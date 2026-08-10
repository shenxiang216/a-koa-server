import { ObjectId } from 'mongodb'

import * as db from '../db'
import { stats } from '../libs/stats'
import { IUser } from './../models/types'

/**
 * 查看某人的帖子
 * @param userId 用户_id
 * @param skip 跳过条数
 * @param limit 返回条数
 * @returns 帖子列表
 * @throws 用户不存在
 * @throws 用户已删除
 */
export async function listByUser(user: IUser, userId: string, skip: number, limit: number) {
  // 查询用户信息
  const userInfo = await db.users.findOne(
    {
      _id: new ObjectId(userId),
    },
    {
      projection: {
        openid: 0,
      },
    }
  )
  if (!userInfo) throw stats.ErrUserNotFound
  // 查询帖子信息
  const posts = await db.posts
    .aggregate([
      {
        $match: {
          userId: new ObjectId(userId),
          deleted: false,
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'user',
        },
      },
      {
        $unwind: '$user',
      },
      {
        $sort: {
          createdAt: -1,
        },
      },
      {
        $skip: skip,
      },
      {
        $limit: limit,
      },
      {
        $project: {
          user: {
            openid: 0,
            bio: 0,
            banner: 0,
          },
        },
      },
    ])
    .toArray()
  const total = await db.posts.countDocuments({
    userId: new ObjectId(userId),
    deleted: false,
  })
  const relationPost = await db.posts
    .aggregate([
      {
        $match: {
          $or: [{ _id: { $in: posts.map((item) => item.relationId) } }],
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'user',
        },
      },
      {
        $unwind: '$user',
      },
      {
        $project: {
          user: {
            openid: 0,
            bio: 0,
            banner: 0,
          },
        },
      },
    ])
    .toArray()
  // 查看我是否点赞，如果点赞，则增加一个字段isLike为true
  const likes = await db.likes
    .find({
      userId: user._id,
      postId: { $in: posts.map((item) => item._id) },
    })
    .toArray()
  const items = posts.map((item) => {
    const islike = likes.find((like) => like.postId.equals(item._id))
    const repost = relationPost.find(
      (repost) => item.relationId && item.relationId.equals(repost._id)
    )
    return {
      ...item,
      repost,
      islike: islike ? true : false,
    }
  })
  return { user: userInfo, items, total }
}

/**
 * 查看某人所有帖子中的照片
 * @param userId 用户_id
 * @param skip 跳过条数
 * @param limit 返回条数
 * @returns 帖子列表
 * @throws 用户不存在
 * @return 照片列表
 */
export async function listImgsByUser(userId: string, skip: number, limit: number) {
  // 查询用户信息
  const user = await db.users.findOne(
    {
      _id: new ObjectId(userId),
    },
    {
      projection: {
        openid: 0,
      },
    }
  )
  if (!user) throw stats.ErrUserNotFound
  // 查询帖子中的所有图片
  const posts = await db.posts
    .aggregate([
      {
        $match: {
          userId: new ObjectId(userId),
          deleted: false,
          imgs: { $ne: [] },
        },
      },
      {
        $sort: { createdAt: -1 },
      },
      {
        $skip: skip,
      },
      {
        $limit: limit,
      },
    ])
    .toArray()
  // 查看我是否点赞，如果点赞，则增加一个字段isLike为true
  const likes = await db.likes
    .find({
      userId: user._id,
      postId: { $in: posts.map((item) => item._id) },
    })
    .toArray()
  const items = posts.map((item) => {
    const islike = likes.find((like) => like.postId.equals(item._id))
    return {
      ...item,
      islike: islike ? true : false,
    }
  })
  const total = await db.posts.countDocuments({
    userId: new ObjectId(userId),
    deleted: false,
    imgs: { $ne: [] },
  })
  return { user, items, total }
}

/**
 * 查看某人的所有喜欢的帖子
 * @param user 用户信息
 * @param userId 用户_id
 * @param skip 跳过条数
 * @param limit 返回条数
 * @returns 帖子列表
 * @throws 用户不存在
 * @return 帖子列表
 */
export async function listLikesByUser(user: IUser, userId: string, skip: number, limit: number) {
  // 查询用户信息
  const userInfo = await db.users.findOne({
    _id: new ObjectId(userId),
  })
  if (!userInfo) throw stats.ErrUserNotFound
  // 聚合查询某人点赞的所有帖子和作者信息
  const items = await db.posts
    .aggregate([
      {
        $lookup: {
          from: 'likes',
          localField: '_id',
          foreignField: 'postId',
          as: 'like',
        },
      },
      {
        $match: {
          'like.userId': new ObjectId(userId),
          deleted: false,
        },
      },
      {
        $skip: skip,
      },
      {
        $limit: limit,
      },
      // 查询帖子对应的用户信息
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'user',
        },
      },
      {
        $unwind: '$user',
      },
      {
        $project: {
          like: 0,
          user: {
            openid: 0,
            bio: 0,
            banner: 0,
          },
        },
      },
    ])
    .toArray()
  // 查看我是否点赞，如果点赞，则增加一个字段isLike为true
  const likes = await db.likes
    .find({
      userId: user._id,
      postId: { $in: items.map((item) => item._id) },
    })
    .toArray()
  const itemsData = items.map((item) => {
    const islike = likes.find((like) => like.postId.equals(item._id))
    return {
      ...item,
      islike: islike ? true : false,
    }
  })

  const total = await db.likes.countDocuments({
    userId: new ObjectId(userId),
  })
  return { items: itemsData, total }
}

/**
 * 查看某人的个人信息
 * @param user 用户信息
 * @param userId 用户_id
 * @returns 用户信息
 * @throws 用户不存在
 */
export async function listUserByUser(user: IUser, userId: string) {
  // 查询用户信息
  const userInfo = await db.users.findOne({
    _id: new ObjectId(userId),
  })
  if (!user) throw stats.ErrUserNotFound
  // 查询我是否关注他
  const isFollow = await db.follows.findOne({
    userId: user._id,
    followId: new ObjectId(userId),
  })
  // 查询我是否被他关注
  const isFan = await db.follows.findOne({
    userId: new ObjectId(userId),
    followId: user._id,
  })
  return { user: userInfo, isFollow: !!isFollow, isFan: !!isFan }
}
