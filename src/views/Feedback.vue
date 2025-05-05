<script setup>
import { ref, onMounted } from "vue";
import { ElMessage, ElTag } from "element-plus";
import { fetchFeedbackAPI, submitFeedbackReplyAPI } from "@/api/adminApi";

const feedbackList = ref([]);
const currentPage = ref(1);
const pageSize = ref(5);
const totalItems = ref(0);
const loading = ref(false);
const filterStatus = ref('all');

const dialogVisible = ref(false);
const detailDialogVisible = ref(false);
const replyContent = ref('');
const selectedFeedback = ref(null);
const formRef = ref(null);

const replyRules = {
    reply: [{ required: true, message: '请输入回复内容', trigger: 'blur' }]
};

const statusOptions = [
    { value: 'all', label: '全部状态' },
    { value: 'PENDING', label: '待处理' },
    { value: 'REPLIED', label: '已回复' }
];

const statusTagType = {
    PENDING: 'error',
    REPLIED: 'success'
};

const fetchFeedback = async () => {
    loading.value = true;
    try {
        const response = await fetchFeedbackAPI(currentPage.value, pageSize.value, filterStatus.value);

        if (response?.data?.feedback && response?.data?.users) {
            const userMap = response.data.users;

            feedbackList.value = response.data.feedback.map(fb => {
                const user = userMap[fb.user_id] || {};
                return {
                    ...fb,
                    email: user.email || '-',
                    phone: user.phone || '-',
                    username: user.username || '-',
                    userId: fb.user_id,
                    createAt: fb.create_at,
                    replyAt: fb.reply_at
                };
            });

            totalItems.value = response.data.pagination?.total_count || 0;
        } else {
            ElMessage.error("数据格式错误");
            console.error("error", response);
        }
    } catch (error) {
        ElMessage.error("获取反馈失败: " + (error.response?.data?.msg || error.message));
    } finally {
        loading.value = false;
    }
};

const submitReply = async () => {
    formRef.value.validate(async (valid) => {
        if (!valid) return;

        try {
            await submitFeedbackReplyAPI(selectedFeedback.value.id, replyContent.value);

            ElMessage.success("回复成功");
            dialogVisible.value = false;

            const target = feedbackList.value.find(f => f.id === selectedFeedback.value.id);
            if (target) {
                target.reply = replyContent.value;
                target.status = 'REPLIED';
                target.replyAt = new Date().toISOString();
            }
        } catch (error) {
            ElMessage.error(`回复失败: ${error.response?.data?.msg || error.message}`);
        }
    });
};

const resetForm = () => {
    replyContent.value = '';
    selectedFeedback.value = null;
};

const handleStatusChange = () => {
    currentPage.value = 1;
    fetchFeedback();
};

const handlePageChange = (page) => {
    currentPage.value = page;
    fetchFeedback();
};

const handlePageSizeChange = (size) => {
    pageSize.value = size;
    currentPage.value = 1;
    fetchFeedback();
};

const openReplyDialog = (feedback) => {
    selectedFeedback.value = feedback;
    replyContent.value = feedback.reply || '';
    dialogVisible.value = true;
};

const showDetail = (feedback) => {
    selectedFeedback.value = feedback;
    detailDialogVisible.value = true;
};

const ellipsis = (text) => {
    if (!text) return '-';
    return text.length > 10 ? text.slice(0, 10) + '...' : text;
};

onMounted(fetchFeedback);
</script>

