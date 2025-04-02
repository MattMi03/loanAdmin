<script setup>
import { ref, onMounted } from 'vue';
import axios from 'axios';
import { ElMessage, ElTag, ElDialog, ElDescriptions, ElDescriptionsItem } from 'element-plus';
import { fetchApplicationAPI, auditApplicationAPI, loanApplicationAPI, getRepaymentPlanAPI } from '@/api/adminApi';

const applications = ref([]);
const currentPage = ref(1);
const pageSize = ref(5);
const totalItems = ref(0);
const loading = ref(false);
const filterStatus = ref('all');
const dialogVisible = ref(false);
const selectedApplication = ref(null);
const auditDialogVisible = ref(false);
const currentApplyId = ref(null);
const auditAction = ref('');
const comment = ref('');
const loanDialogVisible = ref(false);
const loanAmount = ref(0);
const currentApplication = ref(null);
const loanAmountError = ref('');
const repaymentDialogVisible = ref(false);
const repaymentPlan = ref(null);
const repaymentLoading = ref(false);

const statusMap = {
    PENDING: { label: '待审批', type: 'warning' },
    APPROVED: { label: '待放款', type: 'success' },
    REJECTED: { label: '已拒绝', type: 'danger' },
    CANCELLED: { label: '已取消', type: 'info' },
    DISBURSED: { label: '已放款', type: 'primary' },
    SETTLED: { label: '已结清', type: 'success' }
};

// 获取申请列表
const fetchApplications = async () => {
    loading.value = true;
    try {
        const response = await fetchApplicationAPI(currentPage.value, pageSize.value, filterStatus.value);

        if (response?.loanApplications) {
            applications.value = response.loanApplications.map(app => {
                const { minAmount, maxAmount } = app.product;
                return {
                    ...app,
                    product: {
                        ...app.product,
                        minAmount: Number(minAmount) / 100,
                        maxAmount: Number(maxAmount) / 100
                    },
                    amount: Number(app.amount) / 100,
                    createTime: formatDate(app.createTime),
                    updateTime: formatDate(app.updateTime)
                };
            });
            totalItems.value = response.totalItems;
        }
    } catch (error) {
        ElMessage.error('获取申请失败: ' + (error.response?.msg || error.message));
    } finally {
        loading.value = false;
    }
};

const handleAudit = async () => {
    try {
        const statusCode = auditAction.value === 'approve' ? 1 : 2;

        await auditApplicationAPI(currentApplyId.value, statusCode, comment.value);

        ElMessage.success(`操作成功：${auditAction.value === 'approve' ? '通过' : '拒绝'}`);

        const target = applications.value.find(app => app.id === currentApplyId.value);
        if (target) {
            target.status = auditAction.value === 'approve' ? 'APPROVED' : 'REJECTED';
            target.updateTime = new Date().toLocaleString();
        }

        auditDialogVisible.value = false;
        comment.value = '';
    } catch (error) {
        ElMessage.error(`操作失败: ${error.response?.data?.msg || error.message}`);
    }
};

const handleLoan = async () => {
    try {
        loanAmountError.value = '';

        const amount = Number(loanAmount.value);
        const maxAmount = currentApplication.value?.amount || 0;

        if (isNaN(amount)) {
            loanAmountError.value = '请输入有效的数字';
            return;
        }
        if (amount <= 0) {
            loanAmountError.value = '金额必须大于0';
            return;
        }
        if (amount > maxAmount) {
            loanAmountError.value = `金额不可超过￥${maxAmount.toLocaleString()}`;
            return;
        }

        await loanApplicationAPI(
            currentApplication.value.id,
            Number(loanAmount.value * 100)
        );

        ElMessage.success(`成功放款￥${loanAmount.value.toLocaleString()}`);

        const target = applications.value.find(a => a.id === currentApplication.value.id);
        if (target) {
            target.status = 'DISBURSED';
            target.amount = loanAmount.value;
            target.updateTime = new Date().toLocaleString();
        }

        loanDialogVisible.value = false;
    } catch (error) {
        ElMessage.error(`放款失败: ${error.response?.data?.msg || error.message}`);
    }
};

