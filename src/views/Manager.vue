<script setup>
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { HomeFilled, Document, List, User, Message } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import SockJS from 'sockjs-client/dist/sockjs'
import Stomp from 'stompjs'

const messageCount = ref(0)
const messageList = ref([])
const drawerVisible = ref(false)

const isHappy = ref(false)
const isSleeping = ref(false)
const showSpeech = ref(false)
const currentSpeech = ref('')

const speeches = [
  '点击我玩呀~',
  '今天也要加油哦!',
  '喵喵喵~',
  '想不想摸摸我?',
  '工作辛苦啦!',
  '陪我玩一会儿嘛~',
  '我最喜欢你了~',
  '今天心情不错哦~',
  '我想吃好吃的~',
  '你真可爱~',
  '我也想出去玩~',
  '你真聪明~',
  '我想去旅行~',
  '我喜欢和你在一起~',
]

// 宠物互动
const interactWithPet = () => {
  isHappy.value = true
  showSpeech.value = true

  // 随机选择一句话
  currentSpeech.value = speeches[Math.floor(Math.random() * speeches.length)]

  // 开心状态持续1.5秒
  setTimeout(() => {
    isHappy.value = false
  }, 1500)

  // 3秒后隐藏对话气泡
  setTimeout(() => {
    showSpeech.value = false
  }, 3000)
}

// 随机睡觉行为
setInterval(() => {
  if (Math.random() > 0.8) { // 10%概率会睡觉
    isSleeping.value = true
    showSpeech.value = true
    currentSpeech.value = '呼~ 我睡觉了~ Zzz😴'
    setTimeout(() => {
      isSleeping.value = false
      showSpeech.value = false
    }, 3000)
  }
}, 10000)

let stompClient = null

const loadMessagesFromLocalStorage = () => {
  const storedMessages = JSON.parse(localStorage.getItem('messageList') || '[]')
  const storedCount = parseInt(localStorage.getItem('messageCount') || '0')
  messageList.value = storedMessages
  messageCount.value = storedCount
}

const saveMessagesToLocalStorage = () => {
  localStorage.setItem('messageList', JSON.stringify(messageList.value))
  localStorage.setItem('messageCount', messageCount.value.toString())
}

const connectWebSocket = () => {
  const socket = new SockJS('http://localhost:8888/ws')
  stompClient = Stomp.over(socket)
  const token = localStorage.getItem('token')

  if (token) {
    stompClient.connect({ 'Authorization': 'Bearer ' + token }, () => {
      stompClient.subscribe('/topic/review', (message) => {
        const data = JSON.parse(message.body)
        messageCount.value++
        messageList.value.unshift({
          content: data.content,
          applyId: data.apply_id,
          timestamp: new Date().toLocaleString()
        })
        saveMessagesToLocalStorage()
      })
    })
  } else {
    console.log("No token found")
  }
}

const openNotificationDrawer = () => {
  drawerVisible.value = true
}

const router = useRouter()
const activeMenu = ref('1')
const username = ref('用户名')

const goToProfile = () => {
  router.push({ path: '/manager/selfinfo' })
}

const goToChangePassword = () => {
  router.push({ name: 'ChangePassword' })
}

const handleLogout = () => {
  localStorage.removeItem('token')
  ElMessage.success('退出成功')
  router.push('/login')
}

const checkLogin = () => {
  const token = localStorage.getItem('token')
  if (!token) {
    ElMessage.error('请先登录')
    router.push('/login')
  }
}

const handleClick = (applyId) => {
  messageList.value = messageList.value.filter(msg => msg.applyId !== applyId)
  messageCount.value = messageList.value.length
  saveMessagesToLocalStorage()
  drawerVisible.value = false
  router.push({ path: '/manager/approve', query: { applyId: applyId } })
}

onMounted(() => {
  checkLogin()
  loadMessagesFromLocalStorage()
  connectWebSocket()
})
</script>

