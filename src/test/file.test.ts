import { request } from './util'

describe('文件模块', () => {
  test('文件签名', async () => {
    const filename = 'test'
    const query = new URLSearchParams({
      filename,
    })
    const { data } = await request.get('/api/v1/file/signature?' + query.toString())
    expect(data.code).toBe(0)
    // 断言url是否返回
    expect(data.data.url).toBeTruthy()
  })
})
