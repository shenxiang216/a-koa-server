import { MongoClient, Collection } from 'mongodb'
import { IUser, ISession, IFollow, IPost, ILike, IMessage, INotice } from './models/types'

export let users: Collection<IUser>
export let sessions: Collection<ISession>
export let follows: Collection<IFollow>
export let posts: Collection<IPost>
export let likes: Collection<ILike>
export let notices: Collection<INotice>
export let messages: Collection<IMessage>

export async function init() {
  const client = new MongoClient(process.env.MONGO_URL)

  await client.connect()
  const db = client.db()
  users = db.collection('users')
  sessions = db.collection('sessions')
  follows = db.collection('follows')
  posts = db.collection('posts')
  likes = db.collection('likes')
  notices = db.collection('notices')
  messages = db.collection('messages')
  sessions.createIndex(
    {
      createdAt: 1,
    },
    { unique: true, expireAfterSeconds: 86400 * 14 }
  )
}