<template>
    <div class="feedback-management-container">
        <el-card class="management-card">
            <template #header>
                <div class="card-header">
                    <h2 class="management-title">用户反馈管理</h2>
                    <div class="header-actions">
                        <el-select v-model="filterStatus" @change="handleStatusChange" placeholder="筛选状态"
                            class="status-select" popper-class="status-select-dropdown">
                            <el-option v-for="item in statusOptions" :key="item.value" :label="item.label"
                                :value="item.value" />
                        </el-select>
                    </div>
                </div>
            </template>

            <div class="table-container">
                <el-table :data="feedbackList" v-loading="loading" style="width: 100%" :header-cell-style="{
                    background: '#f8fafc',
                    color: '#64748b',
                    textAlign: 'center'
                }" :cell-style="{ padding: '12px 0' }" stripe>
                    <el-table-column prop="id" label="ID" width="80" header-align="center" />

                    <el-table-column prop="user_id" label="用户名" header-align="center" />

                    <el-table-column prop="email" label="邮箱" header-align="center" />

                    <el-table-column prop="content" label="反馈内容" header-align="center">
                        <template #default="{ row }">
                            <div class="content-cell" :title="row.content">
                                {{ ellipsis(row.content) }}
                            </div>
                        </template>
                    </el-table-column>

                    <el-table-column prop="reply" label="回复内容" header-align="center">
                        <template #default="{ row }">
                            <div class="reply-cell" :title="row.reply || '-'">
                                {{ ellipsis(row.reply || '-') }}
                            </div>
                        </template>
                    </el-table-column>

                    <el-table-column prop="status" label="状态" header-align="center">
                        <template #default="{ row }">
                            <el-tag :type="statusTagType[row.status]" effect="plain" class="status-tag">
                                {{ row.status === 'PENDING' ? '待处理' : '已回复' }}
                            </el-tag>
                        </template>
                    </el-table-column>

                    <el-table-column prop="createAt" label="创建时间" width="180" header-align="center">
                        <template #default="{ row }">
                            <div class="timestamp">
                                {{ row.createAt ? new Date(row.createAt).toLocaleString() : '-' }}
                            </div>
                        </template>
                    </el-table-column>

                    <el-table-column label="操作" width="180" fixed="right" header-align="center">
                        <template #default="{ row }">
                            <div class="action-buttons">
                                <el-button type="primary" size="small" @click="showDetail(row)" class="detail-button">
                                    详情
                                </el-button>
                                <el-button v-if="row.status === 'PENDING'" type="success" size="small"
                                    @click="openReplyDialog(row)" class="reply-button">
                                    回复
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

        <!-- 详情对话框 -->
        <el-dialog v-model="detailDialogVisible" title="反馈详情" width="700px" class="feedback-detail-dialog">
            <el-descriptions :column="1" border>
                <el-descriptions-item label="反馈ID">{{ selectedFeedback?.id }}</el-descriptions-item>
                <el-descriptions-item label="用户名">{{ selectedFeedback?.username }}</el-descriptions-item>
                <el-descriptions-item label="用户ID">{{ selectedFeedback?.userId }}</el-descriptions-item>
                <el-descriptions-item label="邮箱">{{ selectedFeedback?.email }}</el-descriptions-item>
                <el-descriptions-item label="电话">{{ selectedFeedback?.phone }}</el-descriptions-item>
                <el-descriptions-item label="状态">
                    <el-tag :type="statusTagType[selectedFeedback?.status]" effect="plain" class="status-tag">
                        {{ selectedFeedback?.status === 'PENDING' ? '待处理' : '已回复' }}
                    </el-tag>
                </el-descriptions-item>
                <el-descriptions-item label="创建时间">
                    {{ selectedFeedback?.createAt ? new Date(selectedFeedback.createAt).toLocaleString() : '-' }}
                </el-descriptions-item>
                <el-descriptions-item label="内容详情" :span="1">
                    <el-scrollbar height="160" class="scroll-content-box">
                        <div class="section">
                            <strong>反馈内容：</strong>
                            <p>{{ selectedFeedback?.content || '-' }}</p>
                        </div>
                        <div class="section" v-if="selectedFeedback?.status === 'REPLIED'">
                            <strong>回复内容：</strong>
                            <p>{{ selectedFeedback?.reply || '-' }}</p>
                        </div>
                    </el-scrollbar>
                </el-descriptions-item>
                <el-descriptions-item label="回复时间" v-if="selectedFeedback?.status === 'REPLIED'">
                    {{ selectedFeedback?.replyAt ? new Date(selectedFeedback.replyAt).toLocaleString() : '-' }}
                </el-descriptions-item>
            </el-descriptions>
        </el-dialog>

        <!-- 回复对话框 -->
        <el-dialog v-model="dialogVisible" title="回复用户反馈" width="500px" class="feedback-reply-dialog"
            @closed="resetForm">
            <el-form :model="{ reply: replyContent }" :rules="replyRules" ref="formRef">
                <el-form-item label="反馈内容">
                    <div class="feedback-content">
                        {{ selectedFeedback?.content }}
                    </div>
                </el-form-item>
                <el-form-item label="回复内容" prop="reply">
                    <el-input v-model="replyContent" type="textarea" :rows="4" placeholder="请输入回复内容" maxlength="500"
                        show-word-limit />
                </el-form-item>
            </el-form>

            <template #footer>
                <el-button @click="dialogVisible = false">取消</el-button>
                <el-button type="primary" @click="submitReply" class="confirm-button">
                    确认回复
                </el-button>
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

