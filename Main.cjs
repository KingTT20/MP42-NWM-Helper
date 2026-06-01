// Jadaene Brown 1903233
const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow () {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    icon: path.join(__dirname, 'build', 'Pixel.ico'),
    webPreferences: {
      nodeIntegration: true
    }
  });
  
  // Loads the compiled React app
  win.loadFile(path.join(__dirname, 'dist', 'index.html'));
}

app.whenReady().then(createWindow);