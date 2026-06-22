import { contextBridge, ipcRenderer } from 'electron'

const api = {
  setIgnoreMouseEvents: (ignore: boolean, opts?: { forward: boolean }) =>
    ipcRenderer.send('win:setIgnoreMouseEvents', ignore, opts),
  setAlwaysOnTop: (onTop: boolean) => ipcRenderer.send('win:setAlwaysOnTop', onTop),
  quit: () => ipcRenderer.send('app:quit'),
  store: {
    get: () => ipcRenderer.invoke('store:get'),
    set: (partial: Record<string, unknown>) => ipcRenderer.invoke('store:set', partial),
    redetectDpi: () => ipcRenderer.invoke('dpi:redetect')
  },
  onInit: (cb: (state: Record<string, unknown>) => void) => {
    const handler = (_e: unknown, state: Record<string, unknown>) => cb(state)
    ipcRenderer.once('ruler:init', handler)
    return () => ipcRenderer.removeListener('ruler:init', handler)
  }
}

try {
  contextBridge.exposeInMainWorld('ruler', api)
} catch {
  ;(globalThis as Record<string, unknown>).ruler = api
}
