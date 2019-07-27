const path = require('path');
const url = require('url');
const electron = require('electron');

const app = electron.app;
const dialog = electron.dialog;
const BrowserWindow = electron.BrowserWindow;
const ipc = electron.ipcMain;
const main = require("./main.js")


const autoLaunch = require('./autoLaunch.js');
const config = require('./config.js');

let i18n = new(require('./i18n'));
let settingsWindow = null;



ipc.on('getConfig', (event, key) => {
  let result = '';
  switch (key) {
    case 'autoLaunch':
    result = config.getConfig('autoLaunch', true);
    break;

    case 'autoLock':
    result = config.getConfig('autoLock', false);
    break;

    case 'downloadPath':
    result = config.getConfig('downloadPath', app.getPath('downloads'));
    break;

    case 'lockSec':
    result = config.getConfig('lockSec',"10");
    break;

    case 'lengCode':
    result = config.getConfig('lengCode','ko')

    
    default:
    console.log('config key does not exist');
    break;
  }
  event.sender.send(key, result);
});

ipc.on('openDownloadPathSelectWindow', (event) => {
  dialog.showOpenDialog({
    'title': i18n.__('E65'),
    'defaultPath': config.getConfig('downloadPath', app.getPath('downloads')),
    'buttonLabel': i18n.__('E66'),
    'properties': ['openDirectory']
  }, (filePath) => {
    if (filePath) {
      event.sender.send('downloadPath', filePath[0]);
    }
  });
});

ipc.on('saveSettings', (event, settings) => {
  config.setConfigs(settings);
});

ipc.on('changeAutoLaunchStatus', (event, val) => {
  autoLaunch.setAutoLaunch(val);
});

exports.openWindow = function() {
  if (settingsWindow && !settingsWindow.isDestroyed()) {
    settingsWindow.show();
    settingsWindow.focus();
  } else {
    settingsWindow = new BrowserWindow({
      resizable: false,
      title: i18n.__('E67'),
      width: 800,
      height: 400,
      x: main.mainWinX(),
      y: main.mainWinY(),
      minimizable: false,
      maximizable: false
    });
    settingsWindow.setMenu(null);
  }
  settingsWindow.loadURL(url.format(
    {
      pathname: path.join(__dirname, '/resource/web/settings.html'),
      protocol: 'file:',
      slashes: true
    }
  ));
};
