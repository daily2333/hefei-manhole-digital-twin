/**
 * 地图加载工具函数
 */
import { MAP_CONFIG } from '../config/mapConfig';

// 不再声明全局Window.AMap类型，使用AMap.tsx中的定义
declare global {
  interface Window {
    AMapUI: any;
    _AMapSecurityConfig?: {
      securityJsCode: string;
    };
  }
}

// 全局状态，跟踪脚本加载进度
let isAMapLoaded = false;
let isAMapUILoaded = false;
let loadingPromise: Promise<void> | null = null;
let timeoutId: NodeJS.Timeout | null = null;

/**
 * 加载高德地图API和UI库
 * @returns 加载完成的Promise
 */
export const loadAMapScript = (): Promise<void> => {
  // 如果已经加载完成，直接返回成功
  if (isAMapLoaded && window.AMap) {
    console.log('高德地图API已加载，直接使用');
    return Promise.resolve();
  }
  
  // 如果正在加载中，返回该加载Promise
  if (loadingPromise) {
    console.log('高德地图API加载中，等待完成');
    return loadingPromise;
  }
  
  // 超时检测
  const timeout = 15000; // 15秒超时
  
  // 开始新的加载过程
  loadingPromise = new Promise<void>((resolve, reject) => {
    try {
      console.log('开始加载高德地图API...');
      
      // 检查运行环境
      if (typeof window === 'undefined' || typeof document === 'undefined') {
        const error = new Error('没有浏览器环境，无法加载地图API');
        console.error(error);
        reject(error);
        return;
      }
      
      // 确保先设置安全配置（必须在加载API之前）
      window._AMapSecurityConfig = {
        securityJsCode: MAP_CONFIG.securityJsCode
      };
      console.log('已设置高德地图安全配置');
      
      // 设置超时处理
      timeoutId = setTimeout(() => {
        console.error('加载高德地图API超时，请检查网络或API Key');
        reject(new Error('加载高德地图API超时'));
        loadingPromise = null;
      }, timeout);
      
      // 检查是否已经存在脚本标签
      const existingScript = document.getElementById('amap-script');
      if (existingScript) {
        console.log('高德地图脚本标签已存在，等待加载完成');
        
        // 设置检测间隔，等待AMap对象初始化
        const checkInterval = setInterval(() => {
          if (window.AMap) {
            clearInterval(checkInterval);
            isAMapLoaded = true;
            
            loadAMapUI()
              .then(() => {
                clearTimeoutIfExists();
                resolve();
              })
              .catch(error => {
                clearTimeoutIfExists();
                console.error('加载AMapUI失败, 但继续使用地图核心功能', error);
                // 即使UI加载失败也仍然可以使用地图核心功能
                resolve();
              });
          }
        }, 100);
        
        return;
      }
      
      // 创建新的脚本元素
      const script = document.createElement('script');
      script.id = 'amap-script';
      script.type = 'text/javascript';
      // 确保使用HTTPS协议
      const apiUrl = MAP_CONFIG.aMapURL.replace('http:', '');
      script.src = `https:${apiUrl.startsWith('//') ? '' : '//'}${apiUrl.replace(/^\/\//, '')}${MAP_CONFIG.apiKey}`;
      script.async = true;
      script.defer = true;
      script.crossOrigin = 'anonymous';
      
      // 错误处理
      script.onerror = (event) => {
        clearTimeoutIfExists();
        const error = new Error('加载高德地图API失败');
        console.error(error, event);
        reject(error);
        loadingPromise = null;
      };
      
      // 加载完成处理
      script.onload = () => {
        console.log('高德地图API加载成功');
        
        // 检查AMap对象是否可用
        if (!window.AMap) {
          clearTimeoutIfExists();
          const error = new Error('高德地图API加载成功，但AMap对象不存在');
          console.error(error);
          reject(error);
          loadingPromise = null;
          return;
        }
        
        // 修补AMap API以增强稳定性
        patchAMapAPI();
        
        isAMapLoaded = true;
        
        // 加载UI库
        loadAMapUI()
          .then(() => {
            clearTimeoutIfExists();
            console.log('高德地图依赖库加载完成');
            resolve();
          })
          .catch(error => {
            clearTimeoutIfExists();
            console.error('加载AMapUI失败, 但继续使用地图核心功能', error);
            // 即使UI加载失败也仍然可以使用地图核心功能
            resolve();
          });
      };
      
      // 将脚本添加到文档
      document.head.appendChild(script);
      console.log('高德地图API脚本已添加到文档', script.src);
      
    } catch (error) {
      clearTimeoutIfExists();
      console.error('加载高德地图API过程中发生错误', error);
      reject(error);
      loadingPromise = null;
    }
  });
  
  return loadingPromise;
};

