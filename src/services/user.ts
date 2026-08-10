import { ObjectId } from 'mongodb'

import * as db from '../db'
import { stats } from '../libs/stats'
import getWxUserInfo from '../libs/accesstoken'
import { IUser } from '../models/types'

/**
 * 用户登录
 * @param code 微信登录code
 * @returns
 */
export async function Login(code: string) {
  const userInfo = await getWxUserInfo(code)
  // 查询用户是否存在
  const user = await db.users.findOne({
    openid: userInfo.openid,
  })
  if (user && user.account) {
    return {
      _id: user._id,
      isRegister: true,
    }
  }
  const result = await db.users.findOneAndUpdate(
    { openid: userInfo.openid },
    {
      $set: {
        openid: userInfo.openid,
        nickname: userInfo.nickname,
        avatar: userInfo.avatar,
        banner: userInfo.banner,
        bio: '',
        follows: 0,
        fans: 0,
        createdAt: Date.now(),
      },
    },
    { upsert: true }
  )
  if (!result.value || !result.value.account) {
    const res = await db.users.findOne({ openid: userInfo.openid })
    return {
      _id: res._id,
      nickname: res.nickname,
      avatar: res.avatar,
      isRegister: false,
    }
  }
}

/**
 * 注册用户
 * @param id 用户id
 * @param account
 */
export async function Register(id: string, account: string) {
  // 查找是否有相同的账号
  const result = await db.users.findOne({
    account,
  })
  if (result) {
    throw stats.ErrAccountExist
  }
  await db.users.findOneAndUpdate(
    { _id: new ObjectId(id) },
    {
      $set: {
        account,
      },
    },
    { upsert: true }
  )
}

/**
 * 查询用户
 * @param user 用户信息
 */
export async function find(user: IUser) {
  const result = await db.users.findOne(
    {
      _id: user._id,
    },
    {
      projection: {
        openid: 0,
      },
    }
  )
  if (!result) throw stats.ErrUserNotFound
  return result
}

/**
 * 更新用户
 * @param user 用户信息
 * @param newUser 更新信息
 */
export async function update(
  user: IUser,
  newUser: {
    nickname?: string
    avatar?: string
    banner?: string
    bio?: string
  }
) {
  const result = await db.users.findOneAndUpdate(
    { _id: user._id },
    {
      $set: {
        ...newUser,
      },
    },
    { upsert: true }
  )
  if (!result.value) throw stats.ErrUserNotFound
}
