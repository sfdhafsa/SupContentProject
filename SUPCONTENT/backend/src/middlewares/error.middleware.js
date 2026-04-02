// src/middlewares/error.middleware.js

export const errorHandler = (err, req, res, next) => {
  const status = err.status || err.statusCode || 500;
  const isDev = process.env.NODE_ENV !== 'production';

  console.error(`[ERROR] ${req.method} ${req.originalUrl} →`, err);

  res.status(status).json({
    message: err.message || 'Erreur serveur',
    ...(isDev && { stack: err.stack }),
  });
};
