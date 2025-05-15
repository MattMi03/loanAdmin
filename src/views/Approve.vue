<script setup>
import { watch, ref, onMounted, onBeforeUnmount } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage, ElTag, ElDialog, ElDescriptions, ElDescriptionsItem } from 'element-plus';
import { fetchApplicationAPI, auditApplicationAPI, loanApplicationAPI, getRepaymentPlanAPI, fetchApplicationByUserIdAPI, fetchApplicationByIdAPI, downloadContractAPI, getAuitByApplyIdAPI } from '@/api/adminApi';

const router = useRouter();
const route = useRoute();
const userIdFromRoute = route.query.userId;
const storedUserId = localStorage.getItem('userId');
const userId = ref(storedUserId === 'CLEAR' ? '' : storedUserId || userIdFromRoute || '');

const applyIdFromRoute = route.query.applyId;
const storedApplyId = localStorage.getItem('applyId');
const applyId = ref(storedApplyId === 'CLEAR' ? '' : storedApplyId || applyIdFromRoute || '');

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

const fetchApplications = async () => {
    loading.value = true;
    try {
        let response;

        if (applyId.value) {
            response = await fetchApplicationByIdAPI(applyId.value);
        } else if (userId.value) {
            response = await fetchApplicationByUserIdAPI(userId.value, currentPage.value, pageSize.value, filterStatus.value);
        } else {
            response = await fetchApplicationAPI(currentPage.value, pageSize.value, filterStatus.value);
        }

        const { loanApplications, users, product, pagination } = response.data || {};

        if (loanApplications && users && product) {
            const userMap = users;
            const productMap = product;

            applications.value = loanApplications.map(app => {
                const user = userMap[app.user_id] || {};
                const product = productMap[app.product_id] || {};

                return {
                    ...app,
                    amount: Number(app.amount) / 100,
                    createTime: formatDate(app.createTime),
                    updateTime: formatDate(app.updateTime),
                    interestRate: Number(app.interestRate),
                    user,
                    product: {
                        ...product,
                        minAmount: Number(product.minAmount) / 100,
                        maxAmount: Number(product.maxAmount) / 100,
                        minRate: Number(product.minRate),
                        maxRate: Number(product.maxRate)
                    }
                };
            });

            totalItems.value = pagination?.total_count || 0;
        }
    } catch (error) {
        ElMessage.error('获取申请失败: ' + (error.response?.msg || error.message));
    } finally {
        loading.value = false;
    }
};

