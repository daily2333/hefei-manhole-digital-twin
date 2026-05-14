import React, { memo, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Spin } from 'antd';
import { ErrorBoundary } from '../layout/ErrorBoundary';
import { AMapInstance, AMapProps, MapChildProps } from './types';
import { MAP_CONFIG } from '../../config/mapConfig';

let amapLoaderPromise: Promise<void> | null = null;

const loadAMapScript = () => {
  if (window.AMap) {
    return Promise.resolve();
  }

  if (amapLoaderPromise) {
    return amapLoaderPromise;
  }

  amapLoaderPromise = new Promise<void>((resolve, reject) => {
    const scriptId = 'manhole-amap-script';
    const existingScript = document.getElementById(scriptId) as HTMLScriptElement | null;

    if (existingScript) {
      existingScript.addEventListener('load', () => resolve(), { once: true });
      existingScript.addEventListener('error', () => reject(new Error('Failed to load AMap script')), { once: true });
      return;
    }

    const script = document.createElement('script');
    script.id = scriptId;
    script.src = `${MAP_CONFIG.aMapURL}${MAP_CONFIG.apiKey}`;
    script.async = true;

    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load AMap script'));

    document.head.appendChild(script);
  });

  return amapLoaderPromise;
};

export const AMap: React.FC<AMapProps> = memo(({
  center = MAP_CONFIG.center,
  zoom = MAP_CONFIG.zoom,
  style,
  className,
  children,
  events = {},
  onMapLoaded
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mapInstance, setMapInstance] = useState<AMapInstance | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let disposed = false;
    let createdMap: AMapInstance | null = null;

    const initMap = async () => {
      try {
        setLoading(true);
        setError(null);

        await loadAMapScript();

        if (disposed || !containerRef.current || !window.AMap) {
          return;
        }

        if ((window as any)._AMapSecurityConfig == null) {
          (window as any)._AMapSecurityConfig = {
            securityJsCode: MAP_CONFIG.securityJsCode
          };
        }

        createdMap = new window.AMap.Map(containerRef.current, {
          center,
          zoom,
          viewMode: '3D',
          mapStyle: 'amap://styles/darkblue',
          features: ['bg', 'road', 'building', 'point']
        });

        createdMap.plugin(['AMap.ToolBar', 'AMap.Scale'], () => {
          createdMap?.addControl(new window.AMap.ToolBar());
          createdMap?.addControl(new window.AMap.Scale());
        });

        Object.entries(events).forEach(([eventName, handler]) => {
          if (typeof handler === 'function') {
            createdMap?.on(eventName, handler);
          }
        });

        createdMap.on('complete', () => {
          if (disposed || !createdMap) {
            return;
          }

          setMapInstance(createdMap);
          setLoading(false);
          onMapLoaded?.(createdMap);
        });
      } catch (initError) {
        if (disposed) {
          return;
        }

        console.error('AMap init failed:', initError);
        setError('地图加载失败，请检查高德配置或网络连接。');
        setLoading(false);
      }
    };

    initMap();

    return () => {
      disposed = true;
      if (createdMap?.destroy) {
        createdMap.destroy();
      }
    };
  }, [center, events, onMapLoaded, zoom]);

  useEffect(() => {
    if (!mapInstance) {
      return;
    }

    mapInstance.setZoomAndCenter(zoom, center);
  }, [center, mapInstance, zoom]);

  const childrenWithMap = useMemo(() => {
    if (!mapInstance) {
      return null;
    }

    return React.Children.map(children, (child) => {
      if (!React.isValidElement(child)) {
        return child;
      }

      return React.cloneElement(child, {
        __map__: mapInstance
      } as MapChildProps);
    });
  }, [children, mapInstance]);

  return (
    <ErrorBoundary>
      <div className={className} style={{ width: '100%', height: '100%', position: 'relative', ...style }}>
        {loading && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(4, 21, 39, 0.55)',
              zIndex: 2
            }}
          >
            <Spin tip="地图加载中..." size="large" />
          </div>
        )}

        {error && (
          <div
            style={{
              position: 'absolute',
              inset: 16,
              zIndex: 3
            }}
          >
            <Alert message="地图异常" description={error} type="error" showIcon />
          </div>
        )}

        <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
        {childrenWithMap}
      </div>
    </ErrorBoundary>
  );
});

export default AMap;
