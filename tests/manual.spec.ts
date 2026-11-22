import { expect, test, type Page } from "@playwright/test";
import { manualCollection } from "../app/manual-posts";

const latestPost = manualCollection.videos.reduce((a, b) => a.hours <= b.hours ? a : b);
const widgetScript = "https://platform.twitter.com/widgets.js";

async function mockPlayer(page: Page) {
  const playerMarkup = `<button onclick="this.textContent='再生中'">再生</button>`;
  await page.route(widgetScript, (route) => route.fulfill({
    contentType: "application/javascript",
    body: `window.twttr = { widgets: {
      async createVideo(id, container) {
        const player = document.createElement("iframe");
        player.title = "X プレーヤー";
        player.dataset.postId = id;
        player.srcdoc = ${JSON.stringify(playerMarkup)};
        container.append(player);
        return player;
      }
    } };`,
  }));
}

test("plays X in the modal without leaving the page and keeps search and bookmarks working", async ({ page }) => {
  await mockPlayer(page);
  await page.route("https://pbs.twimg.com/**", (route) => route.fulfill({
    contentType: "image/svg+xml",
    body: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="9"><rect width="16" height="9"/></svg>',
  }));
  const unexpectedRequests: string[] = [];
  page.on("request", (request) => {
    const url = new URL(request.url());
    if (url.pathname.startsWith("/api/")) {
      unexpectedRequests.push(request.url());
    }
  });

  await page.goto("/manual");
  const cards = page.getByRole("article");
  await expect(cards).toHaveCount(manualCollection.videos.length);
  await expect(page.getByText(/回再生|件の反応/)).toHaveCount(0);
  const thumbnail = page.getByRole("button", { name: `${latestPost.title}を再生`, exact: true });
  await expect(thumbnail.locator("img")).toHaveAttribute("src", latestPost.thumbnailUrl);
  await expect(page.locator("iframe")).toHaveCount(0);
  await thumbnail.click();
  const dialog = page.getByRole("dialog", { name: latestPost.title });
  await expect(dialog.locator("iframe")).toHaveAttribute("data-post-id", latestPost.id);
  await expect(dialog.getByText(latestPost.description)).toHaveCount(0);
  const player = dialog.frameLocator("iframe");
  await player.getByRole("button", { name: "再生", exact: true }).click();
  await expect(player.getByRole("button", { name: "再生中" })).toBeVisible();
  await expect(page).toHaveURL(/\/manual$/);
  expect(page.context().pages()).toHaveLength(1);
  await dialog.getByRole("button", { name: "閉じる" }).click();
  await expect(page.locator("iframe")).toHaveCount(0);

  const periods = page.getByRole("group", { name: "掲載期間" });
  await periods.getByRole("button", { name: "24時間" }).click();
  const recent = manualCollection.videos.filter(({ hours }) => hours <= 24);
  await expect(cards).toHaveCount(recent.length);
  await periods.getByRole("button", { name: "全期間" }).click();

  const latest = latestPost;
  await page.getByRole("searchbox", { name: "動画を検索" }).fill(latest.title);
  const card = cards.filter({ has: page.getByRole("heading", { name: latest.title, exact: true }) });
  await card.getByRole("button", { name: `${latest.title}：保存`, exact: true }).click();
  await page.reload();
  await page.getByRole("button", { name: "保存済み", exact: true }).click();
  await expect(card).toBeVisible();
  expect(unexpectedRequests).toEqual([]);
});

test("reports player failure in the modal without leaving the page", async ({ page }) => {
  await page.route("https://pbs.twimg.com/**", (route) => route.abort("blockedbyclient"));
  await page.route(widgetScript, (route) => route.abort("blockedbyclient"));
  await page.goto("/manual");
  await page.getByRole("button", { name: `${latestPost.title}を再生`, exact: true }).click();
  const dialog = page.getByRole("dialog", { name: latestPost.title });
  await expect(dialog.getByRole("status")).toHaveText("Xの動画プレーヤーを表示できませんでした。");
  await expect(page).toHaveURL(/\/manual$/);
});

test("switches videos with buttons and a mobile swipe in the filtered order", async ({ page, isMobile }) => {
  await mockPlayer(page);
  await page.route("https://pbs.twimg.com/**", (route) => route.abort("blockedbyclient"));
  const [first, second] = manualCollection.videos.toSorted((a, b) => a.hours - b.hours);
  await page.goto("/manual");
  const genres = page.getByRole("group", { name: "ジャンル" });
  const firstThumbnail = page.getByRole("button", { name: `${first.title}を再生`, exact: true });
  await genres.getByRole("button", { name: "スポーツ" }).click();
  await firstThumbnail.click();
  const dialog = page.getByRole("dialog");
  const navigation = dialog.getByRole("group", { name: "動画の切り替え" });
  await expect(navigation).toHaveCount(0);
  await dialog.getByRole("button", { name: "閉じる" }).click();
  await genres.getByRole("button", { name: "すべて" }).click();
  await firstThumbnail.click();
  const previous = navigation.getByRole("button", { name: "前の動画" });
  const next = navigation.getByRole("button", { name: "次の動画" });
  await expect(previous).toBeDisabled();

  if (isMobile) {
    const box = await navigation.boundingBox();
    if (!box) throw new Error("The video navigation must be visible");
    const session = await page.context().newCDPSession(page);
    try {
      const y = box.y + box.height / 2;
      await session.send("Input.dispatchTouchEvent", {
        type: "touchStart", touchPoints: [{ x: box.x + box.width * 0.65, y }],
      });
      await session.send("Input.dispatchTouchEvent", {
        type: "touchMove", touchPoints: [{ x: box.x + box.width * 0.35, y }],
      });
      await session.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
    } finally {
      await session.detach();
    }
  } else {
    await next.click();
  }
  await expect(dialog).toHaveAccessibleName(second.title);
  await expect(dialog.locator("iframe")).toHaveAttribute("data-post-id", second.id);
  await expect(next).toBeDisabled();
  await previous.click();
  await expect(dialog).toHaveAccessibleName(first.title);
});
