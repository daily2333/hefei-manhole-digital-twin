/**
 * 地图标记工具函数
 */
import AMapLoader from '@amap/amap-jsapi-loader';
import { MAP_CONFIG } from '../config/mapConfig';

// 状态颜色映射
const STATUS_COLORS = {
  normal: '#52c41a',   // 绿色 - 正常
  warning: '#faad14',  // 黄色 - 警告
  danger: '#f5222d',   // 红色 - 危险
  offline: '#8c8c8c'   // 灰色 - 离线
};

/**
 * 获取井盖标记点图标
 * @param status 井盖状态 ('normal'|'warning'|'danger'|'offline')
 * @returns 图标配置
 */
export const getMarkerIcon = async (status: string) => {
  try {
    const color = STATUS_COLORS[status as keyof typeof STATUS_COLORS] || STATUS_COLORS.normal;
    return await createCustomMarker(color);
  } catch (error) {
    console.warn('获取标记点图标失败:', error);
    // 返回默认图标
    return {
      content: `<div style="width:26px;height:26px;background:${STATUS_COLORS.normal};border-radius:50%;border:2px solid white;display:flex;align-items:center;justify-content:center;color:white;font-size:12px;"></div>`
    };
  }
};

/**
 * 创建高德地图样式的自定义标记点
 * @param color 标记点颜色
 * @param text 标记点文字
 * @returns 自定义标记配置
 */
export const createCustomMarker = async (color: string, text: string = '') => {
  // 默认样式（不依赖高德地图API）
  const defaultStyle = {
    content: `<div style="width:26px;height:26px;background:${color};border-radius:50%;border:2px solid white;display:flex;align-items:center;justify-content:center;color:white;font-size:12px;">${text}</div>`
  };
  
  try {
    // 浏览器环境检查
    if (typeof window === 'undefined') {
      return defaultStyle;
    }
    
    // 确保安全配置已设置
    if (!window._AMapSecurityConfig) {
      window._AMapSecurityConfig = {
        securityJsCode: MAP_CONFIG.securityJsCode
      };
    }
    
    // 尝试加载高德地图API
    const AMap = await AMapLoader.load({
      key: MAP_CONFIG.apiKey,
      version: '2.0'
    });
    
    // 安全创建Pixel对象
    let pixelOffset: any;
    try {
      pixelOffset = new AMap.Pixel(-13, -30);
      
      // 验证Pixel是否有效
      if (typeof pixelOffset.getX === 'function' && 
          (pixelOffset.getX() !== -13 || pixelOffset.getY() !== -30)) {
        console.warn('创建的Pixel对象值异常，使用安全替代方法');
        // 使用对象字面量替代
        pixelOffset = { x: -13, y: -30 };
      }
    } catch (pixelError) {
      console.warn('创建Pixel对象失败，使用安全替代方法', pixelError);
      // 使用对象字面量替代
      pixelOffset = { x: -13, y: -30 };
    }
    
    // 创建高德地图样式的标记点
    return {
      offset: pixelOffset,
      content: `<div class="custom-marker" style="
        background-color: ${color};
        border-radius: 50% 50% 50% 0;
        border: 2px solid white;
        width: 26px;
        height: 26px;
        transform: rotate(-45deg);
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 0 5px rgba(0,0,0,0.3);
      ">
        <div style="
          color: white;
          transform: rotate(45deg);
          font-weight: bold;
          font-size: 12px;
        ">${text}</div>
      </div>`,
    };
  } catch (error) {
    console.warn('创建自定义标记失败，使用默认样式', error);
    return defaultStyle;
  }
};

/**
 * 在地图上添加标记点
 * @param map 地图实例
 * @param position 标记点位置 [lng, lat]
 * @param options 标记点选项
 * @returns 标记点实例
 */
export const addMarkerToMap = async (map: any, position: [number, number], options: any = {}) => {
  try {
    // 确保地图实例有效
    if (!map) {
      throw new Error('地图实例无效');
    }
    
    // 获取AMap构造函数
    let AMap;
    if (map.constructor && map.constructor.prototype && map.constructor.prototype.__proto__) {
      AMap = map.constructor.prototype.__proto__.constructor;
    } else if (window.AMap) {
      AMap = window.AMap;
    } else {
      throw new Error('无法获取AMap构造函数');
    }
    
    // 创建标记点
    const marker = new AMap.Marker({
      position,
      ...options
    });
    
    // 添加到地图
    marker.setMap(map);
    
    return marker;
  } catch (error) {
    console.error('添加标记点失败', error);
    throw error;
  }
}; 