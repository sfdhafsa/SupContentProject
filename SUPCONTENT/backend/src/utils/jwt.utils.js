// src/utils/jwt.utils.js
import jwt from 'jsonwebtoken';

/**
 * Génère un JWT pour un utilisateur
 * @param {string} userId - l'ID de l'utilisateur (UUID)
 * @returns {string} token
 */
export const signToken = (userId) => {
  if (!userId) throw new Error("userId is required to sign a token");

  return jwt.sign(
    { sub: userId }, // payload
    process.env.JWT_SECRET, // secret
    { expiresIn: process.env.JWT_EXPIRES_IN || '1h' } // expiration
  );
};

/**
 * Vérifie et décode un token JWT
 * @param {string} token - le token JWT
 * @returns {object} payload
 */
export const verifyToken = (token) => {
  if (!token) throw new Error("Token is required");

  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    throw new Error("Token invalide ou expiré");
  }
};

/**
 * Décode un token JWT sans vérifier la signature
 * Utile pour lire le payload côté serveur ou debug
 * @param {string} token
 * @returns {object} payload
 */
export const decodeToken = (token) => {
  if (!token) return null;
  return jwt.decode(token);
};