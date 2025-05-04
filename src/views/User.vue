<script setup>
import { ref, onMounted } from "vue";
import { ElMessage } from "element-plus";
import { fetchUserAPI } from "../api/adminApi";
import { useRouter } from "vue-router";
const router = useRouter();

const goToLoanApplications = (user) => {
    router.push({
        path: '/manager/approve',
        query: {
            userId: user.id,
        },
    });
};

const userList = ref([]);
const currentPage = ref(1);
const pageSize = ref(5);
const totalItems = ref(0);
const loading = ref(false);
const filterStatus = ref('all');

const statusOptions = [
    { value: 'all', label: '全部' },
    { value: '1', label: '已实名' },
    { value: '0', label: '未实名' },
];

const detailDialogVisible = ref(false);
const selectedUser = ref(null);

const fetchUser = async () => {
    loading.value = true;
    try {
        const response = await fetchUserAPI(currentPage.value, pageSize.value, filterStatus.value);
        const data = response?.data;
        if (data?.user && data?.meta?.field_map) {
            const fieldMap = data.meta.field_map;
            const usersObject = data.user;

            userList.value = Object.values(usersObject).map(user => {
                const parsedUser = {};
                for (const [key, value] of Object.entries(fieldMap)) {
                    parsedUser[key] = user[value];
                }
                return {
                    ...parsedUser,
                    createAt: user[fieldMap["create_time"]],
                    updateAt: user[fieldMap["update_time"]],
                };
            });

            totalItems.value = data.pagination?.total_items || 0;
        } else {
            ElMessage.error("数据格式错误");
        }
    } catch (error) {
        ElMessage.error("获取用户失败: " + (error.response?.data?.msg || error.message));
    } finally {
        loading.value = false;
    }
};

const handleStatusChange = () => {
    currentPage.value = 1;
    fetchUser();
};

const handlePageChange = (page) => {
    currentPage.value = page;
    fetchUser();
};

const handlePageSizeChange = (size) => {
    pageSize.value = size;
    currentPage.value = 1;
    fetchUser();
};

const showUserDetail = (user) => {
    selectedUser.value = user;
    detailDialogVisible.value = true;
};

onMounted(() => {
    fetchUser();
});
</script>

<template>
    <div class="user-container">
        <el-card class="user-card">
            <template #header>
                <div class="user-header">
                    <div class="filter-container">
                        <el-select v-model="filterStatus" @change="handleStatusChange" placeholder="筛选实名状态"
                            style="width: 140px; margin-right: 15px;">
                            <el-option v-for="item in statusOptions" :key="item.value" :label="item.label"
                                :value="item.value" />
                        </el-select>
                        <span class="header-title">用户管理列表</span>
                    </div>
                </div>
            </template>

            <el-table :data="userList" v-loading="loading" stripe>
                <el-table-column prop="id" label="用户ID" />
                <el-table-column prop="username" label="用户名" />
                <el-table-column prop="email" label="邮箱" />
                <el-table-column prop="phone" label="电话" />
                <el-table-column prop="createAt" label="创建时间">
                    <template #default="{ row }">
                        {{ row.createAt ? new Date(row.createAt).toLocaleString() : '-' }}
                    </template>
                </el-table-column>
                <el-table-column label="实名状态">
                    <template #default="{ row }">
                        <el-tag :type="row.verified ? 'success' : 'info'" effect="plain">
                            {{ row.verified ? '已实名' : '未实名' }}
                        </el-tag>
                    </template>
                </el-table-column>
                <el-table-column label="操作">
                    <template #default="{ row }">
                        <el-button type="primary" text @click="showUserDetail(row)">查看详情</el-button>
                    </template>
                </el-table-column>
                <el-table-column label="操作" fixed="right" width="140">
                    <template #default="{ row }">
                        <el-button type="primary" size="small" @click="goToLoanApplications(row)">查看贷款</el-button>
                    </template>
                </el-table-column>
            </el-table>

            <div class="pagination-container">
                <el-pagination :current-page="currentPage" :page-size="pageSize" :total="totalItems"
                    :page-sizes="[1, 5, 10, 20, 50]" :pager-count="3" layout="total, sizes, prev, pager, next, jumper"
                    @current-change="handlePageChange" @size-change="handlePageSizeChange" />
            </div>
        </el-card>

        <el-dialog v-model="detailDialogVisible" title="用户详情" width="600px">
            <el-descriptions :column="2" border>
                <el-descriptions-item label="用户ID">{{ selectedUser?.id }}</el-descriptions-item>
                <el-descriptions-item label="用户名">{{ selectedUser?.username }}</el-descriptions-item>
                <el-descriptions-item label="姓名">{{ selectedUser?.name || '-' }}</el-descriptions-item>
                <el-descriptions-item label="用户类型">{{ selectedUser?.user_type }}</el-descriptions-item>
                <el-descriptions-item label="身份证号">{{ selectedUser?.id_num || '-' }}</el-descriptions-item>
                <el-descriptions-item label="邮箱">{{ selectedUser?.email }}</el-descriptions-item>
                <el-descriptions-item label="邮箱验证">
                    <el-tag :type="selectedUser?.email_verified ? 'success' : 'info'" effect="plain">
                        {{ selectedUser?.email_verified ? '已验证' : '未验证' }}
                    </el-tag>
                </el-descriptions-item>
                <el-descriptions-item label="电话">{{ selectedUser?.phone }}</el-descriptions-item>
                <el-descriptions-item label="地址">{{ selectedUser?.address || '-' }}</el-descriptions-item>
                <el-descriptions-item label="性别">{{ selectedUser?.gender || '-' }}</el-descriptions-item>
                <el-descriptions-item label="年龄">{{ selectedUser?.age || '-' }}</el-descriptions-item>
                <el-descriptions-item label="实名状态">
                    <el-tag :type="selectedUser?.verified ? 'success' : 'info'" effect="plain">
                        {{ selectedUser?.verified ? '已实名' : '未实名' }}
                    </el-tag>
                </el-descriptions-item>
                <el-descriptions-item label="创建时间">
                    {{ selectedUser?.createAt ? new Date(selectedUser.createAt).toLocaleString() : '-' }}
                </el-descriptions-item>
                <el-descriptions-item label="更新时间">
                    {{ selectedUser?.updateAt ? new Date(selectedUser.updateAt).toLocaleString() : '-' }}
                </el-descriptions-item>
            </el-descriptions>
        </el-dialog>
    </div>
</template>

<style scoped>
.user-container {
    padding: 20px;
}

.user-card {
    margin-top: 20px;
}

.filter-container {
    display: flex;
    align-items: center;
}

.header-title {
    font-size: 16px;
    font-weight: 500;
    color: #606266;
}

.pagination-container {
    margin-top: 20px;
    display: flex;
    justify-content: flex-end;
}

:deep(.el-table td) {
    padding: 12px 0;
}

:deep(.el-table .cell) {
    word-break: break-word;
}
</style>