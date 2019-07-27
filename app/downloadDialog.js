const electron = require('electron');
const dialog = electron.dialog;
const shell = electron.shell;

let i18n = new(require('./i18n'));

exports.showCompleteDialog = function(targetWindow, filename, savePath) {

  if(process.platform === 'win32') {
    dialog.showMessageBox(targetWindow, {
      type: 'info',
      buttons: [
        i18n.__('E23'),
        i18n.__('E24'),
        i18n.__('E25')
      ],
      title: i18n.__('E26'),
      message: filename
    }, (option) => {
      if (option == 0) { // 0 닫기
      } else if (option == 1) { // 1 폴더열기
        shell.showItemInFolder(savePath);
      } else if (option == 2) { // 2 파일열기
        shell.openItem(savePath);
      }
    });
  } else {//darwin
    dialog.showMessageBox(targetWindow, {
      type: 'info',
      buttons: [
        i18n.__('E23'),
        i18n.__('E24'),
        i18n.__('E25')
      ],
      title: i18n.__('E26'),
      message: filename + i18n.__('E26')
    }, (option) => {
      if(option == 0) { // 0 닫기
      } else if(option == 1) { // 1 폴더열기
        shell.showItemInFolder(savePath);
      } else if(option == 2){ // 열기
        shell.openItem(savePath);
      }
    });
  }
};

exports.showErrorDialog = function(targetWindow, fileName) {
  dialog.showMessageBox(targetWindow, {
    type: il8n.__("E27"),
    title: il8n.__("E28"),
    message: fileName + il8n.__("E28")
  });
};
