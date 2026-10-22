const { execFileSync } = require('node:child_process')
const fs = require('node:fs')
const path = require('node:path')

const REACT_DIR = path.resolve(__dirname, '..', '..', 'ReactJS_Holy')
const REACT_DIST = path.join(REACT_DIR, 'dist')
const TARGET_DIR = path.resolve(__dirname, '..', 'app')

if (!fs.existsSync(REACT_DIR)) {
  console.error(`ReactJS_Holy topilmadi: ${REACT_DIR}`)
  process.exit(1)
}

console.log(`React ilovasi build qilinmoqda: ${REACT_DIR}`)
const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm'
// ELECTRON_BUILD=1 — vite.config.js shu bayroqqa qarab bazani '/ReactJS_Holy/'
// (GitHub Pages uchun) emas, '/' (Electron'ning app:// protokoli uchun) qiladi
execFileSync(npmCmd, ['run', 'build'], {
  cwd: REACT_DIR,
  stdio: 'inherit',
  shell: true,
  env: { ...process.env, ELECTRON_BUILD: '1' },
})

if (!fs.existsSync(REACT_DIST)) {
  console.error(`Build natijasi topilmadi: ${REACT_DIST}`)
  process.exit(1)
}

console.log(`Build natijasi nusxalanmoqda -> ${TARGET_DIR}`)
fs.rmSync(TARGET_DIR, { recursive: true, force: true })
fs.cpSync(REACT_DIST, TARGET_DIR, { recursive: true })

console.log('Tayyor.')
