<script setup>
import { ref, onMounted } from "vue";
import { ElMessage, ElTag } from "element-plus";
import { fetchFeedbackAPI, submitFeedbackReplyAPI } from "@/api/adminApi";

const feedbackList = ref([]);
const currentPage = ref(1);
const pageSize = ref(10);
const totalItems = ref(0);
const loading = ref(false);
const filterStatus = ref('all');

const dialogVisible = ref(false);
const replyContent = ref('');
const selectedFeedbackId = ref(null);
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

        if (response?.feedback) {
            feedbackList.value = response.feedback;
            totalItems.value = response.totalItems;
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
            await submitFeedbackReplyAPI(selectedFeedbackId.value, replyContent.value);

            ElMessage.success("回复成功");
            dialogVisible.value = false;

            const target = feedbackList.value.find(f => f.id === selectedFeedbackId.value);
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
    selectedFeedbackId.value = null;
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
    selectedFeedbackId.value = feedback.id;
    replyContent.value = feedback.reply || '';
    dialogVisible.value = true;
};

onMounted(fetchFeedback);
</script>

<template>
    <div class="feedback-container">
        <el-card class="feedback-card">
            <template #header>
                <div class="feedback-header">
                    <div class="filter-container">
                        <el-select v-model="filterStatus" @change="handleStatusChange" placeholder="筛选状态"
                            style="width: 120px; margin-right: 15px;">
                            <el-option v-for="item in statusOptions" :key="item.value" :label="item.label"
                                :value="item.value" />
                        </el-select>
                        <span class="header-title">用户反馈列表</span>
                    </div>
                </div>
            </template>

            <el-table :data="feedbackList" v-loading="loading" stripe style="width: 100%"
                :header-cell-style="{ background: '#f5f7fa', textAlign: 'left' }">
                <el-table-column prop="id" label="ID" width="80" />
                <el-table-column prop="email" label="邮箱" width="180" />
                <el-table-column prop="phone" label="电话" width="120" />
                <el-table-column prop="userId" label="用户ID" width="100" />
                <el-table-column prop="content" label="反馈内容" min-width="100" />
                <el-table-column prop="status" label="状态" width="100">
                    <template #default="{ row }">
                        <el-tag :type="statusTagType[row.status]" effect="plain">
                            {{ row.status === 'PENDING' ? '待处理' : '已回复' }}
                        </el-tag>
                    </template>
                </el-table-column>
                <el-table-column prop="reply" label="回复内容" min-width="200" />
                <el-table-column prop="createAt" label="创建时间" width="180">
                    <template #default="{ row }">
                        {{ row.createAt ? new Date(row.createAt).toLocaleString() : '-' }}
                    </template>
                </el-table-column>
                <el-table-column prop="replyAt" label="更新时间" width="180">
                    <template #default="{ row }">
                        {{ row.replyAt ? new Date(row.replyAt).toLocaleString() : '-' }}
                    </template>
                </el-table-column>
                <el-table-column label="操作" width="120" align="center">
                    <template #default="{ row }">
                        <el-button v-if="row.status === 'PENDING'" type="primary" size="small"
                            @click="openReplyDialog(row)">
                            回复
                        </el-button>
                        <span v-else>-</span>
                    </template>
                </el-table-column>
            </el-table>

            <el-dialog v-model="dialogVisible" title="回复用户反馈" width="500px" @closed="resetForm">
                <el-form :model="{ reply: replyContent }" :rules="replyRules" ref="formRef">
                    <el-form-item label="回复内容" prop="reply">
                        <el-input v-model="replyContent" type="textarea" :rows="4" placeholder="请输入回复内容" maxlength="500"
                            show-word-limit />
                    </el-form-item>
                </el-form>

                <template #footer>
                    <el-button @click="dialogVisible = false">取消</el-button>
                    <el-button type="primary" @click="submitReply">确认回复</el-button>
                </template>
            </el-dialog>

            <div class="pagination-container">
                <el-pagination :current-page="currentPage" :page-size="pageSize" :total="totalItems"
                    :page-sizes="[1, 5, 10, 20, 50]" :pager-count="3" layout="total, sizes, prev, pager, next, jumper"
                    @current-change="handlePageChange" @size-change="handlePageSizeChange" />
            </div>
        </el-card>
    </div>
</template>

<style scoped>
.feedback-container {
    padding: 20px;
}

.feedback-card {
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

:deep(.el-table__row) .el-button {
    padding: 5px 10px;
}

:deep(.el-dialog__body) {
    padding: 20px 25px;
}
</style>