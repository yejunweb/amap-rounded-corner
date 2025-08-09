export const geometrieToPolygon = (geometrie) => {
    const _paths = geometrie.paths.map((v) => [v.lng, v.lat])
    return turf.polygon([[..._paths, _paths[0]]]) // 结尾补位，回到第一个点
}
