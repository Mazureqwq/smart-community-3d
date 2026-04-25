import { defineConfig } from "unocss/vite";
import {
  presetUno,
  presetAttributify,
  presetIcons,
  presetTypography,
} from "unocss";

export default defineConfig({
  presets: [
    presetUno(), // 核心原子化
    presetAttributify(), // 属性写法
    presetIcons(), // 图标
    presetTypography(), // 排版
  ],
});
