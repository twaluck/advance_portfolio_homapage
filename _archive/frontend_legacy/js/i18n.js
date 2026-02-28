(() => {
  const STORAGE_KEY = "siteLang";
  const DEFAULT_LANG = "ja";

  const applyLang = (lang) => {
    const nextLang = lang === "en" ? "en" : "ja";
    document.documentElement.lang = nextLang;

    const textNodes = document.querySelectorAll("[data-i18n-ja]");
    textNodes.forEach((node) => {
      node.textContent = node.dataset.i18nJa;
    });

    const placeholders = document.querySelectorAll("[data-i18n-placeholder-ja]");
    placeholders.forEach((node) => {
      node.setAttribute("placeholder", node.dataset.i18nPlaceholderJa);
    });

    const titles = document.querySelectorAll("title[data-i18n-ja]");
    titles.forEach((node) => {
      node.textContent = node.dataset.i18nJa;
    });

    const buttons = document.querySelectorAll(".lang-toggle [data-lang]");
    buttons.forEach((button) => {
      button.classList.toggle("is-active", button.dataset.lang === nextLang);
      button.setAttribute("aria-pressed", button.dataset.lang === nextLang ? "true" : "false");
    });
  };

  const getInitialLang = () => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return saved;
    }
    if (navigator.language && navigator.language.toLowerCase().startsWith("ja")) {
      return "ja";
    }
    return DEFAULT_LANG;
  };

  document.addEventListener("DOMContentLoaded", () => {
    const buttons = document.querySelectorAll(".lang-toggle [data-lang]");
    buttons.forEach((button) => {
      button.addEventListener("click", () => {
        const lang = button.dataset.lang || DEFAULT_LANG;
        localStorage.setItem(STORAGE_KEY, lang);
        applyLang(lang);
      });
    });

    applyLang(getInitialLang());
  });
})();
