'use strict';

const { contextBridge, ipcRenderer, webUtils } = require('electron');

contextBridge.exposeInMainWorld('aimetonDesktop', {
  getStartupFiles: () => ipcRenderer.invoke('akid:get-startup-files'),
  rememberFile: (kind, file) => {
    try {
      const filePath = webUtils.getPathForFile(file);
      if (filePath) ipcRenderer.send('akid:remember-file', { kind, filePath });
    } catch (_) {}
  }
});
