'use strict';

const { app, BrowserWindow, shell, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

function settingsPath() {
  return path.join(app.getPath('userData'), 'recent-files.json');
}

function readSettings() {
  try {
    return JSON.parse(fs.readFileSync(settingsPath(), 'utf8')) || {};
  } catch (_) {
    return {};
  }
}

function writeSettings(next) {
  try {
    fs.mkdirSync(path.dirname(settingsPath()), { recursive: true });
    fs.writeFileSync(settingsPath(), JSON.stringify(next, null, 2), 'utf8');
  } catch (_) {}
}

function portableDir() {
  return process.env.PORTABLE_EXECUTABLE_DIR || path.dirname(process.execPath);
}

function readStartupFile(filePath) {
  try {
    if (!filePath || !fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) return null;
    return {
      name: path.basename(filePath),
      filePath,
      base64: fs.readFileSync(filePath).toString('base64')
    };
  } catch (_) {
    return null;
  }
}

ipcMain.handle('akid:get-startup-files', () => {
  const saved = readSettings();
  const adjacentEmployees = path.join(portableDir(), 'employees.csv');

  const employees = readStartupFile(adjacentEmployees) || readStartupFile(saved.employees);
  const tasks = readStartupFile(saved.tasks);

  return { employees, tasks };
});

ipcMain.handle('akid:get-user-guide', () => {
  try {
    const guidePath = path.join(__dirname, 'docs', 'USER_GUIDE_RU.md');
    return fs.readFileSync(guidePath, 'utf8');
  } catch (_) {
    return null;
  }
});

ipcMain.on('akid:remember-file', (_event, payload) => {
  if (!payload || !['tasks', 'employees'].includes(payload.kind)) return;
  const filePath = payload.filePath;
  if (!filePath || !fs.existsSync(filePath)) return;
  const saved = readSettings();
  saved[payload.kind] = filePath;
  writeSettings(saved);
});

function createWindow() {
  const win = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 980,
    minHeight: 640,
    backgroundColor: '#0b1220',
    show: false,
    autoHideMenuBar: true,
    title: 'AIMETON AKID Viewer',
    webPreferences: {
      preload: path.join(__dirname, 'electron-preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      webSecurity: true
    }
  });

  win.once('ready-to-show', () => win.show());
  win.loadFile(path.join(__dirname, 'index.html'));

  win.webContents.setWindowOpenHandler(({ url }) => {
    if (/^(https?:|mailto:)/i.test(url)) {
      shell.openExternal(url).catch(() => {});
    }
    return { action: 'deny' };
  });

  win.webContents.on('will-navigate', (event, url) => {
    if (!url.startsWith('file:')) {
      event.preventDefault();
      if (/^(https?:|mailto:)/i.test(url)) {
        shell.openExternal(url).catch(() => {});
      }
    }
  });
}

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
