import db from '../../config/db.js';

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

  if (listRows.length === 0) throw new Error('Liste introuvable');

  const list = listRows[0];
  const isOwner = viewerId && viewerId === list.user_id;

  if (!list.is_public && !isOwner) throw new Error('Accès refusé à cette liste privée');

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
  if (!name || name.trim().length === 0) throw new Error('Le nom de la liste est requis');
  if (name.trim().length > 100) throw new Error('Le nom ne peut pas dépasser 100 caractères');

  const { rows } = await db.query(
    `INSERT INTO custom_lists (user_id, name, description, is_public, created_at, updated_at)
     VALUES ($1, $2, $3, $4, NOW(), NOW())
     RETURNING *`,
    [userId, name.trim(), description, isPublic]
  );
  return rows[0];
}

async function updateList(listId, userId, { name, description, isPublic }) {
  const existing = await db.query('SELECT * FROM custom_lists WHERE id = $1', [listId]);
  if (existing.rows.length === 0) throw new Error('Liste introuvable');
  if (existing.rows[0].user_id !== userId) throw new Error('Non autorisé à modifier cette liste');

  const updates = [];
  const params = [];
  let paramIndex = 1;

  if (name !== undefined) {
    if (name.trim().length === 0) throw new Error('Le nom ne peut pas être vide');
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

  if (updates.length === 0) throw new Error('Aucune donnée à mettre à jour');

  updates.push(`updated_at = NOW()`);
  params.push(listId);

  const { rows } = await db.query(
    `UPDATE custom_lists SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
    params
  );
  return rows[0];
}

async function deleteList(listId, userId) {
  const existing = await db.query('SELECT * FROM custom_lists WHERE id = $1', [listId]);
  if (existing.rows.length === 0) throw new Error('Liste introuvable');
  if (existing.rows[0].user_id !== userId) throw new Error('Non autorisé à supprimer cette liste');

  await db.query('DELETE FROM custom_lists WHERE id = $1', [listId]);
  return { message: 'Liste supprimée avec succès' };
}

async function addMovieToList(listId, userId, movieId) {
  const list = await db.query('SELECT * FROM custom_lists WHERE id = $1', [listId]);
  if (list.rows.length === 0) throw new Error('Liste introuvable');
  if (list.rows[0].user_id !== userId) throw new Error('Non autorisé');

  const movieCheck = await db.query('SELECT id FROM movies WHERE id = $1', [movieId]);
  if (movieCheck.rows.length === 0) throw new Error('Film introuvable en base locale');

  const { rows } = await db.query(
    `INSERT INTO custom_list_movies (list_id, movie_id, added_at)
     VALUES ($1, $2, NOW())
     ON CONFLICT (list_id, movie_id) DO NOTHING
     RETURNING *`,
    [listId, movieId]
  );

  await db.query('UPDATE custom_lists SET updated_at = NOW() WHERE id = $1', [listId]);
  return rows[0] || { message: 'Film déjà dans la liste' };
}

async function removeMovieFromList(listId, userId, movieId) {
  const list = await db.query('SELECT * FROM custom_lists WHERE id = $1', [listId]);
  if (list.rows.length === 0) throw new Error('Liste introuvable');
  if (list.rows[0].user_id !== userId) throw new Error('Non autorisé');

  const { rows } = await db.query(
    `DELETE FROM custom_list_movies WHERE list_id = $1 AND movie_id = $2 RETURNING *`,
    [listId, movieId]
  );
  if (rows.length === 0) throw new Error('Film non trouvé dans cette liste');

  await db.query('UPDATE custom_lists SET updated_at = NOW() WHERE id = $1', [listId]);
  return { message: 'Film retiré de la liste' };
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