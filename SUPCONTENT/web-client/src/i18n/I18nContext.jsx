import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { DEFAULT_LANGUAGE, SUPPORTED_LANGUAGES, phraseTranslations, translations } from "./translations";

const STORAGE_KEY = "supcontent.language";
const I18nContext = createContext(null);

const normalizeLanguage = (language) =>
  SUPPORTED_LANGUAGES.includes(language) ? language : DEFAULT_LANGUAGE;

const getInitialLanguage = () => {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) return normalizeLanguage(saved);

  const browserLanguage = navigator.language?.slice(0, 2);
  return normalizeLanguage(browserLanguage);
};

export function translatePhrase(value, language) {
  if (typeof value !== "string") return value;

  const trimmed = value.trim();
  if (!trimmed) return value;

  const dynamicTranslation = translateDynamicPhrase(trimmed, language);
  if (dynamicTranslation) {
    return value.replace(trimmed, dynamicTranslation);
  }

  const translated = phraseTranslations[language]?.[trimmed];
  if (!translated) return value;

  return value.replace(trimmed, translated);
}

function translateDynamicPhrase(value, language) {
  const rules = {
    fr: [
      [/^No results found for "(.+)"$/, (_match, query) => `Aucun résultat trouvé pour "${query}"`],
      [/^See all results for "(.+)" →$/, (_match, query) => `Voir tous les résultats pour "${query}" →`],
    ],
    en: [
      [/^Aucun r[ée]sultat trouv[ée] pour "(.+)"$/, (_match, query) => `No results found for "${query}"`],
      [/^Aucun resultat trouve pour "(.+)"$/, (_match, query) => `No results found for "${query}"`],
      [/^Voir tous les r[ée]sultats pour "(.+)" .$/, (_match, query) => `See all results for "${query}" →`],
      [/^Voir tous les resultats pour "(.+)" .$/, (_match, query) => `See all results for "${query}" →`],
    ],
  };

  for (const [pattern, formatter] of rules[language] || []) {
    const match = value.match(pattern);
    if (match) return formatter(...match);
  }

  return null;
}

function translateElementAttribute(element, attribute, language) {
  const originalAttribute = `data-i18n-original-${attribute}`;
  const current = element.getAttribute(attribute);

  if (!current) return;
  if (!element.hasAttribute(originalAttribute)) {
    element.setAttribute(originalAttribute, current);
  }

  const original = element.getAttribute(originalAttribute);
  const translated = translatePhrase(original, language);
  if (current !== translated) {
    element.setAttribute(attribute, translated);
  }
}

function translateDocument(language) {
  const ignoredTags = new Set(["SCRIPT", "STYLE", "CODE", "PRE", "TEXTAREA"]);
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const textNodes = [];

  while (walker.nextNode()) {
    const node = walker.currentNode;
    const parent = node.parentElement;
    if (!parent || ignoredTags.has(parent.tagName)) continue;

    if (!node.__supcontentOriginalText) {
      node.__supcontentOriginalText = node.nodeValue;
    }

    textNodes.push(node);
  }

  textNodes.forEach((node) => {
    const translated = translatePhrase(node.__supcontentOriginalText, language);
    if (node.nodeValue !== translated) {
      node.nodeValue = translated;
    }
  });

  document.querySelectorAll("[placeholder], [title], [aria-label]").forEach((element) => {
    translateElementAttribute(element, "placeholder", language);
    translateElementAttribute(element, "title", language);
    translateElementAttribute(element, "aria-label", language);
  });
}

function I18nDocumentBridge({ language }) {
  useEffect(() => {
    document.documentElement.lang = language;
    translateDocument(language);

    const observer = new MutationObserver(() => {
      window.requestAnimationFrame(() => translateDocument(language));
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: ["placeholder", "title", "aria-label"],
    });

    return () => observer.disconnect();
  }, [language]);

  return null;
}

export function I18nProvider({ children }) {
  const [language, setLanguageState] = useState(getInitialLanguage);

  const setLanguage = (nextLanguage) => {
    const normalized = normalizeLanguage(nextLanguage);
    localStorage.setItem(STORAGE_KEY, normalized);
    setLanguageState(normalized);
    window.dispatchEvent(new CustomEvent("supcontent:language-change", { detail: normalized }));
  };

  const value = useMemo(() => ({
    language,
    setLanguage,
    t(key, fallback = key) {
      return translations[language]?.[key] ?? fallback;
    },
    translate(value) {
      return translatePhrase(value, language);
    },
  }), [language]);

  return (
    <I18nContext.Provider value={value}>
      <I18nDocumentBridge language={language} />
      {children}
    </I18nContext.Provider>
  );
}

export const useI18n = () => {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useI18n must be used inside I18nProvider");
  }
  return context;
};
