import { Middleware } from 'koa'

import xss from '../utils/xss'
import { ErrorStat } from '../libs/stats'

/**
 * 检查执行过程中的异常
 * @param ctx
 * @param next
 */
const checkXss: Middleware = async (ctx, next) => {
  try {
    const result = xss(ctx.request.body)
    ctx.request.body = result
    await next()
  } catch (error) {
    if (error instanceof ErrorStat) {
      ctx.status = error.status
      ctx.body = error
    } else {
      throw error
    }
  }
}

export default checkXss
