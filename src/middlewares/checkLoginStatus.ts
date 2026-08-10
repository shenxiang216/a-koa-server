import { Middleware } from 'koa'

import * as db from '../db'
import { stats } from '../libs/stats'

// 域名白名单
const whiteList = ['/api/v1/user/register', '/api/v1/user/wxlogin/', '/api/v1/user/temporary']

const url = `https://open.weixin.qq.com/connect/oauth2/authorize?appid=${process.env.APPID}&redirect_uri=http://127.0.0.1:4014/api/v1/user/wxlogin&response_type=code&scope=snsapi_userinfo&state=STATE#wechat_redirect`
/**
 * 检查是否登录
 * @param ctx
 * @param next
 */
const checkLoginStatus: Middleware = async (ctx, next) => {
  const sid = ctx.cookies.get('session_id')
  if (whiteList.includes(ctx.path)) {
    await next()
    return
  }
  if (!sid) {
    throw stats.ErrSessionNotFound
  }
  const result = await db.sessions.findOne({ sid })
  if (!result) {
    ctx.redirect(url)
    throw stats.ErrUserNotLogin
  }
  ctx.state.user = await db.users.findOne({ _id: result.userId })
  await next()
}

export default checkLoginStatus
