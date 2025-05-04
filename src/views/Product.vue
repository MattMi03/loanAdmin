<script setup>
import { ref, onMounted } from "vue";
import { ElMessage, ElDialog, ElForm, ElFormItem, ElInput, ElButton, ElPagination } from "element-plus";
import { fetchProductAPI, submitProductAPI, toggleProductStatusAPI } from '@/api/adminApi';

const products = ref([]);
const currentPage = ref(1);
const pageSize = ref(5);
const totalItems = ref(0);
const loading = ref(false);
const dialogVisible = ref(false);
const formRef = ref(null);
const tableRef = ref(null);
const isEditMode = ref(false);
const currentProduct = ref(null);
const filterStatus = ref('all');
const statusOptions = [
    { value: 'all', label: '全部状态' },
    { value: 'ONLINE', label: '已上线' },
    { value: 'OFFLINE', label: '已下线' }
];

const form = ref({
    id: null,
    name: '',
    minAmount: null,
    maxAmount: null,
    minTerm: null,
    maxTerm: null,
    minRate: null,
    maxRate: null,
});

const formRules = {
    name: [{ required: true, message: '请输入产品名称', trigger: 'blur' }],
    minAmount: [{ required: true, message: '请输入最小金额', trigger: 'blur' }],
    maxAmount: [{ required: true, message: '请输入最大金额', trigger: 'blur' }],
    minTerm: [{ required: true, message: '请输入最短期限', trigger: 'blur' }],
    maxTerm: [{ required: true, message: '请输入最长期限', trigger: 'blur' }],
    minRate: [{
        required: true,
        message: '请输入最低利率',
        trigger: 'blur',
        type: 'number',
        transform: value => Number(value)
    }],
    maxRate: [{
        required: true,
        message: '请输入最高利率',
        trigger: 'blur',
        type: 'number',
        transform: value => Number(value)
    }],
};

const fetchProducts = async () => {
    loading.value = true;
    try {
        const response = await fetchProductAPI(currentPage.value, pageSize.value, filterStatus.value);

        const fieldMap = response.data.meta?.field_map;
        if (!fieldMap) {
            throw new Error("字段映射信息缺失");
        }

        const productsData = response.data.product;
        products.value = Object.entries(productsData).map(([id, product]) => ({
            id: Number(id),
            name: product[fieldMap["product_name"]],
            minAmount: product[fieldMap["amount_range.min"]] / 100,
            maxAmount: product[fieldMap["amount_range.max"]] / 100,
            minTerm: product[fieldMap["term_range.min"]],
            maxTerm: product[fieldMap["term_range.max"]],
            minRate: product[fieldMap["rate_range.min"]],
            maxRate: product[fieldMap["rate_range.max"]],
            status: product[fieldMap["product_status"]],
            createTime: product[fieldMap["created_at"]],
            updateTime: product[fieldMap["updated_at"]],
        }));

        totalItems.value = response.data.pagination.total_items;
    } catch (error) {
        ElMessage.error("获取产品列表失败: " + error.message);
    } finally {
        loading.value = false;
    }
};

const submitForm = async () => {
    formRef.value.validate(async (valid) => {
        if (!valid) return;

        const payload = {
            ...form.value,
            minAmount: Number(form.value.minAmount) * 100,
            maxAmount: Number(form.value.maxAmount) * 100,
            minTerm: Number(form.value.minTerm),
            maxTerm: Number(form.value.maxTerm),
            minRate: Number(form.value.minRate),
            maxRate: Number(form.value.maxRate)
        };

        try {
            await submitProductAPI(payload, isEditMode.value);
            ElMessage.success(`产品${isEditMode.value ? '更新' : '创建'}成功`);
            dialogVisible.value = false;
            fetchProducts();
        } catch (error) {
            ElMessage.error(`${isEditMode.value ? '更新' : '创建'}失败: ${error.message}`);
        }
    });
};

const toggleProductStatus = async (id, targetStatus) => {
    try {
        // console.log(`切换产品 ${id} 状态为 ${targetStatus}`);
        await toggleProductStatusAPI(id, targetStatus);
        ElMessage.success(`产品已${targetStatus === 'ONLINE' ? '上线' : '下线'}`);
        const product = products.value.find(p => p.id === id);
        if (product) product.status = targetStatus;
    } catch (error) {
        ElMessage.error(`状态修改失败: ${error.message}`);
    }
};

const handleStatusChange = () => {
    currentPage.value = 1;
    fetchProducts();
};

const handlePageChange = (page) => {
    currentPage.value = page;
    fetchProducts();
};

const handlePageSizeChange = (size) => {
    pageSize.value = size;
    currentPage.value = 1;
    fetchProducts();
};

const openCreateDialog = () => {
    form.value = {
        id: null,
        name: '',
        minAmount: null,
        maxAmount: null,
        minTerm: null,
        maxTerm: null,
        minRate: null,
        maxRate: null
    };
    isEditMode.value = false;
    dialogVisible.value = true;
};

const openEditDialog = async (product) => {
    try {
        loading.value = true;
        form.value = {
            id: product.id,
            name: product.name,
            minAmount: product.minAmount,
            maxAmount: product.maxAmount,
            minTerm: product.minTerm,
            maxTerm: product.maxTerm,
            minRate: product.minRate,
            maxRate: product.maxRate
        };

        isEditMode.value = true;
        dialogVisible.value = true;
    } catch (error) {
        ElMessage.error("获取产品信息失败");
    } finally {
        loading.value = false;
    }
};

