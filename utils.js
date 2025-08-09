// 将几何对象转换为多边形
export const geometryToPolygon = (geometry) => {
    const _paths = geometry.paths.map((v) => [v.lng, v.lat])
    return turf.polygon([[..._paths, _paths[0]]]) // 结尾补位，回到第一个点
}

// 依据多边形轮廓设置所有标志线
export const polygonToLines = (polygon) => {
    const linesPath = []
    const pointsPos = polygon?.geometry?.coordinates[0]?.slice(0, -1)
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

/**
 * 依据多边形轮廓圆角化「曲线拟合方法」
 * 1、顶点处理：
 *  先将多边形转换为线段，每两个相邻线段为一个分组；
 *  则每个分组内有三个顶点、命名为点 a, b, c，起点为 a，终点为 c，则 a, b, c 三个点组成的线段为 ba，bc，ac，构成的角度为∠abc；
 * 2、对线段 ab、bc 进行处理
 *  传入外部距离变量 radius，以点 b 为中心，沿着线段 ba、bc 方向延伸，则得到点 a'、c'，连接点 a'、c'，得到线段 a'c'；
 * 4、以点 b 为基准控制点，与点 a'、c' 生成三点贝塞尔曲线，得到圆弧；
 * 5、对生成的圆弧进行处理，依据外部分段变量 steps，将圆弧分为 step 个片段，并取片段中点为圆弧的顶点，得到圆弧的顶点坐标（差值计算）；
 * 6、对每个线段组都执行如上操作，最终得到边角平滑的坐标组，最终输出一个能够构成 Polygon 的坐标组；
 */

export const roundedCornersByPolygon = (polygon, radius, steps, minAngle, maxAngle) => {
    const linesPath = polygonToLines(polygon)
    const angles = getPolygonAngles(polygon)
    console.log('linesPath: ', linesPath)
    console.log('angles: ', angles)

    // 过滤出需要圆角化的角度
    const anglesToRound = angles.filter((angle) => {
        const angleRad = angle.angle.angleRad
        return angleRad >= minAngle && angleRad <= maxAngle
    })

    // 生成圆角化的多边形坐标
    const roundedPolygon = generateRoundedPolygon(polygon, anglesToRound, radius, steps)

    return {
        linesPath,
        angles,
        anglesToRound,
        roundedPolygon,
    }
}

/**
 * 生成圆角化多边形的坐标
 */
const generateRoundedPolygon = (polygon, anglesToRound, radius, steps) => {
    const pointsPos = polygon?.geometry?.coordinates[0]
    const result = []

    // 按照多边形的顺序遍历所有点
    for (let i = 0; i < pointsPos.length; i++) {
        const currentPoint = pointsPos[i]

        // 查找当前点是否是需要圆角化的角度点
        const angleToRound = anglesToRound.find(
            (angle) => angle.line1.end[0] === currentPoint[0] && angle.line1.end[1] === currentPoint[1]
        )

        if (angleToRound) {
            // 生成圆角坐标，确保方向正确
            const roundedPoints = generateRoundedCorner(angleToRound, radius, steps)
            // 按照多边形的遍历方向添加圆角点
            result.push(...roundedPoints)
        } else {
            // 不需要圆角化的点直接添加
            result.push(currentPoint)
        }
    }

    return turf.cleanCoords(turf.multiPoint(result)).geometry.coordinates
}

/**
 * 生成单个圆角的坐标点
 */
const generateRoundedCorner = (angleData, radius, steps) => {
    const { line1, line2 } = angleData

    // 点 a, b, c 的坐标
    const pointA = line1.start
    const pointB = line1.end // 也是 line2.start
    const pointC = line2.end

    // 使用 turf 计算线段 BA 和 BC 上距离点 B 为 radius 米的点 a' 和 c'
    // 创建线段 BA 和 BC
    const lineBA = turf.lineString([pointB, pointA])
    const lineBC = turf.lineString([pointB, pointC])

    // 计算从点 B 向点 A 方向延伸的点 a'（在线段 BA 上）
    const pointAPrime = turf.along(lineBA, radius / 1000, { units: 'kilometers' }).geometry.coordinates

    // 计算从点 B 向点 C 方向延伸的点 c'（在线段 BC 上）
    const pointCPrime = turf.along(lineBC, radius / 1000, { units: 'kilometers' }).geometry.coordinates

    // 生成圆弧上的点
    const roundedPoints = []
    for (let i = 0; i <= steps; i++) {
        const t = i / steps
        const point = quadraticBezierCurve(pointAPrime, pointB, pointCPrime, t)
        roundedPoints.push(point)
    }

    return roundedPoints
}

/**
 * 二次贝塞尔曲线计算
 */
const quadraticBezierCurve = (p0, p1, p2, t) => {
    const x = Math.pow(1 - t, 2) * p0[0] + 2 * (1 - t) * t * p1[0] + Math.pow(t, 2) * p2[0]
    const y = Math.pow(1 - t, 2) * p0[1] + 2 * (1 - t) * t * p1[1] + Math.pow(t, 2) * p2[1]
    return [x, y]
}