const showRepaymentPlan = async (loanId) => {
    repaymentLoading.value = true;
    try {
        const response = await getRepaymentPlanAPI(loanId);
        repaymentPlan.value = {
            ...response,
            amount: response.amount / 100,
            monthlyPayment: response.monthlyPayment / 100,
            recentAmount: response.recentAmount / 100,
            remainingAmount: response.remainingAmount / 100,
            dueDate: formatDate(response.dueDate),
            recentDate: formatDate(response.recentDate),
            createTime: formatDate(response.createTime),
            updateTime: formatDate(response.updateTime)
        };
        repaymentDialogVisible.value = true;
    } catch (error) {
        ElMessage.error('获取还款计划失败: ' + (error.response?.msg || error.message));
    } finally {
        repaymentLoading.value = false;
    }
};

const openAuditDialog = (id, action) => {
    currentApplyId.value = id;
    auditAction.value = action;
    auditDialogVisible.value = true;
};

const openDisburseDialog = (app) => {
    currentApplication.value = app;
    loanAmount.value = app.amount;
    loanDialogVisible.value = true;
};

const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
};

const showDetail = (app) => {
    selectedApplication.value = {
        ...app,
        user: filterUserInfo(app.user),
        product: app.product
    };
    dialogVisible.value = true;
};

const filterUserInfo = (user) => {
    const { password, idNum, ...safeInfo } = user;
    return safeInfo;
};

const handlePageChange = (page) => {
    currentPage.value = page;
    fetchApplications();
};

const handlePageSizeChange = (size) => {
    pageSize.value = size;
    currentPage.value = 1;
    fetchApplications();
};

const handleStatusChange = () => {
    currentPage.value = 1;
    fetchApplications();
};

onMounted(fetchApplications);
</script>

