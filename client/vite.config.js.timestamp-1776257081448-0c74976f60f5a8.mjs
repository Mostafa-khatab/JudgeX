// vite.config.js
import { defineConfig } from "file:///D:/JudgeX/JudgeX/client/node_modules/vite/dist/node/index.js";
import path from "path";
import react from "file:///D:/JudgeX/JudgeX/client/node_modules/@vitejs/plugin-react-swc/index.mjs";
import svgr from "file:///D:/JudgeX/JudgeX/client/node_modules/vite-plugin-svgr/dist/index.js";
import { viteStaticCopy } from "file:///D:/JudgeX/JudgeX/client/node_modules/vite-plugin-static-copy/dist/index.js";
var __vite_injected_original_dirname = "D:\\JudgeX\\JudgeX\\client";
var vite_config_default = defineConfig({
  define: {
    global: "window",
    "process.env": {}
  },
  plugins: [
    react(),
    svgr({
      svgrOptions: { exportType: "default", ref: true, titleProp: true },
      include: "**/*.svg"
    }),
    viteStaticCopy({
      targets: [
        {
          src: "src/locales",
          dest: ""
        }
      ]
    })
  ],
  css: {
    devSourcemap: true
  },
  resolve: {
    alias: {
      // eslint-disable-next-line no-undef
      "~": path.resolve(__vite_injected_original_dirname, "./src")
    }
  },
  assetsInclude: ["./src/locales"]
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcuanMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJEOlxcXFxKdWRnZVhcXFxcSnVkZ2VYXFxcXGNsaWVudFwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiRDpcXFxcSnVkZ2VYXFxcXEp1ZGdlWFxcXFxjbGllbnRcXFxcdml0ZS5jb25maWcuanNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL0Q6L0p1ZGdlWC9KdWRnZVgvY2xpZW50L3ZpdGUuY29uZmlnLmpzXCI7aW1wb3J0IHsgZGVmaW5lQ29uZmlnIH0gZnJvbSAndml0ZSc7XG5pbXBvcnQgcGF0aCBmcm9tICdwYXRoJztcbmltcG9ydCByZWFjdCBmcm9tICdAdml0ZWpzL3BsdWdpbi1yZWFjdC1zd2MnO1xuaW1wb3J0IHN2Z3IgZnJvbSAndml0ZS1wbHVnaW4tc3Zncic7XG5pbXBvcnQgeyB2aXRlU3RhdGljQ29weSB9IGZyb20gJ3ZpdGUtcGx1Z2luLXN0YXRpYy1jb3B5JztcblxuLy8gaHR0cHM6Ly92aXRlanMuZGV2L2NvbmZpZy9cbmV4cG9ydCBkZWZhdWx0IGRlZmluZUNvbmZpZyh7XG5cdGRlZmluZToge1xuXHRcdGdsb2JhbDogJ3dpbmRvdycsXG5cdFx0J3Byb2Nlc3MuZW52Jzoge30sXG5cdH0sXG5cdHBsdWdpbnM6IFtcblx0XHRyZWFjdCgpLFxuXHRcdHN2Z3Ioe1xuXHRcdFx0c3Znck9wdGlvbnM6IHsgZXhwb3J0VHlwZTogJ2RlZmF1bHQnLCByZWY6IHRydWUsIHRpdGxlUHJvcDogdHJ1ZSB9LFxuXHRcdFx0aW5jbHVkZTogJyoqLyouc3ZnJyxcblx0XHR9KSxcblx0XHR2aXRlU3RhdGljQ29weSh7XG5cdFx0XHR0YXJnZXRzOiBbXG5cdFx0XHRcdHtcblx0XHRcdFx0XHRzcmM6ICdzcmMvbG9jYWxlcycsXG5cdFx0XHRcdFx0ZGVzdDogJycsXG5cdFx0XHRcdH0sXG5cdFx0XHRdLFxuXHRcdH0pLFxuXHRdLFxuXHRjc3M6IHtcblx0XHRkZXZTb3VyY2VtYXA6IHRydWUsXG5cdH0sXG5cdHJlc29sdmU6IHtcblx0XHRhbGlhczoge1xuXHRcdFx0Ly8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLXVuZGVmXG5cdFx0XHQnfic6IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsICcuL3NyYycpLFxuXHRcdH0sXG5cdH0sXG5cdGFzc2V0c0luY2x1ZGU6IFsnLi9zcmMvbG9jYWxlcyddLFxufSk7XG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQStQLFNBQVMsb0JBQW9CO0FBQzVSLE9BQU8sVUFBVTtBQUNqQixPQUFPLFdBQVc7QUFDbEIsT0FBTyxVQUFVO0FBQ2pCLFNBQVMsc0JBQXNCO0FBSi9CLElBQU0sbUNBQW1DO0FBT3pDLElBQU8sc0JBQVEsYUFBYTtBQUFBLEVBQzNCLFFBQVE7QUFBQSxJQUNQLFFBQVE7QUFBQSxJQUNSLGVBQWUsQ0FBQztBQUFBLEVBQ2pCO0FBQUEsRUFDQSxTQUFTO0FBQUEsSUFDUixNQUFNO0FBQUEsSUFDTixLQUFLO0FBQUEsTUFDSixhQUFhLEVBQUUsWUFBWSxXQUFXLEtBQUssTUFBTSxXQUFXLEtBQUs7QUFBQSxNQUNqRSxTQUFTO0FBQUEsSUFDVixDQUFDO0FBQUEsSUFDRCxlQUFlO0FBQUEsTUFDZCxTQUFTO0FBQUEsUUFDUjtBQUFBLFVBQ0MsS0FBSztBQUFBLFVBQ0wsTUFBTTtBQUFBLFFBQ1A7QUFBQSxNQUNEO0FBQUEsSUFDRCxDQUFDO0FBQUEsRUFDRjtBQUFBLEVBQ0EsS0FBSztBQUFBLElBQ0osY0FBYztBQUFBLEVBQ2Y7QUFBQSxFQUNBLFNBQVM7QUFBQSxJQUNSLE9BQU87QUFBQTtBQUFBLE1BRU4sS0FBSyxLQUFLLFFBQVEsa0NBQVcsT0FBTztBQUFBLElBQ3JDO0FBQUEsRUFDRDtBQUFBLEVBQ0EsZUFBZSxDQUFDLGVBQWU7QUFDaEMsQ0FBQzsiLAogICJuYW1lcyI6IFtdCn0K