<template>
  <div>
    <!-- 头部区域 -->
    <div class="header-container">
      <!-- 标题logo -->
      <div class="logo-container">
        <div class="logo-text">自由贷</div>
      </div>

      <!-- 左侧展开按钮 -->
      <div class="left-expand">
        <el-dropdown>
          <span class="el-dropdown-link">
            <el-icon>
              <MoreFilled />
            </el-icon>
          </span>
        </el-dropdown>
      </div>

      <!-- 中间空白区域 -->
      <div class="header-middle">
        <div class="pet-container" @click="interactWithPet">
          <!-- 宠物主体 -->
          <div class="pet" :class="{ 'is-happy': isHappy, 'is-sleeping': isSleeping }">
            <!-- 宠物脸 -->
            <div class="pet-face">
              <!-- 眼睛 -->
              <div class="pet-eyes">
                <div class="pet-eye"></div>
                <div class="pet-eye"></div>
              </div>
              <!-- 嘴巴 -->
              <div class="pet-mouth"></div>
            </div>
            <!-- 宠物耳朵 -->
            <div class="pet-ears">
              <div class="pet-ear left"></div>
              <div class="pet-ear right"></div>
            </div>
          </div>

          <!-- 对话气泡 -->
          <div class="speech-bubble" v-if="showSpeech">
            {{ currentSpeech }}
          </div>
        </div>
      </div>

      <!-- 右侧图标区域 -->
      <div class="header-right">
        <!-- 问题图标 -->
        <el-tooltip content="新用户反馈" placement="bottom">
          <div class="header-icon-wrapper" @click="handleFeedbackClick">
            <el-icon class="header-icon">
              <QuestionFilled />
            </el-icon>
          </div>
        </el-tooltip>

        <!-- 消息图标 -->
        <el-tooltip content="待审核通知" placement="bottom">
          <el-badge :value="messageCount" :hidden="messageCount === 0" class="message-badge">
            <div class="header-icon-wrapper" @click="openNotificationDrawer" :class="{ 'active': drawerVisible }">
              <el-icon class="header-icon">
                <Message />
              </el-icon>
            </div>
          </el-badge>
        </el-tooltip>

        <el-drawer v-model="drawerVisible" title="待审核通知" direction="rtl" class="notification-drawer" size="350px">
          <div class="notification-header">
            <el-tag type="info" size="small">{{ messageList.length }} 条未读</el-tag>
          </div>

          <el-scrollbar class="notification-scrollbar">
            <el-timeline>
              <el-timeline-item v-for="(msg, index) in messageList" :key="index" :timestamp="msg.timestamp"
                placement="top" class="notification-item" @click="handleClick(msg.applyId)">
                <div class="notification-content">
                  <div class="notification-desc">{{ msg.content }}</div>
                </div>
              </el-timeline-item>
            </el-timeline>

            <div v-if="messageList.length === 0" class="empty-notification">
              <el-empty description="暂无待处理通知" :image-size="100">
                <el-icon :size="50" color="#909399">
                  <Bell />
                </el-icon>
              </el-empty>
            </div>
          </el-scrollbar>
        </el-drawer>

        <!-- 管理员下拉 -->
        <el-dropdown>
          <span class="el-dropdown-link">
            <div class="admin-dropdown">
              <el-avatar :size="32" icon="UserFilled" class="admin-avatar" />
              <span class="admin-name">管理员</span>
              <el-icon class="dropdown-arrow">
                <ArrowDown />
              </el-icon>
            </div>
          </span>
          <template #dropdown>
            <el-dropdown-menu class="admin-dropdown-menu">
              <el-dropdown-item @click="goToProfile">个人信息</el-dropdown-item>
              <el-dropdown-item @click="goToChangePassword">修改密码</el-dropdown-item>
              <el-dropdown-item divided @click="handleLogout">退出登录</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </div>

    <!-- 下方区域 -->
    <div class="main-container">
      <!-- 菜单 -->
      <div class="menu-container">
        <el-menu router :default-active="router.currentRoute.value.path" class="side-menu">
          <el-menu-item index="/manager/home">
            <el-icon>
              <HomeFilled />
            </el-icon>
            <span>首页</span>
          </el-menu-item>
          <el-menu-item index="/manager/user">
            <el-icon>
              <User />
            </el-icon>
            <span>用户管理</span>
          </el-menu-item>
          <el-menu-item index="/manager/product">
            <el-icon>
              <Document />
            </el-icon>
            <span>产品管理</span>
          </el-menu-item>
          <el-menu-item index="/manager/approve">
            <el-icon>
              <List />
            </el-icon>
            <span>贷款审核</span>
          </el-menu-item>
          <el-menu-item index="/manager/feedback">
            <el-icon>
              <ChatLineSquare />
            </el-icon>
            <span>用户反馈</span>
          </el-menu-item>
          <el-sub-menu index="4">
            <template #title>
              <el-icon>
                <Setting />
              </el-icon>
              <span>系统设置与权限管理</span>
            </template>
            <el-menu-item index="/manager/setting">系统设置</el-menu-item>
            <el-menu-item index="/manager/limit">权限管理</el-menu-item>
          </el-sub-menu>
        </el-menu>
      </div>

      <!-- 数据渲染区域 -->
      <div class="content-container">
        <div class="content-wrapper">
          <RouterView />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.header-container {
  height: 60px;
  display: flex;
  align-items: center;
  background-color: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  position: relative;
  z-index: 10;
}

