import { ObjectId } from 'mongodb'

import * as db from '../db'
import { PostType, IUser } from './../models/types'
import { stats } from '../libs/stats'
import * as notice from '../utils/notice'

/**
 * 获取帖子列表
 * @param user 用户
 * @param options 参数
 * @returns 帖子列表
 */
export async function list(
  user: IUser,
  options: {
    prev?: string
    next?: string
    limit?: number
  } = {}
) {
  const limit = options.limit || 10
  let posts = []
  let hasNext = false
  let hasPrev = false
  // 查询我关注的用户的_id
  const followIds = await db.follows
    .find({
      userId: user._id,
    })
    .toArray()
  // 查询关注的人的帖子
  if (options.next) {
    // 查询下一页
    posts = await db.posts
      .aggregate([
        {
          $match: {
            $or: [
              { userId: { $in: followIds.map((follow) => new ObjectId(follow.followId)) } },
              { userId: user._id },
            ],
          },
        },
        {
          $match: {
            _id: {
              $lt: new ObjectId(options.next),
            },
            deleted: false,
            type: { $ne: PostType.Comment },
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
            _id: -1,
          },
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
  } else if (options.prev) {
    // 查询上一页
    posts = await db.posts
      .aggregate([
        {
          $match: {
            $or: [
              { userId: { $in: followIds.map((follow) => new ObjectId(follow.followId)) } },
              { userId: user._id },
            ],
          },
        },
        {
          $match: {
            _id: {
              $gt: new ObjectId(options.prev),
            },
            deleted: false,
            type: { $ne: PostType.Comment },
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
            _id: 1,
          },
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
    posts.reverse()
  } else {
    // 查询第一页
    posts = await db.posts
      .aggregate([
        {
          $match: {
            $or: [
              { userId: { $in: followIds.map((follow) => follow.followId) } },
              { userId: user._id },
            ],
          },
        },
        {
          $match: {
            deleted: false,
            type: { $ne: PostType.Comment },
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
            _id: -1,
          },
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
  }
  if (posts.length > 0) {
    // 是否还有下一页
    const next = await db.posts.findOne(
      {
        _id: {
          $lt: new ObjectId(posts[posts.length - 1]._id),
        },
        deleted: false,
        type: { $ne: PostType.Comment },
        $or: [
          { userId: { $in: followIds.map((follow) => follow.followId) } },
          { userId: user._id },
        ],
      },
      {
        sort: {
          _id: -1,
        },
      }
    )
    if (next) hasNext = true
    // 是否还有上一页
    const prev = await db.posts.findOne(
      {
        _id: {
          $gt: new ObjectId(posts[0]._id),
        },
        deleted: false,
        type: { $ne: PostType.Comment },
        $or: [
          { userId: { $in: followIds.map((follow) => follow.followId) } },
          { userId: user._id },
        ],
      },
      {
        sort: {
          _id: -1,
        },
      }
    )
    if (prev) hasPrev = true
  }
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
  // 查看我是否点赞，如果点赞，则增加一个字段isLike为true
  const likes = await db.likes
    .find({
      userId: user._id,
      postId: { $in: posts.map((item) => item._id) },
    })
    .toArray()
  // 合并信息
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
  return { items, hasPrev, hasNext }
}

/**
 * 创建帖子 转发帖子 评论帖子
 * @param user 用户
 * @param content 帖子内容
 * @param imgs 图片列表
 * @param type 帖子类型
 * @param relationId 关联帖子_id
 */
export async function create(
  user: IUser,
  content: string,
  imgs: string[],
  type: PostType,
  relationId?: string
) {
  const post = {
    content,
    imgs,
    userId: user._id,
    relationId: relationId ? new ObjectId(relationId) : null,
    type: type,
    createdAt: Date.now(),
    likes: 0,
    comments: 0,
    reposts: 0,
    deleted: false,
  }
  const result = await db.posts.insertOne(post)
  // 增加点赞转发数
  if (type === PostType.Repost) {
    await db.posts.updateOne({ _id: new ObjectId(relationId) }, { $inc: { reposts: 1 } })
    const receiver = await db.posts.findOne({ _id: new ObjectId(relationId) })
    if (!receiver.userId.equals(user._id)) {
      await notice.createUserNotice({
        user,
        type: 3,
        relationId: new ObjectId(result.insertedId),
        receiverId: receiver.userId,
      })
    }
  }
  if (type === PostType.Comment) {
    await db.posts.updateOne({ _id: new ObjectId(relationId) }, { $inc: { comments: 1 } })
    const receiver = await db.posts.findOne({ _id: new ObjectId(relationId) })
    if (!receiver.userId.equals(user._id)) {
      await notice.createUserNotice({
        user,
        type: 2,
        relationId: new ObjectId(result.insertedId),
        receiverId: receiver.userId,
      })
    }
  }
  return { _id: result.insertedId }
}

/**
 * 帖子详情
 * @param user 用户
 * @param postId 帖子_id
 * @returns 帖子详情
 * @throws 帖子不存在
 * @throws 没有权限
 * @throws 帖子已删除
 */
export async function detail(user: IUser, postId: string) {
  // 查询帖子信息
  const post = await db.posts.findOne({
    _id: new ObjectId(postId),
    deleted: false,
  })
  if (!post) throw stats.ErrPostNotFound
  if (post.deleted) throw stats.ErrPostDeleted
  // 查询用户信息
  const postUser = await db.users.findOne(
    { _id: post.userId },
    {
      projection: {
        _id: 1,
        account: 1,
        nickname: 1,
        avatar: 1,
      },
    }
  )
  // 查询转发帖子的信息和作者信息
  const repost = await db.posts
    .aggregate([
      {
        $match: {
          _id: post.relationId,
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
  // 查询我是否点赞
  const islike = await db.likes
    .find({
      userId: user._id,
      postId: post._id,
    })
    .toArray()
  return {
    islike: islike.length > 0 ? true : false,
    ...post,
    user: postUser,
    repost: repost[0],
  }
}

/**
 * 删除帖子
 * @param user 用户
 * @param postId 帖子_id
 * @throws 没有权限
 * @throws 帖子已删除
 * @throws 帖子不存在
 */
export async function remove(user: IUser, postId: string) {
  // 查询帖子信息
  const post = await db.posts.findOne({
    _id: new ObjectId(postId),
  })
  if (!post) throw stats.ErrPostNotFound
  if (post.deleted) throw stats.ErrPostDeleted
  if (post.userId.toString() !== user._id.toString()) throw stats.ErrNoPermission
  // 删除帖子
  await db.posts.updateOne({ _id: new ObjectId(postId) }, { $set: { deleted: true } })
  // 删除点赞
  await db.likes.deleteMany({ postId: new ObjectId(postId) })
  // 修改原帖中的冗余字段
  if (post.type === PostType.Repost) {
    await db.posts.updateOne({ _id: new ObjectId(post.relationId) }, { $inc: { reposts: -1 } })
  }
  if (post.type === PostType.Comment) {
    await db.posts.updateOne({ _id: new ObjectId(post.relationId) }, { $inc: { comments: -1 } })
  }
}

/**
 * 获取帖子评论列表
 * @param user 用户
 * @param postId 帖子_id
 * @param skip 跳过的数量
 * @param limit 获取的数量
 * @returns 帖子评论列表
 * @throws 帖子不存在
 * @throws 帖子已删除
 * @throws 没有权限
 */
export async function comments(user: IUser, postId: string, skip: number, limit: number) {
  const comments = await db.posts
    .aggregate([
      {
        $match: {
          relationId: new ObjectId(postId),
          type: PostType.Comment,
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
        $sort: { createdAt: -1 },
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
      {
        $skip: skip,
      },
      {
        $limit: limit,
      },
    ])
    .toArray()
  const total = await db.posts.countDocuments({
    relationId: new ObjectId(postId),
    type: PostType.Comment,
    deleted: false,
  })
  // 查询转发帖子的信息和作者信息
  const relationPost = await db.posts
    .aggregate([
      {
        $match: {
          $or: [{ _id: { $in: comments.map((item) => item.relationId) } }],
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
  // 查询我是否点赞
  const likes = await db.likes
    .find({
      userId: user._id,
      postId: { $in: comments.map((item) => item._id) },
    })
    .toArray()
  const items = comments.map((item) => {
    const repost = relationPost.find(
      (repost) => item.relationId && item.relationId.equals(repost._id)
    )
    const liked = likes.find((like) => like.postId.toString() === item._id.toString())
    return {
      ...item,
      repost,
      liked: liked ? true : false,
    }
  })
  // 整合帖子和用户信息
  return {
    items: items,
    total: total,
  }
}
