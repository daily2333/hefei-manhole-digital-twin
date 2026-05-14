/**
 * 高德地图标记点组件
 */
import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { AMapMarkerProps } from './types';
import { createSafePixel } from '../../utils/mapHelpers';

// 高德地图标记点组件
export const AMapMarker: React.FC<AMapMarkerProps> = ({
  position,
  icon,
  title,
  label,
  content,
  extData,
  draggable = false,
  visible = true,
  zIndex = 10,
  animation,
  clickable = true,
  events = {},
  children,
  __map__
}) => {
  // 状态
  const markerRef = useRef<any>(null);
  const [contentContainer, setContentContainer] = useState<HTMLDivElement | null>(null);
  const contentRoot = useRef<any>(null);
  const [iconLoaded, setIconLoaded] = useState(false);
  const [markerIcon, setMarkerIcon] = useState(icon);
  
  // 处理异步加载的图标
  useEffect(() => {
    const loadIcon = async () => {
      try {
        // 如果icon是Promise，等待它解析
        if (icon && typeof icon.then === 'function') {
          const resolvedIcon = await icon;
          setMarkerIcon(resolvedIcon);
          setIconLoaded(true);
        } else {
          setMarkerIcon(icon);
          setIconLoaded(true);
        }
      } catch (error) {
        console.warn('加载标记点图标失败:', error);
        setIconLoaded(true); // 即使失败也标记为已加载
      }
    };
    
    loadIcon();
  }, [icon]);
  
  // 创建标记点
  useEffect(() => {
    if (!__map__ || !iconLoaded) return;
    
    // 创建标记点
    const createMarker = async () => {
      try {
        // 检查API和地图实例
        if (!__map__) {
          throw new Error('地图实例不可用');
        }
        
        // 创建标记点选项
        const options: Record<string, any> = {
          position: position,
          title: title,
          extData: extData,
          draggable: draggable,
          visible: visible,
          zIndex: zIndex,
          clickable: clickable
        };
        
        // 处理标记点图标
        if (markerIcon) {
          options.icon = markerIcon;
        }
        
        // 处理标记点标签
        if (label) {
          options.label = {
            content: label.content || '',
            offset: label.offset ? createSafePixel(label.offset[0], label.offset[1]) : undefined,
            direction: label.direction || 'right'
          };
        }
        
        // 处理标记点内容
        if (content && !children) {
          options.content = content;
        }
        
        // 处理标记点动画
        if (animation && window.AMap && window.AMap.Marker) {
          options.animation = animation;
        }
        
        // 获取AMap构造函数并创建标记点
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
        
        // 创建标记点
        const marker = new AMap.Marker(options);
        
        // 注册标记点事件
        Object.entries(events).forEach(([eventName, handler]) => {
          if (typeof handler === 'function') {
            marker.on(eventName, handler);
          }
        });
        
        // 添加到地图
        marker.setMap(__map__);
        
        // 保存标记点实例
        markerRef.current = marker;
        
        // 创建React内容容器
        if (children) {
          // 创建内容容器
          const div = document.createElement('div');
          setContentContainer(div);
          
          // 创建React根
          if (!contentRoot.current) {
            contentRoot.current = createRoot(div);
          }
          
          // 设置标记点内容
          marker.setContent(div);
        }
        
        console.log('标记点创建成功', options);
      } catch (error) {
        console.error('创建标记点失败:', error);
      }
    };
    
    createMarker();
    
    // 清理函数
    return () => {
      if (markerRef.current) {
        try {
          // 移除标记点
          markerRef.current.setMap(null);
          markerRef.current = null;
        } catch (error) {
          console.warn('清理标记点失败:', error);
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
  }, [__map__, iconLoaded, markerIcon]);
  
  // 更新标记点位置
  useEffect(() => {
    if (!markerRef.current) return;
    
    try {
      // 更新位置
      markerRef.current.setPosition(position);
    } catch (error) {
      console.warn('更新标记点位置失败:', error);
    }
  }, [position]);
  
  // 更新标记点可见性
  useEffect(() => {
    if (!markerRef.current) return;
    
    try {
      if (visible) {
        markerRef.current.show();
      } else {
        markerRef.current.hide();
      }
    } catch (error) {
      console.warn('更新标记点可见性失败:', error);
    }
  }, [visible]);
  
  // 渲染React内容
  useEffect(() => {
    if (!contentContainer || !contentRoot.current || !children) return;
    
    try {
      // 渲染React内容
      contentRoot.current.render(
        <div style={{ cursor: 'pointer' }}>
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