.logo-container {
  display: flex;
  width: 240px;
  height: 100%;
  background-color: #1b1e29;
  align-items: center;
  padding-left: 20px;
}

.logo-text {
  font-size: 20px;
  font-weight: bold;
  color: #ddd;
}

.left-expand {
  display: flex;
  align-items: center;
  height: 100%;
  padding-left: 20px;
  border-bottom: 1px solid #e6e6e6;
}

.pet-container {
  top: 10px;
  position: relative;
  cursor: pointer;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.pet {
  position: relative;
  width: 50px;
  height: 32px;
  background-color: #FFB6C1;
  border-radius: 50% 50% 50% 50% / 60% 60% 40% 40%;
  transition: all 0.3s ease;
}

.pet-face {
  position: absolute;
  width: 100%;
  height: 100%;
}

.pet-eyes {
  position: absolute;
  top: 10px;
  width: 100%;
  display: flex;
  justify-content: space-around;
  transition: all 0.3s ease;
}

.pet-eye {
  width: 8px;
  height: 8px;
  background-color: #333;
  border-radius: 50%;
  transition: all 0.3s ease;
}

.pet-ears {
  position: absolute;
  top: -10px;
  width: 100%;
  display: flex;
  justify-content: space-between;
}

.pet-ear {
  width: 15px;
  height: 20px;
  background-color: #FF8DA1;
  border-radius: 50%;
}

.pet-ear.left {
  transform: rotate(-30deg);
  margin-left: 5px;
}

.pet-ear.right {
  transform: rotate(30deg);
  margin-right: 5px;
}

.pet-mouth {
  position: absolute;
  bottom: 8px;
  left: 50%;
  transform: translateX(-50%);
  width: 15px;
  height: 8px;
  background-color: #333;
  border-radius: 0 0 50% 50%;
  transition: all 0.3s ease;
}

.speech-bubble {
  position: absolute;
  top: 40px;
  left: 150%;
  transform: translateX(50%);
  background-color: white;
  padding: 6px 12px;
  border-radius: 18px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  font-size: 12px;
  white-space: nowrap;
  animation: bubbleIn 0.3s ease;
}

.speech-bubble:after {
  content: '';
  position: absolute;
  bottom: -6px;
  left: 50%;
  transform: translateX(-50%);
  width: 0;
  height: 0;
  border-left: 8px solid transparent;
  border-right: 8px solid transparent;
  border-top: 8px solid white;
}

/* 状态类 */
.pet.is-happy {
  transform: translateY(-5px);
}

.pet.is-happy .pet-mouth {
  border-radius: 50%;
  height: 10px;
  width: 20px;
  bottom: 10px;
  background-color: #FF6B88;
}

.pet.is-sleeping {
  transform: rotate(30deg) translateY(5px);
}

.pet.is-sleeping .pet-eyes {
  transform: translateY(5px);
}

.pet.is-sleeping .pet-eye {
  height: 2px;
  border-radius: 2px;
}

/* 动画 */
@keyframes bubbleIn {
  from { opacity: 0; transform: translate(-50%, 10px); }
  to { opacity: 1; transform: translate(-50%, 0); }
}

@keyframes petJump {
  0% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
  100% { transform: translateY(0); }
}

.pet-container:active .pet {
  animation: petJump 0.5s ease;
}

/* 确保header-middle保持原有布局 */
.header-middle {
  flex: 1;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  border-bottom: 2px solid #e6e6e6; /* 保持原有边框 */
}

.header-right {
  display: flex;
  align-items: center;
  height: 100%;
  padding-right: 20px;
  gap: 20px;
  border-bottom: 2px solid #e6e6e6;
}

.header-icon-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  transition: all 0.3s ease;
  cursor: pointer;
  position: relative;
}

.header-icon-wrapper:hover {
  background-color: #f1f5f9;
}

.header-icon-wrapper.active {
  background-color: #e1e8ff;
}

.header-icon {
  font-size: 20px;
  color: #64748b;
  transition: all 0.3s ease;
}

.header-icon-wrapper:hover .header-icon {
  color: #3b82f6;
  transform: scale(1.1);
}

.header-icon-wrapper.active .header-icon {
  color: #3b82f6;
}

