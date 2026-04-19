<!-- src/components/SceneCanvas.vue -->
<template>
  <div ref="containerRef" class="scene-container">
    <div v-if="!isReady" class="scene-loading">
      <div class="loading-spinner"></div>
      <p>加载场景中...</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, inject } from "vue";
import * as THREE from "three";
import { useScene } from "../composables/useScene";
import { useBuilding } from "../composables/useBuilding";
import { useLabels } from "../composables/useLabels";
import { useSceneStore } from "../stores/model/useSceneStore"; // 引入 Store

const props = defineProps({
  selectedBuildingId: {
    type: String,
  },
});

watch(
  () => props.selectedBuildingId,
  (val) => {},
);

// Store
const sceneStore = useSceneStore();

// Refs
const containerRef = ref<HTMLElement | null>(null);

// Composables
const {
  scene,
  camera,
  isReady,
  // config: sceneConfig, // 注意：这里的 sceneConfig 是 useScene 内部的，可能需要与 Store 同步或替换
  addToScene,
  focusOn,
} = useScene(containerRef);

const { generateFromGeoJSON, generateLabelData } = useBuilding();

const { createLabels, setVisibility } = useLabels();

// 初始化场景内容
async function initSceneContent(): Promise<void> {
  if (!scene.value) return;

  try {
    await sceneStore.filterDataSource();
    const communityData = sceneStore.getGeoJson;
    console.log("communityData", communityData);
    // 生成建筑 - 使用 Store 中的透明度
    const buildingGroup = generateFromGeoJSON(communityData!, 1, 0.5);

    addToScene(buildingGroup);

    // 生成标签
    const labelData = generateLabelData();
    const labelGroup = createLabels(labelData);
    addToScene(labelGroup);
    emit("scene-ready");
  } catch (error) {
    console.error("加载社区数据失败:", error);
  }
}

// 添加装饰元素
function addDecorations(): void {
  if (!scene.value) return;

  const treePositions = [
    [-30, 0, -20],
    [30, 0, -30],
    [-20, 0, 30],
    [40, 0, 20],
    [-40, 0, -10],
  ];

  treePositions.forEach((pos) => {
    const treeGroup = createSimpleTree();
    treeGroup.position.set(pos[0], 0, pos[2]);
    addToScene(treeGroup);
  });
}

// 创建简单树木
function createSimpleTree(): THREE.Group {
  const group = new THREE.Group();

  const trunkGeo = new THREE.CylinderGeometry(0.8, 1, 4);
  const trunkMat = new THREE.MeshStandardMaterial({
    color: 0x8b5e3c,
    roughness: 0.9,
  });
  const trunk = new THREE.Mesh(trunkGeo, trunkMat);
  trunk.position.y = 2;
  trunk.castShadow = true;
  trunk.receiveShadow = true;
  group.add(trunk);

  const crownGeo = new THREE.ConeGeometry(2.5, 5, 8);
  const crownMat = new THREE.MeshStandardMaterial({
    color: 0x2d5a27,
    roughness: 0.6,
  });
  const crown = new THREE.Mesh(crownGeo, crownMat);
  crown.position.y = 6;
  crown.castShadow = true;
  crown.receiveShadow = true;
  group.add(crown);

  return group;
}

// 处理建筑点击
function handleBuildingClick(event: MouseEvent): void {
  if (!camera.value || !scene.value) return;

  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();

  const rect = containerRef.value!.getBoundingClientRect();
  mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

  raycaster.setFromCamera(mouse, camera.value);

  const intersects = raycaster.intersectObjects(scene.value.children, true);
  // console.log("intersects", intersects);
  for (const intersect of intersects) {
    let obj = intersect.object;
    while (obj.parent && !obj.userData.isBuilding) {
      obj = obj.parent;
    }

    if (obj.userData.isBuilding) {
      console.log("obj.userData.isBuilding", obj);
      const buildingId = obj.userData.id;

      const box = new THREE.Box3().setFromObject(obj);
      const center = new THREE.Vector3();
      box.getCenter(center);
      focusOn(obj);

      emit("building-click", buildingId, obj.userData);
      break;
    }
  }
}

// Emits
const emit = defineEmits<{
  (e: "building-click", buildingId: string, properties: any): void;
  (e: "scene-ready"): void;
}>();

// 监听 Store 中的配置变化
watch(
  () => sceneStore.config.showLabels,
  (show) => {
    setVisibility(show);
  },
);

// watch(
//   () => [
//     sceneStore.config.ambientLightIntensity,
//     sceneStore.config.directionalLightIntensity,
//     sceneStore.config.showGrid,
//     sceneStore.config.isNightMode,
//   ],
//   () => {
//     applySceneConfig();
//   },
// );

// 绑定事件
onMounted(() => {
  initSceneContent();
  if (containerRef.value) {
    containerRef.value.addEventListener("click", handleBuildingClick);
  }
});

// 暴露方法
defineExpose({
  focusOn,
});
</script>

<style scoped>
/* ... 原有样式保持不变 ... */
.scene-container {
  width: 100%;
  height: 100%;
  position: relative;
}

.scene-loading {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  color: white;
  z-index: 10;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid rgba(255, 255, 255, 0.3);
  border-top-color: #00f2ff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 15px;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
