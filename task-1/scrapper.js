import puppeteer from "puppeteer";
const browser = await puppeteer.launch({
  headless: false,
  defaultViewport: null,
  args: ["--start-maximized"],
});
const page = await browser.newPage();
const scrap = async () => {
  await page.goto("https://beyondchats.com/blogs/", {
    waitUntil: "networkidle2",
  });
  try {
    const selector = ".page-numbers:last-child";
    await page.locator(selector).click();

    // await page.locator(selector).click();
    // await page.type(selector, "Google Ads");
    // await page.keyboard.press("Enter");

    // await page.waitForSelector(`.is-search-input`, {
    //   visible: true,
    // });
    // await page.click(".is-search-input");
    // await page.type(".is-search-input", "Google Ads");
    //   await page.click(`button[type="submit"]`);
    await page.screenshot({ path: "example.png" });
  } catch (err) {
    console.log("something went wrong", err);
  }
  //   await browser.close();
};
scrap();
