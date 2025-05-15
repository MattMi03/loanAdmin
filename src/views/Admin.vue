<script setup>
import { watch, ref, onMounted, onBeforeUnmount } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage, ElTag, ElDialog, ElDescriptions, ElDescriptionsItem, ElSelect, ElOption } from 'element-plus';
import { fetchAllAdminAPI, fetchAdminByIdAPI, createAdminAPI, deleteAdminAPI, updateAdminAPI } from '@/api/adminApi';

const adminList = ref([]);
const currentPage = ref(1);
const pageSize = ref(5);
const totalItems = ref(0);
const loading = ref(false);
const adminIdInput = ref('');
const selectedAdmin = ref(null);
const detailDialogVisible = ref(false);
const createDialogVisible = ref(false);
const updateDialogVisible = ref(false);
const deleteDialogVisible = ref(false);

// 权限选项
const permissionOptions = ref([
    { value: 'HOME_VIEW', label: '首页查看' },
    { value: 'USER_MANAGE', label: '用户管理' },
    { value: 'LOAN_APPROVE', label: '贷款审批' },
    { value: 'PRODUCT_MANAGE', label: '产品管理' },
    { value: 'LOAN_DISBURSE', label: '贷款发放' },
    { value: 'FEEDBACK_VIEW', label: '反馈查看' },
    { value: 'ADMIN_MANAGE', label: '管理员管理' }
]);

// 表单数据 - 修正为嵌套结构
const newAdminForm = ref({
    user: {
        username: '',
        password: '',
        phone: '',
        email: '',
        name: ''
    },
    codeList: []
});

const updateAdminForm = ref({
    id: '',
    codeList: []
});

