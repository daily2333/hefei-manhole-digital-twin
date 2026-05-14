/**
 * 高德地图配置文件
 */
export const MAP_CONFIG = {
  // 高德地图API密钥
  apiKey: '1a04283e6d5e97973f99c3316b592734',
  // 安全密钥
  securityKey: '29350bce64d701e81d2276e6103f4dad',
  // 初始地图中心点（合肥市）
  center: [117.27, 31.86] as [number, number],
  // 初始缩放级别
  zoom: 12,
  // 高德地图URL - 确保使用HTTPS
  aMapURL: 'https://webapi.amap.com/maps?v=2.0&plugin=AMap.Scale,AMap.ToolBar,AMap.MapType,AMap.Geolocation,AMap.Geocoder,AMap.MarkerClusterer,AMap.DistrictSearch&key=',
  // 高德地图UI库URL - 确保使用HTTPS
  uiURL: 'https://webapi.amap.com/ui/1.1/main.js?v=1.1.1',
  // 地图安全模式，禁用开发者工具可以查看API密钥
  securityJsCode: '01db0b44d1aea1886f7a7a7be61cdae6', // 安全码
}; 