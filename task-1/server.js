import dotenv from "dotenv";
dotenv.config();
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import ArticleModel from "./model/articleModel.js";
import SerpApi from "google-search-results-nodejs";
import { GoogleGenAI } from "@google/genai";
const search = new SerpApi.GoogleSearch(process.env.SERPAPI_KEY);
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const getCompetitorLinks = (query) => {
  return new Promise((resolve) => {
    try {
      search.json({ q: query, num: 3 }, (result) => {
        if (!result.organic_results) return resolve([]);
        resolve(result.organic_results.map((r) => r.link).slice(0, 2));
      });
    } catch (e) {
      resolve([]);
    }
  });
};
const quickImprove = async (article) => {
  const links = await getCompetitorLinks(article.title);

  const prompt = `
    You are an expert SEO editor.
    Original Article: "${article.content.substring(0, 1500)}..."
    Found Competitor Links: ${links.join(", ")}
    Task: Rewrite the original article to be professional and detailed. 
    Use your knowledge of the topic to enhance the content.
    Return ONLY Markdown.
  `;

  try {
    const result = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    });
    const responseText = result.text;

    return {
      content: responseText,
      links,
    };
  } catch (error) {
    console.error("AI Generation failed:", error);
    throw error;
  }
};
const app = express();
const PORT = process.env.PORT || 3000;
app.use(express.json());
app.use(cors());
app.get("/", (req, res) => {
  res.send("Hello, World!");
});
app.get("/api/articles", async (req, res) => {
  try {
    const articles = await ArticleModel.find();
    return res.json(articles);
  } catch (err) {
    console.log(err.message);
    return res.status(500).json({ error: err.message });
  }
});

app.get("/api/articles/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const article = await ArticleModel.findById(id);
    return res.json(article);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

app.put("/api/articles/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const updatedArticle = await ArticleModel.findByIdAndUpdate(id, req.body, {
      new: true,
    });
    return res.json(updatedArticle);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});
app.delete("/api/articles/:id", async (req, res) => {
  try {
    const id = req.params.id;
    await Article.findByIdAndDelete(id);
    res.json({ message: "Article deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.post("/api/articles/:id/improve", async (req, res) => {
  try {
    const article = await ArticleModel.findById(req.params.id);
    if (!article) return res.status(404).send("Not found");

    console.log(`Improving ${article.title}...`);

    const { content, links } = await quickImprove(article);

    article.content = content;
    article.references = links;
    article.isImproved = true;
    await article.save();

    return res.json(article);
  } catch (err) {
    console.error(err);
    res.status(500).send("AI Failed");
  }
});
app.listen(PORT, async () => {
  await mongoose
    .connect(process.env.MONGODB_URI)
    .then(() => console.log("connted to Db"))
    .catch((err) => {
      console.log("Error connecting to Mongo", err.message);
    });
  console.log("Server listening to ", PORT);
});
