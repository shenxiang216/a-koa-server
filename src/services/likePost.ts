import { ObjectId } from 'mongodb'

import * as db from '../db'
import { IUser } from './../models/types'
import { stats } from '../libs/stats'

/**
 * 更新点赞状态
 * @param user 用户
 * @param postId 帖子id
 * @param value 点赞状态
 * @returns
 */
export async function update(user: IUser, postId: string, value: boolean) {
  // 查询是否已经点赞
  const isLiked = await db.likes.findOne({
    userId: user._id,
    postId: new ObjectId(postId),
  })
  // 查询帖子信息
  const post = await db.posts.findOne({
    _id: new ObjectId(postId),
    deleted: false,
  })
  if (!post) throw stats.ErrPostNotFound
  if (post.deleted) throw stats.ErrPostDeleted
  if (value) {
    if (!isLiked) {
      // 插入点赞记录
      await db.likes.insertOne({
        userId: user._id,
        postId: new ObjectId(postId),
        createdAt: Date.now(),
      })
      // 更新帖子点赞数
      await db.posts.updateOne(
        {
          _id: new ObjectId(postId),
        },
        {
          $inc: {
            likes: 1,
          },
        }
      )
    }
  } else {
    if (isLiked) {
      // 删除点赞记录
      await db.likes.deleteOne({
        userId: user._id,
        postId: new ObjectId(postId),
      })
      // 更新帖子点赞数
      await db.posts.updateOne(
        {
          _id: new ObjectId(postId),
        },
        {
          $inc: {
            likes: -1,
          },
        }
      )
    }
  }
}
