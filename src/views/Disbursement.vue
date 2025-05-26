<script setup>
import { ref, onMounted } from "vue";
import { ElMessage } from "element-plus";
import { fetchDisbursementAPI, downloadContractAPI, getRepaymentPlanAPI, getRepaymentHistoryAPI, fetchDisbursementByApplyIdAPI } from "../api/adminApi";
import { useRoute } from 'vue-router';

const route = useRoute();
const applyIdFromRoute = route.query.applyId;
const storedApplyId = localStorage.getItem('applyId');
const applyId = ref(storedApplyId === 'CLEAR' ? '' : storedApplyId || applyIdFromRoute || '');

const disbursementList = ref([]);
const currentPage = ref(1);
const pageSize = ref(5);
const totalItems = ref(0);
const loading = ref(false);
const repaymentPlan = ref(null);
const repaymentDialogVisible = ref(false);
const repaymentLoading = ref(false);
const repaymentHistory = ref([]);
const repaymentHistoryDialogVisible = ref(false);
const sleectDisbursement = ref(null);
const disbursementDetailDialogVisible = ref(false);

const fetchDisbursement = async () => {
    loading.value = true;
    try {
        let response;
        if (applyId.value) {
            response = await fetchDisbursementByApplyIdAPI(applyId.value);
            const item = response?.loanDisbursement;
            if (item) item.amount = item.amount;
            disbursementList.value = [item];
        } else {
            response = await fetchDisbursementAPI(currentPage.value, pageSize.value);
            disbursementList.value = (response?.loanDisbursements || []).map(item => {
                return {
                    ...item,
                    amount: item.amount,
                };
            });
        }

        totalItems.value = response?.totalItems || 0;
    } catch (error) {
        ElMessage.error("获取放款记录失败: " + (error.response?.data?.msg || error.message));
    } finally {
        loading.value = false;
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

const showRepaymentPlan = async (loanId) => {
    repaymentLoading.value = true;
    try {
        const response = await getRepaymentPlanAPI(loanId);
        repaymentPlan.value = {
            ...response,
            amount: response.amount,
            monthlyPayment: response.monthlyPayment,
            recentAmount: response.recentAmount,
            remainingAmount: response.remainingAmount,
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

const showRepaymentHistory = async (loanId) => {
    try {
        const response = await getRepaymentHistoryAPI(loanId);
        repaymentHistory.value = response?.repayHistory || [];
        repaymentHistory.value.forEach(item => {
            item.amount = item.amount;
            item.createTime = formatDate(item.createTime);
            item.updateTime = formatDate(item.updateTime);
        });
        repaymentHistoryDialogVisible.value = true;
    } catch (error) {
        ElMessage.error('获取还款历史失败: ' + (error.response?.msg || error.message));
    }
}

const showDetail = (app) => {
    sleectDisbursement.value = app;
    console.log(app);
    disbursementDetailDialogVisible.value = true;
};


const handlePageChange = (page) => {
    currentPage.value = page;
    fetchDisbursement();
};

const handlePageSizeChange = (size) => {
    pageSize.value = size;
    currentPage.value = 1;
    fetchDisbursement();
};

const handleApplyIdInputChange = () => {
    if (applyId.value) {
        localStorage.setItem('applyId', applyId.value);
    } else {
        localStorage.setItem('applyId', 'CLEAR');
    }
    fetchDisbursement();
};

const clearApplyId = () => {
    applyId.value = '';
    localStorage.setItem('applyId', 'CLEAR');
    fetchDisbursement();
}

const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
};

onMounted(() => {
    fetchDisbursement();
});
</script>

<template>
    <div class="disbursement-management-container">
        <el-card class="management-card">
            <template #header>
                <div class="card-header">
                    <h2 class="management-title">还款管理</h2>
                    <div class="header-actions">
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
                <el-table :data="disbursementList" v-loading="loading" style="width: 100%" :header-cell-style="{
                    background: '#f8fafc',
                    color: '#64748b',
                    textAlign: 'center'
                }" :cell-style="{ padding: '12px 0', textAlign: 'center' }">
                    <el-table-column label="放款编号" prop="id" width="100" />

                    <el-table-column label="客户姓名" prop="loanApplication.user.name" />

                    <el-table-column label="贷款申请ID" prop="loanApplication.id" width="150">
                        <template #default="{ row }">{{ row.loanApplication.id }}</template>
                    </el-table-column>
                    <el-table-column label="放款金额" prop="amount">
                        <template #default="{ row }">{{ row.amount.toFixed(2).toLocaleString() }} 元</template>
                    </el-table-column>

                    <el-table-column label="放款时间">
                        <template #default="{ row }">{{ new Date(row.createTime).toLocaleString() }}</template>
                    </el-table-column>

                    <el-table-column label="合同" width="100">
                        <template #default="{ row }">
                            <el-button type="primary" size="small" @click="downloadContract(row.loanApplication.id)"
                                class="contract-button">
                                下载合同
                            </el-button>
                        </template>
                    </el-table-column>

                    <el-table-column label="查看详情" header-align="center">
                        <template #default="{ row }">
                            <el-button type="primary" size="small" @click="showDetail(row)" class="detail-button">
                                详情
                            </el-button>
                        </template>
                    </el-table-column>

                    <el-table-column label="操作">
                        <template #default="{ row }">
                            <el-button type="primary" size="small" @click="showRepaymentPlan(row.loanApplication.id)"
                                class="plan-button">
                                还款计划
                            </el-button>
                            <el-button type="primary" size="small" @click="showRepaymentHistory(row.loanApplication.id)"
                                class="history-button">
                                还款历史
                            </el-button>
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
                            ￥{{ repaymentPlan.recentAmount.toFixed(2).toLocaleString() }}
                        </el-descriptions-item>

                        <el-descriptions-item label="最终到期日">
                            {{ repaymentPlan.dueDate }}
                        </el-descriptions-item>

                        <el-descriptions-item label="剩余金额">
                            ￥{{ repaymentPlan.remainingAmount.toFixed(2).toLocaleString() }}
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

        <el-dialog title="还款记录" v-model="repaymentHistoryDialogVisible" width="600px" class="repayment-history-dialog">
            <div style="max-height: 400px; overflow-y: auto;">
                <el-table :data="repaymentHistory" style="width: 100%">
                    <el-table-column prop="createTime" label="创建时间" />
                    <el-table-column prop="amount" label="还款金额" >
                        <template #default="{ row }">
                            ￥{{ row.amount.toFixed(2).toLocaleString() }}
                        </template>
                    </el-table-column>
                    <el-table-column prop="method" label="还款方式" />
                    <el-table-column label="状态">
                        <template #default="{ row }">
                            <el-tag :type="row.status === 'PENDING' ? 'warning' : 'success'">
                                {{ row.status === 'PENDING' ? '待还款' : '已结清' }}
                            </el-tag>
                        </template>
                    </el-table-column>
                </el-table>
            </div>

            <template #footer>
                <span class="dialog-footer">
                    <el-button @click="repaymentHistoryDialogVisible = false">关闭</el-button>
                </span>
            </template>
        </el-dialog>

        <el-dialog title="放款详情" v-model="disbursementDetailDialogVisible" width="700px"
            class="disbursement-detail-dialog">
            <template #title>
                <h3>放款详情</h3>
            </template>

            <!-- 放款信息 -->
            <el-descriptions title="放款信息" :column="2" border v-if="sleectDisbursement">
                <el-descriptions-item label="放款编号">
                    {{ sleectDisbursement.id }}
                </el-descriptions-item>

                <el-descriptions-item label="放款金额">
                    ￥{{ sleectDisbursement.amount?.toFixed(2).toLocaleString() || '—' }}
                </el-descriptions-item>

                <el-descriptions-item label="放款时间">
                    {{ new Date(sleectDisbursement.createTime).toLocaleString() }}
                </el-descriptions-item>
            </el-descriptions>

            <!-- 贷款申请信息 -->
            <el-descriptions title="贷款申请信息" :column="2" border v-if="sleectDisbursement.loanApplication">
                <el-descriptions-item label="贷款申请ID">
                    {{ sleectDisbursement.loanApplication.id }}
                </el-descriptions-item>

                <el-descriptions-item label="贷款产品">
                    {{ sleectDisbursement.loanApplication.product?.name || '—' }}
                </el-descriptions-item>

                <el-descriptions-item label="申请金额">
                    ￥{{ sleectDisbursement.loanApplication.amount?.toFixed(2).toLocaleString() || '—' }}
                </el-descriptions-item>

                <el-descriptions-item label="贷款期限">
                    {{ sleectDisbursement.loanApplication.term }} 期
                </el-descriptions-item>

                <el-descriptions-item label="年利率">
                    {{ (sleectDisbursement.loanApplication.interestRate * 100).toFixed(2) }}%
                </el-descriptions-item>

                <el-descriptions-item label="风险评分">
                    {{ sleectDisbursement.loanApplication.riskScore }}
                </el-descriptions-item>

                <el-descriptions-item label="申请状态">
                    {{ sleectDisbursement.loanApplication.status }}
                </el-descriptions-item>

                <el-descriptions-item label="申请时间">
                    {{ new Date(sleectDisbursement.loanApplication.createTime).toLocaleString() }}
                </el-descriptions-item>
            </el-descriptions>

            <!-- 用户信息 -->
            <el-descriptions title="客户信息" :column="2" border v-if="sleectDisbursement.loanApplication.user">
                <el-descriptions-item label="姓名">
                    {{ sleectDisbursement.loanApplication.user.name }}
                </el-descriptions-item>

                <el-descriptions-item label="手机号">
                    {{ sleectDisbursement.loanApplication.user.phone }}
                </el-descriptions-item>

                <el-descriptions-item label="邮箱">
                    {{ sleectDisbursement.loanApplication.user.email }}
                </el-descriptions-item>

                <el-descriptions-item label="实名认证">
                    {{ sleectDisbursement.loanApplication.user.verified ? '是' : '否' }}
                </el-descriptions-item>

                <el-descriptions-item label="邮箱验证">
                    {{ sleectDisbursement.loanApplication.user.emailVerified ? '是' : '否' }}
                </el-descriptions-item>

                <el-descriptions-item label="注册时间">
                    {{ new Date(sleectDisbursement.loanApplication.user.createTime).toLocaleString() }}
                </el-descriptions-item>
            </el-descriptions>

            <template #footer>
                <span class="dialog-footer">
                    <el-button @click="disbursementDetailDialogVisible = false">关闭</el-button>
                </span>
            </template>
        </el-dialog>
    </div>
</template>

<style scoped>
.disbursement-management-container {
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


.table-container {
    padding: 0 20px;
    height: calc(100vh - 450px);
    /* 固定高度，根据实际布局调整 */
    display: flex;
    flex-direction: column;
}

.contract-button {
    background: linear-gradient(135deg, #4facfe 0%, #285261 100%);
    border: none;
    border-radius: 8px;
}

.contract-button:hover {
    background-image: linear-gradient(to right, #fbc2eb, #a6c1ee);
}

.detail-button {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border: none;
    border-radius: 8px;
}

.plan-button {
    background: linear-gradient(135deg, #086bc8 0%, #22bc96 100%);
    border: none;
    border-radius: 8px;
}

.plan-button:hover {
    background-image: linear-gradient(to right, #11998e, #38ef7d);
}

.history-button {
    background-image: linear-gradient(to right, #667eea, #ae88d5);
    border: none;
    border-radius: 8px;
}

.history-button:hover {
    background-image: linear-gradient(to right, #89f7fe, #66a6ff);
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
</style>