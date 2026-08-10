import { ObjectId, WithId } from 'mongodb'
import * as db from '../db'
import { stats } from '../libs/stats'
import { IMessage, IUser, MessageType } from '../models/types'
import { wss } from '../ws'

/**
 * 获取未读私信数量
 * @param user
 * @returns
 */
export async function getlength(user: IUser) {
  const messageCount = await db.messages.countDocuments({
    userId: user._id,
    isread: false,
    deleted: false,
  })
  return messageCount
}

/**
 * 获取私信列表
 */
export async function getMessageList(user: IUser) {
  const result = await db.messages
    .aggregate([
      {
        $match: {
          userId: user._id,
          deleted: false,
        },
      },
      {
        $group: {
          _id: '$friendId',
          totalCount: {
            $sum: {
              $cond: { if: { $eq: ['$isread', false] }, then: 1, else: 0 },
            },
          },
          createdAt: { $last: '$createdAt' },
          content: { $last: '$content' },
          type: { $last: '$type' },
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: '_friend',
        },
      },
      {
        $unwind: {
          path: '$_friend',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $addFields: {
          friendavatar: '$_friend.avatar',
          friendnickname: '$_friend.nickname',
        },
      },
      {
        $sort: {
          createdAt: -1,
        },
      },
      {
        $project: {
          _friend: 0,
        },
      },
    ])
    .toArray()
  return result
}

/**
 * 获取私信内容
 * @param user
 * @param friendId
 * @returns
 */
export async function getUserMessage(
  user: IUser,
  friendId: ObjectId,
  options: {
    prev?: string
    next?: string
    limit?: number
  } = {}
) {
  const limit = options.limit || 8
  let items: WithId<IMessage>[] = []
  let hasNext = false
  if (options.next && !options.prev) {
    // 查询下一页
    items = await db.messages
      .aggregate<WithId<IMessage>>([
        {
          $match: {
            userId: user._id,
            friendId,
            _id: {
              $lt: new ObjectId(options.next),
            },
            deleted: false,
          },
        },
        {
          $sort: {
            createdAt: -1,
          },
        },
        {
          $limit: limit,
        },
      ])
      .toArray()
    items.reverse()
  } else if (options.prev) {
    // 查询上一页
    items = await db.messages
      .aggregate<WithId<IMessage>>([
        {
          $match: {
            userId: user._id,
            friendId,
            _id: {
              $gt: new ObjectId(options.prev),
            },
            deleted: false,
          },
        },
        {
          $sort: {
            createdAt: -1,
          },
        },
        {
          $limit: limit,
        },
      ])
      .toArray()
    items.reverse()
  } else {
    // 查询第一页
    items = await db.messages
      .find({
        userId: user._id,
        friendId,
        deleted: false,
      })
      .sort({ _id: -1 })
      .limit(limit)
      .toArray()
    items.reverse()
  }
  if (items.length > 0) {
    // 是否还有下一页
    const _id = options.prev ? options.next : items[0]._id
    const next = await db.messages.findOne({
      _id: {
        $lt: new ObjectId(_id),
      },
      userId: user._id,
      friendId,
      deleted: false,
    })
    if (next) hasNext = true
  }
  return {
    items,
    hasNext,
  }
}

/**
 * 删除私信
 * @param user
 * @param friendId
 * @param messageId
 * @returns
 */
export async function deleteUserMessage(user: IUser, messageId: ObjectId, friendId: ObjectId) {
  const message = await db.messages.findOneAndUpdate(
    {
      userId: user._id,
      friendId,
      _id: messageId,
    },
    {
      $set: {
        deleted: true,
      },
    }
  )
  if (!message) throw stats.ErrMessageNotFound
}

/**
 * 创建私信
 * @param user
 * @param friendId
 * @param content
 * @param type
 * @returns
 */
export async function createUserMessage(
  user: IUser,
  friendId: ObjectId,
  content: string,
  type: MessageType
) {
  const now = Date.now()
  const result = await db.messages.insertOne({
    content,
    type,
    userId: user._id,
    friendId,
    senderId: user._id,
    receiverId: friendId,
    isread: true,
    deleted: false,
    createdAt: now,
  })
  await db.messages.insertOne({
    content,
    type,
    userId: friendId,
    friendId: user._id,
    senderId: user._id,
    receiverId: friendId,
    isread: false,
    deleted: false,
    createdAt: now,
  })
  wss.clients.forEach((client) => {
    // 如果遍历到的客户端的user和info中的to相同 则发送信息给该客户端
    if (client['user'] === friendId.toString()) {
      client.send('message')
    }
  })
  return result.insertedId
}

/**
 * 将私信标为已读
 * @param user
 * @param friendId
 * @returns
 */
export async function updateUserMessage(user: IUser, friendId: ObjectId) {
  const message = await db.messages.updateMany(
    {
      userId: user._id,
      friendId,
      isread: false,
    },
    {
      $set: { isread: true },
    }
  )
  if (!message) throw stats.ErrMessageUpdateError
}
