/**
 * 高德地图聚合点组件
 */
import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { AMapClusterProps } from './types';
import { loadAMapScript } from '../../utils/mapLoader';

// AMap集群组件
const AMapCluster: React.FC<AMapClusterProps> = ({
  __map__,
  data = [],
  gridSize = 80,
  averageCenter = true,
  styles,
  maxZoom = 18,
  minClusterSize = 2,
  zoomOnClick = true,
  events,
  children
}) => {
  const clusterRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const contentContainerRef = useRef<HTMLDivElement | null>(null);
  const contentRootRef = useRef<any>(null);
  
  // 用于子元素的DOM容器状态
  const [childrenContainer, setChildrenContainer] = useState<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!__map__ || !window.AMap) {
      console.warn('AMapCluster: 地图实例或AMap对象不可用');
      return;
    }

    // 清理之前的标记和聚合器
    const cleanup = () => {
      if (clusterRef.current) {
        try {
          console.log('AMapCluster: 清理现有聚合器');
          clusterRef.current.clearMarkers();
          // 移除事件监听
          if (clusterRef.current.off && typeof clusterRef.current.off === 'function') {
            clusterRef.current.off();
          }
          clusterRef.current = null;
        } catch (error) {
          console.error('AMapCluster: 清理聚合器时出错', error);
        }
      }
      
      if (markersRef.current.length > 0) {
        try {
          console.log(`AMapCluster: 清理 ${markersRef.current.length} 个标记点`);
          markersRef.current.forEach(marker => {
            marker && marker.setMap && marker.setMap(null);
          });
          markersRef.current = [];
        } catch (error) {
          console.error('AMapCluster: 清理标记点时出错', error);
        }
      }
      
      // 清理 React 渲染的子元素
      if (contentRootRef.current) {
        try {
          contentRootRef.current.unmount();
          contentRootRef.current = null;
        } catch (error) {
          console.error('AMapCluster: 清理React内容时出错', error);
        }
      }
    };

    cleanup();

    try {
      console.log('AMapCluster: 开始创建标记点和聚合器');
      
      // 创建标记
      const markers = data.map(item => {
        const { position, ...rest } = item;
        
        // 确保 position 不会从 rest 中重复传入
        const marker = new window.AMap.Marker({
          ...rest,
          position: position ? new window.AMap.LngLat(position[0], position[1]) : undefined
        });
        
        return marker;
      });
      
      markersRef.current = markers;
      console.log(`AMapCluster: 创建了 ${markers.length} 个标记点`);

      // 设置聚合器选项
      const options = {
        gridSize,
        maxZoom,
        averageCenter,
        styles,
        minClusterSize,
        zoomOnClick,
      };
      
      // 初始化聚合器
      const clusterer = new window.AMap.MarkerClusterer(
        __map__,
        markers,
        options
      );
      
      clusterRef.current = clusterer;
      console.log('AMapCluster: 聚合器创建成功', options);

      // 注册事件
      if (events) {
        Object.keys(events).forEach(eventName => {
          if (typeof events[eventName] === 'function') {
            console.log(`AMapCluster: 注册事件 "${eventName}"`);
            clusterer.on(eventName, (...args: any[]) => {
              try {
                events[eventName](...args);
              } catch (error) {
                console.error(`AMapCluster: 事件 "${eventName}" 处理出错`, error);
              }
            });
          } else {
            console.warn(`AMapCluster: 事件 "${eventName}" 不是有效的函数`);
          }
        });
      }
      
      // 如果有子元素，创建容器并渲染
      if (children) {
        const createChildrenContainer = () => {
          try {
            const div = document.createElement('div');
            div.className = 'amap-cluster-children-container';
            div.style.position = 'absolute';
            div.style.top = '10px';
            div.style.left = '10px';
            div.style.zIndex = '100';
            
            // 将容器添加到地图容器
            if (__map__.getContainer()) {
              __map__.getContainer().appendChild(div);
              
              // 创建 React 根
              if (!contentRootRef.current) {
                contentRootRef.current = createRoot(div);
              }
              
              // 设置容器状态，触发子元素渲染
              contentContainerRef.current = div;
              setChildrenContainer(div);
              
              console.log('AMapCluster: 创建了子元素容器');
            } else {
              console.warn('AMapCluster: 无法获取地图容器');
            }
          } catch (error) {
            console.error('AMapCluster: 创建子元素容器出错', error);
          }
        };
        
        createChildrenContainer();
      }
    } catch (error) {
      console.error('AMapCluster: 创建聚合器时出错', error);
    }

    return cleanup;
  }, [__map__, data, gridSize, averageCenter, styles, maxZoom, minClusterSize, zoomOnClick, events]);
  
  // 处理子元素渲染
  useEffect(() => {
    if (!children || !contentContainerRef.current || !contentRootRef.current) return;
    
    try {
      // 渲染子元素到容器
      contentRootRef.current.render(
        <div className="amap-cluster-children-wrapper">
          {children}
        </div>
      );
      console.log('AMapCluster: 子元素渲染成功');
    } catch (error) {
      console.error('AMapCluster: 渲染子元素时出错', error);
    }
  }, [children, childrenContainer]);

  // 组件不渲染实际DOM内容，子元素通过React Portal渲染
  return null;
};

export default AMapCluster; 