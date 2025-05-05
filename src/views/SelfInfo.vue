<script setup>
import { ref, computed, onMounted } from "vue";
import { 
  ElMessage, ElCard, ElRow, ElCol, ElSkeleton, 
  ElTag, ElButton, ElDialog, ElForm, ElFormItem, ElInput 
} from "element-plus";
import { getSelfInfoAPI, changePasswordAPI } from "@/api/adminApi";
import { Calendar, Edit, Key, User, Message, Iphone, Clock, Refresh } from '@element-plus/icons-vue';

const userData = ref(null);
const showPasswordDialog = ref(false);
const passwordForm = ref({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
});
const passwordFormRef = ref(null);

// 密码表单验证规则
const passwordRules = {
  oldPassword: [
    { required: true, message: '请输入原密码', trigger: 'blur' },
    { min: 6, message: '密码长度至少6位', trigger: 'blur' }
  ],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, message: '密码长度至少6位', trigger: 'blur' },
    { validator: validateNewPassword, trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请确认新密码', trigger: 'blur' },
    { validator: validateConfirmPassword, trigger: 'blur' }
  ]
};

// 验证新密码
function validateNewPassword(rule, value, callback) {
  if (value === passwordForm.value.oldPassword) {
    callback(new Error('新密码不能与原密码相同'));
  } else {
    callback();
  }
}

// 验证确认密码
function validateConfirmPassword(rule, value, callback) {
  if (value !== passwordForm.value.newPassword) {
    callback(new Error('两次输入的新密码不一致'));
  } else {
    callback();
  }
}

// 打开修改密码对话框
const openPasswordDialog = () => {
  passwordForm.value = {
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  };
  showPasswordDialog.value = true;
};

// 提交修改密码
const submitPasswordChange = () => {
  passwordFormRef.value.validate(async (valid) => {
    if (!valid) return;

    try {
      await changePasswordAPI({
        oldPassword: passwordForm.value.oldPassword,
        newPassword: passwordForm.value.newPassword
      });

      ElMessage.success('密码修改成功');
      showPasswordDialog.value = false;
    } catch (error) {
      ElMessage.error(error.message || '密码修改失败');
    }
  });
};

const getValueFromArray = (arr, key) => {
  if (!Array.isArray(arr)) return null;
  const found = arr.find(item => item.key === key || item.method === key || item.event === key || item.type === key);
  return found?.value || found?.at || found?.id || null;
};

const getContact = (method) => {
  return userData.value?.contacts?.find(c => c.method === method)?.value || "";
};

const getPersonalField = (key) => {
  const fields = userData.value?.personal_info?.[0]?.fields || [];
  return getValueFromArray(fields, key);
};

const getIdentity = () => {
  return userData.value?.identity?.find(i => i.type === "id")?.value || "";
};

// 计算加入天数
const membershipDays = computed(() => {
  if (!userData.value?.timestamps) return 0;
  const createTime = userData.value.timestamps.find(t => t.event === 'created')?.at;
  if (!createTime) return 0;
  
  const createdDate = new Date(createTime);
  const today = new Date();
  const diffTime = today - createdDate;
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
});

// 随机欢迎语
const welcomeMessages = [
  "今天也是元气满满的一天！",
  "感谢您的辛勤付出！",
  "您是我们团队的重要成员！",
  "让我们一起创造美好明天！",
  "您的贡献让团队更美好！",
  "每一天都是新的开始！",
  "感谢您为团队带来的活力！",
  "您的努力让我们更强大！"
];
const welcomeMessage = computed(() => {
  return welcomeMessages[Math.floor(Math.random() * welcomeMessages.length)];
});

// 随机头像背景色
const avatarBgColor = computed(() => {
  const colors = [
    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    'linear-gradient(135deg, #ff758c 0%, #ff7eb3 100%)',
    'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
    'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',
    'linear-gradient(135deg, #ff9a9e 0%, #fad0c4 100%)'
  ];
  return colors[Math.floor(Math.random() * colors.length)];
});

onMounted(async () => {
  try {
    const res = await getSelfInfoAPI();
    console.log("返回数据：", res);
    userData.value = res.user;
  } catch (error) {
    ElMessage.error(error.message);
  }
});
</script>

