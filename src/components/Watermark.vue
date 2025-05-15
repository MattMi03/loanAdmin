<template>
    <canvas ref="watermarkCanvas" class="unbreakable-watermark"></canvas>
</template>

<script setup>
import { onMounted, onBeforeUnmount, ref } from 'vue'

const watermarkCanvas = ref(null)
let observer = null
let intervalId = null 

function drawWatermark() {
    const name = localStorage.getItem('name') || '默认姓名'
    const id = localStorage.getItem('adminId') || '默认ID'

    const canvas = watermarkCanvas.value
    if (!canvas) return
    const ctx = canvas.getContext('2d')

    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.font = '18px "JetBrains Mono", monospace'
    ctx.fillStyle = 'rgba(0, 0, 0, 0.06)'
    ctx.textAlign = 'center'

    ctx.translate(canvas.width / 2, canvas.height / 2)
    ctx.rotate((-15 * Math.PI) / 180)
    ctx.translate(-canvas.width / 2, -canvas.height / 2)

    const watermarkText = `自由贷 · ${name} · ${id} · ${new Date().toLocaleDateString()}`

    for (let y = -500, row = 0; y < canvas.height + 300; y += 100, row++) {
        const offsetX = row % 2 === 0 ? 0 : 150
        for (let x = -500 + offsetX; x < canvas.width + 300; x += 350) {
            ctx.fillText(watermarkText, x, y)
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

function handleStorageChange(event) {
    if (event.key === 'name' || event.key === 'adminId') {
        drawWatermark()
    }
}


function startWatermarkChecker() {
    intervalId = setInterval(() => {
        if (!document.querySelector('.unbreakable-watermark')) {
            console.log('执行setInterval:', new Date().toISOString())
            localStorage.clear()
            document.body.innerHTML = `
        <div style="
          position:fixed;
          top:0;left:0;
          width:100%;
          height:100%;
          background:#fff;
          display:flex;
          justify-content:center;
          align-items:center;
          z-index:9999999;
        ">
          <h1 style="color:red;">安全违规：禁止移除水印<br><small>请联系管理员</small></h1>
        </div>
      `
        }
    }, 1000)
}

onMounted(() => {
    drawWatermark()
    protectWatermark()
    startWatermarkChecker()
    window.addEventListener('resize', drawWatermark)
    window.addEventListener('storage', handleStorageChange)
})

onBeforeUnmount(() => {
    if (intervalId) clearInterval(intervalId)
    if (observer) observer.disconnect()
    window.removeEventListener('resize', drawWatermark)
    window.removeEventListener('storage', handleStorageChange)
})
</script>

<style scoped>
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
</style>