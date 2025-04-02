import request from './request'

// 登录接口
export function login(data) {
  return request({
    url: '/login',
    method: 'post',
    data: {
      账号: data.username,
      密码: data.password
    }
  })
}

// 注册接口
export function register(data) {
  return request({
    url: '/register',
    method: 'post',
    data: {
      账号: data.username,
      密码: data.password
    }
  })
}
