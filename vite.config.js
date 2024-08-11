import { fileURLToPath, URL } from "node:url";

import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import AutoImport from "unplugin-auto-import/vite";
import Components from "unplugin-vue-components/vite";
import { ElementPlusResolver } from "unplugin-vue-components/resolvers";

// https://vitejs.dev/config/
export default defineConfig({
  transpileDependencies: true,
  lintOnSave: false, //关闭eslint检测
  server: {
    host: true,
    port: 8088,
    open: true,
  },
  plugins: [
    vue(),
    AutoImport({
      imports: ["vue", "pinia", "vue-router"],
      resolvers: [ElementPlusResolver()], // Vant和Element按需加载
    }),
    Components({
      deep: true, // 搜索子目录
      dirs: ["src/components"], // 按需加载的文件夹
      resolvers: [ElementPlusResolver()], // Element按需加载
    }),
  ],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});
