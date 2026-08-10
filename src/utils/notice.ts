import { ObjectId } from 'mongodb'
import { IUser } from '../models/types'
import * as db from '../db'
import { wss } from '../ws'

/**
 * 创建通知
 */
export async function createUserNotice(params: {
  user: IUser
  type: number
  relationId?: ObjectId
  receiverId?: ObjectId
}) {
  const { user, type, relationId, receiverId } = params
  let content = ''
  const now = Date.now()
  if (type === 1) {
    content = '关注了你'
    await db.notices.findOneAndDelete({
      senderId: user._id,
      receiverId,
      type: 1,
    })
    const result = await db.notices.insertOne({
      content,
      receiverId,
      senderId: user._id,
      relationId: relationId,
      type,
      isread: false,
      createdAt: now,
    })
    wss.clients.forEach((client) => {
      // 如果遍历到的客户端的user和info中的to相同 则发送信息给该客户端
      if (client['user'] === receiverId.toString()) {
        client.send('notice')
      }
    })
    return result.insertedId
  } else if (type === 2) {
    content = '评论了你'
  } else if (type === 3) {
    content = '转发了你的帖子'
  }
  const result = await db.notices.insertOne({
    content,
    receiverId,
    senderId: user._id,
    relationId,
    type,
    isread: false,
    createdAt: now,
  })
  wss.clients.forEach((client) => {
    // 如果遍历到的客户端的user和info中的to相同 则发送信息给该客户端
    if (client['user'] === receiverId.toString()) {
      client.send('notice')
    }
  })
  return result.insertedId
}
