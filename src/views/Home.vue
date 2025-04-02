<template>
  <div style="display: flex;">
    <div class="card" style="flex: 1; margin-right: 20px;">
      <el-row :gutter="16">
        <el-col :span="8">
          <div class="statistic-card">
            <el-statistic :value="12573">
              <template #title>
                <div style="display: inline-flex; align-items: center">
                  今日访问量
                  <el-tooltip
                    effect="dark"
                    content="Number of users who logged into the product in one day"
                    placement="top"
                  >
                    <el-icon style="margin-left: 4px" :size="12">
                      <Warning />
                    </el-icon>
                  </el-tooltip>
                </div>
              </template>
            </el-statistic>
            <div class="statistic-footer">
              <div class="footer-item">
                <span>than yesterday</span>
                <span class="green">
                  12%
                  <el-icon>
                    <CaretTop />
                  </el-icon>
                </span>
              </div>
            </div>
          </div>
        </el-col>
      </el-row>
    </div>

    <div class="card" style="flex: 1;">
      <el-row :gutter="16">
        <el-col :span="8">
          <div class="statistic-card">
            <el-statistic :value="1293">
              <template #title>
                <div style="display: inline-flex; align-items: center">
                  待还款
                  <el-tooltip
                    effect="dark"
                    content="Number of users who logged into the product in one month"
                    placement="top"
                  >
                    <el-icon style="margin-left: 4px" :size="12">
                      <Warning />
                    </el-icon>
                  </el-tooltip>
                </div>
              </template>
            </el-statistic>
            <div class="statistic-footer">
              <div class="footer-item">
                <span>month on month</span>
                <span class="red">
                  8%
                  <el-icon>
                    <CaretBottom />
                  </el-icon>
                </span>
              </div>
            </div>
          </div>
        </el-col>
        <el-col :span="8">
          <div class="statistic-card">
            <el-statistic :value="743" title="New transactions today">
              <template #title>
                <div style="display: inline-flex; align-items: center">
                  已完成
                </div>
              </template>
            </el-statistic>
            <div class="statistic-footer">
              <div class="footer-item">
                <span>than yesterday</span>
                <span class="green">
                  6%
                  <el-icon>
                    <CaretTop />
                  </el-icon>
                </span>
              </div>
              <div class="footer-item">
                <el-icon :size="14">
                  <ArrowRight />
                </el-icon>
              </div>
            </div>
          </div>
        </el-col>
      </el-row>
    </div>
  </div>
</template>

<script setup>
</script>

<style scoped>
:global(h2#card-usage ~ .example .example-showcase) {
  background-color: var(--el-fill-color) !important;
}

.el-statistic {
  --el-statistic-content-font-size: 28px;
}

.statistic-card {
  height: 100%;
  padding: 20px;
  border-radius: 4px;
  background-color: var(--el-bg-color-overlay);
}

.statistic-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  font-size: 12px;
  color: var(--el-text-color-regular);
  margin-top: 16px;
}

.statistic-footer .footer-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.statistic-footer .footer-item span:last-child {
  display: inline-flex;
  align-items: center;
  margin-left: 4px;
}

.green {
  color: var(--el-color-success);
}
.red {
  color: var(--el-color-error);
}
</style>