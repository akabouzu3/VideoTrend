import { expect, test } from "@playwright/test";

const cat = "朝から距離感ゼロの茶トラ";
const dog = "水の冷たさも気にせず走る柴犬";
const basketball = "日が暮れるまで続いたストリートバスケ";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
});

test("shows the rankings for each period", async ({ page }) => {
  const videos = page.getByRole("article");
  const periods = page.getByRole("group", { name: "ランキング期間" });

  await expect(periods.getByRole("button", { name: "24時間" })).toHaveAttribute("aria-pressed", "true");
  await expect(videos).toHaveCount(6);
  await expect(videos.first().getByRole("heading")).toHaveText(cat);

  const threeDays = periods.getByRole("button", { name: "3日間" });
  await threeDays.click();
  await expect(threeDays).toHaveAttribute("aria-pressed", "true");
  await expect(videos).toHaveCount(8);

  const week = periods.getByRole("button", { name: "1週間" });
  await week.click();
  await expect(week).toHaveAttribute("aria-pressed", "true");
  await expect(videos).toHaveCount(9);
  await expect(videos.first().getByRole("heading")).toHaveText(basketball);
});

test("filters by genre and keyword and resets an empty result", async ({ page }) => {
  const videos = page.getByRole("article");
  const search = page.getByRole("searchbox", { name: "動画を検索" });

  await page.getByRole("button", { name: "1週間" }).click();
  await page.getByRole("group", { name: "ジャンル" }).getByRole("button", { name: "スポーツ" }).click();
  await expect(videos).toHaveCount(2);

  await search.fill("ストリート　バスケ");
  await expect(videos).toHaveCount(1);
  await expect(videos.first().getByRole("heading")).toHaveText(basketball);

  await search.fill("一致するサンプルがない語句");
  await expect(page.getByRole("heading", { name: "条件に合う動画がありません" })).toBeVisible();
  await page.getByRole("button", { name: "絞り込みを解除" }).click();
  await expect(search).toHaveValue("");
  await expect(videos).toHaveCount(9);
});

test("keeps bookmarks after reload and allows removing them", async ({ page }) => {
  const saved = page.getByRole("button", { name: "保存済み", exact: true });
  const videos = page.getByRole("article");
  await page.getByRole("button", { name: `${cat}：保存`, exact: true }).click();
  await page.getByRole("button", { name: `${dog}：保存`, exact: true }).click();
  await saved.click();
  await expect(videos).toHaveCount(2);
  await expect(videos.first().getByRole("heading")).toHaveText(dog);

  await page.reload();
  await saved.click();
  await expect(videos).toHaveCount(2);

  await page.getByRole("button", { name: `${dog}：保存を解除` }).click();
  const removeCat = page.getByRole("button", { name: `${cat}：保存を解除` });
  await expect(removeCat).toBeFocused();
  await removeCat.click();
  await expect(page.getByRole("heading", { name: "保存済みの動画はまだありません" })).toBeVisible();
  await expect(page.getByRole("button", { name: "ランキングを見る" })).toBeFocused();
});

test("opens video details with a link to the sample's X search", async ({ page, isMobile }) => {
  const trigger = page.getByRole("button", { name: cat, exact: true });
  const dialog = page.getByRole("dialog", { name: cat });

  await trigger.click();
  await expect(dialog).toBeVisible();
  const href = await dialog.getByRole("link", { name: "関連動画をXで探す" }).getAttribute("href");
  expect(href).toBeTruthy();
  const url = new URL(href!);
  expect(url.origin + url.pathname).toBe("https://x.com/search");
  expect(url.searchParams.get("q")).toBe("茶トラ 猫 filter:videos lang:ja");

  if (isMobile) {
    await dialog.getByRole("button", { name: "閉じる" }).click();
  } else {
    await page.keyboard.press("Escape");
    await expect(trigger).toBeFocused();
  }
  await expect(dialog).toBeHidden();
});
