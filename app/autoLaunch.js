const AutoLaunch = require('auto-launch');
const app = require('electron').app;

let appPath;

if(process.platform === 'darwin') {
  appPath = '/Applications/flowMini.app';
} else if(process.platform === 'win32') {
  appPath = app.getPath('exe');
}

const flowAutoLauncher = new AutoLaunch({
  name: 'flowMini',
  path: appPath
});

function setAutoLaunchEnable() {
  flowAutoLauncher.enable();
  flowAutoLauncher.isEnabled().then(function(isEnabled) {
    if(isEnabled) {
      return;
    }
    flowAutoLauncher.enable();
  }).catch(function(err) {
    console.error('autoLaunch disable error', err);
  });
}

function setAutoLaunchDisable() {
  flowAutoLauncher.disable();
  flowAutoLauncher.isEnabled().then(function(isEnabled) {
    if(!isEnabled) {
      return;
    }
    flowAutoLauncher.disable();
  }).catch(function(err) {
    console.error('autoLaunch disable error', err);
  });
}

exports.setAutoLaunch = (val) => {
  if (val) {
    setAutoLaunchEnable();
  } else {
    setAutoLaunchDisable();
  }
};
