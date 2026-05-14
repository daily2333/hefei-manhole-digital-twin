/**
 * 高德地图信息窗口组件
 */
import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { AMapInfoWindowProps } from './types';
import { createSafePixel } from '../../utils/mapHelpers';

// 高德地图信息窗口组件
export const AMapInfoWindow: React.FC<AMapInfoWindowProps> = ({
  position,
  content,
  title,
  visible = true,
  closeWhenClickMap = true,
  autoMove = true,
  events = {},
  children,
  onClose,
  __map__
}) => {
  // 状态
  const infoWindowRef = useRef<any>(null);
  const [contentContainer, setContentContainer] = useState<HTMLDivElement | null>(null);
  const contentRoot = useRef<any>(null);
  
  // 创建信息窗口
  useEffect(() => {
    if (!__map__) return;
    
    // 创建信息窗口
    const createInfoWindow = async () => {
      try {
        // 检查API和地图实例
        if (!__map__) {
          throw new Error('地图实例不可用');
        }
        
        // 创建信息窗口选项
        const options: Record<string, any> = {
          position: position,
          title: title,
          closeWhenClickMap: closeWhenClickMap,
          autoMove: autoMove,
          offset: createSafePixel(0, -30)
        };
        
        // 处理信息窗口内容
        if (content && !children) {
          options.content = content;
        }
        
        // 获取AMap构造函数并创建信息窗口
        let AMap;
        // 尝试从地图实例获取构造函数
        if (__map__.constructor && __map__.constructor.__proto__) {
          AMap = __map__.constructor.__proto__.constructor;
        }
        // 尝试从全局获取
        if (!AMap && window.AMap) {
          AMap = window.AMap;
        }
        // 如果都没有，抛出错误
        if (!AMap) {
          throw new Error('无法获取AMap构造函数');
        }
        
        // 创建信息窗口
        const infoWindow = new AMap.InfoWindow(options);
        
        // 注册信息窗口事件
        Object.entries(events).forEach(([eventName, handler]) => {
          if (typeof handler === 'function') {
            infoWindow.on(eventName, handler);
          }
        });
        
        // 处理关闭回调
        if (onClose && typeof onClose === 'function') {
          infoWindow.on('close', onClose);
        }
        
        // 保存信息窗口实例
        infoWindowRef.current = infoWindow;
        
        // 创建React内容容器
        if (children) {
          // 创建内容容器
          const div = document.createElement('div');
          div.className = 'amap-info-window-content';
          setContentContainer(div);
          
          // 创建React根
          if (!contentRoot.current) {
            contentRoot.current = createRoot(div);
          }
          
          // 设置信息窗口内容
          infoWindow.setContent(div);
        }
        
        // 显示信息窗口
        if (visible) {
          infoWindow.open(__map__, position);
        }
        
        console.log('信息窗口创建成功', options);
      } catch (error) {
        console.error('创建信息窗口失败:', error);
      }
    };
    
    createInfoWindow();
    
    // 清理函数
    return () => {
      if (infoWindowRef.current) {
        try {
          // 关闭信息窗口
          infoWindowRef.current.close();
          infoWindowRef.current = null;
        } catch (error) {
          console.warn('清理信息窗口失败:', error);
        }
      }
      
      if (contentRoot.current) {
        try {
          contentRoot.current.unmount();
          contentRoot.current = null;
        } catch (error) {
          console.warn('清理React内容失败:', error);
        }
      }
    };
  }, [__map__]);
  
  // 更新信息窗口位置
  useEffect(() => {
    if (!infoWindowRef.current) return;
    
    try {
      // 更新位置
      infoWindowRef.current.setPosition(position);
    } catch (error) {
      console.warn('更新信息窗口位置失败:', error);
    }
  }, [position]);
  
  // 更新信息窗口可见性
  useEffect(() => {
    if (!infoWindowRef.current || !__map__) return;
    
    try {
      if (visible) {
        infoWindowRef.current.open(__map__, position);
      } else {
        infoWindowRef.current.close();
      }
    } catch (error) {
      console.warn('更新信息窗口可见性失败:', error);
    }
  }, [visible, __map__, position]);
  
  // 渲染React内容
  useEffect(() => {
    if (!contentContainer || !contentRoot.current || !children) return;
    
    try {
      // 渲染React内容
      contentRoot.current.render(
        <div className="amap-info-window-content-inner">
          {children}
        </div>
      );
    } catch (error) {
      console.warn('渲染React内容失败:', error);
    }
  }, [contentContainer, children]);
  
  // 组件不渲染任何内容
  return null;
}; 