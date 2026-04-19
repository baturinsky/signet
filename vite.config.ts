import glsl from 'vite-plugin-glsl';
import wasm from "vite-plugin-wasm";
import topLevelAwait from "vite-plugin-top-level-await";
import { viteSingleFile } from "vite-plugin-singlefile"
//import compiler from '@ampproject/rollup-plugin-closure-compiler';
import { defineConfig, UserConfig, UserConfigFnObject } from 'vite';

export default defineConfig(({ command, mode, isSsrBuild, isPreview }) => {
  return {
    plugins: [
      glsl({ minify: true }),
      wasm(),
      topLevelAwait(),
      viteSingleFile({removeViteModuleLoader:true}), 
    ],
    base: '',
    define: {
      DEBUG: mode == 'development'
    },

    build: {
      minify: true,
      modulePreload: { polyfill: false },
      emptyOutDir: true,
      outDir: "./postjam",
      rollupOptions: {
        output: { entryFileNames: "bundle.js" }
      }
    }
  } as UserConfig
});

