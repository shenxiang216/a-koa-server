import { WebSocketServer } from 'ws'
import 'dotenv/config'

import * as db from './db'

export const wss = new WebSocketServer({
  port: parseInt(process.env.WS_PORT),
  perMessageDeflate: {
    zlibDeflateOptions: {
      chunkSize: 1024,
      memLevel: 7,
      level: 3,
    },
    zlibInflateOptions: {
      chunkSize: 10 * 1024,
    },
    clientNoContextTakeover: true,
    serverNoContextTakeover: true,
    serverMaxWindowBits: 10,
    concurrencyLimit: 10,
    threshold: 1024,
  },
})

export default function () {
  this.wss = wss
  wss.on('connection', function connection(ws, request) {
    ws.on('message', async function message(data) {
      // 默认接收的message是一个字符串 需用用JSON.parse()转成对象
      const info = JSON.parse(data.toString())
      // 如果是登录请求 为客户端对象ws添加一个user属性info中的user属性
      if (info.type === 'login') {
        // 获取cookie
        const cookie = request.headers.cookie
        if (!cookie) {
          // 关闭连接
          return
        }
        const sid = cookie.split(';')[0].split('=')[1]
        const result = await db.sessions.findOne({ sid })
        if (result) {
          ws['user'] = result.userId.toString()
        }
      } else if (info.type === 'message') {
        // 如果是信息请求 则遍历wss.clients这个客户端set对象
        // 注意 这个对象是set类型 所以需要使用forEach进行遍历
        wss.clients.forEach((element) => {
          // 如果遍历到的客户端的user和info中的to相同 则发送信息给该客户端
          if (element['user'] === info.to) {
            element.send(info.message)
          }
        })
      }
    })
    ws.send('连接成功')
  })
}