.admin-dropdown {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 12px;
  height: 44px;
  border-radius: 22px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.admin-dropdown:hover {
  background-color: #f1f5f9;
}

.admin-avatar {
  background-color: #3b82f6;
  color: white;
}

.admin-name {
  color: #2c3e50;
  font-weight: 500;
  font-size: 14px;
}

.dropdown-arrow {
  color: #64748b;
  font-size: 14px;
  transition: transform 0.3s ease;
}

.el-dropdown:hover .dropdown-arrow {
  transform: rotate(180deg);
}

.message-badge :deep(.el-badge__content) {
  transform: translate(80%, -30%);
  border: 2px solid white;
  font-weight: bold;
  height: 18px;
  min-width: 18px;
  line-height: 18px;
  padding: 0 4px;
}

.notification-drawer :deep(.el-drawer__header) {
  padding: 16px 20px;
  margin: 0;
  border-bottom: 1px solid var(--el-border-color-light);
  color: var(--el-text-color-primary);
  font-weight: 600;
  background: linear-gradient(135deg, #f9fafb 0%, #ffffff 100%);
  box-shadow: 0 1px 6px rgba(0, 0, 0, 0.06);
  backdrop-filter: blur(6px);
}

.notification-drawer :deep(.el-drawer__body) {
  padding: 0;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.notification-header {
  padding: 14px 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background-color: #f7f9fc;
  border-bottom: 1px solid var(--el-border-color-light);
}

.notification-scrollbar {
  flex: 1;
  padding: 12px;
  overflow-y: auto;
}

.notification-item {
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  padding: 14px 16px;
  border-radius: 10px;
  margin-bottom: 10px;
  background: linear-gradient(to right, #ffffff, #f7faff);
  border-left: 3px solid var(--el-color-primary);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.03);
}

.notification-item:hover {
  background-color: #f0f8ff;
  transform: translateX(-2px);
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.06);
}

.notification-content {
  margin-left: 8px;
  display: flex;
  align-items: center;
}

.notification-desc {
  font-size: 14px;
  color: var(--el-text-color-regular);
  line-height: 1.5;
}

.empty-notification {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: 40px 0;
  opacity: 0.8;
}

.notification-drawer :deep(.el-timeline) {
  padding-left: 6px;
  margin-top: 10px;
}

.notification-drawer :deep(.el-timeline-item__node) {
  width: 10px;
  height: 10px;
  background-color: var(--el-color-primary);
  border: 2px solid white;
  box-shadow: 0 0 0 2px var(--el-color-primary-light-9);
}

.notification-drawer :deep(.el-timeline-item__timestamp) {
  color: var(--el-text-color-placeholder);
  font-size: 12px;
  margin-bottom: 4px;
  font-style: italic;
}

.main-container {
  display: flex;
  height: calc(100vh - 60px);
}

.menu-container {
  width: 240px;
  height: 100%;
  background-color: #1b1e29;
}

.side-menu {
  height: 100%;
  border-right: none;
}

.content-container {
  flex: 1;
  background-color: #f5f7fa;
  padding: 20px;
  overflow-y: auto;
}

.content-wrapper {
  background-color: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  padding: 24px;
  min-height: 100%;
}

.admin-dropdown-menu {
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  border: none;
  padding: 8px 0;
}

.admin-dropdown-menu :deep(.el-dropdown-menu__item) {
  padding: 8px 16px;
  font-size: 14px;
  color: #64748b;
}

.admin-dropdown-menu :deep(.el-dropdown-menu__item:hover) {
  background-color: #f1f5f9;
  color: #3b82f6;
}

.admin-dropdown-menu :deep(.el-dropdown-menu__item--divided) {
  border-top: 1px solid #e6e6e6;
  margin-top: 4px;
  padding-top: 8px;
}
</style>

<style>
html,
body,
#app {
  height: 100%;
  overflow: hidden;
  margin: 0;
  padding: 0;
}

::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb {
  background: #c0c4cc;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: #909399;
}

.el-menu {
  background-color: #1b1e29;
  border: none;
}

.el-sub-menu__title {
  height: 50px;
  color: #ddd;
}

.el-menu-item {
  color: #ddd;
}

.el-menu-item.is-active {
  background-color: #537bee;
  color: white !important;
}

.el-menu-item:hover {
  background-color: #2e3440;
  color: #fff;
}

.el-sub-menu__title:hover {
  background-color: #2e3440;
  color: #fff;
}

.el-tooltip__trigger {
  outline: none;
}

.el-dropdown {
  cursor: pointer;
}

.el-menu--inline .el-menu-item {
  padding-left: 48px !important;
}
</style>