import { useState, useEffect } from "react";
import axios from "axios";
import ReactMarkdown from "react-markdown";
import "./App.css";

function App() {
  const [articles, setArticles] = useState([]);
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [viewMode, setViewMode] = useState("improved");
  const [loading, setLoading] = useState(false);

  // UI State
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    axios
      .get(`${import.meta.env.VITE_BACKEND_URL}/api/articles`)
      .then((res) => {
        const data = Array.isArray(res.data) ? res.data : [];
        setArticles(data);
        if (data.length > 0) {
          setSelectedArticle(data[0]);
          setViewMode(data[0].isImproved ? "improved" : "original");
        }
      })
      .catch((err) => {
        console.error("Error fetching articles:", err);
        setArticles([]);
      });
  }, []);

  const handleImprove = async () => {
    if (!selectedArticle) return;
    setLoading(true);

    try {
      const res = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/articles/${
          selectedArticle._id
        }/improve`
      );
      const updatedArticle = res.data;

      setArticles((prev) =>
        prev.map((a) => (a._id === updatedArticle._id ? updatedArticle : a))
      );

      setSelectedArticle(updatedArticle);
      setViewMode("improved");
    } catch (error) {
      console.error("Improvement failed:", error);
      alert("Backend error. Check console.");
    } finally {
      setLoading(false);
    }
  };

  // Helper to select article and close menu (for mobile UX)
  const handleArticleSelect = (article) => {
    setSelectedArticle(article);
    setViewMode(article.isImproved ? "improved" : "original");
    setMobileMenuOpen(false); // Close sidebar on mobile
  };

  return (
    <div className="app-container">
      {/* Mobile Backdrop Overlay */}
      <div
        className={`mobile-overlay ${mobileMenuOpen ? "visible" : ""}`}
        onClick={() => setMobileMenuOpen(false)}
      />

      {/* Sidebar Navigation */}
      <aside className={`sidebar ${mobileMenuOpen ? "open" : ""}`}>
        <div className="sidebar-header">
          <h2>BeyondChats</h2>
          <button
            className="icon-btn close-btn"
            onClick={() => setMobileMenuOpen(false)}
          >
            ✕
          </button>
        </div>

        <div className="article-list">
          {articles.length > 0 ? (
            articles.map((article) => (
              <div
                key={article._id}
                className={`article-card ${
                  selectedArticle?._id === article._id ? "active" : ""
                }`}
                onClick={() => handleArticleSelect(article)}
              >
                <h4 className="article-list-title">{article.title}</h4>
                <div className="article-meta">
                  <span
                    className={`badge ${
                      article.isImproved ? "badge-success" : "badge-pending"
                    }`}
                  >
                    {article.isImproved ? "✨ Enhanced" : "⏳ Pending"}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="empty-state-sidebar">No articles found.</div>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <header className="top-bar">
          <div className="top-bar-left">
            <button
              className="icon-btn menu-btn"
              onClick={() => setMobileMenuOpen(true)}
            >
              ☰
            </button>
            <h3 className="mobile-title">Reader</h3>
          </div>

          {selectedArticle && (
            <div className="top-bar-right">
              <a
                href={selectedArticle.url}
                target="_blank"
                rel="noreferrer"
                className="link-btn"
              >
                Original Source ↗
              </a>
            </div>
          )}
        </header>

        <div className="content-scroll-area">
          {selectedArticle ? (
            <div className="article-container">
              {/* Controls Toolbar */}
              <div className="controls-toolbar">
                <div className="view-toggle">
                  <button
                    className={`toggle-btn ${
                      viewMode === "original" ? "active" : ""
                    }`}
                    onClick={() => setViewMode("original")}
                  >
                    Original
                  </button>
                  <button
                    className={`toggle-btn ${
                      viewMode === "improved" ? "active" : ""
                    }`}
                    onClick={() => setViewMode("improved")}
                    disabled={!selectedArticle.isImproved}
                  >
                    AI Improved
                  </button>
                </div>

                {!selectedArticle.isImproved && (
                  <div className="improve-action">
                    <button
                      className="btn-primary"
                      onClick={handleImprove}
                      disabled={loading}
                    >
                      {loading ? "Magic in progress..." : "✨ Auto-Improve"}
                    </button>
                    <span className="tiny-note">
                      *Runs on Server (No Scraping)
                    </span>
                  </div>
                )}
              </div>

              {/* Content Render */}
              <article className="markdown-body">
                <h1 className="article-title">{selectedArticle.title}</h1>

                {selectedArticle.image && (
                  <img
                    src={selectedArticle.image}
                    alt="Article cover"
                    className="hero-image"
                  />
                )}

                <ReactMarkdown>
                  {viewMode === "improved"
                    ? selectedArticle.content
                    : selectedArticle.originalContent ||
                      selectedArticle.content}
                </ReactMarkdown>
              </article>

              {/* References Footer */}
              {viewMode === "improved" &&
                selectedArticle.references?.length > 0 && (
                  <footer className="article-footer">
                    <h4>Sources & Citations</h4>
                    <ul>
                      {selectedArticle.references.map((ref, idx) => (
                        <li key={idx}>
                          <a href={ref} target="_blank" rel="noreferrer">
                            {ref}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </footer>
                )}
            </div>
          ) : (
            <div className="empty-state-main">
              <p>Select an article from the menu to get started.</p>
              <button
                className="btn-secondary"
                onClick={() => setMobileMenuOpen(true)}
              >
                Open Menu
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;
