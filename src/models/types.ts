import { ObjectId } from 'mongodb'

// 用户
export interface IUser {
  _id: ObjectId
  // 账号
  account: string
  // 昵称
  nickname: string
  // 头像地址
  avatar: string
  // 背景图地址
  banner: string
  // 个人介绍
  bio: string
  // 微信openid
  openid: string
  // 创建时间
  createdAt: number
  // 粉丝数
  fans: number
  // 关注数
  follows: number
}

// 关注列表
export interface IFollow {
  // 用户id
  userId: ObjectId
  // 关注用户id
  followId: ObjectId
  // 创建时间
  createdAt?: Date
}

// 会话
export interface ISession {
  // session id
  sid: string
  // 关联的用户_id
  userId: ObjectId
  // 登录的ip地址
  ip: string
  // 创建时间
  createdAt: Date
}

// 帖子类型
export enum PostType {
  Default = 1,
  Comment = 2,
  Repost = 3,
}

export interface IPost {
   // 帖子内容
   content: string
   // 图片列表
   imgs: string[]
   // 用户_id
   userId: ObjectId
   // 关联帖子_id
   relationId: ObjectId
   // 帖子类型
   type: PostType
   // 回帖数
   comments: number
   // 转发数
   reposts: number
   // 喜欢数
   likes: number
   // 是否删除
   deleted: boolean
   // 创建时间
   createdAt: number
}

export interface ILike {
  // 帖子_id
  postId: ObjectId
  // 用户_id
  userId: ObjectId
  // 创建时间
  createdAt: number
}

// 通知类型
enum NoticeType {
  Follow = 1,
  Comment = 2,
  Repost = 3,
}

export interface INotice {
  // 消息内容
  content: string
  // 接收者id
  receiverId: ObjectId
  // 发送者id
  senderId: ObjectId
  // 关联数据id
  relationId: ObjectId
  // 通知类型
  type: NoticeType
  // 是否已读
  isread: boolean
  // 创建时间
  createdAt: number
}

// 私信类型
export enum MessageType {
  Content = 1,
  Img = 2,
}

export interface IMessage {
  // 私信内容
  content: string
  // 私信类型
  type: MessageType
  // 当前用户id
  userId: ObjectId
  // 对方用户id
  friendId: ObjectId
  // 实际发送者id
  senderId: ObjectId
  // 实际接收者id
  receiverId: ObjectId
  // 是否已读
  isread: boolean
  // 是否已删除
  deleted: boolean
  // 创建时间
  createdAt: number
}
