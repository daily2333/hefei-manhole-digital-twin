import React, { useEffect, useState } from 'react';
import { Alert, Card, Spin } from 'antd';
import ReportContainer from '../components/statistics/ReportContainer';
import { ManholeInfo, ManholeStatus } from '../typings';

const PAGE_TITLE = '\u667a\u80fd\u4e95\u76d6\u7edf\u8ba1\u62a5\u8868';
const PAGE_EXTRA =
  '\u67e5\u770b\u4e0d\u540c\u65f6\u95f4\u5468\u671f\u7684\u4e95\u76d6\u72b6\u6001\u548c\u8fd0\u884c\u7edf\u8ba1';
const LOAD_ERROR_TITLE = '\u6570\u636e\u52a0\u8f7d\u9519\u8bef';
const LOAD_ERROR_DESC = '\u52a0\u8f7d\u4e95\u76d6\u6570\u636e\u5931\u8d25\uff0c\u8bf7\u7a0d\u540e\u91cd\u8bd5';
const LOADING_TEXT = '\u6b63\u5728\u52a0\u8f7d\u6570\u636e...';

const SENSOR_TYPES = [
  '\u6e29\u5ea6',
  '\u6e7f\u5ea6',
  '\u6c14\u4f53',
  '\u6c34\u4f4d',
];

const DISTRICTS = [
  '\u5317\u533a',
  '\u5357\u533a',
  '\u4e1c\u533a',
];

const MATERIALS = [
  '\u94f8\u94c1',
  '\u590d\u5408\u6750\u6599',
];

const createMockManholes = (): ManholeInfo[] => {
  const baseTime = Date.UTC(2026, 0, 1, 0, 0, 0);

  return Array.from({ length: 20 }, (_, index) => {
    const id = index + 1;
    const installationTime = new Date(baseTime - id * 15 * 24 * 60 * 60 * 1000).toISOString();
    const maintenanceTime = new Date(baseTime - id * 3 * 24 * 60 * 60 * 1000).toISOString();

    return {
      id: `MH-${String(id).padStart(4, '0')}`,
      name: `\u4e95\u76d6 ${id}`,
      status:
        index % 5 === 0
          ? ManholeStatus.Alarm
          : index % 4 === 0
            ? ManholeStatus.Warning
            : index % 3 === 0
              ? ManholeStatus.Maintenance
              : index % 7 === 0
                ? ManholeStatus.Offline
                : ManholeStatus.Normal,
      location: {
        district: DISTRICTS[index % DISTRICTS.length],
        address: `\u6d4b\u8bd5\u5730\u5740 ${id}`,
        latitude: 30 + index * 0.03,
        longitude: 120 + index * 0.03,
        city: '\u5408\u80a5\u5e02',
        province: '\u5b89\u5fbd\u7701',
      },
      model: `\u6a21\u578b-${(index % 3) + 1}`,
      manufacturer: `\u5236\u9020\u5546-${(index % 4) + 1}`,
      installationDate: installationTime,
      material: MATERIALS[index % MATERIALS.length],
      diameter: 70 + (index % 3) * 10,
      depth: 80 + (index % 4) * 5,
      manager: `\u7ba1\u7406\u5458-${(index % 5) + 1}`,
      contactPhone: `1381234${String(index + 1000).slice(1)}`,
      lastMaintenanceTime: maintenanceTime,
      deviceId: `DEV-${String(id).padStart(4, '0')}`,
      sensorTypes: SENSOR_TYPES.slice(0, (index % SENSOR_TYPES.length) + 1),
    };
  });
};

const MOCK_MANHOLES = createMockManholes();

const DailyReportPage: React.FC = () => {
  const [manholes, setManholes] = useState<ManholeInfo[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const timerId = window.setTimeout(() => {
      if (!mounted) {
        return;
      }

      try {
        setManholes(MOCK_MANHOLES);
        setError(null);
      } catch (loadError) {
        console.error('Failed to load daily report data:', loadError);
        setError(LOAD_ERROR_DESC);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => {
      mounted = false;
      window.clearTimeout(timerId);
    };
  }, []);

  return (
    <Card title={PAGE_TITLE} extra={<span>{PAGE_EXTRA}</span>}>
      {error && (
        <Alert
          message={LOAD_ERROR_TITLE}
          description={error}
          type="error"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      {loading ? (
        <Card>
          <div
            style={{
              textAlign: 'center',
              padding: '50px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            <Spin size="large" />
            <span>{LOADING_TEXT}</span>
          </div>
        </Card>
      ) : (
        <ReportContainer manholes={manholes} />
      )}
    </Card>
  );
};

export default DailyReportPage;