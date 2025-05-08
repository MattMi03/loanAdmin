<script setup>
import Watermark from '@/components/Watermark.vue'
import { onMounted, ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { House, Document, EditPen, User, Message, Money } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import SockJS from 'sockjs-client/dist/sockjs'
import Stomp from 'stompjs'

const username = ref(localStorage.getItem('name') || '管理员')

const messageCount = ref(0)
const messageList = ref([])
const drawerVisible = ref(false)

const isHappy = ref(false)
const isSleeping = ref(false)
const isChewing = ref(false)
const showSpeech = ref(false)
const currentSpeech = ref('')

const hungerLevel = ref(localStorage.getItem('hungerLevel') ? parseInt(localStorage.getItem('hungerLevel')) : 100)
const lastFedTime = ref(Date.now())
const isHungry = computed(() => hungerLevel.value < 50)
const isStarving = computed(() => hungerLevel.value < 20)

const time = ref('')
const fullDate = ref('')
const weekday = ref('')
const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']

function updateTime() {
  const now = new Date()
  time.value = now.toLocaleTimeString('zh-CN', { hour12: false })
  fullDate.value = `${now.getFullYear()}年${(now.getMonth() + 1)
    .toString()
    .padStart(2, '0')}月${now.getDate().toString().padStart(2, '0')}日`
  weekday.value = weekdays[now.getDay()]
}

const speeches = [
  '玩我呀~ 🎮',
  '加油冲冲！💪',
  '喵喵喵~ 🐱',
  '摸摸我~ 🐾',
  '辛苦啦~ 🥹',
  '陪玩一会~ 🧸',
  '最爱你啦~ 😘',
  '心情棒棒哒~ 🌈',
  '我饿了~ 🍖',
  '你超可爱~ 😍',
  '带我浪浪~ 🧳',
  '聪明绝了~ 🧠',
  '带我旅行吧~ ✈️',
  '我喜欢你~ 💕',
  '加油今天！💪',
  '加班不可能~ 🫠',
  '快喝水呀~ 🧃',
  '钱包哭了~ 💸'
];

const speechesHurgy = [
  '我饿了~ 🍖',
  '别摸了，我饿了~ 🍖',
  '我快饿死了~ 😭',
  '我好饿啊~ 😫',
  '吃点什么呢~ 🍔',
]

// 宠物互动
const interactWithPet = () => {
  isHappy.value = true
  showSpeech.value = true

  // 随机选择一句话
  if (hungerLevel.value > 50)
    currentSpeech.value = speeches[Math.floor(Math.random() * speeches.length)]
  else
    currentSpeech.value = speechesHurgy[Math.floor(Math.random() * speechesHurgy.length)]

  // 开心状态持续1.5秒
  setTimeout(() => {
    isHappy.value = false
  }, 1500)

  // 3秒后隐藏对话气泡
  setTimeout(() => {
    showSpeech.value = false
  }, 3000)
}

const feedPet = () => {
  hungerLevel.value = Math.min(100, hungerLevel.value + Math.floor(Math.random() * 5) + 1)
  localStorage.setItem('hungerLevel', hungerLevel.value.toString())
  lastFedTime.value = Date.now()
  isChewing.value = true
  showSpeech.value = true
  currentSpeech.value = '好吃好吃~谢谢！😋'

  setTimeout(() => {
    isChewing.value = false
    showSpeech.value = false
  }, 2000)
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


const updateHunger = () => {
  // 随机减少1-5点饥饿度
  const decreaseAmount = Math.floor(Math.random() * 5) + 1;
  hungerLevel.value = Math.max(0, hungerLevel.value - decreaseAmount);
  localStorage.setItem('hungerLevel', hungerLevel.value.toString());

  // 如果饥饿度低于30，有30%概率触发抱怨
  if (hungerLevel.value < 50 && Math.random() < 0.5) {
    showSpeech.value = true;
    if (hungerLevel.value < 15) {
      currentSpeech.value = Math.random() < 0.5
        ? '我快饿死了...求你给我吃的！😭'
        : '呜呜呜...快给我吃的！😭';
    } else {
      currentSpeech.value = Math.random() < 0.5
        ? '我好饿啊...快给我吃的！😫'
        : '我有点饿了...能给我点吃的吗？😋';
    }

    setTimeout(() => {
      showSpeech.value = false;
    }, 3000);
  }
}

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

const goToProfile = () => {
  router.push({ path: '/manager/selfinfo' })
}

const goToChangePassword = () => {
  router.push({ name: 'ChangePassword' })
}

const handleLogout = () => {
  localStorage.clear()
  ElMessage.success('退出成功')
  router.push('/login')
}

const checkLogin = () => {
  const token = localStorage.getItem('token')
  if (!token) {
    localStorage.clear()
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
  setInterval(updateHunger, 10000)
  updateTime()
  setInterval(updateTime, 1000)
})
</script>

<template>
  <Watermark />
  <div>
    <!-- 头部区域 -->
    <div class="header-container">
      <!-- 标题logo -->
      <div class="logo-container">
        <div class="logo-text">自由贷</div>
      </div>

      <!-- 左侧展开按钮 -->
      <!-- <div class="left-expand">
        <el-dropdown>
          <span class="el-dropdown-link">
            <el-icon>
              <MoreFilled />
            </el-icon>
          </span>
        </el-dropdown>
      </div> -->

      <!-- 中间空白区域 -->
      <div class="header-middle">
        <div class="time-display">
          <div class="clock">
            🕒 {{ time }}
          </div>
          <div class="date">
            📅 {{ fullDate }} {{ weekday }}
          </div>
        </div>

        <div class="pet-container" @click="interactWithPet">
          <div class="hunger-bar">
            <div class="hunger-level" :style="{ width: hungerLevel + '%' }"
              :class="{ 'low': isHungry, 'critical': isStarving }"></div>
            <span class="hunger-text">饱食度: {{ hungerLevel }}%</span>
          </div>

          <!-- 宠物主体 -->
          <div class="pet" :class="{
            'is-happy': isHappy,
            'is-sleeping': isSleeping,
            'is-hungry': isHungry,
            'is-starving': isStarving,
            'is-chewing': isChewing
          }">
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
          <div class="speech-bubble" v-if="showSpeech" :style="speechBubbleStyle">
            {{ currentSpeech }}
          </div>

          <!-- 喂食按钮 -->
          <el-tooltip content="喂食" placement="bottom">
            <el-button class="feed-btn" size="small" circle @click.stop="feedPet">
              <span style="font-size: 14px">🍗</span>
            </el-button>
          </el-tooltip>
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

          <div class="notification-content-wrapper" :class="{ 'no-scroll': messageList.length === 0 }">
            <el-scrollbar v-if="messageList.length > 0" class="notification-scrollbar">
              <el-timeline>
                <el-timeline-item v-for="(msg, index) in messageList" :key="index" :timestamp="msg.timestamp"
                  placement="top" class="notification-item" @click="handleClick(msg.applyId)">
                  <div class="notification-content">
                    <div class="notification-desc">{{ msg.content }}</div>
                  </div>
                </el-timeline-item>
              </el-timeline>
            </el-scrollbar>

            <div v-if="messageList.length === 0" class="empty-notification">
              <el-empty description="暂无待处理通知" :image-size="100">
                <el-icon :size="50" color="#909399">
                  <Bell />
                </el-icon>
              </el-empty>
            </div>
          </div>
        </el-drawer>

        <!-- 管理员下拉 -->
        <el-dropdown>
          <span class="el-dropdown-link">
            <div class="admin-dropdown">
              <el-avatar :size="32" icon="UserFilled" class="admin-avatar" />
              <span class="admin-name">{{ username }}</span>
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
              <House />
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
              <EditPen />
            </el-icon>
            <span>贷款审核</span>
          </el-menu-item>
          <el-menu-item index="/manager/disbursement">
            <el-icon>
              <Money />
            </el-icon>
            <span>放款管理</span>
          </el-menu-item>
          <el-menu-item index="/manager/feedback">
            <el-icon>
              <ChatLineSquare />
            </el-icon>
            <span>用户反馈</span>
          </el-menu-item>
        </el-menu>
      </div>

      <!-- 数据渲染区域 -->
      <div class="content-container">

        <div class="content-wrapper">
          <RouterView />
        </div>
        <div class="footer-container">
          <div class="footer-text">
            © 2025 自由贷后台管理系统 · 本页面由
            <span class="footer-author tooltip">
              <svg class="author-icon" viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                <path
                  d="M20.71 7.04a1.003 1.003 0 0 0 0-1.42l-2.34-2.34a1.003 1.003 0 0 0-1.42 0l-9.19 9.19c-.13.13-.23.3-.28.49l-.89 3.54a.5.5 0 0 0 .61.61l3.54-.89c.19-.05.36-.15.49-.28l9.18-9.2zM5 18h14v2H5v-2z" />
              </svg>
              Matt Mi
              <span class="tooltip-text">布局基础由团队提供 · 样式设计与前端编码由 Matt Mi 优化与完成</span>
            </span>
            编写实现
          </div>
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
  background: linear-gradient(135deg, #2c3e50 0%, #1a1e29 100%);
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  position: relative;
  z-index: 10;
}

.logo-container {
  display: flex;
  width: 240px;
  height: 100%;
  align-items: center;
  padding-left: 20px;
  background: transparent;
}

.logo-text {
  font-size: 20px;
  font-weight: bold;
  color: #fff;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.left-expand {
  display: flex;
  align-items: center;
  height: 100%;
  padding-left: 20px;
  border-bottom: 0px solid #e6e6e6;
}


.time-display {
  color: #f0f0f0;
  font-size: 14px;
  text-align: left;
  margin-right: 20px;
  line-height: 1.2;
  font-family: 'Courier New', Courier, monospace;
  background-color: rgba(255, 255, 255, 0);
  padding: 8px 12px;
  border-radius: 8px;
  transition: background-color 0.3s ease, box-shadow 0.3s ease;
}

.time-display:hover {
  background-color: rgba(255, 255, 255, 0.2);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3), 0 4px 12px rgba(0, 0, 0, 0.2);
}

