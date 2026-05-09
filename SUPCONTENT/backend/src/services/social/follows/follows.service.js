import { FollowModel } from '../../../models/follow.model.js';
import { UserModel } from '../../../models/user.model.js';

export const followUser = async (followerId, followedId) => {
  if (followerId === followedId) {
    return {
      status: 400,
      data: { message: 'Vous ne pouvez pas vous suivre vous-même.' },
    };
  }

  const targetUser = await UserModel.findById(followedId);
  if (!targetUser) {
    return {
      status: 404,
      data: { message: 'Utilisateur introuvable.' },
    };
  }

  const existingFollow = await FollowModel.findFollow(followerId, followedId);
  if (existingFollow) {
    return {
      status: 409,
      data: { message: 'Vous suivez déjà cet utilisateur.' },
    };
  }

  const follow = await FollowModel.createFollow(followerId, followedId);

  return {
    status: 201,
    data: {
      message: 'Utilisateur suivi avec succès.',
      follow,
    },
  };
};

export const unfollowUser = async (followerId, followedId) => {
  if (followerId === followedId) {
    return {
      status: 400,
      data: { message: 'Action invalide.' },
    };
  }

  const targetUser = await UserModel.findById(followedId);
  if (!targetUser) {
    return {
      status: 404,
      data: { message: 'Utilisateur introuvable.' },
    };
  }

  const existingFollow = await FollowModel.findFollow(followerId, followedId);
  if (!existingFollow) {
    return {
      status: 404,
      data: { message: 'Vous ne suivez pas cet utilisateur.' },
    };
  }

  await FollowModel.deleteFollow(followerId, followedId);

  return {
    status: 200,
    data: { message: 'Utilisateur unfollow avec succès.' },
  };
};

export const getFollowers = async (userId) => {
  const user = await UserModel.findById(userId);
  if (!user) {
    return {
      status: 404,
      data: { message: 'Utilisateur introuvable.' },
    };
  }

  const followers = await FollowModel.getFollowers(userId);
  const count = await FollowModel.countFollowers(userId);

  return {
    status: 200,
    data: {
      count,
      followers,
    },
  };
};

export const getFollowing = async (userId) => {
  const user = await UserModel.findById(userId);
  if (!user) {
    return {
      status: 404,
      data: { message: 'Utilisateur introuvable.' },
    };
  }

  const following = await FollowModel.getFollowing(userId);
  const count = await FollowModel.countFollowing(userId);

  return {
    status: 200,
    data: {
      count,
      following,
    },
  };
};

export const getFollowStatus = async (followerId, followedId) => {
  const targetUser = await UserModel.findById(followedId);
  if (!targetUser) {
    return {
      status: 404,
      data: { message: 'Utilisateur introuvable.' },
    };
  }

  const follow = await FollowModel.findFollow(followerId, followedId);

  return {
    status: 200,
    data: {
      isFollowing: !!follow,
    },
  };
};