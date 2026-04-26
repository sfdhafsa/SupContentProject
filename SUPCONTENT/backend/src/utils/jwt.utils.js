import jwt from 'jsonwebtoken';

/**
 * 🔐 Générer un JWT
 * @param {Object} param0
 * @param {string} param0.userId
 * @param {Array} param0.roles
 * @returns {string} token
 */
export const signToken = ({ userId, roles = [] }) => {
  if (!userId) throw new Error("userId is required");

  return jwt.sign(
    {
      sub: userId,      // user id
      roles: roles      // ["user", "admin"]
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN || '1h',
      issuer: 'supcontent-api',
      audience: 'supcontent-client'
    }
  );
};

/**
 * 🔍 Vérifier un JWT
 * @param {string} token
 * @returns {object} decoded payload
 */
export const verifyToken = (token) => {
  if (!token) throw new Error("Token is required");

  return jwt.verify(token, process.env.JWT_SECRET, {
    issuer: 'supcontent-api',
    audience: 'supcontent-client'
  });
};

/**
 * 👀 Décoder un JWT sans vérification (debug)
 * @param {string} token
 * @returns {object|null}
 */
export const decodeToken = (token) => {
  if (!token) return null;
  return jwt.decode(token);
};