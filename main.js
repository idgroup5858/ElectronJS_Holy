const { app, BrowserWindow, Menu, protocol, net, shell, ipcMain } = require('electron')
const path = require('node:path')
const fs = require('node:fs')
const { spawn } = require('node:child_process')
const { pathToFileURL } = require('node:url')

const APP_DIR = path.join(__dirname, 'app')
const ICON_PATH = path.join(__dirname, 'build', 'icon.ico')
const APP_TITLE = 'Microsoft Edge'

// productName o'zgargani uchun saqlangan ma'lumotlar eski papkada qolishi kerak
app.setPath('userData', path.join(app.getPath('appData'), "Qur'on"))

protocol.registerSchemesAsPrivileged([
  {
    scheme: 'app',
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
      corsEnabled: true,
      stream: true,
    },
  },
])

function resolveFilePath(pathname) {
  let relative = decodeURIComponent(pathname)
  if (relative.startsWith('/')) relative = relative.slice(1)
  if (relative === '') relative = 'index.html'

  let filePath = path.normalize(path.join(APP_DIR, relative))
  if (!filePath.startsWith(APP_DIR)) filePath = path.join(APP_DIR, 'index.html')
  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    filePath = path.join(APP_DIR, 'index.html')
  }
  return filePath
}

function createWindow(bounds = {}) {
  const win = new BrowserWindow({
    width: 1280,
    height: 860,
    ...bounds,
    minWidth: 720,
    minHeight: 560,
    icon: ICON_PATH,
    title: APP_TITLE,
    backgroundColor: '#0f1012',
    autoHideMenuBar: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  })

  win.setMenuBarVisibility(false)
  win.on('page-title-updated', (event) => event.preventDefault())
  win.loadURL('app://holy/')

  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http:') || url.startsWith('https:')) {
      shell.openExternal(url)
    }
    return { action: 'deny' }
  })

  return win
}

// Ilova Edge'ning "Yangi vkladka" sahifasi ko'rinishida ochiladi
function createDecoyWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 860,
    minWidth: 720,
    minHeight: 560,
    icon: ICON_PATH,
    backgroundColor: '#333333',
    titleBarStyle: 'hidden',
    titleBarOverlay: { color: '#000000', symbolColor: '#ffffff', height: 39 },
    webPreferences: {
      preload: path.join(__dirname, 'decoy', 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  })
  win.loadFile(path.join(__dirname, 'decoy', 'index.html'))
  return win
}

function findEdge() {
  const candidates = [process.env['ProgramFiles(x86)'], process.env.ProgramFiles, process.env.LOCALAPPDATA]
    .filter(Boolean)
    .map((dir) => path.join(dir, 'Microsoft', 'Edge', 'Application', 'msedge.exe'))
  return candidates.find((file) => fs.existsSync(file))
}

function openInRealEdge(input) {
  const looksLikeUrl = /^[a-z][a-z0-9+.-]*:\/\//i.test(input) || (!/\s/.test(input) && /\.|^localhost/i.test(input))
  const target = !input ? '' : looksLikeUrl ? input : `https://www.bing.com/search?q=${encodeURIComponent(input)}`
  const edge = findEdge()
  if (edge) {
    spawn(edge, target ? [target] : [], { detached: true, stdio: 'ignore' }).unref()
  } else {
    shell.openExternal(/^[a-z]+:\/\//i.test(target) ? target : `https://${target || 'www.bing.com'}`)
  }
}

ipcMain.on('decoy:open-app', (event) => {
  const decoy = BrowserWindow.fromWebContents(event.sender)
  const maximized = decoy.isMaximized()
  const win = createWindow(maximized ? {} : decoy.getBounds())
  if (maximized) win.maximize()
  decoy.destroy()
})

ipcMain.on('decoy:navigate', (event, input) => {
  openInRealEdge(String(input || ''))
  BrowserWindow.fromWebContents(event.sender)?.close()
})

ipcMain.on('decoy:close', (event) => {
  BrowserWindow.fromWebContents(event.sender)?.close()
})

app.whenReady().then(() => {
  protocol.handle('app', (request) => {
    const { pathname } = new URL(request.url)
    const filePath = resolveFilePath(pathname)
    return net.fetch(pathToFileURL(filePath).toString())
  })

  Menu.setApplicationMenu(null)
  createDecoyWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createDecoyWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
