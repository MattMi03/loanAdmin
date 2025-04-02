import axios from 'axios'
import { ElMessage } from 'element-plus'

// 创建 axios 实例
const service = axios.create({
  baseURL: 'http://localhost:8000',
  timeout: 5000
})

// 请求拦截器
service.interceptors.request.use(
  config => {
    // 这里可以添加token等认证信息
    return config
  },
  error => {
    return Promise.reject(error)
  }
)

// 响应拦截器
service.interceptors.response.use(
  response => {
    return response.data
  },
  error => {
    console.error('请求错误:', error);
    ElMessage.error(
      error.response?.data?.detail || 
      error.message || 
      '网络错误，请稍后重试'
    );
    return Promise.reject(error)
  }
)

export default service 