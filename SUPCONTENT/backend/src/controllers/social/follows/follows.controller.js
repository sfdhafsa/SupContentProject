import {
  followUser as followUserService,
  unfollowUser as unfollowUserService,
  getFollowers as getFollowersService,
  getFollowing as getFollowingService,
  getFollowStatus as getFollowStatusService,
} from '../../../services/social/follows/follows.service.js';

// POST /api/users/:id/follow
export const followUser = async (req, res, next) => {
  try {
    const followerId = req.user.userId;
    const followedId = req.params.id;

    const result = await followUserService(followerId, followedId);
    return res.status(result.status).json(result.data);
  } catch (err) {
    next(err);
  }
};

// DELETE /api/users/:id/follow
export const unfollowUser = async (req, res, next) => {
  try {
    const followerId = req.user.userId;
    const followedId = req.params.id;

    const result = await unfollowUserService(followerId, followedId);
    return res.status(result.status).json(result.data);
  } catch (err) {
    next(err);
  }
};

// GET /api/users/:id/followers
export const getFollowers = async (req, res, next) => {
  try {
    const userId = req.params.id;

    const result = await getFollowersService(userId);
    return res.status(result.status).json(result.data);
  } catch (err) {
    next(err);
  }
};

// GET /api/users/:id/following
export const getFollowing = async (req, res, next) => {
  try {
    const userId = req.params.id;

    const result = await getFollowingService(userId);
    return res.status(result.status).json(result.data);
  } catch (err) {
    next(err);
  }
};

// GET /api/users/:id/follow-status
export const getFollowStatus = async (req, res, next) => {
  try {
    const followerId = req.user.userId;
    const followedId = req.params.id;

    const result = await getFollowStatusService(followerId, followedId);
    return res.status(result.status).json(result.data);
  } catch (err) {
    next(err);
  }
};
