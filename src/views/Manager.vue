<template>
    <div>
        <!-- 头部区域 -->
        <div style="height: 60px; display: flex; align-items: center;">
            <!-- 标题logo -->
            <div style="display: flex; width: 240px; height: 100%;background-color: #1b1e29;">
              <div style="display: flex; align-items: center;font-size: 20px; font-weight: bold; padding-left: 20px; color: #ddd;">自由贷</div>
            </div>

            <!-- 头像 -->
            <!-- 左-展开 -->
            <div style="display: flex; align-items: center; height: 100%; padding-left: 20px; border-bottom: 1px solid #ddd;">
              <el-dropdown>
                <span class="el-dropdown-link">
                  <el-icon><MoreFilled /></el-icon>
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
            <div style="width: fit-content; display: flex; height: 100%; align-items: center; border-bottom: 1px solid #ddd; ">
              <!-- 问题 -->
              <div style="padding-right: 20px;">
                <el-icon><QuestionFilled /></el-icon>
              </div>
              <!-- 信息 -->
              <div style="padding-right: 20px;">
                <el-icon><Message /></el-icon>
              </div>
              <!-- 管理员 -->
              <div style="display: flex; align-items: center; height: 100%; padding-right: 20px; border-bottom: 1px solid #ddd;">
                <el-dropdown>
                  <span class="el-dropdown-link">
                    <div>
                      <el-icon><UserFilled /></el-icon>
                      <span style="padding: 5px;">管理员</span>
                    </div>
                  </span>
                  <template #dropdown>
                    <el-dropdown-menu>
                      <el-dropdown-item>个人信息</el-dropdown-item>
                      <el-dropdown-item>修改密码</el-dropdown-item>
                      <el-dropdown-item divided @click="handleLogout">退出登录</el-dropdown-item>
                    </el-dropdown-menu>
                  </template>
                </el-dropdown>
              </div>
            </div>
        </div>
        <!-- 下方区域 -->
        <div style="display: flex;">
            <!-- 菜单 -->
            <div style="width: 240px;">
              <el-menu  router :default-active="router.currentRoute.value.path" style="min-height: calc(100vh - 60px)">
                <el-menu-item index="/manager/home">
                  <el-icon><House /></el-icon>
                  <span>首页</span>
                </el-menu-item>
                <el-sub-menu index="1">
                  <template #title>
                    <el-icon><User /></el-icon>
                    <span>用户管理</span>
                  </template>
                  <!-- <el-menu-item-group title="Group One"> -->
                    <el-menu-item index="1-1">VIP用户管理</el-menu-item>
                    <el-menu-item index="1-2">普通用户管理</el-menu-item>
                  <!-- </el-menu-item-group> -->
                </el-sub-menu>
                <el-menu-item index="/manager/product">
                  <el-icon><Document /></el-icon>
                  <span>产品管理</span>
                </el-menu-item>
                <el-menu-item index="/manager/approve">
                  <el-icon><Tickets /></el-icon>
                  <span>贷款审核</span>
                </el-menu-item>
                <el-menu-item index="/manager/risk">
                  <el-icon><PieChart /></el-icon>
                  <span>风险管理</span>
                </el-menu-item>
                <el-menu-item index="/manager/feedback">
                  <el-icon><ChatLineSquare /></el-icon>
                  <span>用户反馈</span>
                </el-menu-item>
                <el-sub-menu index="4">
                  <template #title>
                    <el-icon><Setting /></el-icon>
                    <span>系统设置与权限管理</span>
                  </template>
                  <el-menu-item index="/manager/setting">系统设置</el-menu-item>
                  <el-menu-item index="/manager/limit">权限管理</el-menu-item>
                </el-sub-menu>
                
              </el-menu>
            </div>

            <!-- 数据渲染区域 -->
            <div style="flex: 1; background-color: #efefef; padding: 20px;">
              <RouterView />
            </div>
        </div>

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

<style>
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
  color: black;
}
.el-sub-menu__title:hover {
  color: black;
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