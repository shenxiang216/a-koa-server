import { request } from './util'

describe('帖子模块', () => {
  test('获取帖子列表', async () => {
    const { data } = await request.get('/api/v1/post/list')
    expect(data.code).toBe(0)
    expect(data.data.items.length).toBeGreaterThanOrEqual(0)
  })

  let postId = ''
  test('创建普通帖子', async () => {
    const { data } = await request.post('/api/v1/post/create', {
      content: '测试帖子内容',
      imgs: [
        'https://c-ssl.dtstatic.com/uploads/blog/202202/01/20220201222313_e92b7.thumb.1000_0.jpg',
      ],
      type: 1,
      relationId: '',
    })
    expect(data.code).toBe(0)
    postId = data.data._id
  })

  let commentId = ''
  test('创建评论帖子', async () => {
    const { data } = await request.post('/api/v1/post/create', {
      content: '测试帖子内容',
      imgs: [
        'https://c-ssl.dtstatic.com/uploads/blog/202202/01/20220201222313_e92b7.thumb.1000_0.jpg',
      ],
      type: 2,
      relationId: postId,
    })
    expect(data.code).toBe(0)
    commentId = data.data._id
  })

  let repostId = ''
  test('创建转发帖子', async () => {
    const { data } = await request.post('/api/v1/post/create', {
      content: '测试帖子内容',
      imgs: [
        'https://c-ssl.dtstatic.com/uploads/blog/202202/01/20220201222313_e92b7.thumb.1000_0.jpg',
      ],
      type: 3,
      relationId: postId,
    })
    expect(data.code).toBe(0)
    repostId = data.data._id
  })

  test('获取帖子详情', async () => {
    const { data } = await request.get('/api/v1/post/detail?id=' + postId)
    expect(data.code).toBe(0)
    expect(data.data.result).toBeTruthy()
  })

  test('获取帖子评论信息', async () => {
    const { data } = await request.get('/api/v1/post/comment?id=' + postId)
    expect(data.code).toBe(0)
    expect(data.data.items.length).toBeGreaterThanOrEqual(0)
    expect(data.data.total).toBeGreaterThanOrEqual(0)
  })

  test('删除帖子', async () => {
    const { data } = await request.post('/api/v1/post/remove', {
      _id: postId,
    })
    expect(data.code).toBe(0)
  })

  test('删除转发', async () => {
    const { data } = await request.post('/api/v1/post/remove', {
      _id: repostId,
    })
    expect(data.code).toBe(0)
  })

  test('删除评论', async () => {
    const { data } = await request.post('/api/v1/post/remove', {
      _id: commentId,
    })
    expect(data.code).toBe(0)
  })
})
