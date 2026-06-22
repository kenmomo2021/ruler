import { app, BrowserWindow, ipcMain, screen } from 'electron'
import path from 'node:path'
import fs from 'node:fs'
import { registerIpc } from './ipc'
import { detectPxPerMm, DEFAULT_PX_PER_MM } from './dpi'

interface RulerState {
  cx: number
  cy: number
  lengthMm: number
  angleDeg: number
  pxPerMm: number
  pxPerMmAuto: number
  userCalibrated: boolean
  thicknessMm: number
  alwaysOnTop: boolean
}

const DEFAULT_STATE: RulerState = {
  cx: 0,
  cy: 0,
  lengthMm: 150,
  angleDeg: 0,
  pxPerMm: DEFAULT_PX_PER_MM,
  pxPerMmAuto: DEFAULT_PX_PER_MM,
  userCalibrated: false,
  thicknessMm: 30,
  alwaysOnTop: true
}

class JsonStore {
  private filePath: string
  private data: RulerState

  constructor(filename: string) {
    this.filePath = path.join(app.getPath('userData'), filename)
    this.data = { ...DEFAULT_STATE }
    this.load()
  }

  private load(): void {
    try {
      const raw = fs.readFileSync(this.filePath, 'utf8')
      const parsed = JSON.parse(raw) as Partial<RulerState>
      this.data = { ...DEFAULT_STATE, ...parsed }
    } catch {
      this.data = { ...DEFAULT_STATE }
    }
  }

  private save(): void {
    try {
      fs.writeFileSync(this.filePath, JSON.stringify(this.data, null, 2), 'utf8')
    } catch {
      /* ignore write errors */
    }
  }

  get all(): RulerState {
    return this.data
  }

  set(partial: Partial<RulerState>): RulerState {
    this.data = { ...this.data, ...partial }
    this.save()
    return this.data
  }
}

let store: JsonStore

function createWindow(): void {
  const { width: sw, height: sh } = screen.getPrimaryDisplay().workAreaSize

  const saved = store.all
  const initialCx = saved.cx > 0 ? saved.cx : sw / 2
  const initialCy = saved.cy > 0 ? saved.cy : sh / 2

  const win = new BrowserWindow({
    width: sw,
    height: sh,
    x: 0,
    y: 0,
    frame: false,
    transparent: true,
    resizable: false,
    movable: false,
    minimizable: false,
    maximizable: false,
    hasShadow: false,
    skipTaskbar: true,
    alwaysOnTop: saved.alwaysOnTop,
    backgroundColor: '#00000000',
    show: false,
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  })

  win.setIgnoreMouseEvents(true, { forward: true })

  if (process.env['ELECTRON_RENDERER_URL']) {
    win.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    win.loadFile(path.join(__dirname, '../renderer/index.html'))
  }

  win.once('ready-to-show', () => {
    win.show()
    win.webContents.send('ruler:init', {
      ...store.all,
      cx: initialCx,
      cy: initialCy,
      screenWidth: sw,
      screenHeight: sh
    })
  })
}

function registerStoreIpc(): void {
  ipcMain.handle('store:get', () => store.all)
  ipcMain.handle('store:set', (_e, partial: Partial<RulerState>) => store.set(partial))
  ipcMain.handle('dpi:redetect', async () => {
    const detected = await detectPxPerMm()
    store.set({ pxPerMmAuto: detected.value })
    if (!store.all.userCalibrated) {
      store.set({ pxPerMm: detected.value })
    }
    return store.all
  })
}

app.whenReady().then(async () => {
  store = new JsonStore('ruler-config.json')

  const detected = await detectPxPerMm()
  store.set({ pxPerMmAuto: detected.value })
  if (!store.all.userCalibrated) {
    store.set({ pxPerMm: detected.value })
  }

  registerStoreIpc()
  registerIpc()
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
