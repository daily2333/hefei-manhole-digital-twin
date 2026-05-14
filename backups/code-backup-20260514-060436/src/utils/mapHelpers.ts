/**
 * 地图辅助工具函数
 */
import AMapLoader from '@amap/amap-jsapi-loader';
import { MAP_CONFIG } from '../config/mapConfig';

/**
 * 安全创建经纬度对象
 * @param lng 经度
 * @param lat 纬度
 * @returns 安全的经纬度对象
 */
export const createSafeLngLat = async (lng: number, lat: number) => {
  // 基本验证
  if (typeof lng !== 'number' || typeof lat !== 'number' || 
      isNaN(lng) || isNaN(lat) || 
      !isFinite(lng) || !isFinite(lat)) {
    console.warn(`无效的经纬度值: lng=${lng}, lat=${lat}，使用默认值`);
    return { lng: 116.397428, lat: 39.90923 }; // 默认北京天安门
  }
  
  try {
    // 浏览器环境检查
    if (typeof window === 'undefined') {
      // 返回简单对象
      return { lng, lat };
    }
    
    // 确保安全配置已设置
    if (!window._AMapSecurityConfig) {
      window._AMapSecurityConfig = {
        securityJsCode: MAP_CONFIG.securityJsCode
      };
    }
    
    // 加载AMap
    const AMap = await AMapLoader.load({
      key: MAP_CONFIG.apiKey,
      version: '2.0'
    });
    
    // 尝试创建LngLat对象
    const lngLat = new AMap.LngLat(lng, lat);
    
    // 验证创建的对象
    if (!lngLat || typeof lngLat.getLng !== 'function' || typeof lngLat.getLat !== 'function') {
      console.warn('创建AMap.LngLat对象失败，使用简单对象替代');
      return { lng, lat };
    }
    
    return lngLat;
  } catch (error) {
    console.warn('创建AMap.LngLat对象时出错，使用简单对象替代', error);
    return { lng, lat };
  }
};

/**
 * 同步创建像素坐标对象（不依赖AMap实例，仅返回简单对象）
 * @param x X坐标
 * @param y Y坐标
 * @returns 安全的像素坐标对象
 */
export const createSafePixel = (x: number, y: number) => {
  // 基本验证
  if (typeof x !== 'number' || typeof y !== 'number' ||
      isNaN(x) || isNaN(y) ||
      !isFinite(x) || !isFinite(y)) {
    console.warn(`无效的像素坐标值: x=${x}, y=${y}，使用默认值`);
    return { x: 0, y: 0 };
  }
  
  return { x, y };
};

/**
 * 计算两点之间的距离（米）
 * @param lngLat1 坐标点1 [lng, lat]
 * @param lngLat2 坐标点2 [lng, lat]
 * @returns 距离（米）
 */
export const calculateDistance = async (lngLat1: [number, number], lngLat2: [number, number]): Promise<number> => {
  try {
    // 确保安全配置已设置
    if (!window._AMapSecurityConfig) {
      window._AMapSecurityConfig = {
        securityJsCode: MAP_CONFIG.securityJsCode
      };
    }
    
    // 加载AMap
    const AMap = await AMapLoader.load({
      key: MAP_CONFIG.apiKey,
      version: '2.0',
      plugins: ['AMap.GeometryUtil']
    });
    
    const point1 = await createSafeLngLat(lngLat1[0], lngLat1[1]);
    const point2 = await createSafeLngLat(lngLat2[0], lngLat2[1]);
    
    return AMap.GeometryUtil.distance(point1, point2);
  } catch (error) {
    console.error('计算距离失败', error);
    // 使用球面余弦定理计算近似距离作为降级方案
    return calculateHaversineDistance(lngLat1, lngLat2);
  }
};

/**
 * 使用Haversine公式计算球面距离（备用方法）
 * @param lngLat1 坐标点1 [lng, lat]
 * @param lngLat2 坐标点2 [lng, lat]
 * @returns 距离（米）
 */
const calculateHaversineDistance = (lngLat1: [number, number], lngLat2: [number, number]): number => {
  const toRad = (value: number): number => (value * Math.PI) / 180;
  const R = 6371000; // 地球半径（米）
  const dLat = toRad(lngLat2[1] - lngLat1[1]);
  const dLng = toRad(lngLat2[0] - lngLat1[0]);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lngLat1[1])) * Math.cos(toRad(lngLat2[1])) * 
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}; 