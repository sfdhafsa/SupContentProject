import pool from '../config/db.js';

export const FeedModel = {
  async getFollowingActivities(userId, limit, offset, order = 'desc') {
    const sortDirection = order === 'asc' ? 'ASC' : 'DESC';
    const { rows } = await pool.query(
      `
      WITH following_reviews AS (
        SELECT
          CASE
            WHEN r.text IS NOT NULL AND BTRIM(r.text) <> ''
              THEN 'REVIEW_CREATED'
            ELSE 'RATING_GIVEN'
          END AS activity_type,
          r.created_at AS activity_created_at,
          r.id AS review_id,
          r.rating,
          r.text,
          r.contains_spoiler,
          r.created_at AS review_created_at,
          r.updated_at AS review_updated_at,
          NULL::BIGINT AS comment_id,
          NULL::TEXT AS comment_text,
          NULL::BIGINT AS parent_comment_id,
          NULL::TIMESTAMP AS comment_created_at,
          NULL::TIMESTAMP AS comment_updated_at,
          u.id AS review_author_id,
          u.username AS review_author_username,
          u.avatar_url AS review_author_avatar_url,
          NULL::BIGINT AS collection_id,
          NULL::VARCHAR(255) AS collection_name,
          NULL::TEXT AS collection_description,
          NULL::BOOLEAN AS collection_is_public,
          NULL::TIMESTAMP AS collection_movie_added_at,
          u.id AS author_id,
          u.username AS author_username,
          u.avatar_url AS author_avatar_url,
          m.id AS movie_id,
          m.external_id AS movie_external_id,
          m.source_api AS movie_source_api,
          m.title AS movie_title,
          m.poster_url AS movie_poster_url,
          m.release_date AS movie_release_date,
          COUNT(DISTINCT rl.user_id)::INT AS likes_count,
          COUNT(DISTINCT c.id)::INT AS comments_count,
          EXISTS (
            SELECT 1
            FROM review_likes viewer_like
            WHERE viewer_like.review_id = r.id
            AND viewer_like.user_id = $1
          ) AS has_liked
        FROM reviews r
        JOIN follows f
          ON f.followed_id = r.user_id
          AND f.follower_id = $1
        JOIN users u
          ON u.id = r.user_id
        JOIN movies m
          ON m.id = r.movie_id
        LEFT JOIN review_likes rl
          ON rl.review_id = r.id
        LEFT JOIN comments c
          ON c.review_id = r.id
          AND c.deleted_at IS NULL
        WHERE r.deleted_at IS NULL
        GROUP BY r.id, u.id, m.id
      ),
      comment_activities AS (
        SELECT
          'REVIEW_COMMENTED' AS activity_type,
          c.created_at AS activity_created_at,
          r.id AS review_id,
          r.rating,
          r.text,
          r.contains_spoiler,
          r.created_at AS review_created_at,
          r.updated_at AS review_updated_at,
          c.id AS comment_id,
          c.text AS comment_text,
          c.parent_comment_id,
          c.created_at AS comment_created_at,
          c.updated_at AS comment_updated_at,
          review_author.id AS review_author_id,
          review_author.username AS review_author_username,
          review_author.avatar_url AS review_author_avatar_url,
          NULL::BIGINT AS collection_id,
          NULL::VARCHAR(255) AS collection_name,
          NULL::TEXT AS collection_description,
          NULL::BOOLEAN AS collection_is_public,
          NULL::TIMESTAMP AS collection_movie_added_at,
          commenter.id AS author_id,
          commenter.username AS author_username,
          commenter.avatar_url AS author_avatar_url,
          m.id AS movie_id,
          m.external_id AS movie_external_id,
          m.source_api AS movie_source_api,
          m.title AS movie_title,
          m.poster_url AS movie_poster_url,
          m.release_date AS movie_release_date,
          COUNT(DISTINCT rl.user_id)::INT AS likes_count,
          COUNT(DISTINCT all_comments.id)::INT AS comments_count,
          EXISTS (
            SELECT 1
            FROM review_likes viewer_like
            WHERE viewer_like.review_id = r.id
            AND viewer_like.user_id = $1
          ) AS has_liked
        FROM comments c
        JOIN reviews r
          ON r.id = c.review_id
          AND r.deleted_at IS NULL
        JOIN users commenter
          ON commenter.id = c.user_id
        JOIN users review_author
          ON review_author.id = r.user_id
        JOIN movies m
          ON m.id = r.movie_id
        LEFT JOIN follows f
          ON f.followed_id = c.user_id
          AND f.follower_id = $1
        LEFT JOIN review_likes rl
          ON rl.review_id = r.id
        LEFT JOIN comments all_comments
          ON all_comments.review_id = r.id
          AND all_comments.deleted_at IS NULL
        WHERE c.deleted_at IS NULL
        AND (r.user_id = $1 OR f.follower_id IS NOT NULL)
        GROUP BY c.id, r.id, commenter.id, review_author.id, m.id
      ),
      following_collection_additions AS (
        SELECT
          'COLLECTION_MOVIE_ADDED' AS activity_type,
          clm.added_at AS activity_created_at,
          NULL::BIGINT AS review_id,
          NULL::INT AS rating,
          NULL::TEXT AS text,
          NULL::BOOLEAN AS contains_spoiler,
          NULL::TIMESTAMP AS review_created_at,
          NULL::TIMESTAMP AS review_updated_at,
          NULL::BIGINT AS comment_id,
          NULL::TEXT AS comment_text,
          NULL::BIGINT AS parent_comment_id,
          NULL::TIMESTAMP AS comment_created_at,
          NULL::TIMESTAMP AS comment_updated_at,
          NULL::UUID AS review_author_id,
          NULL::VARCHAR(255) AS review_author_username,
          NULL::TEXT AS review_author_avatar_url,
          cl.id AS collection_id,
          cl.name AS collection_name,
          cl.description AS collection_description,
          cl.is_public AS collection_is_public,
          clm.added_at AS collection_movie_added_at,
          u.id AS author_id,
          u.username AS author_username,
          u.avatar_url AS author_avatar_url,
          m.id AS movie_id,
          m.external_id AS movie_external_id,
          m.source_api AS movie_source_api,
          m.title AS movie_title,
          m.poster_url AS movie_poster_url,
          m.release_date AS movie_release_date,
          NULL::INT AS likes_count,
          NULL::INT AS comments_count,
          FALSE AS has_liked
        FROM custom_list_movies clm
        JOIN custom_lists cl
          ON cl.id = clm.list_id
        JOIN follows f
          ON f.followed_id = cl.user_id
          AND f.follower_id = $1
        JOIN users u
          ON u.id = cl.user_id
        JOIN movies m
          ON m.id = clm.movie_id
        WHERE cl.is_public = TRUE
      )
      SELECT *
      FROM (
        SELECT * FROM following_reviews
        UNION ALL
        SELECT * FROM comment_activities
        UNION ALL
        SELECT * FROM following_collection_additions
      ) feed_items
      ORDER BY activity_created_at ${sortDirection}
      LIMIT $2 OFFSET $3;
      `,
      [userId, limit, offset]
    );

    return rows;
  },
};
