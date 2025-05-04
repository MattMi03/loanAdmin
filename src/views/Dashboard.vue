<template>
  <div class="dashboard-container">
    <el-container>
      <!-- 侧边栏 -->
      <el-aside width="200px">
        <el-menu
          class="sidebar-menu"
          :default-active="activeMenu"
          background-color="#304156"
          text-color="#fff"
          active-text-color="#409EFF"
        >
          <el-menu-item index="1">
            <el-icon><HomeFilled /></el-icon>
            <span>首页</span>
          </el-menu-item>
          <el-menu-item index="2">
            <el-icon><Document /></el-icon>
            <span>待审文件</span>
          </el-menu-item>
          <el-menu-item index="3">
            <el-icon><List /></el-icon>
            <span>已审文件</span>
          </el-menu-item>
          <el-menu-item index="4">
            <el-icon><User /></el-icon>
            <span>个人中心</span>
          </el-menu-item>
        </el-menu>
      </el-aside>

      <!-- 主要内容区 -->
      <el-container>
        <!-- 顶部导航栏 -->
        <el-header>
          <div class="header-left">
            <h2>自由贷</h2>
          </div>
          <div class="header-right">
            <el-dropdown>
              <span class="user-dropdown">
                <el-avatar :size="32" :icon="User" />
                <span class="username">{{ username }}</span>
              </span>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item>个人信息</el-dropdown-item>
                  <el-dropdown-item >修改密码</el-dropdown-item>
                  <el-dropdown-item divided @click="handleLogout">退出登录</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </el-header>

        <!-- 内容区域 -->
        <el-main>
          <el-card class="welcome-card">
            <template #header>
              <div class="welcome-header">
                欢迎使用自由贷平台
              </div>
            </template> 
            <div class="dashboard-content">
              <el-row :gutter="20">
                <el-col :span="8">
                  <el-card class="data-card">
                    <h3>待审核文件</h3>
                    <div class="data-value">27</div>
                  </el-card>
                </el-col>
                <el-col :span="8">
                  <el-card class="data-card">
                    <h3>已审核文件</h3>
                    <div class="data-value">33</div>
                  </el-card>
                </el-col>
                <el-col :span="8">
                  <el-card class="data-card">
                    <h3>未通过文件</h3>
                    <div class="data-value">2</div>
                  </el-card>
                </el-col>
              </el-row>
            </div>
          </el-card>
        </el-main>
      </el-container>
    </el-container>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { 
  HomeFilled, 
  Document, 
  List, 
  User 
} from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

const router = useRouter()
const activeMenu = ref('1')
const username = ref('用户名') // 这里可以从store或其他地方获取用户名

const handleLogout = () => {
  // 这里添加登出逻辑
  ElMessage.success('退出成功')
  router.push('/login')
}
</script>

<style scoped>
.dashboard-container {
  height: 100vh;
}

.el-aside {
  background-color: #304156;
  height: 100vh;
}

.sidebar-menu {
  border-right: none;
}

.el-header {
  background-color: #fff;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 1px 4px rgba(0,21,41,.08);
  padding: 0 20px;
}

.header-left h2 {
  margin: 0;
  color: #409EFF;
}

.user-dropdown {
  display: flex;
  align-items: center;
  cursor: pointer;
}

.username {
  margin-left: 8px;
  font-size: 14px;
}

.el-main {
  background-color: #f0f2f5;
  padding: 20px;
}

.welcome-card {
  margin-bottom: 20px;
}

.welcome-header {
  font-size: 18px;
  font-weight: bold;
}

.dashboard-content {
  padding: 20px 0;
}

.data-card {
  text-align: center;
  padding: 20px;
}

.data-card h3 {
  margin: 0;
  color: #666;
  font-size: 16px;
}

.data-value {
  font-size: 24px;
  color: #409EFF;
  margin-top: 10px;
  font-weight: bold;
}

:deep(.el-menu-item) {
  display: flex;
  align-items: center;
}

:deep(.el-menu-item .el-icon) {
  margin-right: 10px;
}
</style> 