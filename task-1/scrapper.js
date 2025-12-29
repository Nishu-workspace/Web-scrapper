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
    //gooes to last page.
    const selector = ".page-numbers:last-child";

    const currentPageRef = await page.waitForSelector(selector);
    let currentPage = parseInt(
      await page.evaluate((el) => el.textContent, currentPageRef)
    );
    console.log(currentPage);

    let allBlogs = [];

    while (allBlogs.length < 5 && currentPage > 0) {
      console.log(`Scrapping data of ${currentPage}...`);

      await page.goto(`https://beyondchats.com/blogs/page/${currentPage}/`, {
        waitUntil: "networkidle2",
      });

      const pageBlogs = await page.$$eval("h2.entry-title a", (links) => {
        console.log(links);
        return links.map((l) => ({ title: l.innerText, url: l.href }));
      });
      console.log(pageBlogs);

      allBlogs.push(...pageBlogs.reverse());
      //   console.log(pageBlogs);
      currentPage--;
    }
    const lastFive = allBlogs.slice(0, 5);

    console.log("--- Last 5 Blogs Found ---");
    console.table(lastFive);
    await page.screenshot({ path: "example.png" });
  } catch (err) {
    console.log("something went wrong", err);
  }
  //   await browser.close();
};
scrap();
