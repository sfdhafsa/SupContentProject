import db from '../../config/db.js';
import { CustomListModel } from '../../models/customList.model.js';
import { CustomListMovieModel } from '../../models/customListMovie.model.js';

const serviceError = (message, status) => Object.assign(new Error(message), { status });

async function getUserLists(ownerId, viewerId = null) {
  const isOwner = viewerId && viewerId === ownerId;

  let query = `
    SELECT
      cl.id,
      cl.name,
      cl.description,
      cl.is_public,
      cl.created_at,
      cl.updated_at,
      COUNT(clm.movie_id) AS movie_count
    FROM custom_lists cl
    LEFT JOIN custom_list_movies clm ON cl.id = clm.list_id
    WHERE cl.user_id = $1
  `;

  if (!isOwner) {
    query += ` AND cl.is_public = TRUE`;
  }

  query += ` GROUP BY cl.id ORDER BY cl.updated_at DESC`;

  const { rows } = await db.query(query, [ownerId]);
  return rows;
}

async function getListById(listId, viewerId = null) {
  const listQuery = `
    SELECT cl.*, u.username AS owner_username
    FROM custom_lists cl
    JOIN users u ON cl.user_id = u.id
    WHERE cl.id = $1
  `;
  const { rows: listRows } = await db.query(listQuery, [listId]);

  if (listRows.length === 0) {
    throw serviceError('Liste introuvable', 404);
  }

  const list = listRows[0];
  const isOwner = viewerId && viewerId === list.user_id;

  if (!list.is_public && !isOwner) {
    throw serviceError('Acces refuse a cette liste privee', 403);
  }

  const moviesQuery = `
    SELECT
      m.id,
      m.external_id,
      m.title,
      m.poster_url,
      m.release_date,
      clm.added_at
    FROM custom_list_movies clm
    JOIN movies m ON clm.movie_id = m.id
    WHERE clm.list_id = $1
    ORDER BY clm.added_at DESC
  `;
  const { rows: movies } = await db.query(moviesQuery, [listId]);

  return { ...list, movies };
}

async function createList(userId, { name, description = null, isPublic = false }) {
  if (!name || name.trim().length === 0) {
    throw serviceError('Le nom de la liste est requis', 400);
  }

  if (name.trim().length > 100) {
    throw serviceError('Le nom ne peut pas depasser 100 caracteres', 400);
  }

  const { rows } = await db.query(
    `INSERT INTO custom_lists (user_id, name, description, is_public, created_at, updated_at)
     VALUES ($1, $2, $3, $4, NOW(), NOW())
     RETURNING *`,
    [userId, name.trim(), description, isPublic]
  );

  return rows[0];
}

async function updateList(listId, userId, { name, description, isPublic }) {
  const existing = await CustomListModel.findById(listId);
  if (!existing) {
    throw serviceError('Liste introuvable', 404);
  }

  if (existing.user_id !== userId) {
    throw serviceError('Non autorise a modifier cette liste', 403);
  }

  const updates = [];
  const params = [];
  let paramIndex = 1;

  if (name !== undefined) {
    if (name.trim().length === 0) {
      throw serviceError('Le nom ne peut pas etre vide', 400);
    }

    updates.push(`name = $${paramIndex++}`);
    params.push(name.trim());
  }

  if (description !== undefined) {
    updates.push(`description = $${paramIndex++}`);
    params.push(description);
  }

  if (isPublic !== undefined) {
    updates.push(`is_public = $${paramIndex++}`);
    params.push(isPublic);
  }

  if (updates.length === 0) {
    throw serviceError('Aucune donnee a mettre a jour', 400);
  }

  updates.push(`updated_at = NOW()`);
  params.push(listId);

  const { rows } = await db.query(
    `UPDATE custom_lists SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
    params
  );

  return rows[0];
}

async function deleteList(listId, userId) {
  const existing = await CustomListModel.findById(listId);
  if (!existing) {
    throw serviceError('Liste introuvable', 404);
  }

  if (existing.user_id !== userId) {
    throw serviceError('Non autorise a supprimer cette liste', 403);
  }

  await db.query('DELETE FROM custom_lists WHERE id = $1', [listId]);
  return { message: 'Liste supprimee avec succes' };
}

async function addMovieToList(listId, userId, movieId) {
  const list = await CustomListModel.findById(listId);
  if (!list) {
    throw serviceError('Liste introuvable', 404);
  }

  if (list.user_id !== userId) {
    throw serviceError('Non autorise', 403);
  }

  const movieCheck = await db.query('SELECT id FROM movies WHERE id = $1', [movieId]);
  if (movieCheck.rows.length === 0) {
    throw serviceError('Film introuvable en base locale', 404);
  }

  const listMovie = await CustomListMovieModel.addMovie(listId, movieId);
  if (!listMovie) {
    return { message: 'Film deja dans la liste' };
  }

  await CustomListModel.touchUpdatedAt(listId);
  return listMovie;
}

async function removeMovieFromList(listId, userId, movieId) {
  const list = await CustomListModel.findById(listId);
  if (!list) {
    throw serviceError('Liste introuvable', 404);
  }

  if (list.user_id !== userId) {
    throw serviceError('Non autorise', 403);
  }

  const removed = await CustomListMovieModel.removeMovie(listId, movieId);
  if (!removed) {
    throw serviceError('Film non trouve dans cette liste', 404);
  }

  await CustomListModel.touchUpdatedAt(listId);
  return { message: 'Film retire de la liste' };
}

async function getPublicLists(page = 1, limit = 20, search = '') {
  const offset = (page - 1) * limit;
  const params = [`%${search}%`, limit, offset];

  const { rows } = await db.query(
    `SELECT
      cl.id,
      cl.name,
      cl.description,
      cl.created_at,
      u.username AS owner_username,
      u.avatar_url AS owner_avatar,
      COUNT(clm.movie_id) AS movie_count
     FROM custom_lists cl
     JOIN users u ON cl.user_id = u.id
     LEFT JOIN custom_list_movies clm ON cl.id = clm.list_id
     WHERE cl.is_public = TRUE AND cl.name ILIKE $1
     GROUP BY cl.id, u.username, u.avatar_url
     ORDER BY cl.updated_at DESC
     LIMIT $2 OFFSET $3`,
    params
  );

  const countQuery = await db.query(
    `SELECT COUNT(*) FROM custom_lists WHERE is_public = TRUE AND name ILIKE $1`,
    [`%${search}%`]
  );

  return {
    lists: rows,
    total: parseInt(countQuery.rows[0].count, 10),
    page,
    totalPages: Math.ceil(countQuery.rows[0].count / limit),
  };
}

export {
  getUserLists,
  getListById,
  createList,
  updateList,
  deleteList,
  addMovieToList,
  removeMovieFromList,
  getPublicLists,
};
