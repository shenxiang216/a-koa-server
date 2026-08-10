/**
 * 统一JSON返回封装类
 */
export class JsonResp {
  code: number
  data?: any

  constructor(data?: any, code = 0) {
    this.data = data
    this.code = code
  }
}

/**
 * 错误状态
 */
export class ErrorStat extends JsonResp {
  message: string
  status: number

  constructor(code: number, message: string, status = 200) {
    super(undefined, code)
    this.message = message
    this.status = status
  }

  toJSON() {
    return {
      code: this.code,
      message: this.message,
    }
  }
}

/**
 * 业务状态错误码
 */
export const stats = {
  ErrServerError: new ErrorStat(1001, '服务器内部错误'),

  ErrUserNotLogin: new ErrorStat(20001, '用户未登录'),
  ErrUserNotFound: new ErrorStat(20002, '用户不存在'),
  ErrUserDisabled: new ErrorStat(20003, '用户已被禁用'),
  ErrFollowExist: new ErrorStat(20004, '已关注该用户'),
  ErrFollowNotFound: new ErrorStat(20005, '未关注该用户'),
  ErrFollowNotExist: new ErrorStat(20006, '关注记录不存在'),
  ErrFollowNotAllowed: new ErrorStat(20007, '不能关注自己'),

  ErrPasswordWrong: new ErrorStat(30001, '密码错误'),
  ErrPasswordSame: new ErrorStat(30002, '新旧密码不能相同'),
  ErrAccountExist: new ErrorStat(30003, '账号已存在'),
  ErrNicknameExist: new ErrorStat(30004, '昵称已存在'),

  ErrPostNotFound: new ErrorStat(40001, '帖子不存在'),
  ErrPostDeleted: new ErrorStat(40002, '帖子已删除'),
  ErrAdd: new ErrorStat(40003, '添加失败'),
  ErrUpdate: new ErrorStat(40004, '更新失败'),
  ErrNoPermission: new ErrorStat(40005, '没有权限'),
  ErrPostAlreadyLiked: new ErrorStat(40006, '已经点赞过该帖子'),
  ErrPostNotLiked: new ErrorStat(40007, '还没有点赞过该帖子'),

  ErrSessionNotFound: new ErrorStat(50001, '会话不存在'),

  ErrNoticeNotFound: new ErrorStat(60001, '通知不存在'),
  ErrNoticeUpdateError: new ErrorStat(60002, '通知更新失败'),

  ErrMessageNotFound: new ErrorStat(70001, '私信不存在'),
  ErrMessageUpdateError: new ErrorStat(70002, '私信不存在'),
}
