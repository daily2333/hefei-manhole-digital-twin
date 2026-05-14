import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { ManholeRealTimeData } from '../typings';
import { generateMockRealTimeData } from '../mock-data/manholes';

const DEFAULT_INTERVAL = 3600000;
const CACHE_CLEANUP_INTERVAL = 3600000;
const CACHE_EXPIRATION_TIME = 6 * 60 * 60 * 1000;
const MAX_CACHE_ITEMS = 100;

type CacheEntry = {
  data: ManholeRealTimeData;
  timestamp: number;
};

type IdleWindow = Window & {
  requestIdleCallback?: (callback: () => void, options?: { timeout: number }) => number;
};

const globalDataCache = new Map<string, CacheEntry>();
let cacheCleanupTimer: ReturnType<typeof setInterval> | null = null;

const scheduleIdleTask = (callback: () => void) => {
  const idleWindow = window as IdleWindow;

  if (idleWindow.requestIdleCallback) {
    idleWindow.requestIdleCallback(callback, { timeout: 1000 });
    return;
  }

  setTimeout(callback, 0);
};

const cleanupCache = () => {
  const now = Date.now();

  globalDataCache.forEach((value, key) => {
    if (now - value.timestamp > CACHE_EXPIRATION_TIME) {
      globalDataCache.delete(key);
    }
  });

  if (globalDataCache.size <= MAX_CACHE_ITEMS) {
    return;
  }

  const oldestEntries = Array.from(globalDataCache.entries())
    .sort((a, b) => a[1].timestamp - b[1].timestamp)
    .slice(0, globalDataCache.size - MAX_CACHE_ITEMS);

  oldestEntries.forEach(([key]) => {
    globalDataCache.delete(key);
  });
};

const ensureCacheCleanupTimer = () => {
  if (typeof window === 'undefined' || cacheCleanupTimer) {
    return;
  }

  cacheCleanupTimer = setInterval(cleanupCache, CACHE_CLEANUP_INTERVAL);
};

const isSignificantChange = (
  oldData: ManholeRealTimeData,
  newData: ManholeRealTimeData,
  threshold: number
): boolean => {
  if (Math.abs(oldData.temperature - newData.temperature) / Math.max(Math.abs(oldData.temperature), 0.1) > threshold) return true;
  if (Math.abs(oldData.humidity - newData.humidity) / Math.max(Math.abs(oldData.humidity), 0.1) > threshold) return true;
  if (Math.abs(oldData.waterLevel - newData.waterLevel) / Math.max(Math.abs(oldData.waterLevel), 0.1) > threshold) return true;
  if (Math.abs(oldData.batteryLevel - newData.batteryLevel) / Math.max(Math.abs(oldData.batteryLevel), 0.1) > threshold) return true;

  const oldGas = oldData.gasConcentration;
  const newGas = newData.gasConcentration;

  if (Math.abs(oldGas.ch4 - newGas.ch4) / Math.max(Math.abs(oldGas.ch4), 0.1) > threshold) return true;
  if (Math.abs(oldGas.co - newGas.co) / Math.max(Math.abs(oldGas.co), 0.1) > threshold) return true;
  if (Math.abs(oldGas.h2s - newGas.h2s) / Math.max(Math.abs(oldGas.h2s), 0.1) > threshold) return true;
  if (Math.abs(oldGas.o2 - newGas.o2) / Math.max(Math.abs(oldGas.o2), 0.1) > threshold) return true;

  return oldData.coverStatus !== newData.coverStatus;
};

const getCachedOrGeneratedData = (manholeId: string, interval: number) => {
  const cachedData = globalDataCache.get(manholeId);
  if (cachedData && Date.now() - cachedData.timestamp < interval) {
    return cachedData.data;
  }

  const nextData = generateMockRealTimeData(manholeId);
  globalDataCache.set(manholeId, {
    data: nextData,
    timestamp: Date.now()
  });
  return nextData;
};

