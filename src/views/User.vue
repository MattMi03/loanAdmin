<script setup>
import { ref, onMounted } from "vue";
import { ElMessage } from "element-plus";
import { fetchUserAPI, fetchUserByIdAPI } from "../api/adminApi";
import { useRouter } from "vue-router";

const router = useRouter();

const userList = ref([]);
const currentPage = ref(1);
const pageSize = ref(5);
const totalItems = ref(0);
const loading = ref(false);
const filterStatus = ref('all');
const detailDialogVisible = ref(false);
const selectedUser = ref(null);
const userIdInput = ref('');

const statusOptions = [
    { value: 'all', label: '全部' },
    { value: '1', label: '已实名' },
    { value: '0', label: '未实名' },
];

const goToLoanApplications = (user) => {
    router.push({
        path: '/manager/approve',
        query: { userId: user.id }
    });
};

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

const fetchUserById = async (id) => {
    if (!id) return;

    loading.value = true;
    try {
        const response = await fetchUserByIdAPI(id);
        const user = response;

        // 格式化用户数据，与表格数据结构保持一致
        selectedUser.value = {
            id: user.id,
            username: user.username,
            email: user.email,
            phone: user.phone,
            name: user.name,
            id_num: user.idNum,
            age: user.age,
            gender: user.gender,
            address: user.address,
            verified: user.verified,
            email_verified: user.emailVerified,
            user_type: user.userType,
            createAt: user.createTime,
            updateAt: user.updateTime
        };

        detailDialogVisible.value = true;
    } catch (error) {
        ElMessage.error("获取用户详情失败: " + (error.response?.data?.msg || error.message));
    } finally {
        loading.value = false;
    }
};

