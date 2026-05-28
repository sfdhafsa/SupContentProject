import { FeedModel } from '../../../models/feed.model.js';

const normalizePagination = ({ limit = 20, offset = 0 } = {}) => {
  const parsedLimit = Number.parseInt(limit, 10);
  const parsedOffset = Number.parseInt(offset, 10);

  return {
    limit: Number.isNaN(parsedLimit)
      ? 20
      : Math.min(Math.max(parsedLimit, 1), 50),
    offset: Number.isNaN(parsedOffset)
      ? 0
      : Math.max(parsedOffset, 0),
  };
};

const mapFeedItem = (row) => ({
  type: 'REVIEW',
  review: {
    id: row.review_id,
    rating: row.rating,
    text: row.text,
    contains_spoiler: row.contains_spoiler,
    created_at: row.created_at,
    updated_at: row.updated_at,
    likes_count: row.likes_count,
    comments_count: row.comments_count,
    has_liked: row.has_liked,
  },
  author: {
    id: row.author_id,
    username: row.author_username,
    avatar_url: row.author_avatar_url,
  },
  movie: {
    id: row.movie_id,
    external_id: row.movie_external_id,
    source_api: row.movie_source_api,
    title: row.movie_title,
    poster_url: row.movie_poster_url,
    release_date: row.movie_release_date,
  },
});

export const getFeed = async (userId, pagination = {}) => {
  const { limit, offset } = normalizePagination(pagination);
  const rows = await FeedModel.getFollowingReviews(userId, limit, offset);

  return {
    status: 200,
    data: {
      limit,
      offset,
      items: rows.map(mapFeedItem),
    },
  };
};
