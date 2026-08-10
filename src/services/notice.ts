import { IUser } from '../models/types'
import * as db from '../db'
import { ObjectId } from 'mongodb'
import { wss } from '../ws'
import { stats } from '../libs/stats'

/**
 * 获取未读通知数量
 * @param user
 * @returns
 */
export async function getlength(user: IUser) {
  const noticeLength = await db.notices.countDocuments({
    receiverId: user._id,
    isread: false,
  })
  return noticeLength
}

/**
 * 获取通知列表
 * @param user
 * @returns
 */
export async function getNoticeList(user: IUser, skip: number, limit: number) {
  const result = await db.notices
    .aggregate([
      {
        $match: {
          receiverId: user._id,
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: 'senderId',
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
        $skip: skip,
      },
      {
        $limit: limit,
      },
      {
        $project: {
          _friend: 0,
        },
      },
    ])
    .toArray()
  const total = await db.notices.countDocuments({
    receiverId: user._id,
  })
  return {
    result,
    total,
  }
}

/**
 * 更新通知
 */
export async function updateUserNotice(user: IUser, noticeId: ObjectId) {
  const notice = await db.notices.updateOne(
    {
      receiverId: user._id,
      _id: noticeId,
    },
    {
      $set: { isread: true },
    }
  )
  if (!notice) throw stats.ErrNoticeUpdateError
  wss.clients.forEach((client) => {
    // 如果遍历到的客户端的user和info中的to相同 则发送信息给该客户端
    if (client['user'] === user._id.toString()) {
      client.send('notice')
    }
  })
}

/**
 * 删除通知
 */
export async function deleteUserNotice(user: IUser, noticeId: ObjectId) {
  const notice = await db.notices.findOneAndDelete({
    _id: noticeId,
    receiverId: user._id,
  })
  if (!notice) throw stats.ErrNoticeNotFound
  wss.clients.forEach((client) => {
    // 如果遍历到的客户端的user和info中的to相同 则发送信息给该客户端
    if (client['user'] === user._id.toString()) {
      client.send('notice')
    }
  })
}
