const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('decoy', {
  openApp: () => ipcRenderer.send('decoy:open-app'),
  navigate: (input) => ipcRenderer.send('decoy:navigate', input),
  close: () => ipcRenderer.send('decoy:close'),
})
