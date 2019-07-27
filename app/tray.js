const path = require('path');
const electron = require('electron');

const BrowserWindow = electron.BrowserWindow;
const Menu = electron.Menu;
const Tray = electron.Tray;
const nativeImage = electron.nativeImage;

const main = require('./main.js');
const settings = require('./settings.js');
const i18n = new(require('./i18n'));

let appIcon = null;
let trayTemplate = null;

const iconName = process.platform === 'win32' ? 'basic_ico256.ico' : 'osx-tray_dawin.png';
const iconNotiName = process.platform === 'win32' ? 'win-tray_ico.ico' : 'tray_noti_darwin.png';
const iconPath = path.join(path.resolve(__dirname), 'resource/image', iconName);
const iconNotiPath = path.join(path.resolve(__dirname), 'resource/image', iconNotiName);
const iconImage = nativeImage.createFromPath(iconPath);
const iconNotiImage = nativeImage.createFromPath(iconNotiPath);
let iconMode = false;

exports.createTray = function() {

  if(appIcon != null) { //Tray already exist
    return;
  }

  trayTemplate = Menu.buildFromTemplate([
    {
      label: i18n.__('E68'),
      click() {
        main.showBrowserWindow();
      }
    },
    {
      label: i18n.__('E69'),
      click() {
        settings.openWindow();
      }
    },
    {
      label: i18n.__('E70'),
      click() {
        var allwindows = BrowserWindow.getAllWindows();
        allwindows.forEach(function(element){
          element.webContents.executeJavaScript('lockScreenOn()')
        })
      }
    },
    {
      label: i18n.__('E71'),
      click: function() {
        main.quit();
      }
    }
  ]);

  


  appIcon = new Tray(iconPath);

  appIcon.on('click', () => {
    appIcon.popUpContextMenu();
  });
  appIcon.on('right-click', () => {
    appIcon.popUpContextMenu();
  });
  if(process.platform !== 'darwin') {
    appIcon.on('double-click', () => {
      main.showBrowserWindow();
    });
  }
  appIcon.setContextMenu(trayTemplate);
};

exports.changeIcon = function(existNoti) {
  if(iconMode == existNoti) {
    return;
  } else {
    iconMode = existNoti;
    if(existNoti) {
      appIcon.setImage(iconNotiImage);
    } else {
      appIcon.setImage(iconImage);
    }
  }
};

exports.destroy = function() {
  if (!appIcon.isDestroyed()) {
    appIcon.destroy();
  }
};
