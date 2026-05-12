// vite.config.js
import { defineConfig, loadEnv } from "file:///D:/JudgeX/JudgeX/client/node_modules/vite/dist/node/index.js";
import path from "path";
import react from "file:///D:/JudgeX/JudgeX/client/node_modules/@vitejs/plugin-react-swc/index.mjs";
import svgr from "file:///D:/JudgeX/JudgeX/client/node_modules/vite-plugin-svgr/dist/index.js";
import { viteStaticCopy } from "file:///D:/JudgeX/JudgeX/client/node_modules/vite-plugin-static-copy/dist/index.js";
var __vite_injected_original_dirname = "D:\\JudgeX\\JudgeX\\client";
var vite_config_default = defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const buildSourcemap = env.VITE_BUILD_SOURCEMAP === "true";
  const disableMinify = env.VITE_DISABLE_MINIFY === "true";
  return {
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
    build: {
      sourcemap: buildSourcemap,
      minify: disableMinify ? false : "esbuild"
    },
    resolve: {
      alias: {
        // eslint-disable-next-line no-undef
        "~": path.resolve(__vite_injected_original_dirname, "./src")
      }
    },
    assetsInclude: ["./src/locales"]
  };
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcuanMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJEOlxcXFxKdWRnZVhcXFxcSnVkZ2VYXFxcXGNsaWVudFwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiRDpcXFxcSnVkZ2VYXFxcXEp1ZGdlWFxcXFxjbGllbnRcXFxcdml0ZS5jb25maWcuanNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL0Q6L0p1ZGdlWC9KdWRnZVgvY2xpZW50L3ZpdGUuY29uZmlnLmpzXCI7aW1wb3J0IHsgZGVmaW5lQ29uZmlnLCBsb2FkRW52IH0gZnJvbSAndml0ZSc7XG5pbXBvcnQgcGF0aCBmcm9tICdwYXRoJztcbmltcG9ydCByZWFjdCBmcm9tICdAdml0ZWpzL3BsdWdpbi1yZWFjdC1zd2MnO1xuaW1wb3J0IHN2Z3IgZnJvbSAndml0ZS1wbHVnaW4tc3Zncic7XG5pbXBvcnQgeyB2aXRlU3RhdGljQ29weSB9IGZyb20gJ3ZpdGUtcGx1Z2luLXN0YXRpYy1jb3B5JztcblxuLy8gaHR0cHM6Ly92aXRlanMuZGV2L2NvbmZpZy9cblxuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKCh7IG1vZGUgfSkgPT4ge1xuXHRjb25zdCBlbnYgPSBsb2FkRW52KG1vZGUsIHByb2Nlc3MuY3dkKCksICcnKTtcblx0Y29uc3QgYnVpbGRTb3VyY2VtYXAgPSBlbnYuVklURV9CVUlMRF9TT1VSQ0VNQVAgPT09ICd0cnVlJztcblx0Y29uc3QgZGlzYWJsZU1pbmlmeSA9IGVudi5WSVRFX0RJU0FCTEVfTUlOSUZZID09PSAndHJ1ZSc7XG5cblx0cmV0dXJuIHtcblx0ZGVmaW5lOiB7XG5cdFx0Z2xvYmFsOiAnd2luZG93Jyxcblx0XHQncHJvY2Vzcy5lbnYnOiB7fSxcblx0fSxcblx0cGx1Z2luczogW1xuXHRcdHJlYWN0KCksXG5cdFx0c3Zncih7XG5cdFx0XHRzdmdyT3B0aW9uczogeyBleHBvcnRUeXBlOiAnZGVmYXVsdCcsIHJlZjogdHJ1ZSwgdGl0bGVQcm9wOiB0cnVlIH0sXG5cdFx0XHRpbmNsdWRlOiAnKiovKi5zdmcnLFxuXHRcdH0pLFxuXHRcdHZpdGVTdGF0aWNDb3B5KHtcblx0XHRcdHRhcmdldHM6IFtcblx0XHRcdFx0e1xuXHRcdFx0XHRcdHNyYzogJ3NyYy9sb2NhbGVzJyxcblx0XHRcdFx0XHRkZXN0OiAnJyxcblx0XHRcdFx0fSxcblx0XHRcdF0sXG5cdFx0fSksXG5cdF0sXG5cdGNzczoge1xuXHRcdGRldlNvdXJjZW1hcDogdHJ1ZSxcblx0fSxcblx0YnVpbGQ6IHtcblx0XHRzb3VyY2VtYXA6IGJ1aWxkU291cmNlbWFwLFxuXHRcdG1pbmlmeTogZGlzYWJsZU1pbmlmeSA/IGZhbHNlIDogJ2VzYnVpbGQnLFxuXHR9LFxuXHRyZXNvbHZlOiB7XG5cdFx0YWxpYXM6IHtcblx0XHRcdC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby11bmRlZlxuXHRcdFx0J34nOiBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCAnLi9zcmMnKSxcblx0XHR9LFxuXHR9LFxuXHRhc3NldHNJbmNsdWRlOiBbJy4vc3JjL2xvY2FsZXMnXSxcblx0fTtcbn0pO1xuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUErUCxTQUFTLGNBQWMsZUFBZTtBQUNyUyxPQUFPLFVBQVU7QUFDakIsT0FBTyxXQUFXO0FBQ2xCLE9BQU8sVUFBVTtBQUNqQixTQUFTLHNCQUFzQjtBQUovQixJQUFNLG1DQUFtQztBQVF6QyxJQUFPLHNCQUFRLGFBQWEsQ0FBQyxFQUFFLEtBQUssTUFBTTtBQUN6QyxRQUFNLE1BQU0sUUFBUSxNQUFNLFFBQVEsSUFBSSxHQUFHLEVBQUU7QUFDM0MsUUFBTSxpQkFBaUIsSUFBSSx5QkFBeUI7QUFDcEQsUUFBTSxnQkFBZ0IsSUFBSSx3QkFBd0I7QUFFbEQsU0FBTztBQUFBLElBQ1AsUUFBUTtBQUFBLE1BQ1AsUUFBUTtBQUFBLE1BQ1IsZUFBZSxDQUFDO0FBQUEsSUFDakI7QUFBQSxJQUNBLFNBQVM7QUFBQSxNQUNSLE1BQU07QUFBQSxNQUNOLEtBQUs7QUFBQSxRQUNKLGFBQWEsRUFBRSxZQUFZLFdBQVcsS0FBSyxNQUFNLFdBQVcsS0FBSztBQUFBLFFBQ2pFLFNBQVM7QUFBQSxNQUNWLENBQUM7QUFBQSxNQUNELGVBQWU7QUFBQSxRQUNkLFNBQVM7QUFBQSxVQUNSO0FBQUEsWUFDQyxLQUFLO0FBQUEsWUFDTCxNQUFNO0FBQUEsVUFDUDtBQUFBLFFBQ0Q7QUFBQSxNQUNELENBQUM7QUFBQSxJQUNGO0FBQUEsSUFDQSxLQUFLO0FBQUEsTUFDSixjQUFjO0FBQUEsSUFDZjtBQUFBLElBQ0EsT0FBTztBQUFBLE1BQ04sV0FBVztBQUFBLE1BQ1gsUUFBUSxnQkFBZ0IsUUFBUTtBQUFBLElBQ2pDO0FBQUEsSUFDQSxTQUFTO0FBQUEsTUFDUixPQUFPO0FBQUE7QUFBQSxRQUVOLEtBQUssS0FBSyxRQUFRLGtDQUFXLE9BQU87QUFBQSxNQUNyQztBQUFBLElBQ0Q7QUFBQSxJQUNBLGVBQWUsQ0FBQyxlQUFlO0FBQUEsRUFDL0I7QUFDRCxDQUFDOyIsCiAgIm5hbWVzIjogW10KfQo=
