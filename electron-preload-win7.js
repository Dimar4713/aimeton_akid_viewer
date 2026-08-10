'use strict';

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('aimetonDesktop', {
  getStartupFiles: () => ipcRenderer.invoke('akid:get-startup-files'),
  getUserGuide: () => ipcRenderer.invoke('akid:get-user-guide'),
  rememberFile: (kind, file) => {
    try {
      const filePath = file && file.path ? file.path : '';
      if (filePath) ipcRenderer.send('akid:remember-file', { kind, filePath });
    } catch (_) {}
  }
});