<template>
    <div class="container">
        <div class="filter-box">
            <el-select v-model="filterStatus" @change="handleStatusChange" placeholder="选择状态" style="width: 150px;">
                <el-option v-for="item in [
                    { value: 'all', label: '全部状态' },
                    ...Object.keys(statusMap).map(k => ({ value: k, label: statusMap[k].label }))
                ]" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>
        </div>

        <el-table :data="applications" v-loading="loading" style="width: 100%" stripe>
            <el-table-column prop="id" label="申请ID" />
            <el-table-column label="用户名">
                <template #default="{ row }">
                    {{ row.user.username }}
                </template>
            </el-table-column>
            <el-table-column label="金额">
                <template #default="{ row }">
                    ￥{{ row.amount.toFixed(2).toLocaleString() }}
                </template>
            </el-table-column>
            <el-table-column label="期限">
                <template #default="{ row }">
                    {{ row.term }}个月
                </template>
            </el-table-column>
            <el-table-column label="利率">
                <template #default="{ row }">
                    {{ (row.interestRate * 100).toFixed(2) }}%
                </template>
            </el-table-column>
            <el-table-column label="状态">
                <template #default="{ row }">
                    <el-tag :type="statusMap[row.status].type">
                        {{ statusMap[row.status].label }}
                    </el-tag>
                </template>
            </el-table-column>
            <el-table-column prop="createTime" label="创建时间">
                <template #default="{ row }">
                    {{ new Date(row.createTime).toLocaleString() }}
                </template>
            </el-table-column>
            <el-table-column prop="updateTime" label="更新时间">
                <template #default="{ row }">
                    {{ new Date(row.updateTime).toLocaleString() }}
                </template>
            </el-table-column>
            <el-table-column label="查看详情">
                <template #default="{ row }">
                    <el-button type="primary" size="small" @click="showDetail(row)">
                        详情
                    </el-button>
                </template>
            </el-table-column>
            <el-table-column label="操作" width="180">
                <template #default="{ row }">
                    <div class="action-buttons">
                        <el-button v-if="row.status === 'PENDING'" type="success" size="small"
                            @click="openAuditDialog(row.id, 'approve')">
                            通过
                        </el-button>
                        <el-button v-if="row.status === 'PENDING'" type="danger" size="small"
                            @click="openAuditDialog(row.id, 'reject')">
                            拒绝
                        </el-button>
                        <el-button v-if="row.status === 'APPROVED'" type="info" size="small"
                            @click="openDisburseDialog(row)">
                            放款
                        </el-button>
                        <el-button v-if="row.status === 'DISBURSED'" type="primary" size="small"
                            @click="showRepaymentPlan(row.id)">
                            还款计划
                        </el-button>
                    </div>
                </template>
            </el-table-column>
        </el-table>

        <div class="pagination-container">
            <el-pagination :current-page="currentPage" :page-size="pageSize" :total="totalItems"
                :page-sizes="[1, 5, 10, 20, 50]" :pager-count="3" layout="total, sizes, prev, pager, next, jumper"
                @current-change="handlePageChange" @size-change="handlePageSizeChange" />
        </div>

        <!-- 申请详情对话框 -->
        <el-dialog v-model="dialogVisible" title="贷款申请详情" width="800px">
            <el-descriptions :column="2" border v-if="selectedApplication">
                <el-descriptions-item label="用户信息" :span="2">
                    <div class="detail-section">
                        <div>用户名: {{ selectedApplication.user.username }}</div>
                        <div>手机: {{ selectedApplication.user.phone }}</div>
                        <div>邮箱: {{ selectedApplication.user.email }}</div>
                        <div>认证状态: {{ selectedApplication.user.verified ? '已认证' : '未认证' }}</div>
                    </div>
                </el-descriptions-item>

                <el-descriptions-item label="贷款产品" :span="2">
                    <div class="detail-section">
                        <div>产品名称: {{ selectedApplication.product.name }}</div>
                        <div>金额范围: ￥{{ selectedApplication.product.minAmount.toFixed(2).toLocaleString() }} -
                            ￥{{ selectedApplication.product.maxAmount.toFixed(2).toLocaleString() }}</div>
                        <div>期限范围: {{ selectedApplication.product.minTerm }} -
                            {{ selectedApplication.product.maxTerm }}个月</div>
                        <div>利率范围: {{ (selectedApplication.product.minRate * 100).toFixed(2) }}% -
                            {{ (selectedApplication.product.maxRate * 100).toFixed(2) }}%</div>
                    </div>
                </el-descriptions-item>

                <el-descriptions-item label="申请详情" :span="2">
                    <div class="detail-section">
                        <div>申请金额: ￥{{ selectedApplication.amount.toFixed(2).toLocaleString() }}</div>
                        <div>贷款期限: {{ selectedApplication.term }}个月</div>
                        <div>适用利率: {{ (selectedApplication.interestRate * 100).toFixed(2) }}%</div>
                        <div>申请时间: {{ selectedApplication.createTime }}</div>
                        <div>最后更新: {{ selectedApplication.updateTime }}</div>
                    </div>
                </el-descriptions-item>
            </el-descriptions>
        </el-dialog>

        <!-- 审批对话框 -->
        <el-dialog v-model="auditDialogVisible" :title="`贷款申请${auditAction === 'approve' ? '通过' : '拒绝'}`" width="500px">
            <el-form>
                <el-form-item label="审批备注" v-if="auditAction === 'reject'">
                    <el-input v-model="comment" type="textarea" :rows="3" placeholder="请输入拒绝原因" />
                </el-form-item>
                <div v-else style="color: #666; margin-bottom: 20px;">
                    确认要通过此贷款申请吗？
                </div>
            </el-form>

            <template #footer>
                <el-button @click="auditDialogVisible = false">取消</el-button>
                <el-button type="primary" @click="handleAudit" :disabled="auditAction === 'reject' && !comment">
                    确认{{ auditAction === 'approve' ? '通过' : '拒绝' }}
                </el-button>
            </template>
        </el-dialog>


        <!-- 放款对话框 -->
        <el-dialog v-model="loanDialogVisible" title="放款操作" width="500px" :close-on-click-modal="false">
            <el-form label-width="100px">
                <el-form-item label="申请金额">
                    <el-input :value="currentApplication?.amount.toFixed(2).toLocaleString()" disabled
                        style="width: 200px">
                        <template #append>元</template>
                    </el-input>
                </el-form-item>

                <el-form-item label="放款金额" required :class="{ 'has-error': loanAmountError }">
                    <el-input-number v-model="loanAmount" :min="0.01" :precision="2" controls-position="right"
                        style="width: 200px" placeholder="输入放款金额" @input="loanAmountError = ''"
                        :class="{ 'shake-animation': loanAmountError }" />
                    <div v-if="loanAmountError" class="error-message">
                        {{ loanAmountError }}
                    </div>
                </el-form-item>
            </el-form>

            <template #footer>
                <el-button @click="loanDialogVisible = false">取消</el-button>
                <el-button type="primary" @click="handleLoan">
                    确认放款
                </el-button>
            </template>
        </el-dialog>

        <!-- 还款计划详情 -->
        <el-dialog v-model="repaymentDialogVisible" title="还款计划详情" width="800px" :close-on-click-modal="false">
            <el-skeleton :loading="repaymentLoading" animated>
                <template #template>
                    <el-skeleton-item variant="text" style="width: 30%" />
                    <el-skeleton-item variant="text" />
                    <el-skeleton-item variant="text" style="width: 50%" />
                </template>

                <template #default>
                    <el-descriptions v-if="repaymentPlan" :column="2" border>
                        <el-descriptions-item label="应还总额" span="2">
                            ￥{{ repaymentPlan.amount.toFixed(2).toLocaleString() }}
                        </el-descriptions-item>

                        <el-descriptions-item label="每月应还">
                            ￥{{ repaymentPlan.monthlyPayment.toFixed(2) }}
                        </el-descriptions-item>

                        <el-descriptions-item label="利率">
                            {{ (repaymentPlan.rate * 100).toFixed(2) }}%
                        </el-descriptions-item>

                        <el-descriptions-item label="最近还款日">
                            {{ repaymentPlan.recentDate }}
                        </el-descriptions-item>

                        <el-descriptions-item label="最近应还款">
                            ￥{{ repaymentPlan.recentAmount.toFixed(2) }}
                        </el-descriptions-item>

                        <el-descriptions-item label="最终到期日">
                            {{ repaymentPlan.dueDate }}
                        </el-descriptions-item>

                        <el-descriptions-item label="剩余金额">
                            ￥{{ repaymentPlan.remainingAmount.toFixed(2) }}
                        </el-descriptions-item>

                        <el-descriptions-item label="自动扣款">
                            <el-tag :type="repaymentPlan.autoRepayment ? 'success' : 'info'">
                                {{ repaymentPlan.autoRepayment ? '已开启' : '未开启' }}
                            </el-tag>
                        </el-descriptions-item>

                        <el-descriptions-item label="状态" span="2">
                            <el-tag :type="repaymentPlan.status === 'PENDING' ? 'warning' : 'success'">
                                {{ repaymentPlan.status === 'PENDING' ? '待还款' : '已结清' }}
                            </el-tag>
                        </el-descriptions-item>

                        <el-descriptions-item label="创建时间">
                            {{ repaymentPlan.createTime }}
                        </el-descriptions-item>

                        <el-descriptions-item label="最后更新">
                            {{ repaymentPlan.updateTime }}
                        </el-descriptions-item>
                    </el-descriptions>
                </template>
            </el-skeleton>
        </el-dialog>
    </div>
