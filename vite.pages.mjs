import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';
import {fileURLToPath} from 'node:url';
export default defineConfig({root:fileURLToPath(new URL('./static-source',import.meta.url)),publicDir:fileURLToPath(new URL('./public-assets',import.meta.url)),plugins:[react()],build:{outDir:'../site-dist',emptyOutDir:true}});
