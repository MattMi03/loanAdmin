<template>
  <div id="app">
    <!-- <canvas ref="watermarkCanvas" class="unbreakable-watermark"></canvas> -->
    <div class="app-container">
      <router-view />
    </div>
  </div>
</template>

<script setup>
console.log('API base URL:', import.meta.env.VITE_API_BASE_URL);
</script>

<!-- <script setup>
import { onMounted, onBeforeUnmount, ref } from 'vue'

const watermarkCanvas = ref(null)
let observer = null

// 从本地内存获取 name 和 id
const userName = localStorage.getItem('name') || '默认姓名'
const userId = localStorage.getItem('adminId') || '默认ID'

function drawWatermark() {
  const canvas = watermarkCanvas.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')

  canvas.width = window.innerWidth
  canvas.height = window.innerHeight

  ctx.font = '18px "JetBrains Mono", monospace'
  ctx.fillStyle = 'rgba(0, 0, 0, 0.06)'
  ctx.textAlign = 'center'

  ctx.translate(canvas.width / 2, canvas.height / 2)
  ctx.rotate((-15 * Math.PI) / 180)
  ctx.translate(-canvas.width / 2, -canvas.height / 2)

  const watermarkText = `保密资料 · 自由贷 · ${userName} · ${userId} · ${new Date().toLocaleDateString()}`
  
  const textSpacing = 10 // 设置字间距

  // 在 x 坐标上拉开间距
  for (let x = -200; x < canvas.width; x += 250) {
    for (let y = 0; y < canvas.height; y += 100) {
      ctx.fillText(watermarkText, x, y)
      // 字间距控制
      x += textSpacing // 增加每个字符之间的水平间距
    }
  }
}

function protectWatermark() {
  observer = new MutationObserver(() => {
    const canvas = watermarkCanvas.value
    if (
      !canvas ||
      getComputedStyle(canvas).display === 'none' ||
      getComputedStyle(canvas).opacity === '0' ||
      getComputedStyle(canvas).visibility === 'hidden' ||
      canvas.getAttribute('hidden') !== null
    ) {
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
      `
    }
  })

  observer.observe(document.body, {
    childList: true,
    attributes: true,
    attributeFilter: ['style', 'class', 'hidden'],
    subtree: true
  })

  // 防止控制台修改
  try {
    Object.defineProperty(HTMLCanvasElement.prototype, 'style', {
      get() {
        if (this.classList.contains('unbreakable-watermark')) {
          console.warn('禁止修改水印样式')
          return {}
        }
        return Reflect.get(...arguments)
      },
      configurable: false
    })
  } catch (e) {
    console.warn('属性保护失败：', e)
  }
}

onMounted(() => {
  drawWatermark()
  window.addEventListener('resize', drawWatermark)
  protectWatermark()
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', drawWatermark)
  if (observer) observer.disconnect()
})
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
</style> -->