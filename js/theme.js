// Multi-theme with persistence: "light", "dark", "ocean", "forest", "neon", "midnight"
(function () {
  const KEY = "dc_theme";
  const root = document.documentElement;
  const THEMES = ["light","dark","ocean","forest","neon","midnight"];

  function apply(theme) {
    THEMES.forEach(t => root.classList.remove(`t-${t}`));
    root.classList.add(`t-${theme}`);
    localStorage.setItem(KEY, theme);
  }

  // init
  const saved = localStorage.getItem(KEY);
  if (saved && THEMES.includes(saved)) apply(saved);
  else if (window.matchMedia?.('(prefers-color-scheme: dark)').matches) apply("dark");
  else apply("light");

  // API
  window.DC_TOGGLE_THEME = function(){
    const now = localStorage.getItem(KEY) || "light";
    const idx = THEMES.indexOf(now);
    const next = THEMES[(idx+1) % THEMES.length];
    apply(next);
    window.toast?.(`Theme: ${next}`);
  };
})();
