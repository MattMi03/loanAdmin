<script setup>
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  HomeFilled,
  Document,
  List,
  User,
  Message
} from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import SockJS from 'sockjs-client/dist/sockjs'
import Stomp from 'stompjs'

const messageCount = ref(0)
const messageList = ref([])
const drawerVisible = ref(false)

let stompClient = null

// 从localStorage恢复消息和未读消息数
const loadMessagesFromLocalStorage = () => {
  const storedMessages = JSON.parse(localStorage.getItem('messageList') || '[]')
  const storedCount = parseInt(localStorage.getItem('messageCount') || '0')

  messageList.value = storedMessages
  messageCount.value = storedCount
}

// 保存消息到localStorage
const saveMessagesToLocalStorage = () => {
  localStorage.setItem('messageList', JSON.stringify(messageList.value))
  localStorage.setItem('messageCount', messageCount.value.toString())
}

// 连接WebSocket并订阅消息
const connectWebSocket = () => {
  const socket = new SockJS('http://localhost:8888/ws')
  stompClient = Stomp.over(socket)

  const token = localStorage.getItem('token');
  if (token) {
    stompClient.connect({ 'Authorization': 'Bearer ' + token }, () => {
      stompClient.subscribe('/topic/review', (message) => {
        const data = JSON.parse(message.body);

        // 更新消息数量和列表
        messageCount.value++;
        messageList.value.unshift({
          content: data.content,
          applyId: data.apply_id,
          timestamp: new Date().toLocaleString(),
        });

        // 保存更新后的数据
        saveMessagesToLocalStorage()
      });
    });
  } else {
    console.log("No token found");
  }
}

// 打开通知抽屉
const openNotificationDrawer = () => {
  drawerVisible.value = true
}

const router = useRouter()
const activeMenu = ref('1')
const username = ref('用户名') // 这里可以从store或其他地方获取用户名

// 跳转到个人资料页面
const goToProfile = () => {
  router.push({ path: '/manager/selfinfo' });
};

// 跳转到修改密码页面
const goToChangePassword = () => {
  router.push({ name: 'ChangePassword' });
};

// 退出登录
const handleLogout = () => {
  // 这里添加登出逻辑
  localStorage.removeItem('token')
  ElMessage.success('退出成功')
  router.push('/login')
}

// 检查登录状态
const checkLogin = () => {
  const token = localStorage.getItem('token')
  if (!token) {
    ElMessage.error('请先登录')
    router.push('/login')
  }
}

// 处理点击通知后跳转
const handleClick = (applyId) => {
  // 删除已点击的消息
  messageList.value = messageList.value.filter(msg => msg.applyId !== applyId)
  messageCount.value = messageList.value.length

  // 更新到 localStorage
  saveMessagesToLocalStorage()

  // 隐藏抽屉
  drawerVisible.value = false;

  // 跳转到审批页面
  router.push({ path: '/manager/approve', query: { applyId: applyId } });
};

onMounted(() => {
  checkLogin() // 页面加载时检查登录状态
  loadMessagesFromLocalStorage() // 从localStorage加载消息和未读消息数
  connectWebSocket() // 连接WebSocket
})
</script>

<template>
  <div>
    <!-- 头部区域 -->
    <div style="height: 60px; display: flex; align-items: center;">
      <!-- 标题logo -->
      <div style="display: flex; width: 240px; height: 100%;background-color: #1b1e29;">
        <div
          style="display: flex; align-items: center;font-size: 20px; font-weight: bold; padding-left: 20px; color: #ddd;">
          自由贷</div>
      </div>

      <!-- 头像 -->
      <!-- 左-展开 -->
      <div style="display: flex; align-items: center; height: 100%; padding-left: 20px; border-bottom: 1px solid #ddd;">
        <el-dropdown>
          <span class="el-dropdown-link">
            <el-icon>
              <MoreFilled />
            </el-icon>
          </span>
          <!-- <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item>Action 1</el-dropdown-item>
                    <el-dropdown-item>Action 2</el-dropdown-item>
                    <el-dropdown-item>Action 3</el-dropdown-item>
                    <el-dropdown-item divided>Action 5</el-dropdown-item>
                  </el-dropdown-menu>
                </template> -->
        </el-dropdown>
      </div>
      <!-- 中-空白 -->
      <div style="display: flex; flex: 1; align-items: center; height: 100%; border-bottom: 1px solid #ddd;"></div>
      <!-- 右-图标 -->
      <!-- 右-图标区域 -->
      <div
        style="display: flex; align-items: center; height: 100%; padding-right: 20px; gap: 20px; border-bottom: 1px solid #ddd;">
        <!-- 问题图标 -->
        <el-tooltip content="新用户反馈">
          <div class="header-icon-wrapper">
            <el-icon>
              <QuestionFilled />
            </el-icon>
          </div>
        </el-tooltip>

        <!-- 消息图标 -->
        <el-tooltip content="待审核通知" placement="bottom">
          <el-badge :value="messageCount" :hidden="messageCount === 0" class="message-badge">
            <div class="header-icon-wrapper" @click="openNotificationDrawer">
              <el-icon>
                <Message />
              </el-icon>
            </div>
          </el-badge>
        </el-tooltip>

        <el-drawer v-model="drawerVisible" title="待审核通知" direction="rtl">
          <el-timeline>
            <el-timeline-item v-for="(msg, index) in messageList" :key="index" :timestamp="msg.timestamp"
              @click="handleClick(msg.applyId)" style="cursor: pointer;">
              {{ msg.content }}
            </el-timeline-item>
          </el-timeline>
        </el-drawer>

        <!-- 管理员下拉 -->
        <el-dropdown>
          <span class="el-dropdown-link">
            <div class="admin-dropdown">
              <el-avatar :size="30" icon="UserFilled" />
              <span style="color: #333; font-weight: 500;">管理员</span>
            </div>
          </span>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item @click="goToProfile">个人信息</el-dropdown-item>
              <el-dropdown-item @click="goToChangePassword">修改密码</el-dropdown-item>
              <el-dropdown-item divided @click="handleLogout">退出登录</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </div>
    <!-- 下方区域 -->
    <div style="display: flex;">
      <!-- 菜单 -->
      <div style="width: 240px;">
        <el-menu router :default-active="router.currentRoute.value.path" style="min-height: calc(100vh - 60px)">
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
      <!-- 数据渲染区域 -->
      <div style="flex: 1; background-color: #f5f6fa; padding: 20px;">
        <div
          style="background-color: white; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.05); padding: 24px;">
          <RouterView />
        </div>
      </div>
    </div>

  </div>
</template>

<style>
/* 顶部区域加阴影 */
.header-icon-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  transition: background-color 0.2s;
  cursor: pointer;
}

.header-icon-wrapper:hover {
  background-color: #f0f0f0;
}

.admin-dropdown {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 10px;
  cursor: pointer;
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