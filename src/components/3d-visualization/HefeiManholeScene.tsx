import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { ManholeInfo, ManholeStatus, ManholeRealTimeData, CoverStatus } from '../../typings';
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

interface HefeiManholeSceneProps {
  manholes: ManholeInfo[];
  realTimeDataMap: Map<string, ManholeRealTimeData>;
  onSelectManhole?: (manholeId: string) => void;
  selectedManholeId?: string;
  isNightMode?: boolean;
}

// 加载进度指示器
const LoadingIndicator: React.FC<{progress: number}> = ({ progress }) => {
  // 使用内部状态来实现平滑动画
  const [smoothProgress, setSmoothProgress] = useState(0);
  
  useEffect(() => {
    // 平滑过渡到目标进度值
    let animationFrame: number;
    let currentProgress = smoothProgress;
    
    const animate = () => {
      // 每帧增加一小部分，实现平滑过渡
      if (currentProgress < progress) {
        currentProgress = Math.min(progress, currentProgress + 0.5);
        setSmoothProgress(currentProgress);
        animationFrame = requestAnimationFrame(animate);
      }
    };
    
    animationFrame = requestAnimationFrame(animate);
    
    return () => {
      cancelAnimationFrame(animationFrame);
    };
  }, [progress, smoothProgress]);
  
  return (
    <div className="loading-container" style={{
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      background: 'rgba(0, 20, 40, 0.8)',
      color: '#fff',
      zIndex: 100
    }}>
      <div className="loading-spinner" style={{
        border: '4px solid rgba(0, 0, 0, 0.1)',
        borderTopColor: '#1890ff',
        borderRadius: '50%',
        width: '50px',
        height: '50px',
        animation: 'spin 1s linear infinite',
        marginBottom: '20px'
      }}></div>
      <div className="loading-progress-bar" style={{
        width: '200px',
        height: '6px',
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        borderRadius: '3px',
        overflow: 'hidden',
        marginBottom: '15px'
      }}>
        <div style={{
          height: '100%',
          width: `${smoothProgress}%`,
          backgroundColor: '#1890ff',
          transition: 'width 0.3s ease-out'
        }}></div>
      </div>
      <div className="loading-progress" style={{
        fontSize: '24px',
        fontWeight: 'bold',
        marginBottom: '10px'
      }}>{Math.round(smoothProgress)}%</div>
      <div className="loading-text" style={{
        fontSize: '16px',
        opacity: 0.8
      }}>加载合肥市数字孪生场景...</div>
    </div>
  );
};

