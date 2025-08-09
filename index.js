const geometrieToPolygon = (geometrie) => {
    const _paths = geometrie.paths.map((v) => [v.lng, v.lat])
    return turf.polygon([[..._paths, _paths[0]]]) // 结尾补位，回到第一个点
}

// 初始化地图
const map = new TMap.Map('map', {
    center: new TMap.LatLng(31.869246755566213, 117.16634751052449),
    zoom: 17,
})

// 创建矢量图层
const originalLayer = new TMap.MultiPolygon({
    map: map,
    geometries: [],
    styles: {
        defaultPolygon: new TMap.PolygonStyle({
            color: 'rgba(43, 91, 249, 0.2)',
            showBorder: true,
            borderColor: 'rgba(43, 91, 249, 1)',
            borderWidth: 2,
        }),
    },
})

// 原始多边形和圆角化后的多边形
let originalPolygon = null
let roundedPolygon = null

const originalCoords = [
    [117.16474496229398, 31.87017788945035],
    [117.16389390775942, 31.868269112572477],
    [117.16616291826983, 31.86799531527631],
    [117.1682498, 31.8681595],
    [117.1682887, 31.8699996],
    [117.1684129, 31.8702436],
    [117.1684207, 31.8704546],
    [117.1681411, 31.8705008],
    [117.1675819, 31.8701974],
    [117.16654910232694, 31.870992280285826],
    [117.1658346, 31.8702568],
    [117.1651745, 31.8702964],
]

// 绘制原始多边形
const drawOriginalPolygon = () => {
    // 创建一个示例多边形
    const paths = originalCoords.map((v) => new TMap.LatLng(v[1], v[0]))

    // 转换为Turf.js可用的格式
    originalPolygon = geometrieToPolygon({ paths })

    // 添加到地图
    originalLayer.setGeometries([
        {
            id: 'original',
            styleId: 'defaultPolygon',
            paths,
        },
    ])
    document.getElementById('error-message').textContent = ''
}
// 初始化绘制原始多边形
drawOriginalPolygon()

// 绘制原始多边形
document.getElementById('draw-original').addEventListener('click', () => {
    drawOriginalPolygon()
})

// 应用圆角化
document.getElementById('apply').addEventListener('click', () => {
    if (!originalPolygon) {
        showError('请先绘制原始图形')
        return
    }

    const radius = parseFloat(document.getElementById('radius').value)
    const steps = parseInt(document.getElementById('steps').value)
    const minAngle = (parseFloat(document.getElementById('angle-min').value) * Math.PI) / 180 // 转换为弧度
    const maxAngle = (parseFloat(document.getElementById('angle-max').value) * Math.PI) / 180 // 转换为弧度
    console.log('圆角化参数: ', radius, steps, minAngle, maxAngle)

    // 绘制圆角化后的多边形
})

// 重置
document.getElementById('reset').addEventListener('click', () => {
    originalLayer.setGeometries([])
    originalPolygon = null
    roundedPolygon = null
    document.getElementById('error-message').textContent = ''
    document.getElementById('stats-info').style.display = 'none'
})

// 更新滑块显示值
document.getElementById('radius').addEventListener('input', (e) => {
    document.getElementById('radius-value').textContent = e.target.value
})

document.getElementById('steps').addEventListener('input', (e) => {
    document.getElementById('steps-value').textContent = e.target.value
})

document.getElementById('angle-min').addEventListener('input', (e) => {
    document.getElementById('angle-min-value').textContent = e.target.value
})

document.getElementById('angle-max').addEventListener('input', (e) => {
    document.getElementById('angle-max-value').textContent = e.target.value
})

// 显示错误信息
const showError = (message) => {
    document.getElementById('error-message').textContent = message
}
