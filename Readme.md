# BeyondChats Blog AI Enhancer

Note: https://web-scrapper-iota.vercel.app/ is a live link, with 4 enhaced post/articles with proper scrapping, the last one is left to test. You can either run the whole script in the backend seperately to test it or tap on improve in the frontend. (The frontend button doesn't scrap the competitor's data).

This project is a MERN stack application designed to scrape blog articles, store them in a database, and use Generative AI (Google Gemini) to rewrite and improve the content using SEO best practices.

## 📂 Project Structure

The system features a **Dual-Mode** AI improvement architecture:

1.  **`server.js` (Quick Mode)**: The Express API. When triggered from the frontend, it performs a fast improvement by fetching competitor *links* (via SerpApi) and using the AI's internal knowledge to rewrite the article.
2.  **`improver.js` (Deep Mode)**: A standalone background script. It uses **Puppeteer** to visit competitor websites, scrape their full content, and feed that data to the AI for a highly detailed rewrite.
3.  **`scrapper.js`**: (Assumed) Fetches the initial raw HTML from target websites.
4.  **Frontend (`src/App.jsx`)**: A React UI to view articles and trigger the "Quick Mode" improvement.

---

## 🚀 How It Works

### 1. The "Quick Improve" (Frontend Trigger)
* **Trigger:** User clicks "Auto-Improve" on the UI.
* **Process:**
    1.  The frontend calls `POST /api/articles/:id/improve`.
    2.  **SerpApi** searches Google for the article title and retrieves the top 2 competitor URLs.
    3.  **AI Processing:** The server sends a prompt to Google Gemini containing the original article and the *links* to the competitors.
    4.  **Result:** The AI rewrites the article using its training data + the context of the links (for citations).
    5.  **Speed:** Fast (~5-10 seconds).

### 2. The "Deep Improve" (Background Script)
* **Trigger:** Manual execution of `node improver.js`.
* **Process:**
    1.  Finds all articles in MongoDB where `isImproved: false`.
    2.  **SerpApi** finds competitor URLs.
    3.  **Puppeteer (Stealth Mode)** launches a browser, visits those URLs, and scrapes the *actual text content*.
    4.  **AI Processing:** The script creates a massive prompt containing: *My Article + Competitor 1 Text + Competitor 2 Text*.
    5.  **Result:** A comprehensive rewrite that incorporates specific insights missing from the original.
    6.  **Speed:** Slower (depends on scraping speed).

---

## 🛠️ Tech Stack

* **Frontend:** React, Axios, React-Markdown.
* **Backend:** Node.js, Express, Mongoose.
* **AI:** Google Gemini (`gemini-2.5-flash` model).
* **Scraping & Search:**
    * `puppeteer-extra` + `stealth-plugin`: For scraping competitor content without getting blocked.
    * `google-search-results-nodejs` (SerpApi): For finding high-ranking competitor URLs.

---

## ⚙️ Setup & Installation

### Prerequisites
* Node.js installed.
* MongoDB running locally or via Atlas.
* **API Keys Required:**
    * Google Gemini API Key.
    * SerpApi Key (for Google Search results).

### 1. Environment Variables
Create a `.env` file in the server directory:
```env
PORT=3000
MONGODB_URI=your_mongodb_uri
GEMINI_API_KEY=your_google_ai_key
SERPAPI_KEY=your_serpapi_key
```
# Install dependencies
```
npm install express mongoose cors dotenv @google/genai google-search-results-nodejs puppeteer-extra puppeteer-extra-plugin-stealth
node server.js
node improver.js
```
Method,Endpoint,Description
```
GET,/api/articles,Fetches all articles.
GET,/api/articles/:id,Fetches a single article by ID.
POST,/api/articles/:id/improve,Quick Improve. Uses SerpApi to find links and Gemini to rewrite content instantly.
note: /api/articles/:id is same for post, put and delete.
```
