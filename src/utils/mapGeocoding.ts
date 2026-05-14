/**
 * 地图地理编码工具函数
 */
import { loadAMapScript } from './mapLoader';

/**
 * 获取地理编码信息（地址转坐标）
 * @param address 地址
 * @returns 地理编码结果
 */
export const geocode = async (address: string) => {
  try {
    // 尝试加载高德地图API
    await loadAMapScript();
    
    // 检查API是否可用
    if (!window.AMap) {
      throw new Error('高德地图API未加载，无法进行地理编码');
    }
    
    return new Promise((resolve, reject) => {
      try {
        // 安全创建地理编码实例
        const geocoder = new window.AMap.Geocoder();
        
        geocoder.getLocation(address, (status: string, result: any) => {
          if (status === 'complete' && result.geocodes.length > 0) {
            resolve(result.geocodes[0]);
          } else {
            console.warn(`地址"${address}"解析失败: ${result.info || status}`);
            reject(new Error('地址解析失败'));
          }
        });
      } catch (error) {
        console.error('地理编码过程中发生错误', error);
        reject(error);
      }
    });
  } catch (error) {
    console.error('地理编码服务初始化失败', error);
    throw error;
  }
};

/**
 * 逆地理编码（坐标转地址）
 * @param lng 经度
 * @param lat 纬度
 * @returns 逆地理编码结果
 */
export const regeocode = async (lng: number, lat: number) => {
  try {
    // 尝试加载高德地图API
    await loadAMapScript();
    
    // 检查API是否可用
    if (!window.AMap) {
      throw new Error('高德地图API未加载，无法进行逆地理编码');
    }
    
    return new Promise((resolve, reject) => {
      try {
        // 创建地理编码实例
        const geocoder = new window.AMap.Geocoder();
        
        geocoder.getAddress([lng, lat], (status: string, result: any) => {
          if (status === 'complete') {
            resolve(result.regeocode);
          } else {
            console.warn(`坐标(${lng},${lat})逆地理编码失败: ${result.info || status}`);
            reject(new Error('逆地理编码失败'));
          }
        });
      } catch (error) {
        console.error('逆地理编码过程中发生错误', error);
        reject(error);
      }
    });
  } catch (error) {
    console.error('逆地理编码服务初始化失败', error);
    throw error;
  }
};

/**
 * 批量地理编码
 * @param addresses 地址数组
 * @returns 地理编码结果数组
 */
export const batchGeocode = async (addresses: string[]) => {
  const results = [];
  const errors = [];
  
  for (const address of addresses) {
    try {
      const result = await geocode(address);
      results.push(result);
    } catch (error) {
      console.warn(`批量地理编码: 地址 "${address}" 解析失败`, error);
      errors.push({ address, error });
    }
  }
  
  return { results, errors };
}; 