export type ManholeStatus = 'normal' | 'warning' | 'alarm' | 'offline';

export interface StatusColors {
  emissive: string;
  emissiveIntensity: number;
  beaconOpacity: number;
}

export const STATUS_CONFIG: Record<ManholeStatus, StatusColors> = {
  normal: { emissive: '#00ff88', emissiveIntensity: 0.3, beaconOpacity: 0.15 },
  warning: { emissive: '#ffaa00', emissiveIntensity: 0.5, beaconOpacity: 0.3 },
  alarm: { emissive: '#ff3333', emissiveIntensity: 0.8, beaconOpacity: 0.5 },
  offline: { emissive: '#666666', emissiveIntensity: 0.0, beaconOpacity: 0.0 },
};

export const NIGHT_COLORS = {
  background: '#0a1525',
  gridLine: '#00ffff',
  gridLineOpacity: 0.3,
  road: '#00ffff',
  roadEmissive: 0.8,
  building: '#00ffff',
  buildingEmissive: 0.6,
  ambientIntensity: 0.15,
  directionalIntensity: 0.0,
};

export const DAY_COLORS = {
  background: '#1a2535',
  gridLine: '#4a8fff',
  gridLineOpacity: 0.2,
  road: '#4a8fff',
  roadEmissive: 0.3,
  building: '#4a8fff',
  buildingEmissive: 0.3,
  ambientIntensity: 0.4,
  directionalIntensity: 1.5,
};

export interface HefeiDistrict {
  name: string;
  center: [number, number];
}

export const HEFEI_DISTRICTS: HefeiDistrict[] = [
  { name: '蜀山区', center: [-8, -6] },
  { name: '庐阳区', center: [6, -6] },
  { name: '包河区', center: [6, 6] },
  { name: '瑶海区', center: [-8, 6] },
  { name: '滨湖新区', center: [12, 10] },
];

export interface RoadPath {
  name: string;
  points: [number, number][];
}

export const ROAD_PATHS: RoadPath[] = [
  {
    name: '长江路',
    points: [[-35, 0], [-15, 0], [0, 0], [15, 0], [35, 0]],
  },
  {
    name: '淮河路',
    points: [[-35, -8], [-15, -8], [0, -8], [15, -8], [35, -8]],
  },
  {
    name: '黄山路',
    points: [[-35, 8], [-15, 8], [0, 8], [15, 8], [35, 8]],
  },
  {
    name: '环城路',
    points: [[-12, -12], [12, -12], [12, 12], [-12, 12], [-12, -12]],
  },
  {
    name: '徽州大道',
    points: [[0, -35], [0, -15], [0, 0], [0, 15], [0, 35]],
  },
  {
    name: '马鞍山路',
    points: [[8, -35], [8, -15], [8, 0], [8, 15], [8, 35]],
  },
];

export interface BuildingOutline {
  name: string;
  points: [number, number][];
  height: number;
  isLandmark: boolean;
}

export const BUILDING_OUTLINES: BuildingOutline[] = [
  {
    name: '合肥市政府',
    points: [[-2, -2], [2, -2], [2, 2], [-2, 2]],
    height: 3,
    isLandmark: true,
  },
  {
    name: '合肥火车站',
    points: [[10, -10], [14, -10], [14, -8], [10, -8]],
    height: 2,
    isLandmark: true,
  },
  {
    name: '滨湖新区',
    points: [[14, 8], [20, 8], [20, 14], [14, 14]],
    height: 4,
    isLandmark: true,
  },
  {
    name: '包河区政府',
    points: [[6, 4], [10, 4], [10, 8], [6, 8]],
    height: 2.5,
    isLandmark: true,
  },
  {
    name: '科学岛',
    points: [[-14, 6], [-10, 6], [-10, 10], [-14, 10]],
    height: 1.5,
    isLandmark: true,
  },
  {
    name: '商业建筑群A',
    points: [[-6, -4], [-3, -4], [-3, -1], [-6, -1]],
    height: 2,
    isLandmark: false,
  },
  {
    name: '商业建筑群B',
    points: [[3, -6], [6, -6], [6, -3], [3, -3]],
    height: 1.8,
    isLandmark: false,
  },
  {
    name: '住宅区A',
    points: [[-10, -8], [-6, -8], [-6, -4], [-10, -4]],
    height: 1.2,
    isLandmark: false,
  },
  {
    name: '住宅区B',
    points: [[12, -4], [16, -4], [16, 0], [12, 0]],
    height: 1.4,
    isLandmark: false,
  },
  {
    name: '工业园',
    points: [[-16, -12], [-10, -12], [-10, -8], [-16, -8]],
    height: 1,
    isLandmark: false,
  },
];
