<template>
    <div class="register-container">
      <div class="register-box">
        <div class="register-left">
          <div class="welcome-text">
            <h1>自由贷后台管理平台</h1>
            <p>Welcome to join us.</p>
          </div>
        </div>
        <div class="register-right">
          <el-card class="register-card" shadow="never">
            <template #header>
              <div class="register-header">
                <el-icon :size="40" color="#409EFF"><UserFilled /></el-icon>
                <h2>管理员注册</h2>
              </div>
            </template>
            <el-form
              ref="formRef"
              :model="form"
              :rules="rules"
              @submit.prevent="handleRegister"
            >
              <el-form-item prop="username">
                <el-input 
                  v-model="form.username"
                  placeholder="请输入用户名"
                  :prefix-icon="User"
                  size="large"
                />
              </el-form-item>
              <el-form-item prop="password">
                <el-input
                  v-model="form.password"
                  type="password"
                  placeholder="请输入密码"
                  :prefix-icon="Lock"
                  size="large"
                />
              </el-form-item>
              <el-form-item prop="confirmPassword">
                <el-input
                  v-model="form.confirmPassword"
                  type="password"
                  placeholder="请确认密码"
                  :prefix-icon="Lock"
                  size="large"
                />
              </el-form-item>
              <el-form-item>
                <el-button
                  type="primary"
                  :loading="loading"
                  @click="handleRegister"
                  size="large"
                  class="register-button"
                >
                  注册
                </el-button>
              </el-form-item>
              <div class="login-link">
                已有账号？<router-link to="/login">立即登录</router-link>
              </div>
            </el-form>
          </el-card>
        </div>
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref } from 'vue';
  import { User, Lock, UserFilled } from '@element-plus/icons-vue';
  import { ElMessage } from 'element-plus';
  import { useRouter } from 'vue-router';
  import { register } from '@/api/user';
  
  const router = useRouter();
  const formRef = ref(null);
  const loading = ref(false);
  
  const form = ref({
    username: '',
    password: '',
    confirmPassword: ''
  });
  
  const validatePass2 = (rule, value, callback) => {
    if (value === '') {
      callback(new Error('请再次输入密码'));
    } else if (value !== form.value.password) {
      callback(new Error('两次输入密码不一致!'));
    } else {
      callback();
    }
  };
  
  const rules = {
    username: [
      { required: true, message: '请输入用户名', trigger: 'blur' },
      { min: 3, max: 20, message: '长度在 3 到 20 个字符', trigger: 'blur' }
    ],
    password: [
      { required: true, message: '请输入密码', trigger: 'blur' },
      { min: 6, max: 20, message: '长度在 6 到 20 个字符', trigger: 'blur' }
    ],
    confirmPassword: [
      { required: true, validator: validatePass2, trigger: 'blur' }
    ]
  };
  
  const handleRegister = async () => {
    if (!formRef.value) return;
    
    await formRef.value.validate(async (valid) => {
      if (valid) {
        loading.value = true;
        console.log('开始注册请求...');
        try {
          console.log('发送数据:', form.value);
          await register(form.value);
          console.log('注册成功');
          ElMessage.success('注册成功');
          router.push('/login');
        } catch (error) {
          console.error('注册错误:', error);
          // 错误处理已在响应拦截器中完成
        } finally {
          loading.value = false;
        }
      }
    });
  };
  </script>
  
  <style scoped>
  .register-container {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 100vh;
    background: linear-gradient(135deg, #1890ff 0%, #36cfc9 100%);
  }
  
  .register-box {
    display: flex;
    width: 900px;
    height: 600px;
    background: #fff;
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
  }
  
  .register-left {
    flex: 1;
    background: linear-gradient(135deg, #1890ff 0%, #36cfc9 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 40px;
    color: #fff;
  }
  
  .welcome-text {
    text-align: center;
  }
  
  .welcome-text h1 {
    font-size: 36px;
    margin-bottom: 20px;
    font-weight: 600;
  }
  
  .welcome-text p {
    font-size: 16px;
    opacity: 0.9;
  }
  
  .register-right {
    flex: 1;
    padding: 40px;
    display: flex;
    align-items: center;
  }
  
  .register-card {
    width: 100%;
    border: none;
    background: transparent;
  }
  
  .register-header {
    text-align: center;
    margin-bottom: 30px;
  }
  
  .register-header h2 {
    margin: 16px 0 0;
    font-size: 24px;
    color: #303133;
  }
  
  .register-button {
    width: 100%;
    height: 44px;
    font-size: 16px;
    border-radius: 4px;
    margin-top: 10px;
  }
  
  .login-link {
    text-align: center;
    margin-top: 15px;
    font-size: 14px;
  }
  
  .login-link a {
    color: #409EFF;
    text-decoration: none;
  }
  
  .login-link a:hover {
    text-decoration: underline;
  }
  
  :deep(.el-input__wrapper) {
    padding: 4px 11px;
    box-shadow: 0 0 0 1px #dcdfe6 inset;
  }
  
  :deep(.el-input__wrapper:hover) {
    box-shadow: 0 0 0 1px #409eff inset;
  }
  
  :deep(.el-input__inner) {
    height: 40px;
  }
  
  :deep(.el-card__header) {
    padding: 0;
    border: none;
  }
  
  :deep(.el-card__body) {
    padding: 20px 0;
  }
  
  :deep(.el-form-item) {
    margin-bottom: 25px;
  }
  
  :deep(.el-form-item__error) {
    padding-top: 4px;
  }
  </style>