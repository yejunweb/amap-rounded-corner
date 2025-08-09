// 将几何对象转换为多边形
export const geometryToPolygon = (geometry) => {
    const _paths = geometry.paths.map((v) => [v.lng, v.lat])
    return turf.polygon([[..._paths, _paths[0]]]) // 结尾补位，回到第一个点
}

// 依据多边形轮廓设置所有标志线
export const polygonToLines = (polygon) => {
    const linesPath = []
    const pointsPos = polygon?.geometry?.coordinates[0]
    for (let i = 0; i < pointsPos.length; i++) {
        const curPos = pointsPos[i]
        const nextPos = pointsPos[i + 1] ? pointsPos[i + 1] : pointsPos[0]
        linesPath.push([curPos, nextPos])
    }
    return linesPath
}

// 依据多边形轮廓圆角化
export const roundedCornersByPolygon = (polygon, radius, steps, minAngle, maxAngle) => {
    const linesPath = polygonToLines(polygon)
    return linesPath
}
