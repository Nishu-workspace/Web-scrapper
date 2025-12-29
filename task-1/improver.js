import "dotenv/config";
import mongoose from "mongoose";
import SerpApi from "google-search-results-nodejs";
import puppeteer from "puppeteer";
import { GoogleGenerativeAI } from "@google/generative-ai";
import ArticleModel from "./model/articleModel.js";

const search = new SerpApi.GoogleSearch(process.env.SERPAPI_KEY);
const genAi = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAi.getGenerativeModel({ model: "gemini-1.5-flash" });

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("Database connected successfully"))
  .catch((err) => {
    console.log(err);
  });

const getCompetitorLinks = (query) => {
  return new Promise((resolve, reject) => {
    try {
      search.json(
        {
          q: query,
          num: 3,
        },
        (result) => {
          if (!result.organic_results) {
            resolve([]);
            return;
          }
          const links = result.organic_results.map((r) => r.link).slice(0, 2);
          resolve(links);
        }
      );
    } catch (error) {
      console.log(error);
      resolve([]);
    }
  });
};

const scrapeUrl = async (url, browser) => {
  try {
    const page = await browser.newPage();

    await page.setRequestInterception(true);
    page.on("request", (req) => {
      if (["image", "stylesheet", "font"].includes(req.resourceType())) {
        req.abort();
      } else {
        req.continue();
      }
    });

    await page.goto(url, { waitUntil: "domcontentloaded" });

    const content = await page.evaluate(() => {
      return (
        document.querySelector(
          "article, main, .post-content, #content, .entry-content"
        )?.innerText || ""
      );
    });
    await page.close();
    return content.slice(0, 3000);
  } catch (error) {
    console.log(`Failed to scrape ${url}: ${error.message}`);
    return;
  }
};
