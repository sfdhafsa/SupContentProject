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

const buildActivity = (row, userId) => {
  if (row.activity_type === 'COLLECTION_MOVIE_ADDED') {
    return {
      type: 'COLLECTION_MOVIE_ADDED',
      action: 'added_to_collection',
      headline: `${row.author_username} added ${row.movie_title} to ${row.collection_name}`,
      body: row.collection_description,
      created_at: row.activity_created_at,
    };
  }

  if (row.activity_type === 'REVIEW_COMMENTED') {
    const isViewerReview = String(row.review_author_id) === String(userId);

    return {
      type: 'REVIEW_COMMENTED',
      action: 'commented',
      headline: isViewerReview
        ? `${row.author_username} commented on your review`
        : `${row.author_username} commented on ${row.review_author_username}'s review`,
      body: row.comment_text,
      created_at: row.activity_created_at,
    };
  }

  if (row.activity_type === 'REVIEW_CREATED' || hasReviewText(row.text)) {
    return {
      type: 'REVIEW_CREATED',
      action: 'reviewed',
      headline: `${row.author_username} reviewed ${row.movie_title}`,
      body: row.text,
      created_at: row.activity_created_at,
    };
  }

  return {
    type: 'RATING_GIVEN',
    action: 'rated',
    headline: `${row.author_username} rated ${row.movie_title}`,
    body: null,
    created_at: row.activity_created_at,
  };
};

const mapFeedItem = (row, userId) => {
  const activity = buildActivity(row, userId);
  const isCollectionActivity = activity.type === 'COLLECTION_MOVIE_ADDED';
  const isCommentActivity = activity.type === 'REVIEW_COMMENTED';

  return {
    type: activity.type,
    activity: {
      action: activity.action,
      headline: activity.headline,
      body: activity.body,
      created_at: activity.created_at,
    },
    review: isCollectionActivity
      ? null
      : {
          id: row.review_id,
          rating: row.rating,
          text: hasReviewText(row.text) ? row.text : null,
          contains_spoiler: row.contains_spoiler,
          created_at: row.review_created_at,
          updated_at: row.review_updated_at,
          likes_count: row.likes_count,
          comments_count: row.comments_count,
          has_liked: row.has_liked,
        },
    comment: isCommentActivity
      ? {
          id: row.comment_id,
          text: row.comment_text,
          parent_comment_id: row.parent_comment_id,
          created_at: row.comment_created_at,
          updated_at: row.comment_updated_at,
        }
      : null,
    collection: isCollectionActivity
      ? {
          id: row.collection_id,
          name: row.collection_name,
          description: row.collection_description,
          is_public: row.collection_is_public,
          added_at: row.collection_movie_added_at,
        }
      : null,
    author: {
      id: row.author_id,
      username: row.author_username,
      avatar_url: row.author_avatar_url,
    },
    review_author: isCollectionActivity
      ? null
      : {
          id: row.review_author_id,
          username: row.review_author_username,
          avatar_url: row.review_author_avatar_url,
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
  const rows = await FeedModel.getFollowingActivities(userId, limit, offset);

  return {
    status: 200,
    data: {
      limit,
      offset,
      items: rows.map((row) => mapFeedItem(row, userId)),
    },
  };
};