<template>
  <div class="user-container">
    <div class="user-info-container">
      <el-card v-if="userData" class="user-card">
        <!-- 头部欢迎区域 -->
        <div class="welcome-banner">
          <div class="welcome-message">{{ welcomeMessage }}</div>
          <div class="welcome-decoration"></div>
        </div>
        
        <!-- 个人信息区域 -->
        <div class="card-header">
          <div class="avatar-placeholder">
            <div class="avatar-circle" :style="{ background: avatarBgColor }">
              <span>{{ getPersonalField("username")?.charAt(0)?.toUpperCase() || "U" }}</span>
            </div>
          </div>
          
          <div class="user-info-header">
            <h2 class="user-title">{{ getPersonalField("username") || "用户" }}</h2>
            <p class="user-subtitle">{{ getPersonalField("reallyname") || "未提供姓名" }}</p>
            
            <div class="membership-days">
              <el-tag type="success" effect="dark" class="days-tag">
                <el-icon><Calendar /></el-icon>
                已共事 {{ membershipDays }} 天
              </el-tag>
            </div>
            
            <div class="welcome-emoji">🎉</div>
          </div>
        </div>

        <div class="divider"></div>

        <!-- 详细信息区域 -->
        <el-row class="user-info">
          <el-col :span="24" class="info-item">
            <div class="info-icon">
              <el-icon><User /></el-icon>
            </div>
            <div class="info-content">
              <div class="info-label">用户ID</div>
              <div class="info-value">{{ getIdentity() }}</div>
            </div>
          </el-col>

          <el-col :span="24" class="info-item">
            <div class="info-icon">
              <el-icon><Message /></el-icon>
            </div>
            <div class="info-content">
              <div class="info-label">邮箱</div>
              <div class="info-value">{{ getContact("email") }}</div>
            </div>
          </el-col>

          <el-col :span="24" class="info-item">
            <div class="info-icon">
              <el-icon><Iphone /></el-icon>
            </div>
            <div class="info-content">
              <div class="info-label">电话</div>
              <div class="info-value">{{ getContact("phone") }}</div>
            </div>
          </el-col>
        </el-row>
        
        <!-- 操作按钮区域 -->
        <div class="action-buttons">
          <el-button 
            type="primary" 
            @click="openPasswordDialog" 
            class="change-password-btn"
            round
          >
            <el-icon><Edit /></el-icon> 修改密码
          </el-button>
        </div>
      </el-card>

      <el-skeleton v-else :rows="5" animated>
        <template #template>
          <el-card class="user-card">
            <div class="card-header">
              <div class="avatar-placeholder">
                <el-skeleton-item variant="circle" style="width: 80px; height: 80px" />
              </div>
              <el-skeleton-item variant="text" style="width: 60%; height: 28px; margin: 10px auto" />
              <el-skeleton-item variant="text" style="width: 40%; height: 20px; margin: 0 auto" />
            </div>
            <div class="divider"></div>
            <div style="padding: 20px">
              <el-skeleton-item variant="text" style="width: 100%; height: 60px; margin-bottom: 15px" />
              <el-skeleton-item variant="text" style="width: 100%; height: 60px; margin-bottom: 15px" />
              <el-skeleton-item variant="text" style="width: 100%; height: 60px" />
            </div>
          </el-card>
        </template>
      </el-skeleton>
    </div>
    
    <!-- 修改密码对话框 -->
    <el-dialog v-model="showPasswordDialog" title="修改密码" width="500px" class="password-dialog">
      <el-form :model="passwordForm" :rules="passwordRules" ref="passwordFormRef" label-width="100px" status-icon>
        <el-form-item label="原密码" prop="oldPassword">
          <el-input v-model="passwordForm.oldPassword" type="password" placeholder="请输入原密码" show-password />
        </el-form-item>

        <el-form-item label="新密码" prop="newPassword">
          <el-input v-model="passwordForm.newPassword" type="password" placeholder="请输入新密码" show-password />
        </el-form-item>

        <el-form-item label="确认密码" prop="confirmPassword">
          <el-input v-model="passwordForm.confirmPassword" type="password" placeholder="请再次输入新密码" show-password />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="showPasswordDialog = false" round>取消</el-button>
        <el-button type="primary" @click="submitPasswordChange" :loading="loading" round>
          确认修改
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.user-container {
  display: flex;
  justify-content: center;
  min-height: 80vh;
  padding: 30px;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
}

.user-info-container {
  width: 100%;
  padding: 24px;
  background: transparent;
}

.user-card {
  width: 100%;
  max-width: 680px;
  margin: 0 auto;
  border-radius: 16px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08);
  overflow: hidden;
  transition: all 0.3s ease;
  border: none;
}

