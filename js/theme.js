// ============================================================
// CASH COMPASS — PREMIUM THEME TOGGLE
// Persists across pages via localStorage
// ============================================================

(function () {
  // Apply theme immediately (before DOM paint) to avoid flash
  const saved = localStorage.getItem("cc-theme") || "light";
  document.documentElement.setAttribute("data-theme", saved);
})();

document.addEventListener("DOMContentLoaded", function () {
  // Inject toggle button into body
  const btn = document.createElement("button");
  btn.id = "theme-toggle";
  btn.setAttribute("aria-label", "Toggle dark/light mode");
  btn.title = "Toggle dark / light mode";
  document.body.appendChild(btn);

  // Set initial icon
  updateIcon();

  btn.addEventListener("click", function () {
    const current = document.documentElement.getAttribute("data-theme");
    const next = current === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("cc-theme", next);
    updateIcon();

    // Bounce click animation
    btn.style.transform = "scale(0.82) rotate(-15deg)";
    setTimeout(() => { btn.style.transform = ""; }, 320);
  });

  function updateIcon() {
    const isDark = document.documentElement.getAttribute("data-theme") === "dark";

    // In light mode → show moon (click to go dark)
    // In dark mode  → show sun  (click to go light)
    btn.innerHTML = isDark
      ? /* SUN icon */
        `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24"
           fill="none" stroke="#facc15" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="5"/>
          <line x1="12" y1="1"  x2="12" y2="3"/>
          <line x1="12" y1="21" x2="12" y2="23"/>
          <line x1="4.22" y1="4.22"  x2="5.64" y2="5.64"/>
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
          <line x1="1" y1="12" x2="3" y2="12"/>
          <line x1="21" y1="12" x2="23" y2="12"/>
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
          <line x1="18.36" y1="5.64"  x2="19.78" y2="4.22"/>
        </svg>`
      : /* MOON icon */
        `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"
           fill="#1a73e8" stroke="#1a73e8" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
        </svg>`;
  }
});
