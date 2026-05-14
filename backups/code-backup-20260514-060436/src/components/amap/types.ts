/**
 * 高德地图组件类型定义
 */

import React from 'react';

// 地图实例类型
export interface AMapInstance {
  // 地图实例上的方法和属性
  getCenter: () => { lng: number; lat: number };
  setCenter: (position: [number, number]) => void;
  setZoom: (zoom: number) => void;
  setZoomAndCenter: (zoom: number, center: [number, number]) => void;
  destroy: () => void;
  plugin: (plugins: string[], callback: () => void) => void;
  addControl: (control: any) => void;
  on: (event: string, callback: (e?: any) => void) => void;
  off?: (event?: string, callback?: Function) => void;
  clearMarkers?: () => void;
  setMap?: (map: AMapInstance | null) => void;
  [key: string]: any; // 其他可能的方法
}

// 扩展Window接口，但避免重复声明冲突
declare global {
  // 使用 & 合并现有的 Window 接口，而不是完全重新定义
  interface Window {
    AMap: {
      Map: new (container: HTMLElement, options: any) => AMapInstance;
      ToolBar: new () => any;
      Scale: new () => any;
      Marker: new (options: any) => any;
      Pixel: new (x: number, y: number) => any;
      LngLat: new (lng: number, lat: number) => any;
      InfoWindow: new (options: any) => any;
      MarkerClusterer: new (map: AMapInstance, markers: any[], options: any) => any;
      [propName: string]: any;
    };
    initAMap?: () => void;
  }
}

// 地图组件props
export interface AMapProps {
  center?: [number, number]; // 中心点坐标
  zoom?: number; // 缩放级别
  style?: React.CSSProperties; // 样式
  className?: string; // 类名
  children?: React.ReactNode; // 子组件
  events?: {
    [key: string]: (e: any) => void;
  }; // 事件回调
  onMapLoaded?: (map: AMapInstance) => void; // 地图加载完成回调
  onMarkerClick?: (id: string, position: [number, number]) => void; // 标记点点击回调
}

// 标记点组件props
export interface AMapMarkerProps {
  position: [number, number]; // 标记点位置
  __map__?: any; // 地图实例引用，由父组件注入
  // 添加缺失的属性
  id?: string; // 标记点ID
  onClick?: (id: string, position: [number, number]) => void; // 点击回调
  className?: string; // 自定义类名
  status?: string; // 状态
  icon?: any;
  title?: string;
  label?: any;
  content?: React.ReactNode;
  extData?: any;
  draggable?: boolean;
  visible?: boolean;
  zIndex?: number;
  animation?: string;
  clickable?: boolean;
  events?: {
    [key: string]: (e: any) => void;
  };
  children?: React.ReactNode;
}

// 信息窗体props
export interface AMapInfoWindowProps {
  position: [number, number]; // 信息窗体位置
  content?: React.ReactNode; // 窗体内容
  visible?: boolean; // 是否可见
  __map__?: any; // 地图实例引用，由父组件注入
  // 添加缺失的属性
  title?: string;
  closeWhenClickMap?: boolean;
  autoMove?: boolean;
  events?: {
    [key: string]: (e: any) => void;
  };
  children?: React.ReactNode;
  onClose?: () => void;
}

// 聚合点props
export interface AMapClusterProps {
  __map__?: any; // 地图实例引用
  data?: Array<{
    position: [number, number];
    [key: string]: any;
  }>;
  gridSize?: number; // 聚合计算时网格的像素大小
  averageCenter?: boolean; // 是否取所有标记的平均值作为聚合点的中心
  styles?: any[]; // 聚合点的样式
  maxZoom?: number; // 最大的聚合级别
  minClusterSize?: number; // 最小聚合数量
  zoomOnClick?: boolean; // 点击聚合点时是否放大
  events?: { // 事件回调
    [key: string]: (...args: any[]) => void;
  };
  children?: React.ReactNode; // 子组件
}

// 给子组件的props类型
export interface MapChildProps {
  __map__?: AMapInstance | null; // 地图实例引用
  [key: string]: any; // 允许其他属性
} 