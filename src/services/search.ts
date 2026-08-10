import * as db from '../db'
import { IUser } from '../models/types'

/**
 * 根据关键词搜索帖子、用户、照片
 * @param keyword 关键字
 * @throws 数据库错误
 */
export async function search(user: IUser, keywords: string) {
  const keyword = new RegExp(keywords, 'i')
  // 根据关键词模糊查询帖子、用户、照片
  const searchUsers = await db.users
    .aggregate<IUser>([
      {
        $match: {
          $or: [
            { account: { $regex: keyword } },
            { nickname: { $regex: keyword } },
            { bio: { $regex: keyword } },
          ],
        },
      },
      {
        $sort: {
          fans: -1,
        },
      },
    ])
    .toArray()
  // 查询我是否关注了该用户，或者该用户是否关注了我
  const follow = await db.follows
    .find({
      $or: [
        { userId: user._id, followId: { $in: searchUsers.map((user) => user._id) } },
        { userId: { $in: searchUsers.map((user) => user._id) }, followId: user._id },
      ],
    })
    .toArray()
  // 合并用户信息
  const users = searchUsers.map((item) => {
    const isFollow = follow.find((follow) => follow.followId.equals(item._id))
    const isFan = follow.find((follow) => follow.userId.equals(item._id))
    return {
      ...item,
      isFollow: isFollow ? true : false,
      isFan: isFan ? true : false,
    }
  })

  // 聚合查询帖子和用户信息
  let posts = await db.posts
    .aggregate([
      {
        $match: {
          $or: [
            { content: { $regex: keyword } },
            { userId: { $in: users.map((user) => user._id) } },
            { relationId: { $in: users.map((user) => user._id) } },
          ],
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
        $project: {
          user: {
            openid: 0,
            banner: 0,
            bio: 0,
          },
        },
      },
    ])
    .toArray()
  // 查询转发帖子的信息和作者信息
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
  // 查看我是否点赞
  const likes = await db.likes
    .find({
      userId: user._id,
      postId: { $in: posts.map((item) => item._id) },
    })
    .toArray()
  posts = posts.map((item) => {
    const repost = relationPost.find(
      (repost) => item.relationId && item.relationId.equals(repost._id)
    )
    const islike = likes.find((like) => like.postId.toString() === item._id.toString())
    return {
      ...item,
      repost,
      islike: islike ? true : false,
    }
  })
  const imgs = posts.map((post) => post.imgs).flat(Infinity)
  return { users, posts, imgs }
}
