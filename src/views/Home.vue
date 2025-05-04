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
  <div>
    <el-date-picker
      v-model="dateRange"
      type="daterange"
      range-separator="至"
      start-placeholder="开始日期"
      end-placeholder="结束日期"
      @change="handleDateChange"
      style="margin-bottom: 24px;"
    />

    <div style="display: flex; gap: 20px; flex-wrap: wrap">
      <div class="card" style="flex: 1;">
        <h3>贷款申请统计</h3>
        <el-row :gutter="16">
          <el-col :span="8" v-for="(item, idx) in applyList" :key="idx">
            <div class="statistic-card">
              <el-statistic :value="item.value">
                <template #title>
                  <div style="display: inline-flex; align-items: center">
                    {{ item.title }}
                    <el-tooltip :content="item.tip" placement="top">
                      <el-icon style="margin-left: 4px" :size="12">
                        <Warning />
                      </el-icon>
                    </el-tooltip>
                  </div>
                </template>
              </el-statistic>
              <div class="statistic-footer">
                <div class="footer-item">
                  <span>环比增长</span>
                  <span :class="item.trend >= 0 ? 'green' : 'red'">
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

      <div class="card" style="flex: 1;">
        <h3>还款统计</h3>
        <el-row :gutter="16">
          <el-col :span="8" v-for="(item, idx) in repayList" :key="idx">
            <div class="statistic-card">
              <el-statistic :value="item.value">
                <template #title>
                  <div style="display: inline-flex; align-items: center">
                    {{ item.title }}
                    <el-tooltip :content="item.tip" placement="top">
                      <el-icon style="margin-left: 4px" :size="12">
                        <Warning />
                      </el-icon>
                    </el-tooltip>
                  </div>
                </template>
              </el-statistic>
              <div class="statistic-footer">
                <div class="footer-item">
                  <span>环比增长</span>
                  <span :class="item.trend >= 0 ? 'green' : 'red'">
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
.card {
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
  padding: 24px;
  margin-bottom: 24px;
}

.statistic-card {
  background: linear-gradient(135deg, #f0f4f8, #ffffff);
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.05);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.statistic-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.1);
}

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

.green {
  color: #21ba45;
  font-weight: bold;
}

.red {
  color: #db2828; 
  font-weight: bold;
}
</style>