</template>

<style scoped>
.container {
    padding: 20px;
    background: #fff;
    border-radius: 4px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, .1);
}

.filter-box {
    margin-bottom: 20px;
}

.pagination-container {
    margin-top: 20px;
    display: flex;
    justify-content: flex-end;
}

.detail-section {
    line-height: 1.8;
    padding: 10px;
}

.detail-section div {
    padding: 4px 0;
}

/* 样式优化 */
.shake-animation {
    animation: shake 0.5s cubic-bezier(.36, .07, .19, .97) both;
    border-color: #ff4d4f;
}

@keyframes shake {

    10%,
    90% {
        transform: translateX(-2px);
    }

    20%,
    80% {
        transform: translateX(3px);
    }

    30%,
    50%,
    70% {
        transform: translateX(-5px);
    }

    40%,
    60% {
        transform: translateX(5px);
    }
}

.error-message {
    color: #ff4d4f;
    font-size: 12px;
    margin-top: 4px;
}

:deep(.has-error .el-input-number) {
    --el-input-border-color: #ff4d4f;
}

:deep(.has-error .el-input-number:focus-within) {
    --el-input-border-color: #ff4d4f;
    --el-input-focus-border-color: #ff7875;
}

:deep(.el-descriptions__body) {
    background: #f8f9fa;
}

:deep(.el-descriptions__header) {
    margin-bottom: 10px;
}

.repayment-status {
    margin: 15px 0;
    padding: 10px;
    background: #f8f9fa;
    border-radius: 4px;

    &-title {
        font-weight: 500;
        margin-bottom: 8px;
    }

    &-detail {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 10px;

        &-item {
            display: flex;
            justify-content: space-between;
            padding: 6px 0;

            &-label {
                color: #666;
            }

            &-value {
                font-weight: 500;
            }
        }
    }
}
</style>