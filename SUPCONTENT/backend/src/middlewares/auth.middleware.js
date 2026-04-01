import jwt from 'jsonwebtoken';
import pool from '../config/db.js';

export const protect = async (req, res, next) => {
  let token;

  // Vérifie le header Authorization
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1]; // Récupère le token
  }

  if (!token) {
    return res.status(401).json({ message: 'Non autorisé, token manquant' });
  }

  try {
    // Vérifie le token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Récupère l'utilisateur depuis la base
    const result = await pool.query('SELECT id, username, email FROM users WHERE id = $1', [decoded.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    req.user = result.rows[0]; // Ajoute user à la requête
    next();
  } catch (err) {
    console.error(err);
    res.status(401).json({ message: 'Token invalide' });
  }
};