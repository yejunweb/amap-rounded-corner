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

// 计算两条线段之间的夹角
export const calculateAngleBetweenLines = (line1, line2) => {
    // 获取两条线段的向量
    const vector1 = {
        x: line1[1][0] - line1[0][0],
        y: line1[1][1] - line1[0][1],
    }

    const vector2 = {
        x: line2[1][0] - line2[0][0],
        y: line2[1][1] - line2[0][1],
    }

    // 计算向量的点积
    const dotProduct = vector1.x * vector2.x + vector1.y * vector2.y

    // 计算向量的模长
    const magnitude1 = Math.sqrt(vector1.x * vector1.x + vector1.y * vector1.y)
    const magnitude2 = Math.sqrt(vector2.x * vector2.x + vector2.y * vector2.y)

    // 计算夹角的余弦值
    const cosAngle = dotProduct / (magnitude1 * magnitude2)

    // 确保余弦值在有效范围内
    const clampedCosAngle = Math.max(-1, Math.min(1, cosAngle))

    // 计算夹角（弧度）
    const angleRad = Math.acos(clampedCosAngle)

    // 转换为角度
    const angleDeg = (angleRad * 180) / Math.PI

    return {
        angleRad,
        angleDeg,
        cosAngle: clampedCosAngle,
    }
}

// 获取多边形中所有相邻线段构成的夹角信息
export const getPolygonAngles = (polygon) => {
    const linesPath = polygonToLines(polygon)
    const angles = []

    for (let i = 0; i < linesPath.length; i++) {
        const currentLine = linesPath[i]
        const nextLine = linesPath[(i + 1) % linesPath.length] // 循环到第一条线

        // 计算夹角
        const angleInfo = calculateAngleBetweenLines(currentLine, nextLine)

        // 构建夹角信息对象
        const angleData = {
            index: i,
            line1: {
                start: currentLine[0],
                end: currentLine[1],
                line: currentLine,
            },
            line2: {
                start: nextLine[0],
                end: nextLine[1],
                line: nextLine,
            },
            angle: angleInfo,
            // 判断是否为锐角、直角或钝角
            angleType: angleInfo.angleDeg < 90 ? 'acute' : angleInfo.angleDeg === 90 ? 'right' : 'obtuse',
        }

        angles.push(angleData)
    }

    return angles
}

// 依据多边形轮廓圆角化
export const roundedCornersByPolygon = (polygon, radius, steps, minAngle, maxAngle) => {
    const linesPath = polygonToLines(polygon)
    const angles = getPolygonAngles(polygon)

    // 过滤出需要圆角化的角度
    const anglesToRound = angles.filter((angle) => {
        const angleRad = angle.angle.angleRad
        return angleRad >= minAngle && angleRad <= maxAngle
    })

    return {
        linesPath,
        angles,
        anglesToRound,
    }
}
