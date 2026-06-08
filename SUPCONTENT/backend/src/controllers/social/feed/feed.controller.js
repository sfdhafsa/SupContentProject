import { getFeed as getFeedService } from '../../../services/social/feed/feed.service.js';

export const getFeed = async (req, res, next) => {
  try {
    const result = await getFeedService(req.user.userId, {
      limit: req.query.limit,
      offset: req.query.offset,
      order: req.query.order,
    });

    return res.status(result.status).json(result.data);
  } catch (err) {
    next(err);
  }
};
