import Joi from 'joi'
import Router from 'koa-router'
import 'dotenv/config'

import validate from '../libs/validate'
import { JsonResp } from '../libs/stats'
import { infoRegex } from './../libs/infoRegex'
import * as sessionService from '../services/session'
import * as userService from '../services/user'

const router = new Router({
  prefix: '/api/v1/user',
})

// 临时登录
router.post('/temporary', async (ctx) => {
  const sid = await sessionService.create('62ff57faabdf9d440d25ad7a', ctx.ip)
  ctx.cookies.set('session_id', sid, {
    httpOnly: true,
    expires: new Date(Date.now() + 14 * 24 * 3600 * 1000),
  })
  ctx.body = new JsonResp()
})

// 用户登录
router.get('/wxlogin', async (ctx) => {
  const { code } = validate(
    ctx.query,
    Joi.object({
      code: Joi.string().required(),
    })
  )
  const result = await userService.Login(code)
  if (!result.isRegister) {
    ctx.redirect(
      `${process.env.FRONT}/register?id=${result._id}&nickname=${result.nickname}&avatar=${result.avatar}`
    )
    ctx.res.end()
    return
  }
  const sid = await sessionService.create(result._id.toString(), ctx.ip)
  ctx.redirect(process.env.FRONT)
  ctx.cookies.set('session_id', sid, {
    httpOnly: true,
    expires: new Date(Date.now() + 14 * 24 * 3600 * 1000),
  })
  ctx.body = new JsonResp()
})

// 用户注册
router.post('/register', async (ctx) => {
  const { account, id } = validate(
    ctx.request.body,
    Joi.object({
      // 账号 6至20位英文组成
      account: Joi.string().trim().regex(infoRegex.account).required(),
      id: Joi.string().required(),
    })
  )
  await userService.Register(id, account)
  const sid = await sessionService.create(id, ctx.ip)
  ctx.cookies.set('session_id', sid, {
    httpOnly: true,
    expires: new Date(Date.now() + 14 * 24 * 3600 * 1000),
  })
  ctx.body = new JsonResp()
})

// 获取用户信息
router.get('/info', async (ctx) => {
  const user = await userService.find(ctx.state.user)
  ctx.body = new JsonResp({ user })
})

// 更新用户信息
router.post('/update', async (ctx) => {
  const value = validate(
    ctx.request.body,
    Joi.object({
      // 最多可设置16个汉字，可设置含有中文、英文、数字、符号组合的昵称
      nickname: Joi.string().trim().max(32),
      avatar: Joi.string(),
      banner: Joi.string(),
      bio: Joi.string().trim().max(70),
    })
  )
  await userService.update(ctx.state.user, value)
  ctx.body = new JsonResp()
})

// 退出登录
router.post('/logout', async (ctx) => {
  await sessionService.remove(ctx.state.user)
  ctx.cookies.set('session_id', '')
  ctx.body = new JsonResp()
})

export default router.routes()
