/**
 * 高德地图配置文件
 * 密钥优先从环境变量读取，未设置时回退到默认值以保持开发兼容性
 */
export const MAP_CONFIG = {
  apiKey: process.env.REACT_APP_AMAP_API_KEY || '1a04283e6d5e97973f99c3316b592734',
  securityKey: process.env.REACT_APP_AMAP_SECURITY_KEY || '29350bce64d701e81d2276e6103f4dad',
  center: [117.27, 31.86] as [number, number],
  zoom: 12,
  aMapURL: 'https://webapi.amap.com/maps?v=2.0&plugin=AMap.Scale,AMap.ToolBar,AMap.MapType,AMap.Geolocation,AMap.Geocoder,AMap.MarkerClusterer,AMap.DistrictSearch&key=',
  uiURL: 'https://webapi.amap.com/ui/1.1/main.js?v=1.1.1',
  securityJsCode: process.env.REACT_APP_AMAP_SECURITY_JS_CODE || '01db0b44d1aea1886f7a7a7be61cdae6',
}; 