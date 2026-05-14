import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { ManholeInfo, ManholeStatus, ManholeRealTimeData, CoverStatus } from '../../typings';
import ManholeCover3D from './ManholeCover3D';
import { useSettings } from '../../contexts/SettingsContext';
import { getRendererSettings } from '../../utils/settingsUtils';

// 合肥市中心坐标
const HEFEI_CENTER = {
  longitude: 117.23,
  latitude: 31.83
};

// 合肥市主要地标
const HEFEI_LANDMARKS = [
  { name: '合肥政务中心', longitude: 117.227, latitude: 31.794, height: 0.12, scale: 1.5, color: 0x7C92B4 },
  { name: '合肥火车站', longitude: 117.276, latitude: 31.863, height: 0.1, scale: 1.2, color: 0x8A8075 },
  { name: '滨湖新区', longitude: 117.178, latitude: 31.760, height: 0.15, scale: 2, color: 0x7DB887 },
  { name: '包河区政府', longitude: 117.308, latitude: 31.793, height: 0.08, scale: 0.9, color: 0x9D9F93 },
  { name: '科学岛', longitude: 117.17, latitude: 31.838, height: 0.05, scale: 1, color: 0x6C9EC9 }
];

// 优化缓存，减少重复资源创建
const sharedMaterials = new Map();
const textureLoader = new THREE.TextureLoader();

// 加载纹理
const loadTexture = (url: string): Promise<THREE.Texture> => {
  return new Promise((resolve, reject) => {
    textureLoader.load(url, resolve, undefined, reject);
  });
};

interface ManholeSceneProps {
  manholes: ManholeInfo[];
  realTimeDataMap: Map<string, ManholeRealTimeData>;
  onSelectManhole?: (manholeId: string) => void;
  selectedManholeId?: string;
}

// 加载进度指示器
const LoadingIndicator: React.FC<{progress: number}> = ({ progress }) => {
  return (
    <div className="loading-container">
      <div className="loading-spinner"></div>
      <div className="loading-progress">{Math.round(progress)}%</div>
      <div className="loading-text">加载合肥市数字孪生场景...</div>
    </div>
  );
};