.user-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 15px 35px rgba(0, 0, 0, 0.12);
}

/* 欢迎横幅 */
.welcome-banner {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 15px 24px;
  color: white;
  position: relative;
  overflow: hidden;
}

.welcome-message {
  font-size: 16px;
  font-weight: 500;
  position: relative;
  z-index: 2;
}

.welcome-decoration {
  position: absolute;
  top: -50px;
  right: -50px;
  width: 150px;
  height: 150px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 50%;
}

.welcome-emoji {
  font-size: 24px;
  margin-top: 10px;
  animation: bounce 2s infinite;
}

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

.card-header {
  padding: 24px;
  display: flex;
  align-items: center;
  background: white;
}

.user-info-header {
  margin-left: 20px;
  flex: 1;
}

.avatar-placeholder {
  margin-bottom: 0;
}

.avatar-circle {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 80px;
  height: 80px;
  border-radius: 50%;
  font-size: 36px;
  font-weight: bold;
  color: white;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.avatar-circle:hover {
  transform: scale(1.05);
}

.user-title {
  font-size: 24px;
  font-weight: 600;
  margin: 0 0 5px 0;
  color: #333;
}

.user-subtitle {
  font-size: 16px;
  color: #666;
  margin: 0;
}

.membership-days {
  margin: 12px 0;
}

.days-tag {
  font-size: 14px;
  padding: 6px 12px;
  border-radius: 16px;
  background: linear-gradient(135deg, #8f3fdb 0%, #00b896 100%);
  color: white;
  border: none;
}

.days-tag .el-icon {
  margin-right: 6px;
  font-size: 16px;
}

.divider {
  height: 1px;
  background: rgba(0, 0, 0, 0.05);
  margin: 0 24px;
}

.user-info {
  padding: 16px 24px;
}

.info-item {
  display: flex;
  align-items: center;
  padding: 15px;
  margin-bottom: 15px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.03);
  transition: all 0.3s ease;
  border: 1px solid rgba(0, 0, 0, 0.05);
}

.info-item:hover {
  transform: translateX(5px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.08);
  border-color: rgba(102, 126, 234, 0.3);
}

.info-icon {
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f0f4ff;
  border-radius: 12px;
  margin-right: 15px;
  color: #667eea;
  font-size: 20px;
}

.info-content {
  flex: 1;
}

.info-label {
  font-size: 12px;
  color: #888;
  margin-bottom: 4px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.info-value {
  font-size: 16px;
  font-weight: 500;
  color: #333;
}

.action-buttons {
  padding: 20px 24px;
  text-align: center;
}

.change-password-btn {
  padding: 12px 24px;
  font-size: 14px;
  font-weight: 500;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  color: white;
  transition: all 0.3s ease;
}

.change-password-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(102, 126, 234, 0.3);
}

.change-password-btn .el-icon {
  margin-right: 6px;
}

/* 密码对话框样式 */
.password-dialog :deep(.el-dialog) {
  border-radius: 16px;
  overflow: hidden;
}

.password-dialog :deep(.el-dialog__header) {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  margin: 0;
  padding: 16px 20px;
}

.password-dialog :deep(.el-dialog__title) {
  color: white;
  font-size: 16px;
}

.password-dialog :deep(.el-dialog__headerbtn .el-dialog__close) {
  color: white;
}

.password-dialog :deep(.el-dialog__body) {
  padding: 20px 25px;
}

.password-dialog :deep(.el-form-item__label) {
  color: #64748b;
  font-weight: 500;
}

.password-dialog :deep(.el-input__inner) {
  border-radius: 8px;
  height: 40px;
  line-height: 40px;
}

.password-dialog :deep(.el-dialog__footer) {
  padding: 10px 20px 20px;
  text-align: right;
}

.password-dialog :deep(.el-button) {
  border-radius: 20px;
  padding: 10px 20px;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .user-container {
    padding: 15px;
  }
  
  .user-info-container {
    padding: 16px;
  }
  
  .card-header {
    flex-direction: column;
    text-align: center;
    padding: 20px;
  }
  
  .user-info-header {
    margin-left: 0;
    margin-top: 15px;
  }
  
  .avatar-circle {
    width: 70px;
    height: 70px;
    font-size: 30px;
  }
  
  .user-title {
    font-size: 20px;
  }
  
  .info-item {
    padding: 12px;
  }
  
  .info-icon {
    width: 40px;
    height: 40px;
    font-size: 18px;
  }
}
</style>