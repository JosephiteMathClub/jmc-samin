const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 720,
    title: "Josephite Math Club",
    icon: path.join(__dirname, 'public/images/logo.png'), // Uses your custom logo
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    }
  });

  // Load the production website
  win.loadURL('https://jmc-sjs.org');

  // Remove the default menu bar
  win.setMenuBarVisibility(false);
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
