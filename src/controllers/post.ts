import Joi from 'joi'
import Router from 'koa-router'

import validate from '../libs/validate'
import * as postService from '../services/post'
import { JsonResp } from '../libs/stats'

const router = new Router({
  prefix: '/api/v1/post',
})

// 获取帖子列表
router.get('/list', async (ctx) => {
  const { prev, next, limit } = validate(
    ctx.query,
    Joi.object({
      prev: Joi.string().hex().length(24),
      next: Joi.string().hex().length(24).empty(null),
      limit: Joi.number().integer().min(5).default(10),
    })
  )
  const result = await postService.list(ctx.state.user, {
    next,
    prev,
    limit,
  })
  ctx.body = new JsonResp(result)
})

// 创建帖子 转发帖子 评论帖子
router.post('/create', async (ctx) => {
  const { content, imgs, type, relationId } = validate(
    ctx.request.body,
    Joi.object({
      content: Joi.string().default('').allow(''),
      imgs: Joi.array().items(Joi.string()).max(4).default([]),
      // 校验枚举类型
      type: Joi.number().integer().min(1).max(3).required(),
      // 关联帖子_id
      relationId: Joi.string().hex().length(24).allow('').required(),
    })
  )
  const result = await postService.create(ctx.state.user, content, imgs, type, relationId)
  ctx.body = new JsonResp(result)
})

// 获取帖子详情
router.get('/detail', async (ctx) => {
  const { id } = validate(
    ctx.query,
    Joi.object({
      id: Joi.string().hex().length(24).required(),
    })
  )
  const result = await postService.detail(ctx.state.user, id)
  ctx.body = new JsonResp({ result })
})

// 获取帖子评论信息
router.get('/comment', async (ctx) => {
  const { id, skip, limit } = validate(
    ctx.query,
    Joi.object({
      id: Joi.string().hex().length(24).required(),
      skip: Joi.number().integer().min(0).default(0),
      limit: Joi.number().integer().min(1).max(20).default(10),
    })
  )
  const result = await postService.comments(ctx.state.user, id, skip, limit)
  ctx.body = new JsonResp(result)
})

// 删除帖子
router.post('/remove', async (ctx) => {
  const { _id } = validate(
    ctx.request.body,
    Joi.object({
      _id: Joi.string().hex().length(24).required(),
    })
  )
  await postService.remove(ctx.state.user, _id)
  ctx.body = new JsonResp()
})

export default router.routes()
