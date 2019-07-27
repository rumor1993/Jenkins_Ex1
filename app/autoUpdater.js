const path = require('path');
const ChildProcess = require('child_process');
const autoUpdater = require('electron-updater').autoUpdater;
const log = require('electron-log');
const electron = require('electron');
const Menu = electron.Menu;
const dialog = electron.dialog;

const main = require('./main.js');
let i18n = new(require('./i18n'));

autoUpdater.logger = log;
autoUpdater.logger.transports.file.level = 'info';
log.info('App starting...');

let state = 'checking';

function spawnUpdate(args, callback) {
  var updateExe = path.resolve(path.dirname(process.execPath), '..', 'Update.exe');
  var stdout = '';
  var spawned = null;

  try {
    spawned = ChildProcess.spawn(updateExe, args);
  } catch (error) {
    if (error && error.stdout == null) {
      error.stdout = stdout;
    }
    process.nextTick(() => callback(error));
    return;
  }

  var error = null;
  spawned.stdout.on('data', data => { stdout += data; });

  spawned.on('error', processError => {
    if (!error) error = processError;
  });

  spawned.on('close', (code, signal) => {
    if (!error && code !== 0) {
      error = new Error('Command failed: ' + code + ' ' + signal);
    }
    if (error && error.code == null) {
      error.code = code;
    }
    if (error && error.stdout == null) {
      error.stdout = stdout;
    }
    callback(error);
  });
}

exports.initialize = function() {

  autoUpdater.on('checking-for-update', () => {
    state = 'checking';
    exports.updateMenu();
  });

  autoUpdater.on('update-available', () => {
    state = 'downloading';
    exports.updateMenu();
  });

  autoUpdater.on('update-not-available', () => {
    state = 'no-update';
    exports.updateMenu();
  });

  autoUpdater.once('update-downloaded', () => {
    dialog.showMessageBox({
      'title':i18n.__('E19'),
      'type':'info',
      'buttons':[i18n.__('E20'), i18n.__('E21')],
      'defaultId':1,
      'cancelId':0,
      'message': i18n.__('E22')
    }, function(response) {
      if( response === 1) {
        autoUpdater.quitAndInstall();
      }
    });
  });

  autoUpdater.on('download-progress', (progress) => {
    let log_message = 'Download speed: ' + progress.bytesPerSecond;
    log_message = log_message + ' - Downloaded ' + progress.percent + '%';
    log_message = log_message + ' (' + progress.transferred + '/' + progress.total + ')';

    state = 'downloading';
    log.info(log_message);
    exports.updateMenu();
  });

  autoUpdater.on('error', (err) => {
    console.error(err);
    state = 'no-update';
    exports.updateMenu();
  });

  autoUpdater.checkForUpdates();

};

exports.updateMenu = function() {
  if (process.mas) return;

  const menu = Menu.getApplicationMenu();
  if (!menu) return;

  menu.items.forEach(function (item) {
    if (item.submenu) {
      item.submenu.items.forEach( item => {
        switch (item.key) {
          case 'checkForUpdates':
            item.visible = state === 'no-update';
            break;
          case 'checkingForUpdate':
            item.visible = state === 'checking';
            break;
          case 'downloadingInstaller':
            item.visible = state === 'downloading';
            break;
          case 'restartToUpdate':
            item.visible = state === 'installed';
            break;
        }
      });
    }
  });
};

exports.createShrotcut = function(callback) {
  spawnUpdate([
    '--createShortcut',
    path.basename(process.execPath),
    '--shortcut-locations',
    'StartMenu'
  ], callback);
};

exports.removeShortcut = function(callback) {
  spawnUpdate([
    '--removeShortcut',
    path.basename(process.execPath)
  ], callback);
};
