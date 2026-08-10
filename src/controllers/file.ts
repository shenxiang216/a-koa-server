import Joi from 'joi'
import Router from 'koa-router'

import validate from '../libs/validate'
import { JsonResp } from '../libs/stats'
import * as fileService from '../services/file'

const router = new Router({
  prefix: '/api/v1/file',
})

// 文件上传签名
router.get('/signature', async (ctx) => {
  const { filename, width, hright } = validate(
    ctx.request.query,
    Joi.object({
      filename: Joi.string().required(),
      width: Joi.number().allow('undefined'),
      height: Joi.number().allow('undefined'),
    })
  )
  const url = fileService.getSignatureUrl(filename, width, hright)
  ctx.body = new JsonResp({ url })
})

export default router.routes()
