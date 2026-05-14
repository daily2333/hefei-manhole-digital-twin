import React from 'react';

export interface AMapInstance {
  getCenter: () => { lng: number; lat: number };
  setCenter: (position: [number, number]) => void;
  setZoom: (zoom: number) => void;
  setZoomAndCenter: (zoom: number, center: [number, number]) => void;
  destroy: () => void;
  plugin: (plugins: string[], callback: () => void) => void;
  addControl: (control: unknown) => void;
  on: (event: string, callback: (e?: unknown) => void) => void;
  off?: (event?: string, callback?: Function) => void;
  clearMarkers?: () => void;
  setMap?: (map: AMapInstance | null) => void;
  [key: string]: any;
}

declare global {
  interface Window {
    AMap: {
      Map: new (container: HTMLElement, options: any) => AMapInstance;
      ToolBar: new () => unknown;
      Scale: new () => unknown;
      Marker: new (options: any) => any;
      Pixel: new (x: number, y: number) => unknown;
      LngLat: new (lng: number, lat: number) => unknown;
      InfoWindow: new (options: any) => any;
      MarkerClusterer: new (map: AMapInstance, markers: any[], options: any) => any;
      [propName: string]: any;
    };
    initAMap?: () => void;
  }
}

export interface AMapProps {
  center?: [number, number];
  zoom?: number;
  style?: React.CSSProperties;
  className?: string;
  children?: React.ReactNode;
  events?: {
    [key: string]: (e: any) => void;
  };
  onMapLoaded?: (map: AMapInstance) => void;
  onError?: (message: string) => void;
  onMarkerClick?: (id: string, position: [number, number]) => void;
}

export interface AMapMarkerProps {
  position: [number, number];
  __map__?: any;
  id?: string;
  onClick?: (id: string, position: [number, number]) => void;
  className?: string;
  status?: string;
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

export interface AMapInfoWindowProps {
  position: [number, number];
  content?: React.ReactNode;
  visible?: boolean;
  __map__?: any;
  title?: string;
  closeWhenClickMap?: boolean;
  autoMove?: boolean;
  events?: {
    [key: string]: (e: any) => void;
  };
  children?: React.ReactNode;
  onClose?: () => void;
}

export interface AMapClusterProps {
  __map__?: any;
  data?: Array<{
    position: [number, number];
    [key: string]: any;
  }>;
  gridSize?: number;
  averageCenter?: boolean;
  styles?: any[];
  maxZoom?: number;
  minClusterSize?: number;
  zoomOnClick?: boolean;
  events?: {
    [key: string]: (...args: any[]) => void;
  };
  children?: React.ReactNode;
}

export interface MapChildProps {
  __map__?: AMapInstance | null;
  [key: string]: any;
}