const handleUserIdSearch = () => {
    if (!userIdInput.value) {
        ElMessage.error("请输入用户ID");
        return;
    }

    const userId = Number(userIdInput.value);
    if (isNaN(userId)) {
        ElMessage.error("请输入有效的用户ID");
        return;
    }
    const foundUser = userList.value.find(user => user.id === userId);
    if (foundUser) {
        selectedUser.value = foundUser;
        detailDialogVisible.value = true;
    } else {
        fetchUserById(userId);
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
    <div class="user-management-container">
        <el-card class="management-card">
            <template #header>
                <div class="card-header">
                    <h2 class="management-title">用户管理</h2>
                    <div class="header-actions">
                        <el-select v-model="filterStatus" @change="handleStatusChange" placeholder="筛选实名状态"
                            class="status-select" popper-class="status-select-dropdown">
                            <el-option v-for="item in statusOptions" :key="item.value" :label="item.label"
                                :value="item.value" />
                        </el-select>
                        <div>
                            <el-input v-model="userIdInput" placeholder="输入用户ID" clearable class="search-input"
                                @keydown.enter="handleUserIdSearch" />
                            <el-button type="primary" @click="handleUserIdSearch" class="search-button">
                                搜索
                            </el-button>
                        </div>
                    </div>
                </div>
            </template>

            <div class="table-container">
                <el-table :data="userList" v-loading="loading" style="width: 100%" :header-cell-style="{
                    background: '#f8fafc',
                    color: '#64748b',
                    textAlign: 'center'
                }" :cell-style="{ padding: '12px 0' }">
                    <el-table-column prop="id" label="用户ID" width="100" header-align="center">
                        <template #default="{ row }">
                            <span class="user-id">{{ row.id }}</span>
                        </template>
                    </el-table-column>

                    <el-table-column prop="username" label="用户名" header-align="center">
                        <template #default="{ row }">
                            <div class="user-info-cell" style="justify-content: flex-start;">
                                <span class="username">{{ row.username }}</span>
                            </div>
                        </template>
                    </el-table-column>

                    <el-table-column prop="email" label="邮箱" width="220" header-align="center">
                        <template #default="{ row }">
                            <div class="contact-info">
                                <span>{{ row.email }}</span>
                            </div>
                        </template>
                    </el-table-column>

                    <el-table-column prop="phone" label="电话" header-align="center">
                        <template #default="{ row }">
                            <div class="contact-info">
                                <span>{{ row.phone }}</span>
                            </div>
                        </template>
                    </el-table-column>

                    <el-table-column prop="createAt" label="创建时间">
                        <template #default="{ row }">
                            <div class="timestamp">
                                {{ row.createAt ? new Date(row.createAt).toLocaleString() : '-' }}
                            </div>
                        </template>
                    </el-table-column>

                    <el-table-column label="实名状态">
                        <template #default="{ row }">
                            <el-tag :type="row.verified ? 'success' : 'info'" effect="light" class="status-tag">
                                {{ row.verified ? '已实名' : '未实名' }}
                            </el-tag>
                        </template>
                    </el-table-column>

                    <el-table-column label="操作" fixed="right">
                        <template #default="{ row }">
                            <div class="action-buttons">
                                <el-button type="primary" size="small" @click="showUserDetail(row)"
                                    class="detail-button">
                                    详情
                                </el-button>
                                <el-button type="primary" size="small" @click="goToLoanApplications(row)"
                                    class="loan-button">
                                    查看贷款
                                </el-button>
                            </div>
                        </template>
                    </el-table-column>
                </el-table>
            </div>

            <div class="pagination-container">
                <el-pagination :current-page="currentPage" :page-size="pageSize" :total="totalItems"
                    :page-sizes="[5, 10, 20, 50]" layout="total, sizes, prev, pager, next, jumper"
                    @current-change="handlePageChange" @size-change="handlePageSizeChange" class="custom-pagination" />
            </div>
        </el-card>

        <el-dialog v-model="detailDialogVisible" title="用户详情" width="700px" class="user-detail-dialog">
            <div class="dialog-content">
                <div class="user-profile">
                    <div class="profile-avatar">
                        <div class="avatar-circle large">
                            {{ selectedUser?.username?.charAt(0)?.toUpperCase() || 'U' }}
                        </div>
                    </div>
                    <div class="profile-info">
                        <h3>{{ selectedUser?.username }}</h3>
                        <p>{{ selectedUser?.email }}</p>
                        <el-tag :type="selectedUser?.verified ? 'success' : 'info'" effect="light"
                            class="profile-status">
                            {{ selectedUser?.verified ? '已实名' : '未实名' }}
                        </el-tag>
                    </div>
                </div>

                <el-descriptions :column="2" border class="user-details">
                    <el-descriptions-item label="用户ID">{{ selectedUser?.id }}</el-descriptions-item>
                    <el-descriptions-item label="用户名">{{ selectedUser?.username }}</el-descriptions-item>
                    <el-descriptions-item label="姓名">{{ selectedUser?.name || '-' }}</el-descriptions-item>
                    <el-descriptions-item label="用户类型">{{ selectedUser?.user_type }}</el-descriptions-item>
                    <el-descriptions-item label="身份证号">{{ selectedUser?.id_num || '-' }}</el-descriptions-item>
                    <el-descriptions-item label="邮箱">{{ selectedUser?.email }}</el-descriptions-item>
                    <el-descriptions-item label="邮箱验证">
                        <el-tag :type="selectedUser?.email_verified ? 'success' : 'info'" effect="light">
                            {{ selectedUser?.email_verified ? '已验证' : '未验证' }}
                        </el-tag>
                    </el-descriptions-item>
                    <el-descriptions-item label="电话">{{ selectedUser?.phone }}</el-descriptions-item>
                    <el-descriptions-item label="地址">{{ selectedUser?.address || '-' }}</el-descriptions-item>
                    <el-descriptions-item label="性别">{{ selectedUser?.gender || '-' }}</el-descriptions-item>
                    <el-descriptions-item label="年龄">{{ selectedUser?.age || '-' }}</el-descriptions-item>
                    <el-descriptions-item label="创建时间">
                        {{ selectedUser?.createAt ? new Date(selectedUser.createAt).toLocaleString() : '-' }}
                    </el-descriptions-item>
                    <el-descriptions-item label="更新时间">
                        {{ selectedUser?.updateAt ? new Date(selectedUser.updateAt).toLocaleString() : '-' }}
                    </el-descriptions-item>
                </el-descriptions>
            </div>
        </el-dialog>
    </div>
</template>

<style scoped>
/* 全局表格样式调整 */
.el-table {
    --el-table-header-bg-color: #f8fafc;
    --el-table-text-color: #64748b;
    --el-table-row-hover-bg-color: #f5f7fa;
}

/* 表头单元格样式 */
:deep(.el-table th.el-table__cell) {
    text-align: center !important;
    font-weight: 600;
    padding: 12px 0;
}

/* 表格内容单元格样式 */
:deep(.el-table td.el-table__cell) {
    padding: 12px 0;
}

/* 表格列对齐方式 */
:deep(.el-table .el-table__cell) {
    text-align: center !important;
}

/* 特定列左对齐 */
:deep(.el-table .username-column .cell),
:deep(.el-table .email-column .cell),
:deep(.el-table .phone-column .cell) {
    text-align: left !important;
    padding-left: 16px;
}

/* 操作列固定右对齐 */
:deep(.el-table .action-column .cell) {
    text-align: right !important;
    padding-right: 16px;
}

/* 调整操作列按钮间距 */
.action-buttons {
    display: flex;
    gap: 8px;
    justify-content: flex-end;
}

/* 用户信息单元格样式 */
.user-info-cell {
    display: flex;
    align-items: center;
    justify-content: flex-start;
    padding-left: 16px;
}

/* 联系信息样式 */
.contact-info {
    display: flex;
    align-items: center;
    justify-content: flex-start;
    padding-left: 16px;
}

/* 时间戳样式 */
.timestamp {
    font-size: 0.9rem;
    color: #64748b;
}

/* 用户ID样式 */
.user-id {
    font-family: 'Courier New', monospace;
    color: #475569;
    font-weight: 500;
}

/* 状态标签样式 */
.status-tag {
    border-radius: 12px;
    padding: 0 10px;
    font-weight: 500;
    min-width: 60px;
    display: inline-block;
    text-align: center;
}

/* 表格行悬停效果 */
:deep(.el-table__body tr:hover>td) {
    background-color: #f1f5f9 !important;
}

/* 其他原有样式保持不变... */
.user-management-container {
    display: flex;
    justify-content: center;
    min-height: 80vh;
    padding: 30px;
    background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
}

.management-card {
    width: 100%;
    max-width: 1500px;
    border: none;
    border-radius: 16px;
    overflow: hidden;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
    transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.management-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 15px 35px rgba(0, 0, 0, 0.15);
}

.card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px 25px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.management-title {
    font-size: 1.5rem;
    color: white;
    font-weight: 600;
    margin: 0;
}

.header-actions {
    display: flex;
    align-items: center;
    gap: 15px;
}

.search-input {
    width: 150px;
}

.search-input :deep(.el-input__inner) {
    background-color: rgba(255, 255, 255, 0.2);
    border: none;
    color: rgb(6, 0, 0);
}

.search-input :deep(.el-input__inner::placeholder) {
    color: rgba(0, 0, 0, 0.7);
}

.search-input :deep(.el-input__suffix) {
    color: white;
}

.status-select {
    width: 160px;
}

.status-select :deep(.el-input__inner) {
    background-color: rgba(255, 255, 255, 0.2);
    border: none;
    color: white;
}

.status-select :deep(.el-input__inner::placeholder) {
    color: rgba(255, 255, 255, 0.7);
}

.status-select :deep(.el-input__suffix) {
    color: white;
}

.table-container {
    padding: 0 20px;
    height: calc(100vh - 450px);
    /* 固定高度，根据实际布局调整 */
    display: flex;
    flex-direction: column;
}

/* 表格包装器 */
.table-wrapper {
    flex: 1;
    overflow: auto;
    position: relative;
}

/* 表格样式 */
:deep(.el-table) {
    width: 100% !important;
    table-layout: fixed;
}

/* 表头固定 */
:deep(.el-table__header-wrapper) {
    position: sticky;
    top: 0;
    z-index: 2;
    background: #f8fafc;
}

/* 表格单元格内容不换行 */
:deep(.el-table .cell) {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.avatar-circle {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    font-weight: 600;
    margin-right: 10px;
}

.avatar-circle.large {
    width: 60px;
    height: 60px;
    font-size: 24px;
}

.username {
    font-weight: 500;
}

.detail-button {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border: none;
    border-radius: 8px;
}

.loan-button {
    background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
    border: none;
    border-radius: 8px;
}

.pagination-container {
    padding: 20px;
    display: flex;
    justify-content: center;
}

.custom-pagination :deep(.btn-prev),
.custom-pagination :deep(.btn-next),
.custom-pagination :deep(.number) {
    border-radius: 8px;
    margin: 0 4px;
}

.custom-pagination :deep(.el-pager li.active) {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
}

.user-detail-dialog :deep(.el-dialog) {
    border-radius: 16px;
    overflow: hidden;
}

.user-detail-dialog :deep(.el-dialog__header) {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    margin: 0;
    padding: 20px;
}

.user-detail-dialog :deep(.el-dialog__title) {
    color: white;
}

.user-detail-dialog :deep(.el-dialog__headerbtn .el-dialog__close) {
    color: white;
}

.dialog-content {
    padding: 20px;
}

.user-profile {
    display: flex;
    align-items: center;
    margin-bottom: 20px;
    padding-bottom: 20px;
    border-bottom: 1px solid #f0f0f0;
}

.profile-info {
    margin-left: 20px;
}

.profile-info h3 {
    margin: 0 0 5px 0;
    font-size: 1.5rem;
}

.profile-info p {
    margin: 0 0 10px 0;
    color: #64748b;
}

.profile-status {
    border-radius: 12px;
    padding: 2px 12px;
}

.user-details :deep(.el-descriptions__body) {
    background-color: #f8fafc;
}

.user-details :deep(.el-descriptions__label) {
    width: 120px;
    background-color: #f1f5f9;
    color: #64748b;
    font-weight: 500;
}

.user-details :deep(.el-descriptions__content) {
    background-color: white;
}

@media (max-width: 992px) {
    .management-card {
        max-width: 100%;
    }

    .table-container {
        overflow-x: auto;
    }

    .user-detail-dialog {
        width: 95% !important;
    }
}
</style>

<style>
.status-select-dropdown {
    border-radius: 12px !important;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1) !important;
    border: none !important;
}
</style>