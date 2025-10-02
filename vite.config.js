import { fileURLToPath, URL } from 'node:url'

import { defineConfig, loadEnv } from 'vite'

import VueRouter from 'unplugin-vue-router/vite'

import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import legacy from '@vitejs/plugin-legacy'

// https://vitejs.dev/config/
export default ({ mode }) => {
  process.env = {...process.env, ...loadEnv(mode, process.cwd())}

  return defineConfig({
    esbuild: {
      supported: {
        'top-level-await': true //browsers can handle top-level-await features
      },
    },
    plugins: [
      VueRouter({
        /* options 입력 // 자세한 내용 : https://www.npmjs.com/package/unplugin-vue-router */
        routesFolder: [
          'src/pages',
        ], // Folder(s) to scan for vue components and generate routes. Can be a string, or an object, or an array of those.
        extensions: ['.vue'], // allowed extensions to be considered as routes
        exclude: ['**/*Popup*.vue', '**/*Tab*.vue', '**/*Sub*.vue'], // Popup, tab file에 대해서 auto routing 예외처리
      }),
      vue(),
      vueJsx(),
      legacy()
    ],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url))
      }
    },
    base: process.env.VITE_vue_publicPath
  })
}