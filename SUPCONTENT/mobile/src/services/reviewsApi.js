import { API_BASE_URL } from '../config/api';

function getJsonHeaders(token) {
  return {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

function getErrorMessage(data, fallback) {
  if (data?.message) return data.message;
  if (data?.error) return data.error;
  if (Array.isArray(data?.errors) && data.errors[0]?.msg) return data.errors[0].msg;
  return fallback;
}

async function parseResponse(response, fallback) {
  const rawBody = await response.text().catch(() => '');
  let data = {};

  if (rawBody.trim()) {
    try {
      data = JSON.parse(rawBody);
    } catch {
      if (!response.ok) {
        throw new Error(fallback);
      }
      return {};
    }
  }

  if (!response.ok) {
    throw new Error(getErrorMessage(data, fallback));
  }

  return data;
}

export async function getMovieReviews(tmdbId, token) {
  const response = await fetch(`${API_BASE_URL}/reviews/movie/${tmdbId}`, {
    headers: getJsonHeaders(token),
  });
  return parseResponse(response, 'Unable to load reviews.');
}

export async function createReview({ token, tmdbId, rating, text, containsSpoiler }) {
  const response = await fetch(`${API_BASE_URL}/reviews`, {
    method: 'POST',
    headers: getJsonHeaders(token),
    body: JSON.stringify({
      tmdb_id: Number(tmdbId),
      rating,
      text,
      contains_spoiler: containsSpoiler,
    }),
  });
  return parseResponse(response, 'Unable to save this review.');
}

export async function updateReview({ token, reviewId, rating, text, containsSpoiler }) {
  const response = await fetch(`${API_BASE_URL}/reviews/${reviewId}`, {
    method: 'PATCH',
    headers: getJsonHeaders(token),
    body: JSON.stringify({
      rating,
      text,
      contains_spoiler: containsSpoiler,
    }),
  });
  return parseResponse(response, 'Unable to save this review.');
}

export async function deleteReview({ token, reviewId }) {
  const response = await fetch(`${API_BASE_URL}/reviews/${reviewId}`, {
    method: 'DELETE',
    headers: getJsonHeaders(token),
  });
  return parseResponse(response, 'Unable to delete this review.');
}

export async function toggleReviewLike({ token, reviewId }) {
  const response = await fetch(`${API_BASE_URL}/reviews/${reviewId}/likes`, {
    method: 'POST',
    headers: getJsonHeaders(token),
  });
  return parseResponse(response, 'Unable to update this like.');
}

export async function createReport({ token, targetType, targetId, reason }) {
  const response = await fetch(`${API_BASE_URL}/reports`, {
    method: 'POST',
    headers: getJsonHeaders(token),
    body: JSON.stringify({
      target_type: targetType,
      target_id: targetId,
      reason,
    }),
  });
  return parseResponse(response, 'Unable to submit this report.');
}

export async function getReviewComments(reviewId) {
  const response = await fetch(`${API_BASE_URL}/reviews/${reviewId}/comments`, {
    headers: getJsonHeaders(),
  });
  return parseResponse(response, 'Unable to load comments.');
}

export async function createReviewComment({ token, reviewId, text, parentCommentId = null }) {
  const response = await fetch(`${API_BASE_URL}/reviews/${reviewId}/comments`, {
    method: 'POST',
    headers: getJsonHeaders(token),
    body: JSON.stringify({
      text,
      parent_comment_id: parentCommentId,
    }),
  });
  return parseResponse(response, 'Unable to post this comment.');
}
