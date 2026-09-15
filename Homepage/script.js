// ===========================================================
// HeritageVerse — shared behaviour across pages
// ===========================================================

function renderHeader(active){
  const links = [
    ["/Homepage/index.html","Explore"],
    ["/Explore/explore.html","States"],
    ["/Scan/scan.html","Scan"],
    ["/Ai-Chatbot/ai-guide.html","AI Guide"],
    ["/TimelineExten/timeline.html","Culture at Risk"],
    ["/Games/games.html","Games"],
  ];
  const nav = links.map(([href,label])=>{
    const cls = active===label ? "active" : "";
    return `<a href="${href}" class="${cls}">${label}</a>`;
  }).join("");

  return `
  <header class="site-header">
    <div class="container nav-row">
      <a href="/Homepage/index.html" class="brand">
        <span class="mark">🕯️</span>
        <span class="brand-text">
          <span class="word">ARCHA</span>
        </span>
      </a>
      <nav class="main-nav">${nav}</nav>
      <button class="nav-toggle" id="navToggle" aria-label="Menu">☰</button>
      <div class="nav-avatar"><a href="/Login/public/login.html">👤</a></div>
    </div>
  </header>`;
}

function renderFooter(){
  return `
  <footer class="site-footer">
    <div class="container">
      <div class="footer-grid">
        <div>
          <h4 style="font-family:var(--serif);font-size:20px;color:var(--text-inverse);"></h4>
          <p style="color:var(--sand-300);max-width:280px;margin-top:10px;">
            A living archive of India's monuments, festivals, food and folklore —
            built for wanderers, students and keepers of memory.
          </p>
        </div>
        <div>
          <h4>Discover</h4>
          <ul>
            <li><a href="/Explore/explore.html">States</a></li>
            <li><a href="/Explore/explore.html#monuments">Monuments</a></li>
            <li><a href="/Explore/explore.html#festivals">Festivals</a></li>
            <li><a href="/Explore/explore.html#food">Food</a></li>
          </ul>
        </div>
        <div>
          <h4>Tools</h4>
          <ul>
            <li><a href="/Scan/scan.html">Scan an artefact</a></li>
            <li><a href="/Ai-Chatbot/ai-guide.html">Ask the AI Guide</a></li>
            <li><a href="/TimelineExten/timeline.html">Culture at Risk</a></li>
            <li><a href="/Games/games.html">Games &amp; quizzes</a></li>
          </ul>
        </div>
        <div>
          <h4>About</h4>
          <ul>
            <li><a href="#">Our story</a></li>
            <li><a href="#">Contributors</a></li>
            <li><a href="#">Contact</a></li>
          </ul>
        </div>
      </div>
      <div class="footer-bottom">
        <span>Archa</span>
      </div>
    </div>
  </footer>`;
}

document.addEventListener("DOMContentLoaded", () => {
  const headerMount = document.getElementById("site-header");
  const footerMount = document.getElementById("site-footer");
  if(headerMount) headerMount.outerHTML = renderHeader(headerMount.dataset.active || "");
  if(footerMount) footerMount.outerHTML = renderFooter();

  const toggle = document.getElementById("navToggle");
  const nav = document.querySelector(".main-nav");
  if(toggle && nav){
    toggle.addEventListener("click", ()=>{
      nav.style.display = nav.style.display === "flex" ? "none" : "flex";
      nav.style.flexDirection = "column";
      nav.style.position = "absolute";
      nav.style.top = "64px";
      nav.style.right = "20px";
      nav.style.background = "var(--ink-800)";
      nav.style.padding = "10px";
      nav.style.borderRadius = "12px";
    });
  }
});