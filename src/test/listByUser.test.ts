import { request } from './util'

describe('用户通用信息模块', () => {
  const userId = '62fc702a72c1fe4ec3ac74ba'

  test('查看某人发布的帖子', async () => {
    const query = new URLSearchParams({
      userId,
    })
    const { data } = await request.get('/api/v1/listByUser/post?' + query.toString())
    expect(data.code).toBe(0)
    expect(data.data.items.length).toBeGreaterThanOrEqual(0)
  })

  test('查看某人所有喜欢的帖子', async () => {
    const query = new URLSearchParams({
      userId,
    })
    const { data } = await request.get('/api/v1/listByUser/likes?' + query.toString())
    expect(data.code).toBe(0)
    expect(data.data.items.length).toBeGreaterThanOrEqual(0)
  })

  test('查看某人的个人信息', async () => {
    const query = new URLSearchParams({
      userId,
    })
    const { data } = await request.get('/api/v1/listByUser/user?' + query.toString())
    expect(data.code).toBe(0)
    expect(data.data.user).toBeTruthy()
  })
})