const fetchAllAdmin = async () => {
    loading.value = true;
    try {
        const response = await fetchAllAdminAPI(currentPage.value, pageSize.value);
        const data = response?.data;

        if (data?.user && data?.meta?.field_map) {
            const fieldMap = data.meta.field_map;
            const usersObject = data.user;

            adminList.value = Object.values(usersObject).map(user => {
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

const fetchAdminById = async (userId) => {
    loading.value = true;
    try {
        const response = await fetchAdminByIdAPI(userId);
        const user = response.user;
        const permissions = response.permissions;

        selectedAdmin.value = {
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
            updateAt: user.updateTime,
            permissions: permissions || []
        };

        // 初始化更新表单
        updateAdminForm.value = {
            id: user.id,
            codeList: permissions || []
        };

        detailDialogVisible.value = true;
    } catch (error) {
        ElMessage.error("获取用户详情失败: " + (error.response?.data?.msg || error.message));
    } finally {
        loading.value = false;
    }
};

const openCreateDialog = () => {
    newAdminForm.value = {
        user: {
            username: '',
            password: '',
            phone: '',
            email: '',
            name: ''
        },
        codeList: []
    };
    createDialogVisible.value = true;
};

const handleCreateAdmin = async () => {
    loading.value = true;
    try {
        const response = await createAdminAPI(newAdminForm.value);
        fetchAllAdmin();
        ElMessage.success(response.msg || "管理员创建成功");
        createDialogVisible.value = false;
    } catch (error) {
        ElMessage.error("创建管理员失败: " + (error.response?.data?.msg || error.message));
    } finally {
        loading.value = false;
    }
};

const openUpdateDialog = (admin) => {
    updateAdminForm.value = {
        id: admin.id,
        codeList: admin.permissions || []
    };
    updateDialogVisible.value = true;
};

const handleUpdateAdmin = async () => {
    loading.value = true;
    try {
        const response = await updateAdminAPI(updateAdminForm.value.id, updateAdminForm.value.codeList);
        fetchAllAdmin();
        ElMessage.success(response.msg || "权限更新成功");
        updateDialogVisible.value = false;
    } catch (error) {
        ElMessage.error("更新权限失败: " + (error.response?.data?.msg || error.message));
    } finally {
        loading.value = false;
    }
};

const openDeleteDialog = (admin) => {
    selectedAdmin.value = admin;
    deleteDialogVisible.value = true;
};

const handleDeleteAdmin = async () => {
    loading.value = true;
    try {
        const response = await deleteAdminAPI(selectedAdmin.value.id);
        fetchAllAdmin();
        ElMessage.success(response.msg || "管理员删除成功");
        deleteDialogVisible.value = false;
    } catch (error) {
        ElMessage.error("删除管理员失败: " + (error.response?.data?.msg || error.message));
    } finally {
        loading.value = false;
    }
};

const handleAdminIdSearch = () => {
    if (!adminIdInput.value) {
        ElMessage.error("请输入用户ID");
        return;
    }

    const userId = Number(adminIdInput.value);
    if (isNaN(userId)) {
        ElMessage.error("请输入有效的用户ID");
        return;
    }
    const foundUser = adminList.value.find(user => user.id === userId);

    if (foundUser) {
        selectedAdmin.value = foundUser;
        detailDialogVisible.value = true;
    } else {
        fetchAdminById(userId);
    }
};

const handlePageChange = (page) => {
    currentPage.value = page;
    fetchAllAdmin();
};

const handlePageSizeChange = (size) => {
    pageSize.value = size;
    currentPage.value = 1;
    fetchAllAdmin();
};

onMounted(() => {
    fetchAllAdmin();
});

</script>

<template>
    <div class="admin-management-container">
        <el-card class="management-card">
            <template #header>
                <div class="card-header">
                    <h2 class="management-title">管理员管理</h2>
                    <div class="header-actions">
                        <div>
                            <el-input v-model="adminIdInput" placeholder="输入管理员ID" clearable class="search-input"
                                @keydown.enter="handleAdminIdSearch" />
                            <el-button type="primary" @click="handleAdminIdSearch" class="search-button">
                                搜索
                            </el-button>
                            <el-button type="primary" @click="openCreateDialog">
                                创建管理员
                            </el-button>
                        </div>
                    </div>
                </div>
            </template>

            <div class="table-container">
                <el-table :data="adminList" v-loading="loading" style="width: 100%" :header-cell-style="{
                    background: '#f8fafc',
                    color: '#64748b',
                    textAlign: 'center'
                }" :cell-style="{ padding: '12px 0', textAlign: 'center' }">
                    <el-table-column prop="id" label="用户ID" width="100" header-align="center">
                        <template #default="{ row }">
                            <span class="user-id">{{ row.id }}</span>
                        </template>
                    </el-table-column>

                    <el-table-column prop="name" label="姓名" header-align="center">
                        <template #default="{ row }">
                            <div class="user-info-cell" style="justify-content: flex-start;">
                                <span class="name">{{ row.name }}</span>
                            </div>
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

                    <el-table-column label="操作" fixed="right" width="220">
                        <template #default="{ row }">
                            <div class="action-buttons">
                                <el-button type="primary" size="small" @click="fetchAdminById(row.id)"
                                    class="action-button-detail">
                                    详情
                                </el-button>
                                <el-button type="warning" size="small" @click="openUpdateDialog(row)"
                                    class="action-button-update">
                                    权限
                                </el-button>
                                <el-button type="danger" size="small" @click="openDeleteDialog(row)"
                                    class="action-button-delete">
                                    删除
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

        <!-- 管理员详情对话框 -->
        <el-dialog v-model="detailDialogVisible" title="管理员详情" width="700px" class="user-detail-dialog">
            <div class="dialog-content">
                <div class="user-profile">
                    <div class="profile-avatar">
                        <div class="avatar-circle large">
                            {{ selectedAdmin?.username?.charAt(0)?.toUpperCase() || 'A' }}
                        </div>
                    </div>
                    <div class="profile-info">
                        <h3>{{ selectedAdmin?.username }}</h3>
                        <p>{{ selectedAdmin?.email }}</p>
                    </div>
                </div>

                <el-descriptions :column="2" border class="user-details">
                    <el-descriptions-item label="用户ID">{{ selectedAdmin?.id }}</el-descriptions-item>
                    <el-descriptions-item label="用户名">{{ selectedAdmin?.username }}</el-descriptions-item>
                    <el-descriptions-item label="姓名">{{ selectedAdmin?.name || '-' }}</el-descriptions-item>
                    <el-descriptions-item label="邮箱">{{ selectedAdmin?.email }}</el-descriptions-item>
                    <el-descriptions-item label="电话">{{ selectedAdmin?.phone }}</el-descriptions-item>
                    <el-descriptions-item label="类型">{{ selectedAdmin?.user_type || '-' }}</el-descriptions-item>
                    <el-descriptions-item label="创建时间">
                        {{ selectedAdmin?.createAt ? new Date(selectedAdmin.createAt).toLocaleString() : '-' }}
                    </el-descriptions-item>
                    <el-descriptions-item label="更新时间">
                        {{ selectedAdmin?.updateAt ? new Date(selectedAdmin.updateAt).toLocaleString() : '-' }}
                    </el-descriptions-item>
                    <el-descriptions-item label="权限" :span="2">
                        <div v-if="selectedAdmin?.permissions?.length">
                            <el-tag v-for="permission in selectedAdmin.permissions" :key="permission"
                                class="permission-tag">
                                {{permissionOptions.find(opt => opt.value === permission)?.label || permission}}
                            </el-tag>
                        </div>
                        <span v-else>-</span>
                    </el-descriptions-item>
                </el-descriptions>
            </div>
        </el-dialog>

        <!-- 创建管理员对话框 - 修正为嵌套结构 -->
        <el-dialog v-model="createDialogVisible" title="创建管理员" width="500px">
            <el-form :model="newAdminForm" label-width="100px">
                <el-form-item label="用户名" required>
                    <el-input v-model="newAdminForm.user.username" placeholder="请输入用户名" />
                </el-form-item>
                <el-form-item label="密码" required>
                    <el-input v-model="newAdminForm.user.password" type="password" placeholder="请输入密码" show-password />
                </el-form-item>
                <el-form-item label="姓名">
                    <el-input v-model="newAdminForm.user.name" placeholder="请输入姓名" />
                </el-form-item>
                <el-form-item label="邮箱" required>
                    <el-input v-model="newAdminForm.user.email" placeholder="请输入邮箱" />
                </el-form-item>
                <el-form-item label="电话">
                    <el-input v-model="newAdminForm.user.phone" placeholder="请输入电话" />
                </el-form-item>
                <el-form-item label="权限">
                    <el-select v-model="newAdminForm.codeList" multiple placeholder="请选择权限" style="width: 100%">
                        <el-option v-for="item in permissionOptions" :key="item.value" :label="item.label"
                            :value="item.value" />
                    </el-select>
                </el-form-item>
            </el-form>
            <template #footer>
                <el-button @click="createDialogVisible = false">取消</el-button>
                <el-button type="primary" @click="handleCreateAdmin" :loading="loading">创建</el-button>
            </template>
        </el-dialog>

        <!-- 更新权限对话框 -->
        <el-dialog v-model="updateDialogVisible" title="更新管理员权限" width="500px">
            <el-form :model="updateAdminForm" label-width="100px">
                <el-form-item label="管理员ID">
                    <el-input v-model="updateAdminForm.id" disabled />
                </el-form-item>
                <el-form-item label="权限">
                    <el-select v-model="updateAdminForm.codeList" multiple placeholder="请选择权限" style="width: 100%">
                        <el-option v-for="item in permissionOptions" :key="item.value" :label="item.label"
                            :value="item.value" />
                    </el-select>
                </el-form-item>
            </el-form>
            <template #footer>
                <el-button @click="updateDialogVisible = false">取消</el-button>
                <el-button type="primary" @click="handleUpdateAdmin" :loading="loading">更新</el-button>
            </template>
        </el-dialog>

        <!-- 删除确认对话框 -->
        <el-dialog v-model="deleteDialogVisible" title="删除管理员" width="400px">
            <p>确定要删除管理员 <strong>{{ selectedAdmin?.username }}</strong> 吗？</p>
            <p style="color: #f56c6c;">此操作不可撤销！</p>
            <template #footer>
                <el-button @click="deleteDialogVisible = false">取消</el-button>
                <el-button type="danger" @click="handleDeleteAdmin" :loading="loading">确认删除</el-button>
            </template>
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

.action-button-detail {
    background: linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%);
    border: none;
    border-radius: 8px;
}

.action-button-update {
    background: linear-gradient(135deg, #4caf50 0%, #8bc34a 100%);
    border: none;
    border-radius: 8px;
}

.action-button-delete {
    background: linear-gradient(135deg, #ff416c 0%, #ff4b2b 100%);
    border: none;
    border-radius: 8px;
}

/* 用户信息单元格样式 */
/* .user-info-cell {
    display: flex;
    align-items: center;
    justify-content: flex-start;
    padding-left: 16px;
} */

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
/* .user-id {
    font-family: 'Courier New', monospace;
    color: #475569;
    font-weight: 500;
} */


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

/* 容器样式 */
.admin-management-container {
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

.table-container {
    padding: 0 20px;
    height: calc(100vh - 450px);
    display: flex;
    flex-direction: column;
}

/* 表格包装器 */
.table-wrapper {
    flex: 1;
    overflow: auto;
    position: relative;
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

.permission-tag {
    margin-right: 8px;
    margin-bottom: 8px;
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