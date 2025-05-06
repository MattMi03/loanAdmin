<template>
  <div id="app">
    <canvas ref="watermarkCanvas" class="unbreakable-watermark"></canvas>
    <div class="app-container">
      <router-view />
    </div>
  </div>
</template>

<script>
export default {
  mounted() {
    this.drawWatermark();
    window.addEventListener('resize', this.drawWatermark);
    this.protectWatermark();
  },
  methods: {
    drawWatermark() {
      const canvas = this.$refs.watermarkCanvas;
      const ctx = canvas.getContext('2d');
      
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      
      ctx.font = '18px "JetBrains Mono", monospace';
      ctx.fillStyle = 'rgba(0, 0, 0, 0.06)';
      ctx.textAlign = 'center';
      
      ctx.translate(canvas.width/2, canvas.height/2);
      ctx.rotate(-15 * Math.PI / 180);
      ctx.translate(-canvas.width/2, -canvas.height/2);
      
      for(let x = -200; x < canvas.width; x += 300) {
        for(let y = 0; y < canvas.height; y += 200) {
          ctx.fillText('保密资料 · 自由贷 · '+new Date().toLocaleDateString(), x, y);
        }
      }
    },
    protectWatermark() {
      const observer = new MutationObserver(() => {
        const watermark = this.$refs.watermarkCanvas;
        if (!watermark || 
            getComputedStyle(watermark).display === 'none' ||
            getComputedStyle(watermark).opacity === '0' ||
            getComputedStyle(watermark).visibility === 'hidden' ||
            watermark.getAttribute('hidden') !== null) {
          document.body.innerHTML = `
            <div style="
              position:fixed;
              top:0;left:0;
              width:100%;
              height:100%;
              background:#f5f7fa;
              display:flex;
              justify-content:center;
              align-items:center;
              z-index:999999;
            ">
              <h1 style="color:#f56c6c;text-align:center;">
                安全违规：禁止移除系统水印<br>
                <small style="color:#909399">请联系管理员</small>
              </h1>
            </div>
          `;
        }
      });
      
      observer.observe(document.body, { 
        childList: true, 
        attributes: true,
        attributeFilter: ['style', 'class', 'hidden'],
        subtree: true 
      });
      
      // 防止控制台修改
      Object.defineProperty(HTMLCanvasElement.prototype, 'style', {
        get() {
          if (this.classList.contains('unbreakable-watermark')) {
            console.warn('禁止修改水印样式');
            return {};
          }
          return Reflect.get(...arguments);
        },
        configurable: false
      });
    }
  }
}
</script>

<style>
.unbreakable-watermark {
  position: fixed !important;
  top: 0 !important;
  left: 0 !important;
  width: 100vw !important;
  height: 100vh !important;
  pointer-events: none !important;
  z-index: 2147483647 !important;
  opacity: 1 !important;
  transform: none !important;
  will-change: transform !important;
}

/* 重置 Element Plus 组件的定位和层级 */
:deep(.el-card),
:deep(.el-dialog),
:deep(.el-overlay),
:deep(.el-table),
:deep(.el-table__header-wrapper),
:deep(.el-table__body-wrapper),
:deep(.el-table__fixed),
:deep(.el-table__fixed-right),
:deep(.el-card__body) {
  position: static !important;
  transform: none !important;
  z-index: auto !important;
  isolation: auto !important;
}
</style>