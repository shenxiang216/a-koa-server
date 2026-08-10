import { request } from './util'

describe('点赞模块', () => {
  let postId = ''

  test('点赞', async () => {
    const { data: post } = await request.post('/api/v1/post/create', {
      content: '测试帖子内容',
      imgs: [
        'https://c-ssl.dtstatic.com/uploads/blog/202202/01/20220201222313_e92b7.thumb.1000_0.jpg',
      ],
      type: 1,
      relationId: '',
    })
    expect(post.code).toBe(0)
    postId = post.data._id
    const { data } = await request.post('/api/v1/like/update', {
      id: postId,
      value: true,
    })
    expect(data.code).toBe(0)
  })

  test('取消点赞', async () => {
    const { data } = await request.post('/api/v1/like/update', {
      id: postId,
      value: false,
    })
    expect(data.code).toBe(0)
    await request.post('/api/v1/post/remove', {
      _id: postId,
    })
  })
})
