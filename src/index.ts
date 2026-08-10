import 'dotenv/config'
import Koa from 'koa'
import KoaBody from 'koa-body'

import logger from './middlewares/logger'
import checkError from './middlewares/checkError'
import * as db from './db'
import checkLoginStatus from './middlewares/checkLoginStatus'
import checkXss from './middlewares/checkXss'
import user from './controllers/user'
import file from './controllers/file'
import follow from './controllers/follow'
import post from './controllers/post'
import likePost from './controllers/likePost'
import search from './controllers/search'
import listByUser from './controllers/listByUser'
import message from './controllers/message'
import notice from './controllers/notice'
import ws from './ws'

const app = new Koa({
  keys: JSON.parse(process.env.KEYS),
})

app.use(logger)
app.use(checkError)
app.use(checkLoginStatus)
app.use(KoaBody())
app.use(checkXss)
app.use(user)
app.use(file)
app.use(follow)
app.use(post)
app.use(likePost)
app.use(search)
app.use(listByUser)
app.use(message)
app.use(notice)

async function run() {
  // 先等待数据库连接
  await db.init()
  // 监听端口
  app.listen(process.env.PORT)
  console.log('\x1B[36m%s\x1B[0m', `正在监听端口:${process.env.PORT}......`)
}

run()
ws()
