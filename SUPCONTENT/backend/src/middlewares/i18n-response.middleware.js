import { translateApiPayload } from "../i18n/messages.js";

export const i18nResponseMiddleware = (req, res, next) => {
  const originalJson = res.json.bind(res);

  res.json = (payload) => originalJson(translateApiPayload(payload, req.locale));

  next();
};