const handleAudit = async () => {
    try {
        const statusCode = auditAction.value === 'approve' ? 1 : 0;

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

const downloadContract = async (applyId) => {
    try {
        const fileData = await downloadContractAPI(applyId)
        const blob = new Blob([fileData], { type: 'application/pdf' })

        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.setAttribute('download', `loan_contract_${applyId}.pdf`)
        document.body.appendChild(link)
        link.click()

        document.body.removeChild(link)
        window.URL.revokeObjectURL(url)
    } catch (error) {
        ElMessage.error('下载合同失败: ' + (error.response?.msg || error.message));
    }
}

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
    getAuitByApplyIdAPI(app.id).then(res => {
        const record = res.loanApproval;
        const auditRecords = record ? [{
            ...record,
            amount: record.amount / 100,
            approvalTime: formatDate(record.approvalTime)
        }] : [];

        selectedApplication.value = {
            ...app,
            auditRecords
        };
    }).catch(error => {
        console.error('获取审批记录失败: ' + (error.response?.msg || error.message));
    });
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

const clearUserId = () => {
    userId.value = '';
    localStorage.setItem('userId', 'CLEAR');
    fetchApplications();
};

const handleUserIdInputChange = () => {

    if (userId.value) {
        localStorage.setItem('userId', userId.value);
    } else {
        localStorage.setItem('userId', 'CLEAR');
    }
    fetchApplications();
};

const clearApplyId = () => {
    applyId.value = '';
    localStorage.setItem('applyId', 'CLEAR');
    fetchApplications();
};

const handleApplyIdInputChange = () => {
    if (applyId.value) {
        localStorage.setItem('applyId', applyId.value);
    } else {
        localStorage.setItem('applyId', 'CLEAR');
    }
    fetchApplications();
};

const goToDisbursement = (applyId) => {
    router.push({
        path: '/manager/disbursement',
        query: { applyId: applyId }
    });
}

onMounted(fetchApplications);

onBeforeUnmount(() => {
    localStorage.removeItem('userId');
    localStorage.removeItem('applyId');
});

watch(() => route.query.applyId, (newId) => {
    applyId.value = newId || '';
    if (newId) {
        localStorage.setItem('applyId', newId);
    } else {
        localStorage.setItem('applyId', 'CLEAR');
    }
    fetchApplications();
});
</script>

<template>
    <div class="approval-management-container">
        <el-card class="management-card">
            <template #header>
                <div class="card-header">
                    <h2 class="management-title">贷款审批</h2>
                    <div class="header-actions">
                        <el-select v-model="filterStatus" @change="handleStatusChange" placeholder="选择状态"
                            class="status-select" popper-class="status-select-dropdown">
                            <el-option v-for="item in [
                                { value: 'all', label: '全部状态' },
                                ...Object.keys(statusMap).map(k => ({ value: k, label: statusMap[k].label }))
                            ]" :key="item.value" :label="item.label" :value="item.value" />
                        </el-select>
                        <div>
                            <el-input v-model="userId" placeholder="输入用户ID" clearable @clear="clearUserId"
                                @keydown.enter="handleUserIdInputChange" class="search-input" />
                            <el-button type="primary" @click="handleUserIdInputChange" class="search-button">
                                搜索
                            </el-button>
                        </div>
                        <div>
                            <el-input v-model="applyId" placeholder="输入申请ID" clearable @clear="clearApplyId"
                                @keydown.enter="handleApplyIdInputChange" class="search-input" />
                            <el-button type="primary" @click="handleApplyIdInputChange" class="search-button">
                                搜索
                            </el-button>
                        </div>
                    </div>
                </div>
            </template>

            <div class="table-container">
                <el-table :data="applications" v-loading="loading" style="width: 100%" :header-cell-style="{
                    background: '#f8fafc',
                    color: '#64748b',
                    textAlign: 'center'
                }" :cell-style="{ padding: '12px 0' }" stripe>
                    <el-table-column prop="id" label="申请ID" width="100" header-align="center" />

                    <el-table-column label="用户名" header-align="center">
                        <template #default="{ row }">
                            <div class="user-info-cell">
                                <span class="username">{{ row.user.username }}</span>
                            </div>
                        </template>
                    </el-table-column>

                    <el-table-column label="金额" header-align="center">
                        <template #default="{ row }">
                            ￥{{ row.amount.toFixed(2).toLocaleString() }}
                        </template>
                    </el-table-column>

                    <el-table-column label="期限" header-align="center">
                        <template #default="{ row }">
                            {{ row.term }}个月
                        </template>
                    </el-table-column>

                    <el-table-column label="利率" header-align="center">
                        <template #default="{ row }">
                            {{ (row.interestRate * 100).toFixed(2) }}%
                        </template>
                    </el-table-column>

                    <el-table-column label="状态" header-align="center">
                        <template #default="{ row }">
                            <el-tag :type="statusMap[row.status].type" class="status-tag">
                                {{ statusMap[row.status].label }}
                            </el-tag>
                        </template>
                    </el-table-column>

                    <el-table-column label="查看详情" header-align="center">
                        <template #default="{ row }">
                            <el-button type="primary" size="small" @click="showDetail(row)" class="detail-button">
                                详情
                            </el-button>
                        </template>
                    </el-table-column>

                    <el-table-column label="操作" fixed="right" header-align="center">
                        <template #default="{ row }">
                            <div class="action-buttons">
                                <el-button v-if="row.status === 'PENDING'" type="success" size="small"
                                    @click="openAuditDialog(row.id, 'approve')" class="approve-button">
                                    通过
                                </el-button>
                                <el-button v-if="row.status === 'PENDING'" type="danger" size="small"
                                    @click="openAuditDialog(row.id, 'reject')" class="reject-button">
                                    拒绝
                                </el-button>
                                <el-button v-if="row.status === 'APPROVED'" type="info" size="small"
                                    @click="openDisburseDialog(row)" class="loan-button">
                                    放款
                                </el-button>
                            
                                <el-button v-if="row.status === 'DISBURSED'" type="primary" size="small"
                                    @click="goToDisbursement(row.id)" class="contract-button">
                                    查看放款
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

        <!-- 申请详情对话框 -->
        <el-dialog v-model="dialogVisible" title="贷款申请详情" width="700px" class="application-detail-dialog">
            <el-descriptions :column="2" border v-if="selectedApplication">

                <!-- 用户信息 -->
                <el-descriptions-item label="用户信息" :span="2">
                    <div class="detail-section">
                        <div><strong>用户ID：</strong>{{ selectedApplication.user_id }}</div>
                        <div><strong>用户名：</strong>{{ selectedApplication.user.username }}</div>
                        <div><strong>手机：</strong>{{ selectedApplication.user.phone }}</div>
                        <div><strong>邮箱：</strong>{{ selectedApplication.user.email }}</div>
                        <div><strong>认证状态：</strong>{{ selectedApplication.user.verified ? '已认证' : '未认证' }}</div>
                    </div>
                </el-descriptions-item>

                <!-- 贷款产品 -->
                <el-descriptions-item label="贷款产品" :span="2">
                    <div class="detail-section">
                        <div><strong>产品名称：</strong>{{ selectedApplication.product.name }}</div>
                        <div>
                            <strong>金额范围：</strong>
                            ￥{{ selectedApplication.product.minAmount.toFixed(2).toLocaleString() }} -
                            ￥{{ selectedApplication.product.maxAmount.toFixed(2).toLocaleString() }}
                        </div>
                        <div>
                            <strong>期限范围：</strong>{{ selectedApplication.product.minTerm }} -
                            {{ selectedApplication.product.maxTerm }}个月
                        </div>
                        <div>
                            <strong>利率范围：</strong>{{ (selectedApplication.product.minRate * 100).toFixed(2) }}% -
                            {{ (selectedApplication.product.maxRate * 100).toFixed(2) }}%
                        </div>
                    </div>
                </el-descriptions-item>

                <!-- 申请详情 -->
                <el-descriptions-item label="申请详情" :span="2">
                    <div class="detail-section">
                        <div><strong>风险得分：</strong>{{ selectedApplication.riskScore.toFixed(2).toLocaleString()
                            }}/100.00</div>
                        <div><strong>申请金额：</strong>￥{{ selectedApplication.amount.toFixed(2).toLocaleString() }}</div>
                        <div><strong>贷款期限：</strong>{{ selectedApplication.term }}个月</div>
                        <div><strong>适用利率：</strong>{{ (selectedApplication.interestRate * 100).toFixed(2) }}%</div>
                        <div><strong>申请时间：</strong>{{ selectedApplication.createTime }}</div>
                        <div><strong>最后更新：</strong>{{ selectedApplication.updateTime }}</div>
                    </div>
                </el-descriptions-item>

                <!-- 审批情况 -->
                <el-descriptions-item label="审批情况" :span="2">
                    <div class="detail-section">
                        <div v-if="selectedApplication?.auditRecords?.length">
                            <div v-for="(record, index) in selectedApplication.auditRecords" :key="index"
                                class="audit-record">
                                <div><strong>审批人ID：</strong>{{ record.adminId }}</div>
                                <div><strong>审批人：</strong>{{ record.adminUsername }}</div>
                                <div><strong>邮箱：</strong>{{ record.adminEmail }}</div>
                                <div>
                                    <strong>审批金额：</strong>
                                    ￥{{ record.amount.toFixed(2).toLocaleString() }}
                                </div>
                                <div>
                                    <strong>状态：</strong>
                                    <span :class="['status', record.status?.toLowerCase()]">
                                        {{ record.status === 'APPROVED' ? '审批通过' : '审批拒绝' }}
                                    </span>
                                </div>
                                <div><strong>审批时间：</strong>{{ record.approvalTime }}</div>
                                <div><strong>备注：</strong>{{ record.comment || '无' }}</div>
                                <el-divider v-if="index !== selectedApplication.auditRecords.length - 1" />
                            </div>
                        </div>
                        <div v-else style="text-align: center; padding: 20px 0; color: #999;">
                            暂无审批记录
                        </div>
                    </div>
                </el-descriptions-item>

            </el-descriptions>
        </el-dialog>

        <!-- 审批对话框 -->
        <el-dialog v-model="auditDialogVisible" :title="`贷款申请${auditAction === 'approve' ? '通过' : '拒绝'}`" width="500px"
            class="audit-dialog">
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
                <el-button type="primary" @click="handleAudit" :disabled="auditAction === 'reject' && !comment"
                    class="confirm-button">
                    确认{{ auditAction === 'approve' ? '通过' : '拒绝' }}
                </el-button>
            </template>
        </el-dialog>

        <!-- 放款对话框 -->
        <el-dialog v-model="loanDialogVisible" title="放款操作" width="500px" class="loan-dialog"
            :close-on-click-modal="false">
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
                <el-button type="primary" @click="handleLoan" class="confirm-button">
                    确认放款
                </el-button>
            </template>
        </el-dialog>

        <!-- 还款计划详情 -->
        <el-dialog v-model="repaymentDialogVisible" title="还款计划详情" width="700px" class="repayment-dialog"
            :close-on-click-modal="false">
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
:deep(.el-table .amount-column .cell) {
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
/* .user-info-cell {
    display: flex;
    align-items: center;
    justify-content: flex-start;
    padding-left: 16px;
} */

/* 金额样式 */
.amount-info {
    display: flex;
    align-items: center;
    justify-content: flex-start;
    padding-left: 16px;
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
.approval-management-container {
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
    width: 200px;
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

/* 按钮样式 */
.detail-button {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border: none;
    border-radius: 8px;
}

.approve-button {
    background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
    border: none;
    border-radius: 8px;
}

.reject-button {
    background: linear-gradient(135deg, #ff758c 0%, #ff7eb3 100%);
    border: none;
    border-radius: 8px;
}

.loan-button {
    background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
    border: none;
    border-radius: 8px;
}

.plan-button {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border: none;
    border-radius: 8px;
}

.contract-button {
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

.application-detail-dialog :deep(.el-dialog) {
    border-radius: 16px;
    overflow: hidden;
}

.application-detail-dialog :deep(.el-dialog__header) {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    margin: 0;
    padding: 20px;
}

.application-detail-dialog :deep(.el-dialog__title) {
    color: white;
}

.application-detail-dialog :deep(.el-dialog__headerbtn .el-dialog__close) {
    color: white;
}

.audit-dialog :deep(.el-dialog),
.loan-dialog :deep(.el-dialog),
.repayment-dialog :deep(.el-dialog) {
    border-radius: 16px;
    overflow: hidden;
}

.audit-dialog :deep(.el-dialog__header),
.loan-dialog :deep(.el-dialog__header),
.repayment-dialog :deep(.el-dialog__header) {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    margin: 0;
    padding: 20px;
}

.audit-dialog :deep(.el-dialog__title),
.loan-dialog :deep(.el-dialog__title),
.repayment-dialog :deep(.el-dialog__title) {
    color: white;
}

.audit-dialog :deep(.el-dialog__headerbtn .el-dialog__close),
.loan-dialog :deep(.el-dialog__headerbtn .el-dialog__close),
.repayment-dialog :deep(.el-dialog__headerbtn .el-dialog__close) {
    color: white;
}

:deep(.el-dialog__body) {
    padding: 20px 25px;
}

.detail-section {
    padding: 10px;
}

.error-message {
    color: #f56c6c;
    font-size: 12px;
    margin-top: 5px;
}

.shake-animation {
    animation: shake 0.5s;
}

@keyframes shake {

    0%,
    100% {
        transform: translateX(0);
    }

    20%,
    60% {
        transform: translateX(-5px);
    }

    40%,
    80% {
        transform: translateX(5px);
    }
}

@media (max-width: 992px) {
    .management-card {
        max-width: 100%;
    }

    .table-container {
        overflow-x: auto;
    }

    .application-detail-dialog,
    .audit-dialog,
    .loan-dialog,
    .repayment-dialog {
        width: 95% !important;
    }

    .header-actions {
        flex-direction: column;
        align-items: flex-start;
        gap: 10px;
    }

    .search-input,
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
</style>