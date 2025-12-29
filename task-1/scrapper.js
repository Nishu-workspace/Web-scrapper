import "dotenv/config";
import puppeteer from "puppeteer";
import TurndownService from "turndown";

import mongoose from "mongoose";
import ArticleModel from "./model/articleModel.js";
const turndownService = new TurndownService();
await mongoose
  .connect(process.env.MONGODB_URI, {})
  .then(() => {
    console.log("DB connected in scrapper");
  })
  .catch((err) => {
    console.log("Error occurred while connecting to db", err);
  });
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

    for (const key in lastFive) {
      const blog = await page.goto(`${lastFive[key].url}`, {
        waitUntil: "networkidle2",
      });
      const blogDetails = await page.$eval("#content", (el) => {
        const subHeading = el.querySelector("h2").innerText.trim() || "";
        const image = el.querySelector("img").getAttribute("src") || "";
        let content =
          el.querySelector(".elementor-widget-theme-post-content").innerHTML ||
          "";

        return { subHeading, image, content };
      });
      blogDetails.content = turndownService.turndown(blogDetails.content);
      lastFive[key] = { ...lastFive[key], blogDetails };
    }
    for (const article of lastFive) {
      await ArticleModel.findOneAndUpdate(
        { url: article.url },
        {
          title: article.title,
          url: article.url,
          subHeading: article.blogDetails.subHeading,
          image: article.blogDetails.image,
          content: article.blogDetails.content,
          originalContent: article.blogDetails.content,
        },
        { upsert: true, new: true }
      );
    }
    console.log(lastFive);
    await page.screenshot({ path: "example.png" });
    await browser.close();
    mongoose.connection.close();
  } catch (err) {
    console.log("something went wrong", err);
    await browser.close();
    mongoose.connection.close();
  }
  //
};
scrap();
