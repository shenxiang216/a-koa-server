import { request } from './util'

describe('用户模块', () => {
  test('获取用户信息', async () => {
    const { data } = await request.get('/api/v1/user/info')
    expect(data.code).toBe(0)
    expect(data.data.user).toBeTruthy()
  })

  test('更新用户信息', async () => {
    const { data } = await request.post('/api/v1/user/update', {
      nickname: '测试用户',
      // 随机头像
      avatar:
        'https://c-ssl.dtstatic.com/uploads/blog/202202/01/20220201222313_e92b7.thumb.1000_0.jpg',
      banner:
        'https://c-ssl.dtstatic.com/uploads/blog/202202/01/20220201222313_e92b7.thumb.1000_0.jpg',
      bio: '测试介绍',
    })
    expect(data.code).toBe(0)
  })
})
