import 'dotenv/config'
import OSS from 'ali-oss'

// 阿里云oss
export const client = new OSS({
  region: process.env.REGION,
  accessKeyId: process.env.ACESSKEYID,
  accessKeySecret: process.env.ACESSKEYSECRET,
  bucket: process.env.bucket,
  cname: false,
  secure: true,
})

/**
 * 生成带图片处理参数的签名URL
 * @param {string} filename 文件名
 * @param {number} width 图片宽度
 * @param {number} height 图片高度
 */

export const getSignatureUrl = (filename: string, width?: number, height?: number) => {
  const res = client.signatureUrl(filename, {
    'Content-Type': 'blob',
    expires: 3600,
    method: 'PUT',
    response: {
      'content-type': 'application/json',
    },
    process: width ? `image/resize,w_${width},h_${height}` : '',
  })
  return res
}