const HefeiManholeScene: React.FC<HefeiManholeSceneProps> = ({
  manholes,
  realTimeDataMap,
  onSelectManhole,
  selectedManholeId,
  isNightMode = false
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const frameIdRef = useRef<number | null>(null);
  const landmarksRef = useRef<THREE.Group | null>(null);
  const waterRef = useRef<THREE.Mesh | null>(null);
  const raycasterRef = useRef<THREE.Raycaster>(new THREE.Raycaster());
  const mouseRef = useRef<THREE.Vector2>(new THREE.Vector2());
  const loadingManagerRef = useRef<THREE.LoadingManager | null>(null);
  const fpsCounterRef = useRef<number>(0);
  const lastFpsUpdateRef = useRef<number>(Date.now());
  
  const [isLoading, setIsLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<Error | null>(null);
  const [fps, setFps] = useState(0);
  const [hoveredManholeId, setHoveredManholeId] = useState<string | null>(null);
  const [predictedManholes, setPredictedManholes] = useState<{id: string, status: ManholeStatus, predictedStatus: ManholeStatus}[]>([]);
  
  const { settings } = useSettings();
  const rendererSettings = useMemo(() => getRendererSettings(settings.graphicsQuality), [settings.graphicsQuality]);

  // 创建合肥市地图和地标
  const createHefeiMap = useCallback(async (scene: THREE.Scene, loadingManager: THREE.LoadingManager) => {
    // 创建底图
    const groundGeometry = new THREE.PlaneGeometry(50, 50, 32, 32);
    
    try {
      // 模拟合肥地图纹理
      const canvas = document.createElement('canvas');
      canvas.width = 1024;
      canvas.height = 1024;
      const ctx = canvas.getContext('2d');
      
      if (ctx) {
        // 绘制背景
        const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
        gradient.addColorStop(0, '#1a3c70');
        gradient.addColorStop(1, '#0c2546');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // 绘制网格线
        ctx.strokeStyle = 'rgba(100, 180, 255, 0.2)';
        ctx.lineWidth = 1;
        
        // 横向网格线
        for (let i = 0; i <= 20; i++) {
          const y = i * (canvas.height / 20);
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(canvas.width, y);
          ctx.stroke();
        }
        
        // 纵向网格线
        for (let i = 0; i <= 20; i++) {
          const x = i * (canvas.width / 20);
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, canvas.height);
          ctx.stroke();
        }
        
        // 绘制主要道路
        ctx.strokeStyle = 'rgba(100, 210, 255, 0.5)';
        ctx.lineWidth = 3;
        
        // 长江路
        ctx.beginPath();
        ctx.moveTo(200, 300);
        ctx.lineTo(800, 300);
        ctx.stroke();
        
        // 淮河路
        ctx.beginPath();
        ctx.moveTo(200, 500);
        ctx.lineTo(800, 500);
        ctx.stroke();
        
        // 黄山路
        ctx.beginPath();
        ctx.moveTo(300, 200);
        ctx.lineTo(300, 800);
        ctx.stroke();
        
        // 合肥环城路
        ctx.beginPath();
        ctx.arc(512, 512, 300, 0, 2 * Math.PI);
        ctx.stroke();
        
        // 绘制巢湖
        ctx.fillStyle = 'rgba(30, 120, 200, 0.6)';
        ctx.beginPath();
        ctx.arc(800, 800, 150, 0, 2 * Math.PI);
        ctx.fill();
        
        // 绘制标签
        ctx.fillStyle = 'rgba(220, 240, 255, 0.8)';
        ctx.font = '20px Arial';
        ctx.fillText('巢湖', 780, 800);
        ctx.fillText('长江路', 500, 280);
        ctx.fillText('淮河路', 500, 480);
        ctx.fillText('黄山路', 320, 500);
        ctx.fillText('环城路', 450, 300);
      }
      
      const mapTexture = new THREE.CanvasTexture(canvas);
      mapTexture.wrapS = THREE.RepeatWrapping;
      mapTexture.wrapT = THREE.RepeatWrapping;
      
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
      water.position.set(15, -0.08, 15);
      water.rotation.x = -Math.PI / 2;
      water.receiveShadow = true;
      scene.add(water);
      waterRef.current = water;
      
      // 创建地标建筑
      const landmarks = new THREE.Group();
      HEFEI_LANDMARKS.forEach(landmark => {
        // 计算相对位置
        const x = (landmark.longitude - HEFEI_CENTER.longitude) * 100;
        const z = -(landmark.latitude - HEFEI_CENTER.latitude) * 100;
        
        // 创建建筑
        const buildingGeometry = new THREE.BoxGeometry(landmark.scale, landmark.height, landmark.scale);
        const buildingMaterial = new THREE.MeshStandardMaterial({
          color: landmark.color,
          roughness: 0.7,
          metalness: 0.3
        });
        
        const building = new THREE.Mesh(buildingGeometry, buildingMaterial);
        building.position.set(x, landmark.height / 2, z);
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
      console.error('创建合肥地图失败:', err);
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
    
    // 注册一个假的资源来触发loadingManager的进度更新
    loadingManager.itemStart('init-scene');
    setTimeout(() => {
      loadingManager.itemEnd('init-scene');
    }, 1000);
  }, []);
  
  // 场景设置和渲染
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
    scene.background = isNightMode ? new THREE.Color(0x0A1525) : new THREE.Color(0x87CEEB);
    scene.fog = isNightMode ? new THREE.FogExp2(0x0A1525, 0.025) : new THREE.FogExp2(0x87CEEB, 0.01);
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
      powerPreference: 'high-performance'
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
        
        // 使用类型断言解决DirectionalLight的shadow.camera属性问题
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
        HEFEI_LANDMARKS.forEach(landmark => {
          const x = (landmark.longitude - HEFEI_CENTER.longitude) * 100;
          const z = -(landmark.latitude - HEFEI_CENTER.latitude) * 100;
          
          const streetLight = new THREE.PointLight(0xFFCC66, 0.8, 10);
          streetLight.position.set(x, 2, z);
          
          // 添加灯光辅助对象
          const streetLightHelper = new THREE.SphereGeometry(0.1, 8, 8);
          const streetLightMaterial = new THREE.MeshBasicMaterial({
            color: 0xFFCC66,
            transparent: true,
            opacity: 0.8
          });
          const streetLightMesh = new THREE.Mesh(streetLightHelper, streetLightMaterial);
          streetLightMesh.position.copy(streetLight.position);
          
          // 添加光晕
          const glowGeometry = new THREE.SphereGeometry(0.2, 16, 16);
          const glowMaterial = new THREE.MeshBasicMaterial({
            color: 0xFFCC66,
            transparent: true,
            opacity: 0.3,
            side: THREE.BackSide
          });
          const glow = new THREE.Mesh(glowGeometry, glowMaterial);
          glow.position.copy(streetLight.position);
          
          scene.add(streetLight);
          scene.add(streetLightMesh);
          scene.add(glow);
        });
      }
    };
    
    setupLights();
    
    // 创建地图和地标
    createHefeiMap(scene, loadingManager).catch(err => {
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
      
      if (rendererRef.current && container) {
        container.removeChild(rendererRef.current.domElement);
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
    
    // 添加新的井盖 - 只添加最多15个井盖用于演示
    const demoManholes = manholes.slice(0, 15);
    
    demoManholes.forEach((manhole, index) => {
      if (!sceneRef.current) return;
      
      // 基于井盖ID和位置数据确定在场景中的位置
      let xBase = 0, zBase = 0;
      
      // 为演示，我们将井盖放在合肥市主要地标周围
      if (index < HEFEI_LANDMARKS.length) {
        const landmark = HEFEI_LANDMARKS[index];
        xBase = (landmark.longitude - HEFEI_CENTER.longitude) * 100;
        zBase = -(landmark.latitude - HEFEI_CENTER.latitude) * 100;
        
        // 稍微偏移，不要直接放在建筑上
        xBase += 1.5;
        zBase += 1.5;
      } else {
        // 如果没有地标，使用ID生成伪随机位置
        const idNumber = parseInt(manhole.id.replace(/\D/g, ''), 10) || index;
        const angle = (idNumber % 12) * (Math.PI / 6);
        const radius = 5 + (idNumber % 7) * 1.5;
        
        xBase = Math.cos(angle) * radius;
        zBase = Math.sin(angle) * radius;
      }
      
      // 检查实时数据
      const realTimeData = realTimeDataMap.get(manhole.id);
      const predictedStatus = getPredictedStatus(manhole, realTimeData);

      const isSelected = selectedManholeId === manhole.id;
      
      const manholeGroup = new THREE.Group();
      manholeGroup.userData = {
        isManholeCover: true,
        manholeId: manhole.id,
        manholeData: manhole,
        realTimeData: realTimeData,
        predictedStatus: predictedStatus
      };
      
      // 创建井盖3D模型组件
      manholeGroup.position.set(xBase, 0, zBase);
      sceneRef.current.add(manholeGroup);
      
      // 使用Three.js对象直接渲染井盖
      const coverGeometry = new THREE.CylinderGeometry(0.5, 0.5, 0.1, 32);
      const coverMaterial = new THREE.MeshStandardMaterial({
        color: getStatusColor(manhole.status),
        roughness: 0.24,
        metalness: 0.9,
        emissive: new THREE.Color(getStatusColor(manhole.status)).multiplyScalar(isSelected ? 0.28 : 0.12),
        emissiveIntensity: isSelected ? 1.1 : 0.45
      });
      
      const coverMesh = new THREE.Mesh(coverGeometry, coverMaterial);
      coverMesh.rotation.x = Math.PI / 2;
      coverMesh.position.y = 0.05;
      coverMesh.castShadow = true;
      coverMesh.receiveShadow = true;
      manholeGroup.add(coverMesh);

      const baseRing = new THREE.Mesh(
        new THREE.TorusGeometry(0.62, 0.08, 20, 40),
        new THREE.MeshStandardMaterial({
          color: 0x7f8ea3,
          roughness: 0.35,
          metalness: 0.95
        })
      );
      baseRing.rotation.x = Math.PI / 2;
      baseRing.position.y = 0.02;
      baseRing.castShadow = true;
      baseRing.receiveShadow = true;
      manholeGroup.add(baseRing);

      const halo = new THREE.Mesh(
        new THREE.RingGeometry(0.75, isSelected ? 1.15 : 0.95, 48),
        new THREE.MeshBasicMaterial({
          color: getStatusColor(manhole.status),
          side: THREE.DoubleSide,
          transparent: true,
          opacity: isSelected ? 0.38 : 0.16
        })
      );
      halo.rotation.x = -Math.PI / 2;
      halo.position.y = 0.01;
      manholeGroup.add(halo);
      
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
      indicator.position.set(0, 0.68, 0);
      manholeGroup.add(indicator);

      const beacon = new THREE.Mesh(
        new THREE.CylinderGeometry(0.03, 0.08, isSelected ? 1.4 : 1, 12),
        new THREE.MeshBasicMaterial({
          color: getStatusColor(manhole.status),
          transparent: true,
          opacity: isSelected ? 0.42 : 0.2
        })
      );
      beacon.position.set(0, isSelected ? 0.75 : 0.55, 0);
      manholeGroup.add(beacon);
      
      // 添加预测状态指示器
      if (predictedStatus && predictedStatus !== manhole.status) {
        const predictIndicatorGeometry = new THREE.RingGeometry(0.15, 0.2, 16);
        const predictIndicatorMaterial = new THREE.MeshBasicMaterial({
          color: getStatusColor(predictedStatus),
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.8
        });
        
        const predictIndicator = new THREE.Mesh(predictIndicatorGeometry, predictIndicatorMaterial);
        predictIndicator.position.set(0, 0.52, 0);
        predictIndicator.rotation.x = -Math.PI / 2;
        manholeGroup.add(predictIndicator);
        
        // 创建动画效果
        const animatePredictIndicator = () => {
          if (!sceneRef.current || !predictIndicator.parent) return;
          
          const time = Date.now() * 0.001;
          predictIndicatorMaterial.opacity = 0.5 + Math.sin(time * 2) * 0.3;
          
          requestAnimationFrame(animatePredictIndicator);
        };
        
        requestAnimationFrame(animatePredictIndicator);
      }
      
      // 添加数据流效果 - 模拟数据上传/下载
      if (manhole.status !== ManholeStatus.Offline) {
        const dataStreamGeometry = new THREE.CylinderGeometry(0.05, 0.05, 10, 8);
        const dataStreamMaterial = new THREE.MeshBasicMaterial({
          color: 0x00FFFF,
          transparent: true,
          opacity: 0.3
        });
        
        const dataStream = new THREE.Mesh(dataStreamGeometry, dataStreamMaterial);
        dataStream.position.set(0, 5, 0);
        
        // 创建动画效果
        const animateDataStream = () => {
          if (!sceneRef.current) return;
          
          const time = Date.now() * 0.001;
          dataStreamMaterial.opacity = 0.2 + Math.sin(time * 2) * 0.1;
          
          // 创建粒子效果
          if (Math.random() > 0.9) {
            const particleGeometry = new THREE.SphereGeometry(0.03, 8, 8);
            const particleMaterial = new THREE.MeshBasicMaterial({
              color: 0x00FFFF,
              transparent: true,
              opacity: 0.7
            });
            
            const particle = new THREE.Mesh(particleGeometry, particleMaterial);
            particle.position.set(
              (Math.random() - 0.5) * 0.1,
              0.2 + Math.random() * 0.5,
              (Math.random() - 0.5) * 0.1
            );
            
            dataStream.add(particle);
            
            // 粒子上升动画
            const animateParticle = () => {
              if (!sceneRef.current || !particle.parent) return;
              
              particle.position.y += 0.05;
              particle.material.opacity -= 0.01;
              
              if (particle.position.y > 5 || particle.material.opacity <= 0) {
                particle.parent.remove(particle);
                particleGeometry.dispose();
                particleMaterial.dispose();
              } else {
                requestAnimationFrame(animateParticle);
              }
            };
            
            requestAnimationFrame(animateParticle);
          }
          
          requestAnimationFrame(animateDataStream);
        };
        
        requestAnimationFrame(animateDataStream);
        
        manholeGroup.add(dataStream);
      }
      
      manholeGroup.add(coverMesh);
      
      // 选中效果
      if (manhole.id === selectedManholeId) {
        const highlightGeometry = new THREE.RingGeometry(0.6, 0.7, 32);
        const highlightMaterial = new THREE.MeshBasicMaterial({
          color: 0x00FFFF,
          transparent: true,
          opacity: 0.8,
          side: THREE.DoubleSide
        });
        
        const highlight = new THREE.Mesh(highlightGeometry, highlightMaterial);
        highlight.rotation.x = -Math.PI / 2;
        highlight.position.y = 0.01;
        
        // 创建脉冲动画
        const animateHighlight = () => {
          if (!sceneRef.current || !highlight.parent) return;
          
          const time = Date.now() * 0.001;
          highlightMaterial.opacity = 0.5 + Math.sin(time * 4) * 0.3;
          
          requestAnimationFrame(animateHighlight);
        };
        
        requestAnimationFrame(animateHighlight);
        
        manholeGroup.add(highlight);
      }
    });
  }, [manholes, realTimeDataMap, selectedManholeId, onSelectManhole]);
  
  // 生成一些测试数据进行预测分析演示
  const generateTestPredictions = useCallback(() => {
    if (!manholes.length) return [];
    
    // 在真实数据基础上模拟一些预测数据
    const testPredictions: {id: string, status: ManholeStatus, predictedStatus: ManholeStatus}[] = [];
    
    // 从正常状态到各种不同状态的模拟预测
    const statusChanges = [
      { from: ManholeStatus.Normal, to: ManholeStatus.Warning },
      { from: ManholeStatus.Normal, to: ManholeStatus.Alarm },
      { from: ManholeStatus.Warning, to: ManholeStatus.Alarm },
      { from: ManholeStatus.Normal, to: ManholeStatus.Offline }
    ];
    
    // 为简单起见，为前几个井盖生成模拟数据
    const demoCount = Math.min(5, manholes.length);
    for (let i = 0; i < demoCount; i++) {
      const manhole = manholes[i];
      if (!manhole) continue;
      
      // 随机选择一种状态变化类型
      const changeIndex = Math.floor(Math.random() * statusChanges.length);
      const change = statusChanges[changeIndex];
      
      // 如果当前状态符合预测起点，添加预测
      if (manhole.status === change.from) {
        testPredictions.push({
          id: manhole.id,
          status: manhole.status,
          predictedStatus: change.to
        });
      }
    }
    
    return testPredictions;
  }, [manholes]);

  // 更新预测分析结果
  useEffect(() => {
    if (!manholes.length) return;
    
    try {
      let newPredictions: {id: string, status: ManholeStatus, predictedStatus: ManholeStatus}[] = [];
      
      // 获取基于实时数据的预测
      manholes.forEach(manhole => {
        const realTimeData = realTimeDataMap.get(manhole.id);
        const predictedStatus = getPredictedStatus(manhole, realTimeData);
        
        if (predictedStatus && predictedStatus !== manhole.status) {
          newPredictions.push({
            id: manhole.id,
            status: manhole.status,
            predictedStatus: predictedStatus
          });
        }
      });
      
      // 如果没有真实预测结果，使用测试数据
      if (newPredictions.length === 0) {
        newPredictions = generateTestPredictions();
      }
      
      // 仅在有变化时更新状态，避免不必要的重渲染
      if (JSON.stringify(newPredictions) !== JSON.stringify(predictedManholes)) {
        setPredictedManholes(newPredictions);
      }
    } catch (error) {
      console.error("更新预测分析结果错误:", error);
      // 如果实时分析出错，尝试使用测试数据
      setPredictedManholes(generateTestPredictions());
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [manholes, realTimeDataMap, generateTestPredictions]);
  
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
  
  // 预测井盖状态函数
  const getPredictedStatus = (manhole: ManholeInfo, realTimeData?: ManholeRealTimeData): ManholeStatus | null => {
    if (!realTimeData) return null;
    
    try {
      // 简单的预测逻辑示例
      // 1. 如果水位超过80%，预测将进入警告状态
      if (realTimeData.waterLevel > 80 && manhole.status === ManholeStatus.Normal) {
        return ManholeStatus.Warning;
      }
      
      // 2. 如果水位超过95%，预测将进入报警状态
      if (realTimeData.waterLevel > 95 && manhole.status === ManholeStatus.Warning) {
        return ManholeStatus.Alarm;
      }
      
      // 3. 如果气体浓度超过安全值的80%，预测将进入警告状态
      // 检查气体浓度数据是否存在并格式正确
      if (realTimeData.gasConcentration) {
        // 适配不同可能的数据格式
        let ch4Level = 0;
        if (typeof realTimeData.gasConcentration === 'object' && realTimeData.gasConcentration.ch4) {
          ch4Level = realTimeData.gasConcentration.ch4;
        } else if (typeof realTimeData.gasConcentration === 'number') {
          ch4Level = realTimeData.gasConcentration;
        }
        
        if (ch4Level > 80 && manhole.status === ManholeStatus.Normal) {
          return ManholeStatus.Warning;
        }
      }
      
      // 4. 如果传感器上报间隔异常延长，预测可能即将离线
      let updateTime = 0;

      // 使用类型断言安全地访问可能存在的字段
      const realTimeDataAny = realTimeData as any;

      if (realTimeData.timestamp) {
        updateTime = typeof realTimeData.timestamp === 'string' ? 
          new Date(realTimeData.timestamp).getTime() : 
          (typeof realTimeData.timestamp === 'number' ? realTimeData.timestamp : 0);
      } 
      // 尝试找到任何日期相关的字段
      else {
        const dateKeys = Object.keys(realTimeDataAny).filter(key => 
          key.toLowerCase().includes('time') || 
          key.toLowerCase().includes('date') || 
          key.toLowerCase().includes('update')
        );
        
        for (const key of dateKeys) {
          const value = realTimeDataAny[key];
          if (value) {
            try {
              if (typeof value === 'string') {
                const parsedTime = new Date(value).getTime();
                if (!isNaN(parsedTime)) {
                  updateTime = parsedTime;
                  break;
                }
              } else if (typeof value === 'number') {
                updateTime = value;
                break;
              }
            } catch (e) {
              // 忽略无法解析的日期
            }
          }
        }
      }

      if (updateTime > 0) {
        const currentTime = new Date().getTime();
        const timeDiff = currentTime - updateTime;
        
        // 如果上次更新时间超过10分钟，预测即将离线
        if (timeDiff > 10 * 60 * 1000 && manhole.status !== ManholeStatus.Offline) {
          return ManholeStatus.Offline;
        }
      }
      
      return null;
    } catch (error) {
      console.error("预测状态计算错误:", error);
      return null;
    }
  };
  
  // 处理鼠标悬停
  const handleMouseMove = (event: MouseEvent) => {
    if (!containerRef.current || !cameraRef.current || !sceneRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / containerRef.current.clientWidth) * 2 - 1;
    const y = -((event.clientY - rect.top) / containerRef.current.clientHeight) * 2 + 1;
    
    mouseRef.current.set(x, y);
    raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current);
    
    const intersects = raycasterRef.current.intersectObjects(sceneRef.current.children, true);
    
    let foundManholeId = null;
    
    for (const intersect of intersects) {
      let obj = intersect.object;
      while (obj && !obj.userData.manholeId && obj.parent) {
        obj = obj.parent;
      }
      
      if (obj && obj.userData.manholeId) {
        foundManholeId = obj.userData.manholeId;
        break;
      }
    }
    
    setHoveredManholeId(foundManholeId);
  };
  
  // 初始化鼠标事件
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    
    container.addEventListener('mousemove', handleMouseMove);
    
    return () => {
      container.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);
  
  // 获取悬停的井盖信息
  const getHoveredManholeInfo = () => {
    if (!hoveredManholeId) return null;
    
    const manhole = manholes.find(m => m.id === hoveredManholeId);
    if (!manhole) return null;
    
    const realTimeData = realTimeDataMap.get(hoveredManholeId);
    const predictedStatus = getPredictedStatus(manhole, realTimeData);
    
    return {
      manhole,
      realTimeData,
      predictedStatus
    };
  };
  
  const hoveredInfo = getHoveredManholeInfo();
  
  // 定义动画关键帧
  const fadeInKeyframes = `
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `;

  return (
    <div className="manhole-scene-container" style={{ width: '100%', height: '100%', position: 'relative' }}>
      <style dangerouslySetInnerHTML={{ __html: fadeInKeyframes }} />
      
      <div ref={containerRef} style={{ width: '100%', height: '100%' }}></div>
      
      {isLoading && <LoadingIndicator progress={progress} />}
      
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
      
      {/* 预测分析结果面板 */}
      <div className="prediction-panel" style={{
        position: 'absolute',
        bottom: '20px',
        right: '20px',
        background: 'rgba(0,20,40,0.9)',
        color: '#fff',
        padding: '15px',
        borderRadius: '8px',
        maxWidth: '350px',
        maxHeight: '300px',
        overflowY: 'auto',
        fontSize: '14px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
        backdropFilter: 'blur(3px)',
        border: '1px solid rgba(100, 180, 255, 0.2)'
      }}>
        <div style={{ 
          fontWeight: 'bold', 
          marginBottom: '15px', 
          fontSize: '16px',
          display: 'flex',
          alignItems: 'center',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          paddingBottom: '10px'
        }}>
          {/* 预测图标 */}
          <div style={{
            width: '20px',
            height: '20px',
            borderRadius: '50%',
            backgroundColor: '#1890ff',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            marginRight: '10px'
          }}>
            <div style={{
              width: '8px',
              height: '8px',
              borderLeft: '2px solid white',
              borderBottom: '2px solid white',
              transform: 'rotate(-45deg) translateX(-1px)'
            }}></div>
          </div>
          预测分析
          {predictedManholes.length > 0 && (
            <span style={{
              backgroundColor: '#1890ff',
              color: 'white',
              fontSize: '12px',
              borderRadius: '10px',
              padding: '0 8px',
              marginLeft: '10px',
              lineHeight: '20px'
            }}>
              {predictedManholes.length}
            </span>
          )}
        </div>
        
        {predictedManholes.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {predictedManholes.map((item, index) => {
              const manhole = manholes.find(m => m.id === item.id);
              return (
                <div key={item.id || index} style={{ 
                  padding: '10px', 
                  background: 'rgba(255,255,255,0.05)',
                  borderRadius: '6px',
                  borderLeft: `4px solid ${getStatusColorHex(item.predictedStatus)}`,
                  transition: 'all 0.3s ease',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  animation: `fadeIn 0.5s ease ${index * 0.1}s both`
                }}>
                  <div style={{ 
                    fontWeight: 'bold', 
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <span>{manhole?.name || `井盖 ${index + 1}`}</span>
                    <span style={{
                      fontSize: '11px',
                      opacity: 0.6
                    }}>ID: {item.id.substring(0, 8)}</span>
                  </div>
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    flexWrap: 'wrap', 
                    gap: '6px', 
                    marginTop: '8px'
                  }}>
                    <div style={{
                      display: 'inline-block',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      backgroundColor: `${getStatusColorHex(item.status)}20`,
                      color: getStatusColorHex(item.status),
                      fontSize: '12px',
                      fontWeight: 'bold'
                    }}>
                      {getStatusText(item.status)}
                    </div>
                    <div style={{
                      margin: '0 6px',
                      position: 'relative',
                      width: '20px',
                      height: '12px'
                    }}>
                      <div style={{
                        position: 'absolute',
                        top: '50%',
                        left: 0,
                        width: '100%',
                        height: '2px',
                        backgroundColor: 'rgba(255,255,255,0.3)',
                        transform: 'translateY(-50%)'
                      }}></div>
                      <div style={{
                        position: 'absolute',
                        top: '50%',
                        right: '-2px',
                        width: '0',
                        height: '0',
                        borderTop: '4px solid transparent',
                        borderBottom: '4px solid transparent',
                        borderLeft: '6px solid rgba(255,255,255,0.3)',
                        transform: 'translateY(-50%)'
                      }}></div>
                    </div>
                    <div style={{
                      display: 'inline-block',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      backgroundColor: `${getStatusColorHex(item.predictedStatus)}20`,
                      color: getStatusColorHex(item.predictedStatus),
                      fontSize: '12px',
                      fontWeight: 'bold',
                      boxShadow: '0 0 8px rgba(255,255,255,0.1)'
                    }}>
                      {getStatusText(item.predictedStatus)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{ opacity: 0.7, textAlign: 'center', padding: '15px 0' }}>
            当前无状态变化预测
          </div>
        )}
      </div>
      
      {/* 悬停信息提示 */}
      {hoveredInfo && (
        <div className="hover-info" style={{
          position: 'absolute',
          top: '50px',
          left: '20px',
          background: 'rgba(0,20,40,0.8)',
          color: '#fff',
          padding: '12px',
          borderRadius: '6px',
          maxWidth: '300px',
          fontSize: '14px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
          zIndex: 10
        }}>
          <div style={{ fontWeight: 'bold', marginBottom: '8px', fontSize: '16px' }}>
            {hoveredInfo.manhole.name}
          </div>
          <div style={{ marginBottom: '4px' }}>
            <span style={{ opacity: 0.7 }}>ID: </span>
            {hoveredInfo.manhole.id}
          </div>
          <div style={{ marginBottom: '4px' }}>
            <span style={{ opacity: 0.7 }}>状态: </span>
            <span style={{ 
              color: getStatusColorHex(hoveredInfo.manhole.status),
              fontWeight: 'bold' 
            }}>
              {getStatusText(hoveredInfo.manhole.status)}
            </span>
          </div>
          {hoveredInfo.realTimeData && (
            <>
              <div style={{ marginBottom: '4px' }}>
                <span style={{ opacity: 0.7 }}>水位: </span>
                {hoveredInfo.realTimeData.waterLevel}%
              </div>
              <div style={{ marginBottom: '4px' }}>
                <span style={{ opacity: 0.7 }}>温度: </span>
                {hoveredInfo.realTimeData.temperature}°C
              </div>
              <div style={{ marginBottom: '4px' }}>
                <span style={{ opacity: 0.7 }}>盖板状态: </span>
                {hoveredInfo.realTimeData.coverStatus === CoverStatus.Closed ? '关闭' : '打开'}
              </div>
            </>
          )}
          {hoveredInfo.predictedStatus && hoveredInfo.predictedStatus !== hoveredInfo.manhole.status && (
            <div style={{ 
              marginTop: '8px',
              padding: '6px 8px',
              background: 'rgba(255,255,255,0.1)',
              borderRadius: '4px',
              borderLeft: `3px solid ${getStatusColorHex(hoveredInfo.predictedStatus)}`
            }}>
              <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>预测状态变化</div>
              <div>
                <span style={{ opacity: 0.7 }}>预测状态: </span>
                <span style={{ 
                  color: getStatusColorHex(hoveredInfo.predictedStatus),
                  fontWeight: 'bold' 
                }}>
                  {getStatusText(hoveredInfo.predictedStatus)}
                </span>
              </div>
            </div>
          )}
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
      
      <div className="scene-info" style={{
        position: 'absolute',
        top: '10px',
        left: '10px',
        background: 'rgba(0,20,40,0.7)',
        color: '#fff',
        padding: '8px 12px',
        borderRadius: '4px',
        maxWidth: '300px',
        fontSize: '14px'
      }}>
        <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>合肥市智慧井盖系统</div>
        <div style={{ fontSize: '12px', opacity: 0.8 }}>
          显示关键位置井盖，包括政务中心、火车站、滨湖新区、包河区和科学岛
        </div>
      </div>
    </div>
  );
};

// 获取状态对应的颜色（十六进制格式）
const getStatusColorHex = (status: ManholeStatus): string => {
  switch (status) {
    case ManholeStatus.Normal:
      return '#52c41a'; // 绿色
    case ManholeStatus.Warning:
      return '#faad14'; // 黄色
    case ManholeStatus.Alarm:
      return '#f5222d'; // 红色
    case ManholeStatus.Offline:
      return '#8c8c8c'; // 灰色
    case ManholeStatus.Maintenance:
      return '#1890ff'; // 蓝色
    default:
      return '#52c41a';
  }
};

// 获取状态文本描述
const getStatusText = (status: ManholeStatus): string => {
  switch (status) {
    case ManholeStatus.Normal:
      return '正常';
    case ManholeStatus.Warning:
      return '警告';
    case ManholeStatus.Alarm:
      return '报警';
    case ManholeStatus.Offline:
      return '离线';
    case ManholeStatus.Maintenance:
      return '维护中';
    default:
      return '未知';
  }
};

export default React.memo(HefeiManholeScene);
