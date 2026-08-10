import * as crypto from 'crypto'
import { ObjectId, WithId } from 'mongodb'

import * as db from '../db'
import { stats } from '../libs/stats'
import { IUser } from './../models/types'

/**
 * 添加session
 * @param userId
 * @param ip ip地址
 */
export async function create(userId: string, ip: string) {
  const user = await db.users.findOne({
    _id: new ObjectId(userId),
  })
  if (!user) throw stats.ErrUserNotFound
  const sid = crypto.randomBytes(12).toString('hex')
  try {
    await db.sessions.findOneAndUpdate(
      {
        userId: user._id,
      },
      {
        $set: {
          sid,
          ip,
          createdAt: new Date(),
        },
      },
      {
        upsert: true,
      }
    )
    return sid
  } catch (err) {
    throw stats.ErrServerError
  }
}

/**
 * 删除session
 * @param user 用户
 */
export async function remove(user: WithId<IUser>) {
  const result = await db.sessions.findOneAndDelete({
    userId: user._id,
  })
  if (!result.value) throw stats.ErrSessionNotFound
}
