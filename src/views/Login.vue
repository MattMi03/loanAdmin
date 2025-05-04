  <template>
  <div class="login-container">
    <div class="login-box">
      <div class="login-left">
        <div class="welcome-text">
          <h1>自由贷后台管理平台</h1>
          <p>Welcome to join us.</p>
        </div>
      </div>
      <div class="login-right">
        <el-card class="login-card" shadow="never">
          <template #header>
            <div class="login-header">
              <el-icon :size="40" color="#409EFF"><Reading /></el-icon>
              <h2>管理员登录</h2>
            </div>
          </template>
          <el-form
            ref="formRef"
            :model="form"
            :rules="rules"
            @submit.prevent="handleLogin"
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
                @keyup.enter="handleLogin"
              />
            </el-form-item>
            <el-form-item>
              <el-button
                type="primary"
                :loading="loading"
                @click="handleLogin"
                size="large"
                class="login-button"
              >
                登录
              </el-button>
            </el-form-item>
            <div class="register-link">
              还没有账号？<router-link to="/register">立即注册</router-link>
            </div>
          </el-form>
        </el-card>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { ElMessage } from 'element-plus';
import { User, Lock, Reading } from '@element-plus/icons-vue';
import { useRouter } from 'vue-router';
import { login } from '@/api/user';
import { loginAPI } from '@/api/adminApi'; 

const router = useRouter();

const formRef = ref(null);

const form = ref({
  username: '',
  password: ''
});

const rules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '长度在 3 到 20 个字符', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, max: 20, message: '长度在 6 到 20 个字符', trigger: 'blur' }
  ]
};

const loading = ref(false);

const handleLogin = async () => {
  if (!formRef.value) return;

  await formRef.value.validate(async (valid) => {
    if (valid) {
      loading.value = true;
      try {
        const result = await loginAPI(form.value);
        localStorage.setItem('token', result.token); // 假设返回的 token 在 data.token 中
        ElMessage.success('登录成功');
        router.push('/manager/home');
      } catch (error) {
        ElMessage.error('登录失败，请检查用户名和密码');
      } finally {
        loading.value = false;
      }
    }
  });
};

// const handleLogin = async () => {
//   if (!formRef.value) return;
  
//   await formRef.value.validate(async (valid) => {
//     if (valid) {
//       loading.value = true;
//       try {
//         const result = await login(form.value);
//         ElMessage.success('登录成功');
//         router.push('/manager/home');
//       } catch (error) {
//         // 错误处理已在响应拦截器中完成
//       } finally {
//         loading.value = false;
//       }
//     }
//   });
// };
</script>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #1890ff 0%, #36cfc9 100%);
}

.login-box {
  display: flex;
  width: 900px;
  height: 500px;
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
}

.login-left {
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

.login-right {
  flex: 1;
  padding: 40px;
  display: flex;
  align-items: center;
}

.login-card {
  width: 100%;
  border: none;
  background: transparent;
}

.login-header {
  text-align: center;
  margin-bottom: 30px;
}

.login-header h2 {
  margin: 16px 0 0;
  font-size: 24px;
  color: #303133;
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

.login-button {
  width: 100%;
  height: 44px;
  font-size: 16px;
  border-radius: 4px;
  margin-top: 10px;
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

.register-link {
  text-align: center;
  margin-top: 15px;
  font-size: 14px;
}

.register-link a {
  color: #409EFF;
  text-decoration: none;
}

.register-link a:hover {
  text-decoration: underline;
}
</style>