/**
 * 清除超时计时器
 */
const clearTimeoutIfExists = () => {
  if (timeoutId) {
    clearTimeout(timeoutId);
    timeoutId = null;
  }
};

/**
 * 加载高德地图UI库
 * @returns 加载完成的Promise
 */
const loadAMapUI = (): Promise<void> => {
  // 如果UI已加载，直接返回成功
  if (isAMapUILoaded || window.AMapUI) {
    isAMapUILoaded = true;
    return Promise.resolve();
  }

  return new Promise<void>((resolve, reject) => {
    try {
      // 检查是否已经存在脚本标签
      const existingScript = document.getElementById('amap-ui-script');
      if (existingScript) {
        console.log('高德地图UI库脚本已存在，等待加载完成');
        
        // 设置检测间隔，等待AMapUI对象初始化
        const checkInterval = setInterval(() => {
          if (window.AMapUI) {
            clearInterval(checkInterval);
            isAMapUILoaded = true;
            resolve();
          }
        }, 100);
        
        return;
      }
      
      // 创建UI脚本元素
      const script = document.createElement('script');
      script.id = 'amap-ui-script';
      script.type = 'text/javascript';
      // 确保使用HTTPS协议
      const uiUrl = MAP_CONFIG.uiURL.replace('http:', '');
      script.src = `https:${uiUrl.startsWith('//') ? '' : '//'}${uiUrl.replace(/^\/\//, '')}`;
      script.async = true;
      script.defer = true;
      script.crossOrigin = 'anonymous';
      
      // 错误处理
      script.onerror = (event) => {
        console.error('加载高德地图UI库失败', event);
        try {
          document.head.removeChild(script);
        } catch (err) {
          // 忽略删除失败错误
        }
        reject(new Error('加载高德地图UI库失败'));
      };
      
      // 加载成功处理
      script.onload = () => {
        // 短暂延迟确保AMapUI对象已初始化
        setTimeout(() => {
          if (!window.AMapUI) {
            console.warn('高德地图UI库脚本加载完成，但AMapUI对象不存在');
            // 对于UI，选择不拒绝promise - 核心功能仍可用
            resolve();
            return;
          }
          
          console.log('高德地图UI库加载成功');
          isAMapUILoaded = true;
          resolve();
        }, 100);
      };
      
      // 添加脚本到文档
      document.head.appendChild(script);
      console.log('高德地图UI库脚本已添加到文档', script.src);
      
    } catch (error) {
      console.warn('加载高德地图UI库过程中发生错误，但继续使用核心功能', error);
      // 对于UI错误，选择不拒绝promise - 核心功能仍可用
      resolve();
    }
  });
};

/**
 * 修补高德地图API，增强稳定性
 */
export const patchAMapAPI = () => {
  if (typeof window === 'undefined' || !window.AMap) {
    return;
  }
  
  try {
    // 添加任何需要的修补内容
    console.log('增强高德地图API稳定性');
  } catch (error) {
    console.warn('修补高德地图API失败', error);
  }
}; 