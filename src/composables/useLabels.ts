import { markRaw, ref, shallowRef } from "vue";
import * as THREE from "three";
import { CSS2DObject } from "three/examples/jsm/renderers/CSS2DRenderer";
import type { LabelData } from "../types/community";
import { createCSS2DLabel } from "../utils/threeHelpers";

export function useLabels() {
  const labels = shallowRef<CSS2DObject[]>([]);
  const labelGroup = shallowRef<THREE.Group | null>(null);
  const visible = ref(true);

  /**
   * 创建标签组
   */
  function createLabels(labelData: LabelData[]): THREE.Group {
    const group = markRaw(new THREE.Group());

    const labelList: CSS2DObject[] = [];

    labelData.forEach((data) => {
      const element = createCSS2DLabel(
        data.text,
        data.color || "#ffffff",
        `${data.fontSize || 14}px`,
      );

      const label = markRaw(new CSS2DObject(element));
      label.position.set(data.position[0], data.position[1], data.position[2]);
      label.userData = {
        type: "building-label",
        buildingId: data.buildingId,
      };

      labelList.push(label);
      group.add(label);
    });

    labels.value = labelList;
    labelGroup.value = group;
    return group;
  }

  /**
   * 切换标签显示/隐藏
   */
  function toggleVisibility(): void {
    visible.value = !visible.value;
    labels.value.forEach((label) => {
      label.visible = visible.value;
    });
  }

  /**
   * 设置标签可见性
   */
  function setVisibility(show: boolean): void {
    visible.value = show;
    labels.value.forEach((label) => {
      label.visible = show;
    });
  }

  /**
   * 更新标签文本
   */
  function updateLabelText(buildingId: string, text: string): void {
    const label = labels.value.find(
      (l) => l.userData.buildingId === buildingId,
    );
    if (label) {
      const element = label.element as HTMLDivElement;
      element.textContent = text;
    }
  }

  /**
   * 清除所有标签
   */
  function clear(): void {
    labels.value = [];
    labelGroup.value = null;
  }

  return {
    labels,
    labelGroup,
    visible,
    createLabels,
    toggleVisibility,
    setVisibility,
    updateLabelText,
    clear,
  };
}
