import { expect, test } from "@playwright/test";
import { manualCollection } from "../app/manual-posts";

const widgetScript = "https://platform.twitter.com/widgets.js";
const latestPost = manualCollection.videos.reduce((a, b) => a.hours <= b.hours ? a : b);

test("shows video thumbnails and opens the player on demand", async ({ page }) => {
  const playerMarkup = `<button onclick="this.textContent='再生中'">再生</button>`;
  let widgetLoads = 0;
  await page.route(widgetScript, (route) => {
    widgetLoads++;
    return route.fulfill({
      contentType: "application/javascript",
      body: `window.twttr = { widgets: {
        async createVideo(id, target) {
          const frame = document.createElement("iframe");
          frame.title = "X プレーヤー";
          frame.srcdoc = ${JSON.stringify(playerMarkup)};
          target.append(frame);
          return frame;
        }
      } };`,
    });
  });
  await page.route("https://pbs.twimg.com/**", (route) => route.fulfill({
    contentType: "image/svg+xml",
    body: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="9"><rect width="16" height="9"/></svg>',
  }));
  const apiRequests: string[] = [];
  page.on("request", (request) => {
    if (new URL(request.url()).pathname.startsWith("/api/")) apiRequests.push(request.url());
  });

  await page.goto("/manual");
  const cards = page.getByRole("article");
  await expect(cards).toHaveCount(manualCollection.videos.length);
  await expect(page.getByText(/回再生|件の反応/)).toHaveCount(0);
  const thumbnail = page.getByRole("button", { name: `${latestPost.title}を再生`, exact: true });
  await expect(thumbnail.locator("img")).toHaveAttribute("src", latestPost.thumbnailUrl);
  await expect(page.locator("iframe")).toHaveCount(0);
  expect(widgetLoads).toBe(0);
  const external = manualCollection.videos.find(({ playback }) => playback === "x");
  if (!external) throw new Error("Expected an X-only video in the curated collection");
  await expect(page.getByRole("link", { name: `${external.title}をXで再生` }))
    .toHaveAttribute("href", `https://x.com/${external.account}/status/${external.id}`);

  await thumbnail.click();
  const dialog = page.getByRole("dialog", { name: latestPost.title });
  const player = dialog.getByRole("region", { name: `${latestPost.title}の動画プレーヤー` }).frameLocator("iframe");
  await player.getByRole("button", { name: "再生", exact: true }).click();
  await expect(player.getByRole("button", { name: "再生中" })).toBeVisible();
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
  await card.getByRole("button", { name: latest.title, exact: true }).click();
  await expect(dialog.getByRole("link", { name: "Xで元投稿を開く" }))
    .toHaveAttribute("href", `https://x.com/${latest.account}/status/${latest.id}`);
  await dialog.getByRole("button", { name: "閉じる" }).click();

  await card.getByRole("button", { name: `${latest.title}：保存`, exact: true }).click();
  await page.reload();
  await page.getByRole("button", { name: "保存済み", exact: true }).click();
  await expect(card).toBeVisible();
  expect(apiRequests).toEqual([]);
});

test("keeps the original X link available when the embedded player is blocked", async ({ page }) => {
  await page.route(widgetScript, (route) => route.abort("blockedbyclient"));
  await page.route("https://pbs.twimg.com/**", (route) => route.abort("blockedbyclient"));
  await page.goto("/manual");
  await page.getByRole("button", { name: `${latestPost.title}を再生`, exact: true }).click();
  const dialog = page.getByRole("dialog", { name: latestPost.title });
  await expect(dialog.getByRole("status")).toHaveText("Xの動画プレーヤーを表示できませんでした。");
  await expect(dialog.getByRole("link", { name: "Xで元投稿を開く" }))
    .toHaveAttribute("href", `https://x.com/${latestPost.account}/status/${latestPost.id}`);
});

test("switches videos with buttons and a mobile swipe in the filtered order", async ({ page, isMobile }) => {
  await page.route(widgetScript, (route) => route.abort("blockedbyclient"));
  await page.route("https://pbs.twimg.com/**", (route) => route.abort("blockedbyclient"));
  const sports = manualCollection.videos.filter(({ category }) => category === "sports")
    .toSorted((a, b) => a.hours - b.hours);
  await page.goto("/manual");
  await page.getByRole("group", { name: "ジャンル" }).getByRole("button", { name: "スポーツ" }).click();
  await page.getByRole("button", { name: `${sports[0].title}を再生`, exact: true }).click();
  const dialog = page.getByRole("dialog");
  const navigation = dialog.getByRole("group", { name: "動画の切り替え" });
  const previous = navigation.getByRole("button", { name: "前の動画" });
  const next = navigation.getByRole("button", { name: "次の動画" });
  await expect(previous).toBeDisabled();
  await next.click();
  await expect(dialog.getByRole("heading", { name: sports[1].title })).toBeVisible();

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
  await expect(dialog.getByRole("heading", { name: sports[2].title })).toBeVisible();
  await expect(next).toBeDisabled();
  await previous.click();
  await expect(dialog.getByRole("heading", { name: sports[1].title })).toBeVisible();
});
