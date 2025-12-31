import "dotenv/config";
import mongoose from "mongoose";
import SerpApi from "google-search-results-nodejs";
import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";

import ArticleModel from "./model/articleModel.js";
import { GoogleGenAI } from "@google/genai";
puppeteer.use(StealthPlugin());
const search = new SerpApi.GoogleSearch(process.env.SERPAPI_KEY);

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
    return content;
  } catch (error) {
    console.log(`Failed to scrape ${url}: ${error.message}`);
    return;
  }
};
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const rewriteArticle = async (original, competitor1, competitor2) => {
  // Combine everything into one clear instruction
  const singlePrompt = `
    You are an expert SEO copywriter. I need you to rewrite MY ARTICLE by incorporating unique insights and missing data from COMPETITOR 1 and COMPETITOR 2.
    
    MY ARTICLE:
    ${original}

    COMPETITOR 1:
    ${competitor1}

    COMPETITOR 2:
    ${competitor2}

    TASK:
    - Update my article to be more comprehensive than both competitors.
    - Use professional Markdown (H2, H3, lists).
    - Maintain the original tone but improve the SEO structure.
    - Reply ONLY with the rewritten Markdown content.
  `;

  try {
    const result = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ role: "user", parts: [{ text: singlePrompt }] }],
    });
    console.log("Rewrite content", result.text);
    return result.text;
  } catch (err) {
    console.error("Gemini 2.5 Error:", err.message);
    return original;
  }
};
// const rewriteArticle = async (original, competitor1, competitor2) => {
//   const prompt = `
//     You are an expert SEO copywriter.

//     ORIGINAL ARTICLE:
//     ${original.substring(0, 1500)}

//     COMPETITOR 1 CONTENT:
//     ${competitor1}

//     COMPETITOR 2 CONTENT:
//     ${competitor2}

//     TASK:
//     Rewrite the ORIGINAL ARTICLE to make it better.
//     - Incorporate insights from the Competitors.
//     - Use professional Markdown formatting (Headings, lists, bold text).
//     - Maintain the core message of the original.
//     - Do NOT include conversational filler like "Here is the rewritten article". Return ONLY the markdown content.
//     `;

//   try {
//     const result = await model.generateContent(prompt);
//     const response = await result.response;
//     const text = response.text();
//     return text;
//   } catch (error) {
//     console.log("Gemini Error:", error);
//     return original;
//   }
// };

const runImprovement = async () => {
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
    args: ["--start-maximized"],
  });

  const articlesToFix = await ArticleModel.find({ isImproved: false }).limit(1);

  if (articlesToFix.length === 0) {
    console.log("No improvement needed..");
    return;
  }

  console.log(`${articlesToFix.length} articles to fix`);

  for (const article of articlesToFix) {
    console.log(article.title);

    console.log("google");
    const competitorLinks = await getCompetitorLinks(article.title);

    if (competitorLinks.length === 0) {
      console.log("No competitors found");
      continue;
    }
    console.log("competitorsLinks: ", competitorLinks);

    let compContent1 = await scrapeUrl(competitorLinks[0], browser);
    let compContent2 = "";
    if (competitorLinks[1]) {
      compContent2 = await scrapeUrl(competitorLinks[1], browser);
    }

    console.log("rewrite");

    const newContent = await rewriteArticle(
      article.content,
      compContent1,
      compContent2
    );

    console.log("Updating database");
    article.content = newContent;
    article.references = competitorLinks;
    article.isImproved = true;
    await article.save();
    await browser.close();
    mongoose.disconnect();
  }
};
runImprovement();
