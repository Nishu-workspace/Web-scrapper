import { useState, useEffect } from "react";
import axios from "axios";
import ReactMarkdown from "react-markdown";
import "./App.css";

function App() {
  const [articles, setArticles] = useState([]);
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [viewMode, setViewMode] = useState("improved");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    axios
      .get("http://localhost:5000/api/articles")
      .then((res) => {
        setArticles(res.data);
        if (res.data.length > 0) {
          setSelectedArticle(res.data[0]);

          setViewMode(res.data[0].isImproved ? "improved" : "original");
        }
      })
      .catch((err) => console.error("Error fetching articles:", err));
  }, []);

  const handleImprove = async () => {
    if (!selectedArticle) return;
    setLoading(true);

    try {
      const res = await axios.post(
        `http://localhost:5000/api/articles/${selectedArticle._id}/improve`
      );
      const updatedArticle = res.data;

      setArticles((prev) =>
        prev.map((a) => (a._id === updatedArticle._id ? updatedArticle : a))
      );

      setSelectedArticle(updatedArticle);
      setViewMode("improved");
    } catch (error) {
      console.error("Improvement failed:", error);
      alert("Failed to improve article. Make sure the backend is running.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <aside className="sidebar">
        <h2>BeyondChats Blogs</h2>
        <div className="list">
          {articles.map((article) => (
            <div
              key={article._id}
              className={`list-item ${
                selectedArticle?._id === article._id ? "active" : ""
              }`}
              onClick={() => {
                setSelectedArticle(article);

                setViewMode(article.isImproved ? "improved" : "original");
              }}
            >
              <h4>{article.title}</h4>
              <span
                className={`status ${article.isImproved ? "done" : "pending"}`}
              >
                {article.isImproved ? "✨ AI Enhanced" : "⏳ Pending"}
              </span>
            </div>
          ))}
        </div>
      </aside>

      <main className="content-area">
        {selectedArticle ? (
          <>
            <header className="article-header">
              <div className="header-left">
                <a
                  href={selectedArticle.url}
                  target="_blank"
                  rel="noreferrer"
                  className="source-link"
                >
                  View Source ↗
                </a>
              </div>

              <div className="header-actions">
                {!selectedArticle.isImproved && (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "flex-end",
                    }}
                  >
                    <button
                      className="improve-btn"
                      onClick={handleImprove}
                      disabled={loading}
                    >
                      {loading ? "Generating..." : "✨ Auto-Improve"}
                    </button>

                    <span
                      style={{
                        fontSize: "0.75rem",
                        color: "#666",
                        marginTop: "4px",
                      }}
                    >
                      *Process runs on Backend (No Scraping)
                    </span>
                  </div>
                )}

                <div className="toggle-container">
                  <button
                    className={viewMode === "original" ? "active" : ""}
                    onClick={() => setViewMode("original")}
                  >
                    Original
                  </button>
                  <button
                    className={viewMode === "improved" ? "active" : ""}
                    onClick={() => setViewMode("improved")}
                    disabled={!selectedArticle.isImproved}
                    title={
                      !selectedArticle.isImproved
                        ? "Run Auto-Improve first"
                        : ""
                    }
                  >
                    AI Improved
                  </button>
                </div>
              </div>
            </header>

            <div className="article-body">
              <h1>{selectedArticle.title}</h1>
              {selectedArticle.image && (
                <img
                  src={selectedArticle.image}
                  alt="Blog cover"
                  className="cover-image"
                />
              )}

              <div className="markdown-content">
                <ReactMarkdown>
                  {viewMode === "improved"
                    ? selectedArticle.content
                    : selectedArticle.originalContent ||
                      selectedArticle.content}
                </ReactMarkdown>
              </div>

              {viewMode === "improved" &&
                selectedArticle.references?.length > 0 && (
                  <div className="references">
                    <h3>References used by AI:</h3>
                    <ul>
                      {selectedArticle.references.map((ref, index) => (
                        <li key={index}>
                          <a href={ref} target="_blank" rel="noreferrer">
                            {ref}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
            </div>
          </>
        ) : (
          <div className="empty-state">Select an article to view</div>
        )}
      </main>
    </div>
  );
}

export default App;
