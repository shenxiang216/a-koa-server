import { request } from './util'

describe('通知模块', () => {
  const friendId = '62fc702a72c1fe4ec3ac74ba'

  test('获取通知数量', async () => {
    const { data } = await request.get('/api/v1/notice/getlength')
    expect(data.code).toBe(0)
    expect(data.data.noticeLength).toBeGreaterThanOrEqual(0)
  })

  let hasNext = false
  test('获取第一页通知列表', async () => {
    const { data } = await request.get('/api/v1/notice/getlist')
    expect(data.code).toBe(0)
    expect(data.data.result.length).toBeGreaterThanOrEqual(0)
    if (data.data.total > data.data.result.length) {
      hasNext = true
    }
  })

  test('获取下一页通知列表', async () => {
    if (hasNext) {
      const query = new URLSearchParams({
        skip: '10',
        limit: '10',
      })
      const { data } = await request.get('/api/v1/notice/getlist?' + query.toString())
      expect(data.code).toBe(0)
      expect(data.data.items).toBeGreaterThan(0)
    }
  })
  let createCareId = ''
  test('创建关注通知', async () => {
    const { data } = await request.post('/api/v1/notice/create', {
      type: 1,
      receiverId: friendId,
    })
    expect(data.code).toBe(0)
    createCareId = data.data._id
  })
  let postId = ''
  let commentId = ''
  let createCommentId = ''
  test('创建评论通知', async () => {
    const { data: post } = await request.post('/api/v1/post/create', {
      content: '测试帖子内容',
      imgs: ['https://c-ssl.dtstatic.com/uploads/blog/202202/01/20220201222313_e92b7.thumb.1000_0.jpg'],
      type: 1,
      relationId: ''
    })
    expect(post.code).toBe(0)
    postId = post.data._id
    const { data: comment } = await request.post('/api/v1/post/create', {
      content: '测试帖子内容',
      imgs: ['https://c-ssl.dtstatic.com/uploads/blog/202202/01/20220201222313_e92b7.thumb.1000_0.jpg'],
      type: 2,
      relationId: postId,
    })
    expect(comment.code).toBe(0)
    commentId = comment.data._id
    const { data } = await request.post('/api/v1/notice/create', {
      type: 2,
      relationId: commentId,
      receiverId: friendId,
    })
    expect(data.code).toBe(0)
    createCommentId = data.data._id
  })
  let repostId = ''
  let createRepostId = ''
  test('创建转发通知', async () => {
    const { data: repost } = await request.post('/api/v1/post/create', {
      content: '测试帖子内容',
      imgs: ['https://c-ssl.dtstatic.com/uploads/blog/202202/01/20220201222313_e92b7.thumb.1000_0.jpg'],
      type: 3,
      relationId: postId,
    })
    expect(repost.code).toBe(0)
    repostId = repost.data._id
    const { data } = await request.post('/api/v1/notice/create', {
      type: 3,
      relationId: repostId,
      receiverId: friendId,
    })
    expect(data.code).toBe(0)
    createRepostId = data.data._id
  })

  test('更新通知', async () => {
    const { data } = await request.post('/api/v1/notice/update', {
      noticeId: createCareId,
    })
    expect(data.code).toBe(0)
  })
  test('删除关注通知', async () => {
    const { data } = await request.post('/api/v1/notice/delete', {
      noticeId: createCareId,
    })
    expect(data.code).toBe(0)
  })
  test('删除评论通知', async () => {
    const { data } = await request.post('/api/v1/notice/delete', {
      noticeId: createCommentId,
    })
    expect(data.code).toBe(0)
  })
  test('删除转发通知', async () => {
    const { data } = await request.post('/api/v1/notice/delete', {
      noticeId: createRepostId,
    })
    expect(data.code).toBe(0)
  })
})
