import { request } from './util'

describe('搜索模块', () => {
  test('搜索用户,帖子', async () => {
    const { data: user } = await request.get('/api/v1/user/info')
    const query = new URLSearchParams({
      keyword: user.nickname
    })
    const { data } = await request.get('/api/v1/search?' + query.toString())
    expect(data.code).toBe(0)
    expect(data.data.users.length).toBeGreaterThanOrEqual(0)
    expect(data.data.posts.length).toBeGreaterThanOrEqual(0)
  })
})