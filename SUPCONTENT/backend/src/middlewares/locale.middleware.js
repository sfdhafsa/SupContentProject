const SUPPORTED_LOCALES = new Set(["fr", "en"]);

export const getRequestLocale = (req) => {
  const requested =
    req.headers["x-language"] ||
    req.headers["accept-language"] ||
    req.query?.lang ||
    "fr";

  const locale = String(requested).slice(0, 2).toLowerCase();
  return SUPPORTED_LOCALES.has(locale) ? locale : "fr";
};

export const localeMiddleware = (req, _res, next) => {
  req.locale = getRequestLocale(req);
  next();
};

export const tmdbLanguageForLocale = (locale) => (locale === "en" ? "en-US" : "fr-FR");
