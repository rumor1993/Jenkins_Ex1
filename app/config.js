const path = require('path');
const fs = require('fs');
const electron = require('electron');
const app = electron.app;
const autoLaunch = require('./autoLaunch.js');
const i18n = require('./i18n');


global.config = {};
let file;




function readfile(callback) {
  let data;
  try {
    data = fs.readFileSync(file, 'utf8');
    loadConfig(data);
    callback();

  } catch(error) {
    console.error('cannot read config file', error);
  }
}

function loadConfig(data) {
  if(data) {
    try {
      global.config = JSON.parse(data);
    } catch(error) {
      console.error('cannot load config', error);
    }
  }
  //set user environment
}

function saveConfig() {
  fs.writeFile(file, JSON.stringify(global.config), 'utf8', (err) => {
    if(err) {
      console.error(err);
    }
  });
  i18n.setlengCode();
}

function getConfig (key, init) {
  let result = global.config[key];

  if(typeof result == 'undefined') {
    if (init) {
      setConfig(key, init);
      result = init;
    } else {
      console.log('init param not defined');
      return null;
    }
  }
  return result;
}

function setConfig(key, val) {
  global.config[key] = val;
  saveConfig();
}

function setConfigs(configs) {
  configs.forEach((v) => {
    global.config[v.key] = v.val;
  });
  saveConfig();
}

function initializeConfigFile() {
  if(getConfig('firstRun', true)) {
    autoLaunch.setAutoLaunch(true);
    setConfigs([
      { 'key': 'firstRun', 'val': false},
      { 'key': 'autoLock', 'val': true},
      { 'key': 'autoLaunch', 'val': true}
    ]);

    auto
  }
}


exports.getConfig = function(key, init) {
  if (init) {
    return getConfig(key, init);
  } else {
    return getConfig(key);
  }
};
exports.setConfig = function(key, val) {
  setConfig(key, val);
};
exports.setConfigs = function(configs) {
  setConfigs(configs);
};

exports.initialize = function() {
  file = path.join(app.getPath('userData'), 'config.json');
  if(!fs.existsSync(file)){
    fs.open(file, 'w', (err, fd) => {
      if(err) {
        throw err;
      }
      fs.close(fd, () => {
        readfile(() => {
          initializeConfigFile();
        });
      });
    });
  } else {
    readfile(() => {
      initializeConfigFile();
    });
  }
};
