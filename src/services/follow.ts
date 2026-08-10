import { ObjectId } from 'mongodb'

import * as db from '../db'
import { IUser } from '../models/types'
import { stats } from '../libs/stats'
import * as notice from '../utils/notice'

/**
 * 获取关注的用户信息
 * @param user 用户
 * @param _id 用户_id
 * @param skip 跳过的数量
 * @param limit 获取的数量
 * @returns 关注列表和粉丝的用户信息
 * @throws 用户不存在
 */
export async function list(user: IUser, _id: string, skip = 0, limit = 10) {
  const followIds = await db.follows
    .find({
      userId: new ObjectId(_id),
    })
    .toArray()
  const users = await db.users
    .find({
      _id: {
        $in: followIds.map((follow) => follow.followId),
      },
    })
    .skip(skip)
    .limit(limit)
    .toArray()
  const follows = await db.follows
    .find({
      userId: user._id,
      followId: { $in: users.map((item) => new ObjectId(item._id)) },
    })
    .toArray()
  const fans = await db.follows
    .find({
      userId: { $in: users.map((item) => new ObjectId(item._id)) },
      followId: user._id,
    })
    .toArray()

  const items = users.map((item) => {
    const isFollow = follows.find((follow) => follow.followId.equals(item._id))
    const isFan = fans.find((follow) => follow.userId.equals(item._id))
    return { ...item, isFollow: !!isFollow, isFan: !!isFan }
  })
  return {
    items,
  }
  // 查询关注和粉丝的用户信息
}

/**
 * 获取粉丝列表
 * @param user 用户
 * @param _id 用户_id
 * @param skip 跳过的数量
 * @param limit 获取的数量
 * @returns 粉丝列表
 */
export async function fanslist(user: IUser, _id: string, skip = 0, limit = 10) {
  const fansIds = await db.follows
    .find({
      followId: new ObjectId(_id),
    })
    .toArray()
  const users = await db.users
    .find({
      _id: {
        $in: fansIds.map((follow) => follow.userId),
      },
    })
    .skip(skip)
    .limit(limit)
    .toArray()
  const follows = await db.follows
    .find({
      userId: user._id,
      followId: { $in: users.map((item) => new ObjectId(item._id)) },
    })
    .toArray()
  const fans = await db.follows
    .find({
      userId: { $in: users.map((item) => new ObjectId(item._id)) },
      followId: user._id,
    })
    .toArray()

  const items = users.map((item) => {
    const isFollow = follows.find((follow) => follow.followId.equals(item._id))
    const isFan = fans.find((follow) => follow.userId.equals(item._id))
    return { ...item, isFollow: !!isFollow, isFan: !!isFan }
  })

  return {
    items,
  }
}

/**
 * 关注用户
 * @param user 用户信息
 * @param followId 关注用户id
 */
export async function follow(user: IUser, followId: string) {
  if (user._id.toString() === followId) {
    throw stats.ErrFollowNotAllowed
  }
  // 查询是否已经关注
  const follow = await db.follows.findOne({
    userId: user._id,
    followId: new ObjectId(followId),
  })
  if (follow) {
    throw stats.ErrFollowExist
  }
  // 插入关注记录
  await db.follows.insertOne({
    userId: user._id,
    followId: new ObjectId(followId),
    createdAt: new Date(),
  })
  // 增加粉丝数
  await db.users.updateOne({ _id: new ObjectId(followId) }, { $inc: { fans: 1 } })
  // 增加关注数
  await db.users.updateOne({ _id: user._id }, { $inc: { follows: 1 } })
  await notice.createUserNotice({ user, type: 1, receiverId: new ObjectId(followId) })
}

/**
 * 取消关注用户
 * @param user 用户信息
 * @param followId 关注用户id
 */
export async function unfollow(user: IUser, followId: string) {
  // 查询是否已经关注
  const follow = await db.follows.findOne({
    userId: user._id,
    followId: new ObjectId(followId),
  })
  if (!follow) {
    throw stats.ErrFollowNotExist
  }
  // 删除关注记录
  await db.follows.deleteOne({
    userId: user._id,
    followId: new ObjectId(followId),
  })
  // 减少粉丝数
  await db.users.updateOne({ _id: new ObjectId(followId) }, { $inc: { fans: -1 } })
  // 减少关注数
  await db.users.updateOne({ _id: user._id }, { $inc: { follows: -1 } })
}