const ManholeScene: React.FC<ManholeSceneProps> = ({
  manholes,
  realTimeDataMap,
  onSelectManhole,
  selectedManholeId
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const frameIdRef = useRef<number | null>(null);
  const landmarksRef = useRef<THREE.Group | null>(null);
  const roadsRef = useRef<THREE.Group | null>(null);
  const waterRef = useRef<THREE.Mesh | null>(null);
  const raycasterRef = useRef<THREE.Raycaster>(new THREE.Raycaster());
  const mouseRef = useRef<THREE.Vector2>(new THREE.Vector2());
  const loadingManagerRef = useRef<THREE.LoadingManager | null>(null);
  const fpsCounterRef = useRef<number>(0);
  const lastFpsUpdateRef = useRef<number>(Date.now());
  
  const [isLoading, setIsLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<Error | null>(null);
  const [isNightMode, setIsNightMode] = useState(false);
  const [fps, setFps] = useState(0);
  
  const { settings } = useSettings();
  const rendererSettings = useMemo(() => getRendererSettings(settings.graphicsQuality), [settings.graphicsQuality]);
  
  // 创建合肥市地图和地标
  const createHefeiMap = useCallback(async (scene: THREE.Scene) => {
    // 创建底图
    const groundGeometry = new THREE.PlaneGeometry(50, 50, 32, 32);
    
    // 加载地图纹理
    try {
      const mapTexture = await loadTexture('/assets/images/hefei_map.jpg');
      mapTexture.wrapS = THREE.RepeatWrapping;
      mapTexture.wrapT = THREE.RepeatWrapping;
      mapTexture.repeat.set(1, 1);
      
      const groundMaterial = new THREE.MeshStandardMaterial({
        map: mapTexture,
        roughness: 0.9,
        metalness: 0.1,
        side: THREE.DoubleSide
      });
      
      const ground = new THREE.Mesh(groundGeometry, groundMaterial);
      ground.rotation.x = -Math.PI / 2;
      ground.receiveShadow = true;
      scene.add(ground);
      
      // 创建道路
      const roads = new THREE.Group();
      roadsRef.current = roads;
      scene.add(roads);
      
      // 创建巢湖水域
      const waterGeometry = new THREE.CircleGeometry(8, 32);
      const waterMaterial = new THREE.MeshStandardMaterial({
        color: 0x3498db,
        transparent: true,
        opacity: 0.6,
        roughness: 0.2,
        metalness: 0.8
      });
      
      const water = new THREE.Mesh(waterGeometry, waterMaterial);
      water.position.set(-15, -0.08, -10);
      water.rotation.x = -Math.PI / 2;
      water.receiveShadow = true;
      scene.add(water);
      waterRef.current = water;
      
      // 创建地标建筑
      const landmarks = new THREE.Group();
      HEFEI_LANDMARKS.forEach(landmark => {
        // 计算相对位置
        const x = (landmark.longitude - HEFEI_CENTER.longitude) * 100;
        const z = (landmark.latitude - HEFEI_CENTER.latitude) * 100;
        
        // 创建建筑
        const buildingGeometry = new THREE.BoxGeometry(landmark.scale, landmark.height, landmark.scale);
        const buildingMaterial = new THREE.MeshStandardMaterial({
          color: landmark.color,
          roughness: 0.7,
          metalness: 0.3
        });
        
        const building = new THREE.Mesh(buildingGeometry, buildingMaterial);
        building.position.set(x, landmark.height / 2, -z);
        building.castShadow = true;
        building.receiveShadow = true;
        building.userData = { name: landmark.name };
        
        // 添加名称标签
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        if (context) {
          canvas.width = 256;
          canvas.height = 64;
          context.fillStyle = 'rgba(0, 20, 40, 0.8)';
          context.fillRect(0, 0, canvas.width, canvas.height);
          context.font = '24px Arial';
          context.fillStyle = 'white';
          context.textAlign = 'center';
          context.fillText(landmark.name, canvas.width / 2, canvas.height / 2 + 8);
          
          const texture = new THREE.CanvasTexture(canvas);
          const spriteMaterial = new THREE.SpriteMaterial({ map: texture });
          const sprite = new THREE.Sprite(spriteMaterial);
          sprite.position.set(0, landmark.height + 0.5, 0);
          sprite.scale.set(4, 1, 1);
          
          building.add(sprite);
        }
        
        landmarks.add(building);
      });
      
      scene.add(landmarks);
      landmarksRef.current = landmarks;
      
    } catch (err) {
      console.error('加载合肥地图纹理失败:', err);
      // 使用默认纹理
      const groundMaterial = new THREE.MeshStandardMaterial({
        color: 0xCDD8E8,
        roughness: 0.8,
        metalness: 0.2,
        side: THREE.DoubleSide
      });
      
      const ground = new THREE.Mesh(groundGeometry, groundMaterial);
      ground.rotation.x = -Math.PI / 2;
      ground.receiveShadow = true;
      scene.add(ground);
    }
  }, []);
  
  // 井盖配置和初始化
  useEffect(() => {
    if (!containerRef.current) return;
    
    const container = containerRef.current;
    
    // 创建加载管理器
    const loadingManager = new THREE.LoadingManager();
    loadingManagerRef.current = loadingManager;
    
    loadingManager.onProgress = (_, itemsLoaded, itemsTotal) => {
      const newProgress = (itemsLoaded / itemsTotal) * 100;
      setProgress(newProgress);
    };
    
    loadingManager.onLoad = () => {
      setIsLoading(false);
    };
    
    // 创建场景
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0A1A2F);
    scene.fog = new THREE.FogExp2(0x0A1A2F, 0.025);
    sceneRef.current = scene;
    
    // 创建相机
    const camera = new THREE.PerspectiveCamera(60, container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.position.set(0, 15, 15);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;
    
    // 创建渲染器
    const renderer = new THREE.WebGLRenderer({
      antialias: rendererSettings.antialias,
      // @ts-ignore - powerPreference 在 WebGLRenderer 类型定义中可能缺失
      powerPreference: 'high-performance' // 请求高性能GPU
    });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, rendererSettings.pixelRatio));
    renderer.shadowMap.enabled = rendererSettings.shadowMapEnabled;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = rendererSettings.outputColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;
    
    // 创建控制器
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 2;
    controls.maxDistance = 30;
    controls.maxPolarAngle = Math.PI / 2 - 0.1;
    controlsRef.current = controls;
    
    // 添加光照
    const setupLights = () => {
      // 主光源 - 太阳/月亮
      const mainLight = isNightMode
        ? new THREE.PointLight(0x3B8AB8, 0.7)
        : new THREE.DirectionalLight(0xFFEECC, 1.5);
      
      if (isNightMode) {
        mainLight.position.set(0, 20, 0);
      } else {
        const dirLight = mainLight as THREE.DirectionalLight;
        dirLight.position.set(5, 20, 10);
        dirLight.castShadow = true;
        dirLight.shadow.mapSize.width = rendererSettings.shadowMapSize;
        dirLight.shadow.mapSize.height = rendererSettings.shadowMapSize;
        dirLight.shadow.camera.near = 0.5;
        dirLight.shadow.camera.far = 50;
        
        // 使用类型断言将camera转换为OrthographicCamera
        const shadowCamera = dirLight.shadow.camera as THREE.OrthographicCamera;
        shadowCamera.left = -20;
        shadowCamera.right = 20;
        shadowCamera.top = 20;
        shadowCamera.bottom = -20;
        
        dirLight.shadow.bias = -0.0005;
      }
      
      // 环境光
      const ambientLight = isNightMode
        ? new THREE.AmbientLight(0x1E293B, 0.3)
        : new THREE.AmbientLight(0x94B0C6, 0.5);
      
      // 清除旧的光源
      scene.children.forEach(child => {
        if (child instanceof THREE.Light) {
          scene.remove(child);
        }
      });
      
      scene.add(mainLight);
      scene.add(ambientLight);
      
      // 添加夜间点光源，模拟路灯
      if (isNightMode) {
        for (let i = 0; i < 5; i++) {
          const streetLight = new THREE.PointLight(0xFFCC66, 0.8, 10);
          const angle = (i / 5) * Math.PI * 2;
          const radius = 8;
          streetLight.position.set(Math.cos(angle) * radius, 2, Math.sin(angle) * radius);
          
          const streetLightHelper = new THREE.PointLightHelper(streetLight, 0.2);
          scene.add(streetLight);
          scene.add(streetLightHelper);
        }
      }
    };
    
    setupLights();
    
    // 创建地图和地标
    createHefeiMap(scene).catch(err => {
      console.error('创建合肥地图失败:', err);
      setError(new Error('创建地图场景失败'));
    });
    
    // 渲染循环
    const animate = () => {
      if (!rendererRef.current || !sceneRef.current || !cameraRef.current || !controlsRef.current) return;
      
      controlsRef.current.update();
      
      // 更新水波效果
      if (waterRef.current) {
        const time = Date.now() * 0.001;
        const waterMaterial = waterRef.current.material as THREE.MeshStandardMaterial;
        waterMaterial.opacity = 0.6 + Math.sin(time) * 0.1;
      }
      
      // 更新FPS计数器
      fpsCounterRef.current++;
      const now = Date.now();
      if (now - lastFpsUpdateRef.current >= 1000) {
        setFps(fpsCounterRef.current);
        fpsCounterRef.current = 0;
        lastFpsUpdateRef.current = now;
      }
      
      rendererRef.current.render(sceneRef.current, cameraRef.current);
      frameIdRef.current = requestAnimationFrame(animate);
    };
    
    frameIdRef.current = requestAnimationFrame(animate);
    
    // 处理窗口大小变化
    const handleResize = () => {
      if (!cameraRef.current || !rendererRef.current || !containerRef.current) return;
      
      const container = containerRef.current;
      const camera = cameraRef.current;
      const renderer = rendererRef.current;
      
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    
    window.addEventListener('resize', handleResize);
    
    // 处理鼠标点击
    const handleClick = (event: MouseEvent) => {
      if (!containerRef.current || !cameraRef.current || !sceneRef.current) return;
      
      const rect = containerRef.current.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / containerRef.current.clientWidth) * 2 - 1;
      const y = -((event.clientY - rect.top) / containerRef.current.clientHeight) * 2 + 1;
      
      mouseRef.current.set(x, y);
      raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current);
      
      const intersects = raycasterRef.current.intersectObjects(sceneRef.current.children, true);
      
      for (const intersect of intersects) {
        let obj = intersect.object;
        while (obj && !obj.userData.manholeId && obj.parent) {
          obj = obj.parent;
        }
        
        if (obj && obj.userData.manholeId) {
          if (onSelectManhole) {
            onSelectManhole(obj.userData.manholeId);
          }
          break;
        }
      }
    };
    
    container.addEventListener('click', handleClick);
    
    // 清理函数
    return () => {
      window.removeEventListener('resize', handleResize);
      container.removeEventListener('click', handleClick);
      
      if (frameIdRef.current !== null) {
        cancelAnimationFrame(frameIdRef.current);
      }
      
      if (rendererRef.current && containerRef.current) {
        containerRef.current.removeChild(rendererRef.current.domElement);
      }
      
      // 释放资源
      if (rendererRef.current) {
        rendererRef.current.dispose();
      }
      
      const disposeScene = () => {
        if (!sceneRef.current) return;
        
        sceneRef.current.traverse((object) => {
          if (object instanceof THREE.Mesh) {
            if (object.geometry) {
              object.geometry.dispose();
            }
            
            if (object.material) {
              if (Array.isArray(object.material)) {
                object.material.forEach(disposeMaterialTextures);
              } else {
                disposeMaterialTextures(object.material);
              }
            }
          }
        });
      };
      
      const disposeMaterialTextures = (material: THREE.Material) => {
        if (material instanceof THREE.MeshStandardMaterial) {
          if (material.map) material.map.dispose();
          if (material.lightMap) material.lightMap.dispose();
          if (material.aoMap) material.aoMap.dispose();
          if (material.emissiveMap) material.emissiveMap.dispose();
          if (material.bumpMap) material.bumpMap.dispose();
          if (material.normalMap) material.normalMap.dispose();
          if (material.displacementMap) material.displacementMap.dispose();
          if (material.roughnessMap) material.roughnessMap.dispose();
          if (material.metalnessMap) material.metalnessMap.dispose();
          if (material.alphaMap) material.alphaMap.dispose();
          if (material.envMap) material.envMap.dispose();
        }
        material.dispose();
      };
      
      disposeScene();
    };
  }, [createHefeiMap, onSelectManhole, isNightMode, rendererSettings]);
  
  // 根据manholes数据更新场景中的井盖
  useEffect(() => {
    if (!sceneRef.current || !manholes.length) return;
    
    // 移除旧的井盖
    const existingManholes = sceneRef.current.children.filter(
      child => child.userData && child.userData.isManholeCover
    );
    
    existingManholes.forEach(manhole => {
      sceneRef.current?.remove(manhole);
    });
    
    // 添加新的井盖
    manholes.forEach((manhole, index) => {
      if (!sceneRef.current) return;
      
      // 基于井盖ID和位置数据确定在场景中的位置
      let xBase = 0, zBase = 0;
      
      // 计算基于经纬度的相对位置
      if (manhole && manhole.location) {
        // 相对于合肥市中心的位置
        xBase = (manhole.location.longitude - HEFEI_CENTER.longitude) * 100;
        zBase = -(manhole.location.latitude - HEFEI_CENTER.latitude) * 100;
      } else {
        // 如果没有位置数据，使用ID生成伪随机位置
        const idNumber = parseInt(manhole.id.replace(/\D/g, ''), 10) || index;
        const angle = (idNumber % 12) * (Math.PI / 6);
        const radius = 5 + (idNumber % 7) * 1.5;
        
        xBase = Math.cos(angle) * radius;
        zBase = Math.sin(angle) * radius;
      }
      
      // 根据ID添加小的随机偏移，使布局更自然
      const idHash = manhole.id.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
      const xOffset = (Math.sin(idHash * 0.1) * 0.5);
      const zOffset = (Math.cos(idHash * 0.1) * 0.5);
      
      const x = xBase + xOffset;
      const z = zBase + zOffset;
      
      // 检查实时数据
      const realTimeData = realTimeDataMap.get(manhole.id);
      const coverStatus = realTimeData?.coverStatus || CoverStatus.Closed;
      
      const manholeGroup = new THREE.Group();
      manholeGroup.userData = {
        isManholeCover: true,
        manholeId: manhole.id
      };
      
      // 创建井盖3D模型组件
      const manholeElement = document.createElement('div');
      manholeGroup.position.set(x, 0, z);
      sceneRef.current.add(manholeGroup);
      
      // 创建和添加React井盖组件到场景
      const manholeCover = (
        <ManholeCover3D
          info={manhole}
          coverStatus={coverStatus}
          selected={manhole.id === selectedManholeId}
          position={[0, 0, 0]}
          onClick={() => onSelectManhole && onSelectManhole(manhole.id)}
        />
      );
      
      // 使用Three.js对象直接渲染井盖
      // 这里简化为直接添加一个几何体，实际上应该替换为完整的React-three-fiber集成
      const coverGeometry = new THREE.CylinderGeometry(0.5, 0.5, 0.1, 32);
      const coverMaterial = new THREE.MeshStandardMaterial({
        color: getStatusColor(manhole.status),
        roughness: 0.7,
        metalness: 0.6
      });
      
      const coverMesh = new THREE.Mesh(coverGeometry, coverMaterial);
      coverMesh.rotation.x = Math.PI / 2;
      coverMesh.position.y = 0.05;
      coverMesh.castShadow = true;
      coverMesh.receiveShadow = true;
      
      // 添加名称标签
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      if (context) {
        canvas.width = 256;
        canvas.height = 64;
        context.fillStyle = 'rgba(0, 20, 40, 0.8)';
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.font = '20px Arial';
        context.fillStyle = 'white';
        context.textAlign = 'center';
        context.fillText(manhole.name, canvas.width / 2, canvas.height / 2 + 8);
        
        const texture = new THREE.CanvasTexture(canvas);
        const spriteMaterial = new THREE.SpriteMaterial({ map: texture });
        const sprite = new THREE.Sprite(spriteMaterial);
        sprite.position.set(0, 0.5, 0);
        sprite.scale.set(2, 0.5, 1);
        
        manholeGroup.add(sprite);
      }
      
      // 添加状态指示灯
      const indicatorGeometry = new THREE.SphereGeometry(0.1, 16, 16);
      const indicatorMaterial = new THREE.MeshStandardMaterial({
        color: getStatusColor(manhole.status),
        emissive: getStatusColor(manhole.status),
        emissiveIntensity: 0.5
      });
      
      const indicator = new THREE.Mesh(indicatorGeometry, indicatorMaterial);
      indicator.position.set(0, 0.5, 0);
      manholeGroup.add(indicator);
      
      manholeGroup.add(coverMesh);
    });
  }, [manholes, realTimeDataMap, selectedManholeId, onSelectManhole]);
  
  // 获取状态对应的颜色
  const getStatusColor = (status: ManholeStatus) => {
    switch (status) {
      case ManholeStatus.Normal:
        return 0x52c41a; // 绿色
      case ManholeStatus.Warning:
        return 0xfaad14; // 黄色
      case ManholeStatus.Alarm:
        return 0xf5222d; // 红色
      case ManholeStatus.Offline:
        return 0x8c8c8c; // 灰色
      case ManholeStatus.Maintenance:
        return 0x1890ff; // 蓝色
      default:
        return 0x52c41a;
    }
  };
  
  // 更新FPS
  const updateFps = () => {
    // 使用useRef处理FPS更新
  };
  
  return (
    <div className="manhole-scene-container" style={{ width: '100%', height: '100%', position: 'relative' }}>
      <div ref={containerRef} style={{ width: '100%', height: '100%' }}></div>
      
      {isLoading && <LoadingIndicator progress={progress} />}
      
      {/* 白天/黑夜模式切换按钮 */}
        <button 
        className="night-mode-toggle"
        onClick={() => setIsNightMode(!isNightMode)}
          style={{
          position: 'absolute',
          bottom: '20px',
          right: '20px',
          background: isNightMode ? '#f0f2f5' : '#1f1f1f',
          color: isNightMode ? '#1f1f1f' : '#f0f2f5',
          border: 'none',
          borderRadius: '50%',
          width: '50px',
          height: '50px',
          cursor: 'pointer',
          boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '24px'
        }}
      >
        {isNightMode ? '☀️' : '🌙'}
      </button>
      
      {settings.showFps && (
        <div className="fps-counter" style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          background: 'rgba(0,0,0,0.6)',
          color: fps >= 40 ? '#52c41a' : fps >= 30 ? '#faad14' : '#f5222d',
          padding: '4px 8px',
          borderRadius: '4px',
          fontSize: '12px'
        }}>
          FPS: {fps}
            </div>
      )}
      
      {error && (
        <div className="error-container" style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: 'rgba(0,0,0,0.8)',
          color: '#fff',
          padding: '20px',
          borderRadius: '8px',
          maxWidth: '400px',
          textAlign: 'center'
        }}>
          <h3>加载错误</h3>
          <p>{error.message}</p>
          <button onClick={() => window.location.reload()}>重新加载</button>
        </div>
      )}
    </div>
  );
};

// 错误边界组件
class ErrorBoundary extends React.Component<
  { children: React.ReactNode, fallback: React.ReactNode, onError: (error: Error) => void },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode, fallback: React.ReactNode, onError: (error: Error) => void }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    this.props.onError(error);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

export default React.memo(ManholeScene);