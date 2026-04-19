import { viteSingleFile } from "vite-plugin-singlefile"
//import compiler from '@ampproject/rollup-plugin-closure-compiler';
import { defineConfig, UserConfig, UserConfigFnObject } from 'vite';

export default defineConfig(({ command, mode, isSsrBuild, isPreview }) => {
  return {
    plugins: [
      viteSingleFile({removeViteModuleLoader:true}), 
    ],
    base: '',
    define: {
      DEBUG: mode == 'development'
    },

    build: {
      minify: true,
      emptyOutDir: true
    }
  } as UserConfig
});

