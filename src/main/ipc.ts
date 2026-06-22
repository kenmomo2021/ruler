import { app, BrowserWindow, ipcMain } from 'electron'

export function registerIpc(): void {
  ipcMain.on('win:setIgnoreMouseEvents', (e, ignore: boolean, opts?: { forward: boolean }) => {
    const win = BrowserWindow.fromWebContents(e.sender)
    if (win) win.setIgnoreMouseEvents(ignore, opts ?? { forward: true })
  })

  ipcMain.on('win:setAlwaysOnTop', (e, onTop: boolean) => {
    const win = BrowserWindow.fromWebContents(e.sender)
    if (win) win.setAlwaysOnTop(onTop)
  })

  ipcMain.on('app:quit', () => {
    app.quit()
  })
}
