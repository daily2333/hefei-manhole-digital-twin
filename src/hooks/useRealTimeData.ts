import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { ManholeRealTimeData } from '../typings';
import { fetchRealtimeByManhole } from '../services/api';

const DEFAULT_INTERVAL = 30000;
const CACHE_CLEANUP_INTERVAL = 3600000;
const CACHE_EXPIRATION_TIME = 6 * 60 * 60 * 1000;
const MAX_CACHE_ITEMS = 100;

type CacheEntry = { data: ManholeRealTimeData; timestamp: number };

type IdleWindow = Window & {
  requestIdleCallback?: (callback: () => void, options?: { timeout: number }) => number;
};

const globalDataCache = new Map<string, CacheEntry>();
let cacheCleanupTimer: ReturnType<typeof setInterval> | null = null;
let cacheRefCount = 0;

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
    if (now - value.timestamp > CACHE_EXPIRATION_TIME) globalDataCache.delete(key);
  });
  if (globalDataCache.size <= MAX_CACHE_ITEMS) return;
  const oldest = Array.from(globalDataCache.entries()).sort((a, b) => a[1].timestamp - b[1].timestamp)
    .slice(0, globalDataCache.size - MAX_CACHE_ITEMS);
  oldest.forEach(([key]) => globalDataCache.delete(key));
};

const ensureCacheCleanupTimer = () => {
  if (typeof window === 'undefined') return;
  cacheRefCount++;
  if (cacheCleanupTimer) return;
  cacheCleanupTimer = setInterval(cleanupCache, CACHE_CLEANUP_INTERVAL);
};

const releaseCacheCleanupTimer = () => {
  cacheRefCount--;
  if (cacheRefCount <= 0 && cacheCleanupTimer) {
    clearInterval(cacheCleanupTimer);
    cacheCleanupTimer = null;
    cacheRefCount = 0;
  }
};

const isSignificantChange = (oldData: ManholeRealTimeData, newData: ManholeRealTimeData, threshold: number): boolean => {
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

const fetchWithCache = async (manholeId: string, interval: number): Promise<ManholeRealTimeData> => {
  const cached = globalDataCache.get(manholeId);
  if (cached && Date.now() - cached.timestamp < interval) return cached.data;
  try {
    const data = await fetchRealtimeByManhole(manholeId);
    globalDataCache.set(manholeId, { data, timestamp: Date.now() });
    return data;
  } catch {
    if (cached) return cached.data;
    throw new Error(`No data for ${manholeId}`);
  }
};

export const useRealTimeData = (manholeId: string, interval = DEFAULT_INTERVAL): ManholeRealTimeData | null => {
  const [data, setData] = useState<ManholeRealTimeData | null>(null);
  const lastRef = useRef('');
  const lastTimeRef = useRef(0);
  const mountedRef = useRef(false);

  useEffect(() => {
    ensureCacheCleanupTimer();
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      releaseCacheCleanupTimer();
    };
  }, []);

  useEffect(() => {
    fetchWithCache(manholeId, interval).then((d) => {
      if (!mountedRef.current) return;
      setData(d);
      lastRef.current = JSON.stringify(d);
      lastTimeRef.current = Date.now();
    });

    const timer = setInterval(() => {
      if (!mountedRef.current || Date.now() - lastTimeRef.current < interval / 2) return;
      scheduleIdleTask(async () => {
        if (!mountedRef.current) return;
        try {
          const nextData = await fetchWithCache(manholeId, interval);
          if (!lastRef.current) {
            setData(nextData); lastRef.current = JSON.stringify(nextData); lastTimeRef.current = Date.now(); return;
          }
          const prev = JSON.parse(lastRef.current) as ManholeRealTimeData;
          if (!isSignificantChange(prev, nextData, 0.2)) return;
          setData(nextData);
          lastRef.current = JSON.stringify(nextData);
          lastTimeRef.current = Date.now();
        } catch { /* keep current data */ }
      });
    }, interval);

    return () => clearInterval(timer);
  }, [interval, manholeId]);

  return data;
};

export const useMultiRealTimeData = (manholeIds: string[], interval = DEFAULT_INTERVAL): Map<string, ManholeRealTimeData> => {
  const [map, setMap] = useState<Map<string, ManholeRealTimeData>>(new Map());
  const lastRef = useRef<Record<string, string>>({});
  const mountedRef = useRef(false);
  const processingRef = useRef(false);
  const counterRef = useRef(0);
  const stableRef = useRef<Map<string, ManholeRealTimeData>>(new Map());
  const prevIdsRef = useRef<string[]>([]);

  useEffect(() => {
    ensureCacheCleanupTimer();
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      releaseCacheCleanupTimer();
    };
  }, []);

  const stableIds = useMemo(() => [...manholeIds].sort(), [manholeIds.join(',')]);

  const fetchOne = useCallback(async (id: string) => {
    try {
      return await fetchWithCache(id, interval);
    } catch {
      return stableRef.current.get(id) || null;
    }
  }, [interval]);

  useEffect(() => {
    const idsChanged = stableIds.length !== prevIdsRef.current.length ||
      stableIds.some((id) => !prevIdsRef.current.includes(id)) ||
      prevIdsRef.current.some((id) => !stableIds.includes(id));

    if (idsChanged) {
      const batchSize = 3;
      for (let i = 0; i < stableIds.length; i += batchSize) {
        const batch = stableIds.slice(i, i + batchSize);
        setTimeout(async () => {
          if (!mountedRef.current) return;
          for (const id of batch) {
            const d = await fetchOne(id);
            if (d) {
              stableRef.current.set(id, d);
              lastRef.current[id] = JSON.stringify(d);
            }
          }
          if (mountedRef.current) setMap(new Map(stableRef.current));
        }, (i / batchSize) * 100);
      }
      prevIdsRef.current = [...stableIds];
    }

    if (processingRef.current) return;
    const timer = setInterval(() => {
      if (!mountedRef.current || processingRef.current || stableIds.length === 0) return;
      processingRef.current = true;
      counterRef.current += 1;
      if (counterRef.current % 20 !== 0) { processingRef.current = false; return; }
      scheduleIdleTask(async () => {
        if (!mountedRef.current) { processingRef.current = false; return; }
        const batchSize = 2;
        const batchCount = Math.max(1, Math.ceil(stableIds.length / batchSize));
        const batchIdx = Math.floor((counterRef.current / 20) % batchCount);
        const batch = stableIds.slice(batchIdx * batchSize, (batchIdx + 1) * batchSize);
        let changed = false;
        for (const id of batch) {
          const d = await fetchOne(id);
          if (!d) continue;
          const serialized = JSON.stringify(d);
          const prev = lastRef.current[id];
          let shouldUpdate = true;
          if (prev) {
            try { shouldUpdate = isSignificantChange(JSON.parse(prev), d, 0.3); } catch { }
          }
          if (shouldUpdate) {
            stableRef.current.set(id, d);
            lastRef.current[id] = serialized;
            changed = true;
          }
        }
        processingRef.current = false;
        if (changed) setMap(new Map(stableRef.current));
      });
    }, interval);

    return () => clearInterval(timer);
  }, [fetchOne, interval, stableIds]);

  return map;
};
