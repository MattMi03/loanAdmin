<script setup>
import { ref, onMounted } from "vue";
import { ElMessage, ElCard, ElRow, ElCol, ElSkeleton } from "element-plus";
import { getSelfInfoAPI } from "@/api/adminApi";

const userData = ref(null);

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
  <div class="user-info-container">
    <el-card v-if="userData" class="user-card">
      <div class="card-header">
        <h2 class="user-title">个人信息</h2>
      </div>

      <el-row class="user-info">
        <el-col :span="24" class="info-item">
          <strong>用户ID:</strong> {{ getIdentity() }}
        </el-col>
        <el-col :span="24" class="info-item">
          <strong>邮箱:</strong> {{ getContact("email") }}
        </el-col>
        <el-col :span="24" class="info-item">
          <strong>电话:</strong> {{ getContact("phone") }}
        </el-col>
        <el-col :span="24" class="info-item">
          <strong>用户名:</strong> {{ getPersonalField("username") }}
        </el-col>
        <el-col :span="24" class="info-item">
          <strong>姓名:</strong> {{ getPersonalField("reallyname") || "未提供" }}
        </el-col>
      </el-row>
    </el-card>

    <el-skeleton v-else :rows="5" :loading="!userData">
      <template #template>
        <el-card class="user-card">
          <div class="card-header">
            <h2 class="user-title">个人信息</h2>
          </div>
          <el-row class="user-info">
            <el-col :span="24" class="info-item"></el-col>
            <el-col :span="24" class="info-item"></el-col>
            <el-col :span="24" class="info-item"></el-col>
            <el-col :span="24" class="info-item"></el-col>
            <el-col :span="24" class="info-item"></el-col>
          </el-row>
        </el-card>
      </template>
    </el-skeleton>
  </div>
</template>

<style scoped>
.user-info-container {
  display: flex;
  justify-content: center;
  padding: 0 20px;
  margin-top: 50px;
}

.user-card {
  width: 100%;
  max-width: 480px;
  padding: 20px;
  border-radius: 8px;
  background-color: #ffffff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.user-card:hover {
  transform: scale(1.03);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.card-header {
  border-bottom: 2px solid #f0f0f0;
  margin-bottom: 16px;
}

.user-title {
  font-size: 1.6rem;
  color: #333;
  font-weight: bold;
}

.user-info .info-item {
  padding: 16px;
  background-color: #f9f9f9;
  border-radius: 6px;
  margin-bottom: 12px;
  font-size: 1rem;
  color: #333;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.user-info .info-item:hover {
  transform: translateY(-3px);
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
}

.user-info .info-item strong {
  color: #409EFF;
}

.el-skeleton {
  margin-top: 20px;
}

.el-skeleton-row {
  margin-bottom: 12px;
}
</style>