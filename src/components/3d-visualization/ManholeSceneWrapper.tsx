import React, { lazy, Suspense } from 'react';
import { Spin } from 'antd';
import { ManholeInfo, ManholeRealTimeData } from '../../typings';

const DigitalTwinScene = lazy(() => import('./DigitalTwinScene'));

interface ManholeSceneWrapperProps {
  manholes: ManholeInfo[];
  realTimeDataMap: Map<string, ManholeRealTimeData>;
  onSelectManhole?: (manholeId: string) => void;
  selectedManholeId?: string;
  isNightMode?: boolean;
}

const LoadingFallback: React.FC = () => (
  <div
    style={{
      width: '100%',
      height: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#0a1525',
    }}
  >
    <Spin size="large" tip="加载数字孪生场景..." />
  </div>
);

const ManholeSceneWrapper: React.FC<ManholeSceneWrapperProps> = ({
  manholes,
  realTimeDataMap,
  onSelectManhole,
  selectedManholeId,
  isNightMode,
}) => {
  return (
    <div style={{ width: '100%', height: '100%', minHeight: 500 }}>
      <Suspense fallback={<LoadingFallback />}>
        <DigitalTwinScene
          manholes={manholes}
          realTimeDataMap={realTimeDataMap}
          onSelectManhole={onSelectManhole}
          selectedManholeId={selectedManholeId}
          isNightMode={isNightMode}
        />
      </Suspense>
    </div>
  );
};

export default ManholeSceneWrapper;
