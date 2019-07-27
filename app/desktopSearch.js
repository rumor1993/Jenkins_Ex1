const path = require('path');
const electron = require('electron');
const BrowserWindow = electron.BrowserWindow;
const ipc = electron.ipcMain;
let searchBox = null;

// searchBox's ipc receiver
ipc.on('closeDesktopSearch', (event) => {
  exports.closeDesktopSearch();
});

ipc.on('desktopSearchPrev', (event, searchTxt) => {
  if (searchBox == null) {
    return;
  }
  if (searchTxt) { //Boolean('') => false
    let fWindow = searchBox.getParentWindow();
    fWindow.webContents.findInPage(searchTxt, {
      forward: false
    });
  } else {
    searchBox.getParentWindow().webContents.stopFindInPage('clearSelection');
    searchBox.webContents.send('found', 0, 0);
  }
});

ipc.on('desktopSearch', (event, searchTxt) => {
  if (searchBox == null) {
    return;
  }
  if (searchTxt) { //Boolean('') => false
    let fWindow = searchBox.getParentWindow();
    fWindow.webContents.findInPage(searchTxt);
  } else {
    searchBox.getParentWindow().webContents.stopFindInPage('clearSelection');
    searchBox.webContents.send('found', 0, 0);
  }
});

/**
 * @method desktopSearch.openDesktopSearchFromWebContents
 * @param {BrowserWindow} focusedWindow 현재 활성화된 window. 검색을 수헹할 webContents를 가지고 있음.
 * @description searchBox 열기. focusedWindow를 parent로 가지는  searchBox browserWindow를 생성.
 **/
exports.openDesktopSearchFromWebContents = function(focusedWindow) {
  if (searchBox && !searchBox.isDestroyed()) {
    searchBox.show();
  } else {
    searchBox = new BrowserWindow({
      width: 300,
      height: 40,
      x: focusedWindow.getPosition()[0] + focusedWindow.getContentSize()[0] - (process.platform === 'darwin' ? 305 : 325),
      y: focusedWindow.getPosition()[1] + (process.platform === 'darwin' ? 85 : 115),
      hasShadow: false,
      thickFrame: false,
      resizable: false,
      moveable: false,
      frame: false,
      parent: focusedWindow,
      webPreferences: {
        preload: path.join(__dirname, 'desktopSearchPreload.js'),
      }
    });
    searchBox.loadURL(`file://${path.join(__dirname, '/resource/web/searchBox.html')}`);
  }

  focusedWindow.webContents.on('found-in-page', (event, result) => {
    if (result.matches === 0) {

    }
    searchBox.webContents.send('found', result.activeMatchOrdinal, result.matches);
  });
};

/**
 * @method desktopSearch.closeDesktopSearch
 * @description x버튼 누르거나, inputBox에서 esc누를 때, 채팅 등 새창 열 때, 404페이지로 넘어갈 때 searchBox 닫음.
 **/
exports.closeDesktopSearch = function() {
  if (searchBox) {
    searchBox.getParentWindow().webContents.stopFindInPage('clearSelection');
    searchBox.getParentWindow().webContents.on('found-in-page', () => {});
    searchBox.destroy();
    searchBox = null;
  }
};

/**
 * @method desktopSearch.setWindowPosition
 * @description Windows일때 parentWindow 이동 시 searchWindow도 같이 이동하도록 해줌.
 * @param {BrowserWindow} bw 이동된 browserWindow
 **/
exports.setWindowPosition = function(bw) {
  if (process.platform === 'darwin') {
    return;
  }
  if (searchBox) {
    if (searchBox.getParentWindow() != bw) {
      return;
    }

    let bounds = bw.getBounds();
    let x = bounds.x + bounds.width - (process.platform === 'darwin' ? 305 : 325);
    let y = bounds.y + (process.platform === 'darwin' ? 85 : 115);
    searchBox.setPosition(x, y);
  }
};
