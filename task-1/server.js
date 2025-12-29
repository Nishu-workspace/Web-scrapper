import dotenv from "dotenv";
dotenv.config();
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import ArticleModel from "./model/articleModel";

const app = express();
app.use(express.json());
app.use(cors());

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

app.listen(8080, async () => {
  await mongoose
    .connect(process.env.MONGODB_URI)
    .then(() => console.log("connted to Db"))
    .catch((err) => {
      console.log("Error connecting to Mongo", err.message);
    });
  console.log("Server listening to ", 8080);
});
