import { app, BrowserWindow } from 'electron';
import path from 'path';
import AutoLaunch from 'auto-launch';
import { fork } from 'child_process';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
let serverProcess;

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    fullscreen: true,
    kiosk: true, // Force Kiosk mode
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false, // Allow loading local resources (screensavers)
    },
  });

  // Start the Express server
  const serverPath = path.join(__dirname, '../dist/index.cjs');
  serverProcess = fork(serverPath, [], {
    env: { ...process.env, NODE_ENV: 'production', PORT: '5000' }
  });

  serverProcess.on('message', (msg) => {
    console.log('Server message:', msg);
  });

  // Wait for the server to be ready before loading the URL
  // In a real app, we might want a splash screen or a more robust check
  setTimeout(() => {
    win.loadURL('https://localhost:5000');
  }, 3000);

  win.on('closed', () => {
    if (serverProcess) serverProcess.kill();
    app.quit();
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    if (serverProcess) serverProcess.kill();
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// Auto-Launch Configuration
const appLauncher = new AutoLaunch({
  name: 'MaainHome',
  path: process.execPath,
});

appLauncher.isEnabled().then((isEnabled) => {
  if (!isEnabled) {
    appLauncher.enable();
    console.log('Auto-Launch enabled');
  }
}).catch((err) => {
  console.error('Auto-Launch error:', err);
});
