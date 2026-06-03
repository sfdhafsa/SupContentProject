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

const hasReviewText = (text) => typeof text === 'string' && text.trim() !== '';

const buildActivity = (row) => {
  if (hasReviewText(row.text)) {
    return {
      type: 'REVIEW_CREATED',
      action: 'reviewed',
      headline: `${row.author_username} reviewed ${row.movie_title}`,
      body: row.text,
    };
  }

  return {
    type: 'RATING_GIVEN',
    action: 'rated',
    headline: `${row.author_username} rated ${row.movie_title}`,
    body: null,
  };
};

const mapFeedItem = (row) => {
  const activity = buildActivity(row);

  return {
    type: activity.type,
    activity: {
      action: activity.action,
      headline: activity.headline,
      body: activity.body,
    },
    review: {
      id: row.review_id,
      rating: row.rating,
      text: hasReviewText(row.text) ? row.text : null,
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
  };
};

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