/* 主容器样式 */
.feedback-management-container {
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
    height: calc(100vh - 450px); /* 固定高度，根据实际布局调整 */
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

/* 分页样式 */
.pagination-container {
    padding: 15px 0;
    background: white;
    position: sticky;
    bottom: 0;
    z-index: 2;
    border-top: 1px solid #ebeef5;
}

/* 响应式调整 */
@media (max-width: 992px) {
    .table-container {
        height: calc(100vh - 350px); /* 移动端调整高度 */
    }
}

/* 内容单元格样式 - 截断长文本 */
.content-cell {
    display: -webkit-box;
    -webkit-box-orient: vertical;
    overflow: hidden;
    text-overflow: ellipsis;
    max-height: 3em;
    line-height: 1.5;
    margin: 0 auto;
    width: 90%;
}

/* 操作按钮样式 */
.action-buttons {
    display: flex;
    gap: 8px;
    justify-content: center;
}

.detail-button {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border: none;
    border-radius: 8px;
}

.reply-button {
    background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
    border: none;
    border-radius: 8px;
}

.confirm-button {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
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

/* 详情对话框样式 */
.feedback-detail-dialog :deep(.el-dialog) {
    border-radius: 16px;
    overflow: hidden;
}

.feedback-detail-dialog :deep(.el-dialog__header) {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    margin: 0;
    padding: 20px;
}

.feedback-detail-dialog :deep(.el-dialog__title) {
    color: white;
}

.feedback-detail-dialog :deep(.el-dialog__headerbtn .el-dialog__close) {
    color: white;
}

/* 详情内容区域样式 */
.detail-content {
    max-height: 60vh;
    overflow-y: auto;
    padding-right: 10px;
}

.detail-content :deep(.el-descriptions__body) {
    background-color: #fff;
}

.detail-content :deep(.el-descriptions__table) {
    width: 100%;
}

.scroll-content-box {
    padding: 8px 12px;
    background: #fafafa;
    border: 1px solid #ebeef5;
    border-radius: 6px;
    font-size: 14px;
    line-height: 1.6;
    color: #333;
    max-width: 600px;
    box-sizing: border-box;
}

.section {
    margin-bottom: 10px;
}

.section p {
    margin: 4px 0 0;
    white-space: pre-wrap;
    word-break: break-word;
}

/* 内容框样式 - 可滚动 */
.content-box {
    padding: 10px;
    background: #f8f9fa;
    border-radius: 4px;
    margin-top: 5px;
    max-height: 200px;
    overflow-y: auto;
    word-break: break-word;
    white-space: pre-wrap;
    line-height: 1.6;
    border: 1px solid #ebeef5;
}

/* 时间戳样式 */
.timestamp {
    font-size: 0.9rem;
    color: #666;
}

/* 回复对话框样式 */
.feedback-reply-dialog :deep(.el-dialog) {
    border-radius: 16px;
    overflow: hidden;
}

.feedback-reply-dialog :deep(.el-dialog__header) {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    margin: 0;
    padding: 20px;
}

.feedback-reply-dialog :deep(.el-dialog__title) {
    color: white;
}

.feedback-reply-dialog :deep(.el-dialog__headerbtn .el-dialog__close) {
    color: white;
}

.feedback-content {
    padding: 10px;
    background: #f5f7fa;
    border-radius: 4px;
    margin-bottom: 10px;
    max-height: 150px;
    overflow-y: auto;
    word-break: break-word;
    white-space: pre-wrap;
    line-height: 1.6;
}

@media (max-width: 992px) {
    .management-card {
        max-width: 100%;
    }

    .table-container {
        overflow-x: auto;
    }

    .feedback-detail-dialog,
    .feedback-reply-dialog {
        width: 95% !important;
    }

    .header-actions {
        flex-direction: column;
        align-items: flex-start;
        gap: 10px;
    }

    .status-select {
        width: 100%;
    }
}
</style>

<style>
.status-select-dropdown {
    border-radius: 12px !important;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1) !important;
    border: none !important;
}

/* 滚动条样式 */
::-webkit-scrollbar {
    width: 6px;
    height: 6px;
}

::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 3px;
}

::-webkit-scrollbar-thumb {
    background: #c1c1c1;
    border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
    background: #a8a8a8;
}
</style>