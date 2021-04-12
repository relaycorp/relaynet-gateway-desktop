import { fork } from 'child_process'
import { app, BrowserWindow, Menu } from 'electron';
import ServerMessage from '../ipc/message';
import buildMenuTemplate from './menu';
import path from 'path';

app.on('ready', function createWindow(): void {
  // Create the browser window.
  const win = new BrowserWindow({
    height: 700,
    title: 'Awala',
    webPreferences: {
      contextIsolation: false,
      nodeIntegration: true,
    },
    width: 900,
  });

  // and load the index.html of the app.
  win.loadFile('app.html');

  Menu.setApplicationMenu(buildMenuTemplate(win));

  // Launch the daemon process and get a token via IPC
  const server = fork(path.join(app.getAppPath(), 'daemon/build/bin/gateway-daemon.js'));
  server.on('error', (err) => {
    console.log('Error ', err);
  });
  server.on('message', (message : ServerMessage) => {
    console.log('Token from server', message.token);
    win.webContents.send('token', message.token);
  })

  app.on('window-all-closed', function(event : Event) : void {
    // Override the default behavior to quit the app,
    // keep the daemon running in the background.
    event.preventDefault();
  });
  app.on('will-quit', function() : void {
    // User hit Cmd+Q or app.quit() was called.
    server.kill(); // Stops the child process
  });
});
