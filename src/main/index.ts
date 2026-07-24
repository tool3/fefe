import { join } from 'node:path'
import { BrowserWindow, app, shell } from 'electron'
import { JobManager } from './ffmpeg/jobManager'
import { registerIpc, wireJobEvents } from './ipc'
import { handleMediaProtocol, registerMediaScheme } from './mediaProtocol'

const isDev = !app.isPackaged

// Must run before the app is ready.
registerMediaScheme()

function createWindow(): void {
  const window = new BrowserWindow({
    width: 1180,
    height: 780,
    minWidth: 900,
    minHeight: 600,
    show: false,
    backgroundColor: '#141414',
    title: 'Fefe',
    autoHideMenuBar: true,
    webPreferences: {
      preload: join(__dirname, '../preload/index.mjs'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  window.on('ready-to-show', () => window.show())

  // Open external links in the OS browser, never inside the app.
  window.webContents.setWindowOpenHandler(({ url }) => {
    void shell.openExternal(url)
    return { action: 'deny' }
  })

  const devUrl = process.env['ELECTRON_RENDERER_URL']
  if (isDev && devUrl) {
    void window.loadURL(devUrl)
    window.webContents.openDevTools({ mode: 'detach' })
  } else {
    void window.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(() => {
  handleMediaProtocol()

  const manager = new JobManager()
  registerIpc(manager)
  wireJobEvents(manager)

  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
