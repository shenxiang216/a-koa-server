# server


## 服务端运行说明

#### 1.创建`.env`文件

> 为了方便运行项目，将自己的阿里云oss的id和secret写了上来
>
> 请将**APP_ID、APP_SECRET**补充完整

* 文件说明：

  ``` bash
  #http端口
  PORT=
  #websocket端口
  WS_PORT=
  #mongodb地址
  MONGO_URL=
  KEYS=
  #oss所在区域
  REGION=
  #oss keyid
  ACESSKEYID=
  #oss密钥
  ACESSKEYSECRET=
  #oss文件bucket名
  bucket=
  #前端地址
  FRONT=
  #微信开发者appid
  APP_ID=
  #微信开发者app密钥
  APP_SECRET=
  ```


#### 2.安装依赖启动

``` bash
# 安装依赖
npm i
# 编译ts代码
tsc -w
# 启动
npm start/yarn start
```

#### 3.备注

* 服务端运行后会开启两个端口，4014负责监听http请求，4015负责ws请求
* 请在微信开发者后台配置域名`127.0.0.1:4014`