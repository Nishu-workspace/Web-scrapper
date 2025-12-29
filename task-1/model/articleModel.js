import mongoose from "mongoose";
const articleSchema = new mongoose.Schema({
  title: { type: String, required: true },
  url: { type: String, required: true },

  subHeading: String,
  image: String,
  content: String,

  originalContent: String,
  references: [{ type: String }],
  isImproved: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now() },
});
const ArticleModel = mongoose.model("Article", articleSchema);

export default ArticleModel;
