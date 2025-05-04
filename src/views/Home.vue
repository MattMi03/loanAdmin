<script setup>
import { ref, onMounted } from 'vue';
import { getStatisticsAPI } from '@/api/adminApi';
import { CaretTop, CaretBottom, Warning } from '@element-plus/icons-vue';

const today = new Date();
const dateRange = ref([today, today]);
const applyList = ref([]);
const repayList = ref([]);

const fetchAllStatistics = async () => {
  try {
    const [startDate, endDate] = dateRange.value || [];
    const start = startDate ? startDate.toISOString().slice(0, 10) : undefined;
    const end = endDate ? endDate.toISOString().slice(0, 10) : undefined;

    const res = await getStatisticsAPI( start, end );

    const applyMap = {
      totalApplications: '总申请数',
      pendingCount: '待审核数',
      approvedCount: '已通过数',
      rejectedCount: '已拒绝数',
      cancelledCount: '已取消数',
      disbursedCount: '已放款数',
      settledCount: '已结清数',
    };

    const repayMap = {
      totalRepayments: '总还款计划数',
      pendingCount: '待还款数',
      settledCount: '已还清数',
    };

    applyList.value = Object.entries(res.apply).map(([key, val]) => ({
      title: applyMap[key],
      value: val.value,
      trend: val.trend,
      tip: `${applyMap[key]}在选定时间内的统计值`
    }));

    repayList.value = Object.entries(res.repay).map(([key, val]) => ({
      title: repayMap[key],
      value: val.value,
      trend: val.trend,
      tip: `${repayMap[key]}在选定时间内的统计值`
    }));
  } catch (e) {
    console.error('统计数据获取失败：', e);
  }
};

const handleDateChange = () => {
  fetchAllStatistics();
};

onMounted(fetchAllStatistics);
</script>

<template>
  <div class="statistics-container">
    <el-date-picker
      v-model="dateRange"
      type="daterange"
      range-separator="至"
      start-placeholder="开始日期"
      end-placeholder="结束日期"
      @change="handleDateChange"
      class="date-picker"
    />

    <div class="statistics-content">
      <div class="card">
        <h3 class="card-title">贷款申请统计</h3>
        <el-row :gutter="16">
          <el-col :span="8" v-for="(item, idx) in applyList" :key="idx">
            <div class="statistic-card">
              <el-statistic :value="item.value">
                <template #title>
                  <div class="statistic-title">
                    {{ item.title }}
                    <el-tooltip :content="item.tip" placement="top">
                      <el-icon class="tip-icon"><Warning /></el-icon>
                    </el-tooltip>
                  </div>
                </template>
              </el-statistic>
              <div class="statistic-footer">
                <div class="footer-item">
                  <span>环比增长</span>
                  <span :class="item.trend >= 0 ? 'up' : 'down'">
                    {{ Math.abs(item.trend) }}%
                    <el-icon>
                      <component :is="item.trend >= 0 ? CaretTop : CaretBottom" />
                    </el-icon>
                  </span>
                </div>
              </div>
            </div>
          </el-col>
        </el-row>
      </div>

      <div class="card">
        <h3 class="card-title">还款统计</h3>
        <el-row :gutter="16">
          <el-col :span="8" v-for="(item, idx) in repayList" :key="idx">
            <div class="statistic-card">
              <el-statistic :value="item.value">
                <template #title>
                  <div class="statistic-title">
                    {{ item.title }}
                    <el-tooltip :content="item.tip" placement="top">
                      <el-icon class="tip-icon"><Warning /></el-icon>
                    </el-tooltip>
                  </div>
                </template>
              </el-statistic>
              <div class="statistic-footer">
                <div class="footer-item">
                  <span>环比增长</span>
                  <span :class="item.trend >= 0 ? 'up' : 'down'">
                    {{ Math.abs(item.trend) }}%
                    <el-icon>
                      <component :is="item.trend >= 0 ? CaretTop : CaretBottom" />
                    </el-icon>
                  </span>
                </div>
              </div>
            </div>
          </el-col>
        </el-row>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 主容器 */
.statistics-container {
  padding: 30px;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  min-height: 80vh
}

/* 日期选择器 */
.date-picker {
  margin-bottom: 24px;
  width: 100%;
  max-width: 400px;
}

/* 内容区域 */
.statistics-content {
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
}

/* 卡片样式 */
.card {
  flex: 1;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  padding: 24px;
  margin-bottom: 24px;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.card:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.12);
}

.card-title {
  font-size: 1.25rem;
  color: #2c3e50;
  margin-top: 0;
  margin-bottom: 16px;
  font-weight: 600;
}

/* 统计卡片 */
.statistic-card {
  background: linear-gradient(135deg, #f8fafc, #ffffff);
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
}

.statistic-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
}

.statistic-title {
  display: inline-flex;
  align-items: center;
  font-size: 14px;
  color: #64748b;
}

.tip-icon {
  margin-left: 6px;
  color: #64748b;
  cursor: pointer;
}

/* 统计底部 */
.statistic-footer {
  margin-top: 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13px;
  color: #666;
}

.footer-item span:last-child {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

/* 趋势指示器 */
.up {
  color: #21ba45;
  font-weight: 500;
}

.down {
  color: #db2828;
  font-weight: 500;
}
</style>

<style>
/* 全局统计数字样式 */
.statistics-container .el-statistic__content {
  font-size: 24px;
  font-weight: 600;
  color: #2c3e50;
}

.statistics-container .el-statistic__head {
  font-size: 14px;
}
</style>