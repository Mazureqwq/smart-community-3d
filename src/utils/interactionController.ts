import * as THREE from "three";
import { CSS2DObject } from "three/examples/jsm/renderers/CSS2DRenderer";
import { createApp } from "vue";
import BuildingPanel from "../components/BuildingPanel.vue";
import { useSceneStore } from "../stores";
import { storeToRefs } from "pinia";

type Options = {
  getScene: () => THREE.Scene | null;
  getCamera: () => THREE.PerspectiveCamera | null;
  getRendererDom: () => HTMLElement | null;
  getControls: () => any; // MapControls
  getBuildings: () => THREE.Object3D[];
};

enum State {
  IDLE,
  FLYING,
  SHOWING,
}

export function createInteractionController(opt: Options) {
  const { getScene, getCamera, getRendererDom, getControls, getBuildings } =
    opt;

  let state = State.IDLE;

  // ===== raycaster
  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();

  // ===== 飞行动画参数
  let flyT = 0;
  const FLY_DURATION = 0.6;

  const startPos = new THREE.Vector3();
  const startTarget = new THREE.Vector3();

  const endPos = new THREE.Vector3();
  const endTarget = new THREE.Vector3();

  const { config } = storeToRefs(useSceneStore());

  // ===== 当前选中
  let currentTarget: THREE.Object3D | null = null;

  // ===== label & line
  let label: CSS2DObject | null = null;

  let lineCanvas: HTMLCanvasElement | null = null;
  let ctx: CanvasRenderingContext2D | null = null;

  let vueApp: any = null;

  // ===== 缓存向量
  const box = new THREE.Box3();
  const center = new THREE.Vector3();
  const size = new THREE.Vector3();

  // ===== 初始化连线canvas
  function initLineCanvas() {
    const dom = getRendererDom();
    if (!dom) return;

    lineCanvas = document.createElement("canvas");
    lineCanvas.style.position = "absolute";
    lineCanvas.style.left = "0";
    lineCanvas.style.top = "0";
    lineCanvas.style.pointerEvents = "none";

    ctx = lineCanvas.getContext("2d");

    dom.parentElement?.appendChild(lineCanvas);

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);
  }

  function resizeCanvas() {
    const dom = getRendererDom();
    if (!dom || !lineCanvas || !ctx) return;

    const dpr = window.devicePixelRatio || 1;

    lineCanvas.width = dom.clientWidth * dpr;
    lineCanvas.height = dom.clientHeight * dpr;

    lineCanvas.style.width = dom.clientWidth + "px";
    lineCanvas.style.height = dom.clientHeight + "px";

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  // ===== 点击检测
  function onClick(event: MouseEvent) {
    const dom = getRendererDom();
    const cam = getCamera();
    const scene = getScene();

    if (!dom || !cam || !scene) return;

    const rect = dom.getBoundingClientRect();

    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(mouse, cam);

    const intersects = raycaster.intersectObjects(getBuildings(), true);

    if (intersects.length > 0) {
      const obj = intersects[0].object;
      selectBuilding(obj);
    }
    if (intersects.length === 0) {
      clearSelection();
    }
  }
  function clearSelection() {
    currentTarget = null;
    state = State.IDLE;

    removeLabel(); // 这里会触发你做的“动画关闭”

    // 如果你启用了连线
    if (ctx && lineCanvas) {
      ctx.clearRect(0, 0, lineCanvas.width, lineCanvas.height);
    }
  }
  // ===== 选择建筑
  function selectBuilding(obj: THREE.Object3D) {
    const cam = getCamera();
    const controls = getControls();
    if (!cam || !controls) return;

    currentTarget = obj;

    box.setFromObject(obj);
    box.getCenter(center);
    box.getSize(size);

    // 起点
    startPos.copy(cam.position);
    startTarget.copy(controls.target);

    // 终点（自动计算距离）
    const maxDim = Math.max(size.x, size.y, size.z);
    const dist = maxDim * 2;

    const dir = new THREE.Vector3(1, 1, 1).normalize();

    endTarget.copy(center);
    endPos.copy(center).add(dir.multiplyScalar(dist));

    flyT = 0;
    state = State.FLYING;

    removeLabel();
  }

  // ===== 飞行更新
  function updateFly(delta: number) {
    const cam = getCamera();
    const controls = getControls();
    if (!cam || !controls) return;

    flyT += delta / FLY_DURATION;
    if (flyT > 1) flyT = 1;

    const t = flyT < 0.5 ? 2 * flyT * flyT : 1 - Math.pow(-2 * flyT + 2, 2) / 2;

    cam.position.lerpVectors(startPos, endPos, t);
    controls.target.lerpVectors(startTarget, endTarget, t);

    if (flyT === 1) {
      state = State.SHOWING;
      createPanel();
    }
  }

  // ===== 创建右侧面板
  function createPanel() {
    if (!currentTarget) return;

    const scene = getScene();
    if (!scene) return;
    config.value.showLabels = false;
    removeLabel();

    const container = document.createElement("div");
    container.style.pointerEvents = "auto";

    vueApp = createApp(BuildingPanel);
    vueApp.mount(container);

    const wrapper = document.createElement("div");
    wrapper.style.position = "relative";

    const panel = document.createElement("div");
    panel.style.position = "absolute";
    // ===== 初始态（更偏右 + 透明）
    panel.style.transform = "translate(60px,-50%)";
    panel.style.opacity = "0";
    panel.style.transition = "all 0.25s ease";
    panel.style.width = "0"; //解决面板视觉宽高与实际dom宽高不符问题

    //  下一帧进入目标态（触发动画）
    requestAnimationFrame(() => {
      panel.style.transform = "translate(20px,-50%)";
      panel.style.opacity = "1";
    });

    panel.appendChild(container);
    wrapper.appendChild(panel);
    wrapper.addEventListener("click", (e) => {
      e.stopPropagation();
    });
    label = new CSS2DObject(wrapper);

    const el = wrapper;

    // 初始状态
    el.classList.add("fade-enter");
    el.classList.add("fade-enter-active");

    requestAnimationFrame(() => {
      el.classList.add("fade-enter-to");
    });

    box.setFromObject(currentTarget);
    box.getCenter(center);
    center.x = box.max.x;
    center.y += 2;

    // label.position.copy(center);
    const cam = getCamera();
    if (cam) {
      // 从建筑中心 → 相机方向
      const dir = new THREE.Vector3()
        .subVectors(cam.position, center)
        .normalize();

      const OFFSET = 0; //  控制“离屏幕更近”的程度

      label.position.copy(center.clone().add(dir.multiplyScalar(OFFSET)));
    }

    scene.add(label);
  }

  function removeLabel() {
    if (!label) return;
    config.value.showLabels = true;
    const panel = (label.element as HTMLElement)
      .firstElementChild as HTMLElement;

    if (panel) {
      panel.style.transition = "all 0.25s ease";
      panel.style.transform = "translate(80px,-50%)"; //
      panel.style.opacity = "0";
    }

    setTimeout(() => {
      getScene()?.remove(label);
      label = null;

      if (vueApp) {
        vueApp.unmount();
        vueApp = null;
      }
    }, 250);
  }

  function updateLine() {
    if (!ctx || !lineCanvas || !label || !currentTarget) return;

    const cam = getCamera();
    if (!cam) return;

    // ===== 实时计算建筑中心（关键）
    box.setFromObject(currentTarget);
    box.getCenter(center);

    const p = center.clone().project(cam);

    // ===== 视锥裁剪（防止消失）
    if (p.z > 1 || p.z < -1) {
      ctx.clearRect(0, 0, lineCanvas.width, lineCanvas.height);
      return;
    }
    const dom = getRendererDom();
    if (!dom) return;

    const x1 = (p.x * 0.5 + 0.5) * dom.clientWidth;
    const y1 = (-p.y * 0.5 + 0.5) * dom.clientHeight;

    // ===== DOM 延迟一帧读取（避免抖动）
    requestAnimationFrame(() => {
      const rect = (label?.element as HTMLElement)?.getBoundingClientRect();

      if (!rect?.width || !rect?.height) return;

      const x2 = rect.left;
      const y2 = rect.top + rect.height / 2;

      if (ctx && lineCanvas) {
        ctx.clearRect(0, 0, lineCanvas.width, lineCanvas.height);

        ctx.beginPath();

        //  贝塞尔曲线（更顺滑）
        const cx = (x1 + x2) / 2;

        ctx.moveTo(x1, y1);
        ctx.quadraticCurveTo(cx, y1, x2, y2);

        ctx.strokeStyle = "#00ffff";
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    });
  }

  // ===== 主更新
  function update(delta: number) {
    if (state === State.FLYING) {
      updateFly(delta);
    }

    if (state === State.SHOWING) {
      updateLine();
    }
  }

  // ===== 绑定
  function bind() {
    const dom = getRendererDom();
    if (!dom) return;
    dom.addEventListener("click", onClick);
    initLineCanvas();
  }

  function dispose() {
    const dom = getRendererDom();
    dom?.removeEventListener("click", onClick);
    window.removeEventListener("resize", resizeCanvas);
    removeLabel();
  }

  return {
    bind,
    update,
    dispose,
  };
}