export const useRealTimeData = (
  manholeId: string,
  interval = DEFAULT_INTERVAL
): ManholeRealTimeData | null => {
  const [realTimeData, setRealTimeData] = useState<ManholeRealTimeData | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastUpdateRef = useRef<string>('');
  const lastUpdateTimeRef = useRef<number>(0);
  const mountedRef = useRef(false);

  useEffect(() => {
    ensureCacheCleanupTimer();
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    const initialData = getCachedOrGeneratedData(manholeId, interval);
    const initialDataString = JSON.stringify(initialData);

    setRealTimeData(initialData);
    lastUpdateRef.current = initialDataString;
    lastUpdateTimeRef.current = Date.now();

    timerRef.current = setInterval(() => {
      if (!mountedRef.current) {
        return;
      }

      if (Date.now() - lastUpdateTimeRef.current < interval / 2) {
        return;
      }

      scheduleIdleTask(() => {
        if (!mountedRef.current) {
          return;
        }

        const nextData = generateMockRealTimeData(manholeId);
        const nextDataString = JSON.stringify(nextData);

        if (!lastUpdateRef.current) {
          setRealTimeData(nextData);
          lastUpdateRef.current = nextDataString;
          lastUpdateTimeRef.current = Date.now();
          globalDataCache.set(manholeId, { data: nextData, timestamp: Date.now() });
          return;
        }

        try {
          const previousData = JSON.parse(lastUpdateRef.current) as ManholeRealTimeData;
          if (!isSignificantChange(previousData, nextData, 0.2)) {
            return;
          }
        } catch {
          // Fall back to applying the update when cached serialization is invalid.
        }

        requestAnimationFrame(() => {
          if (!mountedRef.current) {
            return;
          }

          setRealTimeData(nextData);
          lastUpdateRef.current = nextDataString;
          lastUpdateTimeRef.current = Date.now();
          globalDataCache.set(manholeId, { data: nextData, timestamp: Date.now() });
        });
      });
    }, interval);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [interval, manholeId]);

  return realTimeData;
};

export const useMultiRealTimeData = (
  manholeIds: string[],
  interval = DEFAULT_INTERVAL
): Map<string, ManholeRealTimeData> => {
  const [realTimeDataMap, setRealTimeDataMap] = useState<Map<string, ManholeRealTimeData>>(new Map());
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastUpdateMapRef = useRef<Record<string, string>>({});
  const mountedRef = useRef(false);
  const processingRef = useRef(false);
  const updateCounterRef = useRef(0);
  const stableDataMap = useRef<Map<string, ManholeRealTimeData>>(new Map());
  const previousIdsRef = useRef<string[]>([]);

  useEffect(() => {
    ensureCacheCleanupTimer();
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
    };
  }, []);

  const stableIds = useMemo(() => [...manholeIds].sort(), [manholeIds.join(',')]);

  const generateData = useCallback((id: string) => {
    return getCachedOrGeneratedData(id, interval);
  }, [interval]);

  useEffect(() => {
    const idsChanged =
      stableIds.length !== previousIdsRef.current.length ||
      stableIds.some((id) => !previousIdsRef.current.includes(id)) ||
      previousIdsRef.current.some((id) => !stableIds.includes(id));

    if (idsChanged) {
      const initialMap = new Map(stableDataMap.current);
      const batchSize = 3;
      const batchInterval = 100;

      for (let i = 0; i < stableIds.length; i += batchSize) {
        const batchIds = stableIds.slice(i, i + batchSize);

        setTimeout(() => {
          if (!mountedRef.current) {
            return;
          }

          const nextMap = new Map(initialMap);
          batchIds.forEach((id) => {
            const data = generateData(id);
            nextMap.set(id, data);
            lastUpdateMapRef.current[id] = JSON.stringify(data);
          });

          stableDataMap.current = nextMap;
          setRealTimeDataMap(nextMap);
        }, (i / batchSize) * batchInterval);
      }

      previousIdsRef.current = [...stableIds];
    }

    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    timerRef.current = setInterval(() => {
      if (!mountedRef.current || processingRef.current || stableIds.length === 0) {
        return;
      }

      processingRef.current = true;
      updateCounterRef.current += 1;

      if (updateCounterRef.current % 20 !== 0) {
        processingRef.current = false;
        return;
      }

      scheduleIdleTask(() => {
        if (!mountedRef.current) {
          processingRef.current = false;
          return;
        }

        setRealTimeDataMap((prevMap) => {
          const nextMap = new Map(prevMap);
          const batchSize = 2;
          const batchCount = Math.max(1, Math.ceil(stableIds.length / batchSize));
          const batchIndex = Math.floor((updateCounterRef.current / 20) % batchCount);
          const batchIds = stableIds.slice(batchIndex * batchSize, (batchIndex + 1) * batchSize);

          let hasChanges = false;

          batchIds.forEach((id) => {
            const nextData = generateData(id);
            const serialized = JSON.stringify(nextData);

            let shouldUpdate = true;
            const previousSerialized = lastUpdateMapRef.current[id];

            if (previousSerialized) {
              try {
                const previousData = JSON.parse(previousSerialized) as ManholeRealTimeData;
                shouldUpdate = isSignificantChange(previousData, nextData, 0.3);
              } catch {
                shouldUpdate = true;
              }
            }

            if (shouldUpdate) {
              nextMap.set(id, nextData);
              lastUpdateMapRef.current[id] = serialized;
              hasChanges = true;
            }
          });

          processingRef.current = false;

          if (!hasChanges) {
            return prevMap;
          }

          stableDataMap.current = nextMap;
          return nextMap;
        });
      });
    }, interval);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [generateData, interval, stableIds]);

  return realTimeDataMap;
};
