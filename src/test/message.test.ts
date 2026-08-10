import { request } from './util'

describe('私信模块', () => {
  const friendId = '62fc702a72c1fe4ec3ac74ba'

  test('获取私信数量', async () => {
    const { data } = await request.get('/api/v1/message/getlength')
    expect(data.code).toBe(0)
    expect(data.data.messageLength).toBeGreaterThanOrEqual(0)
  })

  test('获取私信列表', async () => {
    const { data } = await request.get('/api/v1/message/getlist')
    expect(data.code).toBe(0)
    expect(data.data.result.length).toBeGreaterThanOrEqual(0)
  })

  let createId = ''
  test('创建普通私信', async () => {
    const { data } = await request.post('/api/v1/message/create', {
      friendId,
      content: '测试私信',
      type: 1,
    })
    expect(data.code).toBe(0)
    createId = data.data._id
  })
  let createImgId = ''
  test('创建图片私信', async () => {
    const { data } = await request.post('/api/v1/message/create', {
      friendId,
      content:
        'https://c-ssl.dtstatic.com/uploads/blog/202202/01/20220201222313_e92b7.thumb.1000_0.jpg',
      type: 2,
    })
    expect(data.code).toBe(0)
    createImgId = data.data._id
  })

  test('更新私信', async () => {
    const { data } = await request.post('/api/v1/message/update', {
      friendId,
    })
    expect(data.code).toBe(0)
  })
  let next = ''
  let prev = ''
  let hasNext = false
  test('获取第一页私信内容', async () => {
    const query = new URLSearchParams({
      friendId,
    })
    const { data } = await request.get('/api/v1/message/getcontent?' + query.toString())
    expect(data.code).toBe(0)
    expect(data.data.items.length).toBeGreaterThanOrEqual(0)
    hasNext = data.hasNext
    if (data.data.items.length > 0) {
      next = data.data.items[0]._id
      prev = data.data.items[data.data.items.length - 1]._id
    }
  })

  test('获取下一页私信内容', async () => {
    if (hasNext) {
      const query = new URLSearchParams({
        friendId,
        next,
      })
      const { data } = await request.get('/api/v1/message/getcontent?' + query.toString())
      expect(data.code).toBe(0)
      expect(data.data.items.length).toBeGreaterThan(0)
    }
  })
  test('获取上一页私信内容', async () => {
    if (hasNext) {
      const query = new URLSearchParams({
        friendId,
        prev,
        next,
      })
      const { data } = await request.get('/api/v1/message/getcontent?' + query.toString())
      expect(data.code).toBe(0)
      expect(data.data.items.length).toBeGreaterThan(0)
    }
  })
  test('删除私信', async () => {
    const { data } = await request.post('/api/v1/message/delete', {
      messageId: createId,
      friendId,
    })
    expect(data.code).toBe(0)
  })
  test('删除图片私信', async () => {
    const { data } = await request.post('/api/v1/message/delete', {
      messageId: createImgId,
      friendId,
    })
    expect(data.code).toBe(0)
  })
})
