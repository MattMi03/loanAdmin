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
  <div class="product-management-container">
    <el-card class="management-card">
      <template #header>
        <div class="card-header">
          <h2 class="management-title">产品管理</h2>
          <div class="header-actions">
            <el-select 
              v-model="filterStatus" 
              @change="handleStatusChange" 
              placeholder="选择产品状态"
              class="status-select" 
              popper-class="status-select-dropdown"
            >
              <el-option 
                v-for="item in statusOptions" 
                :key="item.value" 
                :label="item.label"
                :value="item.value" 
              />
            </el-select>
            <el-button type="primary" @click="openCreateDialog">
              创建产品
            </el-button>
          </div>
        </div>
      </template>

      <div class="table-container">
        <el-table 
          :data="products" 
          v-loading="loading" 
          ref="tableRef" 
          style="width: 100%"
          :header-cell-style="{
            background: '#f8fafc',
            color: '#64748b',
            textAlign: 'center'
          }" 
          :cell-style="{ padding: '12px 0' }"
        >
          <el-table-column prop="id" label="产品ID" width="100" header-align="center" />
          
          <el-table-column prop="name" label="产品名称" header-align="center">
            <template #default="{ row }">
              <div class="product-info-cell" style="justify-content: flex-start;">
                <span class="product-name">{{ row.name }}</span>
              </div>
            </template>
          </el-table-column>
          
          <el-table-column label="最小金额" header-align="center">
            <template #default="{ row }">
              ¥{{ (row.minAmount).toFixed(2) }}
            </template>
          </el-table-column>
          
          <el-table-column label="最大金额" header-align="center">
            <template #default="{ row }">
              ¥{{ (row.maxAmount).toFixed(2) }}
            </template>
          </el-table-column>
          
          <el-table-column prop="minTerm" label="最短期限(月)" header-align="center" />
          <el-table-column prop="maxTerm" label="最长期限(月)" header-align="center" />
          <el-table-column prop="minRate" label="最低年利率" header-align="center" />
          <el-table-column prop="maxRate" label="最高年利率" header-align="center" />
          
          <el-table-column label="状态" header-align="center">
            <template #default="{ row }">
              <el-tag :type="row.status === 'ONLINE' ? 'success' : 'danger'" class="status-tag">
                {{ row.status === 'ONLINE' ? '已上线' : '已下线' }}
              </el-tag>
            </template>
          </el-table-column>
          
          <el-table-column label="操作" fixed="right" header-align="center">
            <template #default="{ row }">
              <div class="action-buttons">
                <el-button type="primary" size="small" @click="openEditDialog(row)" class="edit-button">
                  编辑
                </el-button>
                <el-button 
                  v-if="row.status === 'OFFLINE'" 
                  type="success" 
                  size="small" 
                  @click="toggleProductStatus(row.id, 'ONLINE')"
                  class="online-button"
                >
                  上线
                </el-button>
                <el-button 
                  v-else 
                  type="danger" 
                  size="small" 
                  @click="toggleProductStatus(row.id, 'OFFLINE')"
                  class="offline-button"
                >
                  下线
                </el-button>
              </div>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <div class="pagination-container">
        <el-pagination 
          :current-page="currentPage" 
          :page-size="pageSize" 
          :total="totalItems"
          :page-sizes="[5, 10, 20, 50]" 
          layout="total, sizes, prev, pager, next, jumper"
          @current-change="handlePageChange" 
          @size-change="handlePageSizeChange" 
          class="custom-pagination" 
        />
      </div>
    </el-card>

    <el-dialog 
      v-model="dialogVisible" 
      :title="isEditMode ? '编辑产品' : '创建新产品'" 
      width="500px" 
      class="product-detail-dialog"
      @closed="formRef?.resetFields()"
    >
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
:deep(.el-table .product-name-column .cell),
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

/* 产品信息单元格样式 */
.product-info-cell {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  padding-left: 16px;
}

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
.product-management-container {
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
}

/* 按钮样式 */
.edit-button {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  border-radius: 8px;
}

.online-button {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  border: none;
  border-radius: 8px;
}

.offline-button {
  background: linear-gradient(135deg, #ff758c 0%, #ff7eb3 100%);
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

.product-detail-dialog :deep(.el-dialog) {
  border-radius: 16px;
  overflow: hidden;
}

.product-detail-dialog :deep(.el-dialog__header) {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  margin: 0;
  padding: 20px;
}

.product-detail-dialog :deep(.el-dialog__title) {
  color: white;
}

.product-detail-dialog :deep(.el-dialog__headerbtn .el-dialog__close) {
  color: white;
}

:deep(.el-dialog__body) {
  padding: 20px 25px;
}

@media (max-width: 992px) {
  .management-card {
    max-width: 100%;
  }

  .table-container {
    overflow-x: auto;
  }

  .product-detail-dialog {
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