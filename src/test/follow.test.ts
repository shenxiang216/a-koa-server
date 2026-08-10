import { request } from './util'

describe('关注模块', () => {
  const _id = '62fc683afbbecd348774fd60'
  const friendId = '62fc702a72c1fe4ec3ac74ba'

  test('获取某人关注的人的用户信息', async () => {
    const query = new URLSearchParams({
      _id,
    })
    const { data } = await request.get('/api/v1/follow/followlist?' + query.toString())
    expect(data.code).toBe(0)
    expect(data.data.items.length).toBeGreaterThanOrEqual(0)
  })

  test('获取某人关注的人的用户信息', async () => {
    const query = new URLSearchParams({
      _id,
    })
    const { data } = await request.get('/api/v1/follow/fanlist?' + query.toString())
    expect(data.code).toBe(0)
    expect(data.data.items.length).toBeGreaterThanOrEqual(0)
  })

  test('关注', async () => {
    await request.post('/api/v1/follow/remove', {
      id: friendId,
    })
    const { data } = await request.post('/api/v1/follow/create', {
      id: friendId,
    })

    expect(data.code).toBe(0)
  })

  test('取消关注', async () => {
    const { data } = await request.post('/api/v1/follow/remove', {
      id: friendId,
    })
    expect(data.code).toBe(0)
  })
})
