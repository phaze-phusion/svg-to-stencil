import { existsSync, readdirSync, rmSync, copyFileSync, mkdirSync } from 'fs'

const distDir = './dist';

if (existsSync(distDir)) {
  readdirSync(distDir).forEach(file => rmSync(`${distDir}/${file}`, {recursive: true, force: true}))
  copyFileSync('./src/index.html', `${distDir}/index.html`)
  copyFileSync('./src/favicon.ico', `${distDir}/favicon.ico`)
} else {
  mkdirSync(distDir)
}