.clock {
  margin-top: 0px;
  font-size: 15px;
  font-weight: bold;
  color: #fff;
}

.date {
  margin-top: 6px;
  font-size: 13px;
  font-weight: bold;
  color: #ddd;
}

.hunger-bar {
  position: absolute;
  top: 16px;
  left: -110%;
  transform: translateX(-50%);
  width: 100px;
  height: 18px;
  background-color: rgba(255, 255, 255, 0.2);
  border-radius: 10px;
  overflow: hidden;
  box-shadow:
    0 1px 3px rgba(0, 0, 0, 0.2),
    inset 0 1px 2px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.15);
}

.hunger-level {
  height: 100%;
  background: linear-gradient(135deg, #4CAF50 0%, #66BB6A 100%);
  transition: width 0.5s ease;
  position: relative;
  overflow: hidden;
  position: absolute;
  right: 100;
}

.hunger-level::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(90deg,
      rgba(255, 255, 255, 0.2) 0%,
      rgba(255, 255, 255, 0) 50%,
      rgba(255, 255, 255, 0.2) 100%);
  animation: shine 2s infinite;
}

.hunger-level.low {
  background: linear-gradient(135deg, #FFC107 0%, #FFD54F 100%);
}

.hunger-level.critical {
  background: linear-gradient(135deg, #F44336 0%, #EF5350 100%);
}

.hunger-text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 11px;
  font-weight: 500;
  color: white;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
  white-space: nowrap;
  letter-spacing: 0.5px;
}

@keyframes shine {
  0% {
    transform: translateX(-100%);
  }

  100% {
    transform: translateX(100%);
  }
}

.feed-btn {
  position: absolute;
  right: -25px;
  bottom: 11px;
  width: 24px;
  height: 24px;
  min-width: auto;
  padding: 0;
  background: linear-gradient(135deg, #FFD166 0%, #FF9F1C 100%);
  border: none;
  border-radius: 50%;
  box-shadow:
    0 2px 5px rgba(0, 0, 0, 0.2),
    inset 0 -1px 2px rgba(255, 255, 255, 0.3);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 8;
  will-change: transform, box-shadow;
}

.feed-btn:hover {
  transform: scale(1.1) rotate(15deg);
  box-shadow:
    0 3px 8px rgba(0, 0, 0, 0.3),
    inset 0 -1px 2px rgba(255, 255, 255, 0.3);
  background: linear-gradient(135deg, #FFDF7F 0%, #FFB347 100%);
}

.feed-btn:active {
  transform: scale(0.95);
}

.feed-btn span {
  font-size: 13px;
  transition: transform 0.3s ease;
  transform-origin: center center;
}

.feed-btn:hover span {
  transform: scale(1.2);
}

/* 饥饿状态下的宠物样式 */
.pet.is-hungry .pet-eyes {
  animation: blink 2s infinite;
}

.pet.is-starving .pet-eyes {
  animation: blink 1s infinite;
}

.pet.is-starving .pet-mouth {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background-color: #FF6B88;
}

@keyframes blink {

  0%,
  100% {
    opacity: 1;
  }

  50% {
    opacity: 0.3;
  }
}

/* 在style部分添加 */
.pet.is-chewing .pet-mouth {
  animation: chew 0.3s infinite alternate;
}

@keyframes chew {
  0% {
    border-radius: 50%;
    height: 10px;
    width: 20px;
    bottom: 10px;
    background-color: #FF6B88;
  }

  50% {
    border-radius: 0 0 50% 50%;
    height: 8px;
    width: 15px;
    bottom: 8px;
    background-color: #333;
  }

  100% {
    border-radius: 50%;
    height: 6px;
    width: 18px;
    bottom: 9px;
    background-color: #FF6B88;
  }
}

.pet.is-chewing .pet-eyes {
  transform: translateY(1px);
  transition: transform 0.15s ease;
}

/* 咀嚼时耳朵微微抖动 */
.pet.is-chewing .pet-ear.left {
  animation: earTwitchLeft 0.4s infinite alternate;
}

.pet.is-chewing .pet-ear.right {
  animation: earTwitchRight 0.4s infinite alternate;
}

@keyframes earTwitchLeft {
  0% {
    transform: rotate(-30deg);
  }

  100% {
    transform: rotate(-25deg) translateX(1px);
  }
}

@keyframes earTwitchRight {
  0% {
    transform: rotate(30deg);
  }

  100% {
    transform: rotate(35deg) translateX(1px);
  }
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
  top: 6px;
  left: 400%;
  transform: translateX(-50%);
  background-color: white;
  padding: 6px 12px;
  border-radius: 18px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  font-size: 12px;
  white-space: nowrap;
  max-width: 1500px;
  text-overflow: ellipsis;
  overflow: hidden;
  z-index: 10;
  animation: bubbleIn 0.3s ease;
  pointer-events: none;
}

.speech-bubble:after {
  content: '';
  position: absolute;
  top: 50%;
  left: -5px;
  transform: translateY(-50%);
  border-top: 8px solid transparent;
  border-bottom: 8px solid transparent;
  border-right: 8px solid white;
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
  from {
    opacity: 0;
    transform: translate(-50%, 10px);
  }

  to {
    opacity: 1;
    transform: translate(-50%, 0);
  }
}

@keyframes petJump {
  0% {
    transform: translateY(0);
  }

  50% {
    transform: translateY(-10px);
  }

  100% {
    transform: translateY(0);
  }
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
  border-bottom: 0px solid #e6e6e6;
  /* 保持原有边框 */
}

.header-right {
  display: flex;
  align-items: center;
  height: 100%;
  padding-right: 20px;
  gap: 20px;
  border-bottom: 0px solid #e6e6e6;
}

.header-icon-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
  position: relative;
}

.header-icon-wrapper:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

.header-icon-wrapper.active {
  background-color: rgba(255, 255, 255, 0.15);
}

.header-icon {
  font-size: 20px;
  color: rgba(255, 255, 255, 0.9);
  transition: all 0.3s ease;
}

.header-icon-wrapper:hover .header-icon {
  color: #fff;
  transform: scale(1.1);
}

.admin-dropdown {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 12px;
  height: 44px;
  border-radius: 22px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.admin-dropdown:hover {
  background-color: #526679;
}

.admin-avatar {
  background: linear-gradient(135deg, #537bee 0%, #3b82f6 100%);
  color: white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.admin-name {
  color: rgba(255, 255, 255, 0.9);
  font-weight: 500;
  font-size: 14px;
  transition: color 0.3s ease;
}

.admin-dropdown:hover .admin-name {
  color: #fff;
}

.dropdown-arrow {
  color: rgba(255, 255, 255, 0.7);
  font-size: 14px;
  transition: all 0.3s ease;
}

.admin-dropdown:hover .dropdown-arrow {
  color: #fff;
  transform: rotate(180deg);
}


.el-dropdown:hover .dropdown-arrow {
  transform: rotate(180deg);
}

.message-badge :deep(.el-badge__content) {
  transform: translate(70%, -30%);
  border: 2px solid #1a1e29;
  font-weight: 600;
  height: 18px;
  min-width: 18px;
  line-height: 18px;
  padding: 0 4px;
  background: linear-gradient(135deg, #ef4444 0%, #f87171 100%);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
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
  margin-top: -30px;
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

.notification-content-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  height: calc(100% - 60px);
}

.notification-content-wrapper.no-scroll {
  overflow: hidden;
}


.empty-notification {
  margin-top: -150%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: 40px 0;
  opacity: 0.8;
}

/* 强制隐藏滚动条 */
.notification-content-wrapper.no-scroll :deep(.el-scrollbar__wrap),
.notification-content-wrapper.no-scroll :deep(.el-scrollbar__bar) {
  display: none !important;
  overflow: hidden !important;
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
  background: linear-gradient(180deg, #2c3e50 0%, #1a1e29 100%);
  box-shadow: 2px 0 8px rgba(0, 0, 0, 0.08);
}

.side-menu {
  height: 100%;
  border-right: none;
  background: transparent;
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
  border-radius: 10px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.12);
  border: none;
  padding: 8px 0;
  background-color: white;
}

.admin-dropdown-menu :deep(.el-dropdown-menu__item) {
  padding: 10px 16px;
  font-size: 14px;
  color: #4b5563;
  transition: all 0.2s ease;
}

.admin-dropdown-menu :deep(.el-dropdown-menu__item:hover) {
  background-color: #f3f4f6;
  color: #3b82f6;
}

.admin-dropdown-menu :deep(.el-dropdown-menu__item--divided) {
  border-top: 1px solid #f3f4f6;
  margin-top: 4px;
  padding-top: 8px;
}

.footer-container {
  margin-top: -40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f8f8f8;
  border-top: 1px solid #e5e5e5;
  box-shadow: 0 -1px 6px rgba(0, 0, 0, 0.03);
}

.footer-text {
  font-size: 15px;
  color: #444;
  font-family: 'Noto Serif SC', 'PingFang SC', 'Microsoft YaHei', sans-serif;
  text-align: center;
  line-height: 1.6;
  letter-spacing: 0.2px;
}

.footer-author {
  font-weight: 700;
  color: #1a1a1a;
  font-family: 'JetBrains Mono', 'Times New Roman', serif;
  font-size: 16px;
  text-decoration: underline;
  text-underline-offset: 3px;
  text-decoration-color: rgba(0, 0, 0, 0.15);
  display: inline-flex;
  align-items: center;
  gap: 5px;
  cursor: default;
  transition: all 0.3s ease;
}

.footer-author.tooltip {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-weight: 700;
  color: #1a1a1a;
  font-family: 'JetBrains Mono', 'Times New Roman', serif;
  font-size: 16px;
  text-decoration: underline;
  text-underline-offset: 3px;
  text-decoration-color: rgba(0, 0, 0, 0.15);
  cursor: default;
  transition: all 0.3s ease;
}

.tooltip-text {
  visibility: hidden;
  opacity: 0;
  width: max-content;
  max-width: 450px;
  background-color: #ffffff00;
  color: #000000;
  font-size: 13px;
  line-height: 1.4;
  border-radius: 4px;
  padding: 6px 10px;
  position: absolute;
  bottom: 115%;
  left: 50%;
  transform: translateX(-50%);
  white-space: normal;
  text-align: center;
  z-index: 999;
  transition: opacity 0.3s ease;
  pointer-events: none;
}

.tooltip:hover .tooltip-text {
  visibility: visible;
  opacity: 1;
}

.author-icon {
  color: #000000;
  opacity: 0.8;
  margin-bottom: 1px;
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
  --el-menu-bg-color: transparent;
  --el-menu-hover-bg-color: rgba(255, 255, 255, 0.08);
  --el-menu-active-color: #fff;
}

.el-sub-menu__title {
  color: rgba(255, 255, 255, 0.8);
  transition: all 0.3s ease;
  margin: 4px 8px;
  border-radius: 6px;
}

.el-menu-item {
  color: rgba(255, 255, 255, 0.8);
  transition: all 0.3s ease;
  margin: 4px 8px;
  border-radius: 6px;
}

.el-menu-item.is-active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
  color: white !important;
  box-shadow: 0 2px 8px rgba(83, 123, 238, 0.3);
}

.el-menu-item:hover {
  color: #fff;
  background-color: rgba(255, 255, 255, 0.08) !important;
}


.el-sub-menu__title:hover {
  color: #fff;
  background-color: rgba(255, 255, 255, 0.08) !important;
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