onMounted(fetchProducts);
</script>

<template>
    <div class="product-container">
        <el-card class="product-card">
            <template #header>
                <div class="product-header">
                    <div class="filter-container">
                        <el-select v-model="filterStatus" @change="handleStatusChange" placeholder="选择产品状态"
                            style="width: 150px; margin-right: 15px;">
                            <el-option v-for="item in statusOptions" :key="item.value" :label="item.label"
                                :value="item.value" />
                        </el-select>
                        <span class="header-title">产品列表</span>
                    </div>
                    <el-button type="primary" @click="openCreateDialog" style="float: right;">
                        创建产品
                    </el-button>
                </div>
            </template>

            <el-table :data="products" v-loading="loading" ref="tableRef" stripe>
                <el-table-column prop="id" label="产品ID" />
                <el-table-column prop="name" label="产品名称" />
                <el-table-column label="最小金额">
                    <template #default="{ row }">
                        ¥{{ (row.minAmount).toFixed(2) }}
                    </template>
                </el-table-column>
                <el-table-column label="最大金额">
                    <template #default="{ row }">
                        ¥{{ (row.maxAmount).toFixed(2) }}
                    </template>
                </el-table-column>
                <el-table-column prop="minTerm" label="最短期限(月)" />
                <el-table-column prop="maxTerm" label="最长期限(月)" />
                <el-table-column prop="minRate" label="最低年利率" />
                <el-table-column prop="maxRate" label="最高年利率" />
                <el-table-column prop="status" label="状态">
                    <template #default="{ row }">
                        <el-tag :type="row.status === 'ONLINE' ? 'success' : 'danger'">
                            {{ row.status === 'ONLINE' ? '已上线' : '已下线' }}
                        </el-tag>
                    </template>
                </el-table-column>
                <el-table-column label="操作">
                    <template #default="{ row }">
                        <el-button type="primary" size="small" @click="openEditDialog(row)">
                            编辑
                        </el-button>
                        <el-button v-if="row.status === 'OFFLINE'" type="success" size="small"
                            @click="toggleProductStatus(row.id, 'ONLINE')">
                            上线
                        </el-button>
                        <el-button v-else type="danger" size="small" @click="toggleProductStatus(row.id, 'OFFLINE')">
                            下线
                        </el-button>
                    </template>
                </el-table-column>
            </el-table>

            <div class="pagination-container">
                <el-pagination :current-page="currentPage" :page-size="pageSize" :total="totalItems"
                    :page-sizes="[1, 5, 10, 20, 50]" :pager-count="3" layout="total, sizes, prev, pager, next, jumper"
                    @current-change="handlePageChange" @size-change="handlePageSizeChange" />
            </div>
        </el-card>

        <el-dialog v-model="dialogVisible" :title="isEditMode ? '编辑产品' : '创建新产品'" width="500px"
            @closed="formRef?.resetFields()">
            <el-form :model="form" :rules="formRules" ref="formRef" label-width="100px" status-icon>
                <el-form-item label="产品名称" prop="name">
                    <el-input v-model="form.name" placeholder="请输入产品名称" />
                </el-form-item>

                <el-form-item label="金额范围" required>
                    <el-form-item prop="minAmount" style="display: inline-block; width: 45%">
                        <el-input v-model.number="form.minAmount" placeholder="最小金额" type="number" />
                    </el-form-item>
                    <span style="display: inline-block; width: 10%; text-align: center">-</span>
                    <el-form-item prop="maxAmount" style="display: inline-block; width: 45%">
                        <el-input v-model.number="form.maxAmount" placeholder="最大金额" type="number" />
                    </el-form-item>
                </el-form-item>

                <el-form-item label="期限范围" required>
                    <el-form-item prop="minTerm" style="display: inline-block; width: 45%">
                        <el-input v-model.number="form.minTerm" placeholder="最短期限" type="number" />
                    </el-form-item>
                    <span style="display: inline-block; width: 10%; text-align: center">-</span>
                    <el-form-item prop="maxTerm" style="display: inline-block; width: 45%">
                        <el-input v-model.number="form.maxTerm" placeholder="最长期限" type="number" />
                    </el-form-item>
                </el-form-item>

                <el-form-item label="利率范围" required>
                    <el-form-item prop="minRate" style="display: inline-block; width: 45%">
                        <el-input v-model.number="form.minRate" placeholder="最低利率" type="number" step="0.01" />
                    </el-form-item>
                    <span style="display: inline-block; width: 10%; text-align: center">-</span>
                    <el-form-item prop="maxRate" style="display: inline-block; width: 45%">
                        <el-input v-model.number="form.maxRate" placeholder="最高利率" type="number" step="0.01" />
                    </el-form-item>
                </el-form-item>
            </el-form>

            <template #footer>
                <el-button @click="dialogVisible = false">取消</el-button>
                <el-button type="primary" @click="submitForm">
                    {{ isEditMode ? '确认更新' : '立即创建' }}
                </el-button>
            </template>
        </el-dialog>
    </div>
</template>

<style scoped>
.product-container {
    padding: 20px;
}

.filter-container {
    display: flex;
    align-items: center;
}

.header-title {
    font-size: 18px;
    font-weight: 600;
}

.product-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.pagination-container {
    margin-top: 20px;
    display: flex;
    justify-content: flex-end;
}

.el-table th .gutter {
    display: table-cell !important;
}


:deep(.el-dialog__body) {
    padding: 20px 25px;
}
</style>