window.nodeRequire = require;
delete window.require;
delete window.exports;
delete window.module;

const ipc = require('electron').ipcRenderer;

global.closeSearchBox = function() {
  ipc.send('closeDesktopSearch');
};

global.search = function(searchTxt, isForward, isFirst) {
  if (isFirst) {
    ipc.send('desktopSearch', '');
    ipc.send('desktopSearch', searchTxt);
  } else {
    if (isForward) {
      ipc.send('desktopSearch', searchTxt);
    } else {
      ipc.send('desktopSearchPrev', searchTxt);
    }
  }
};

ipc.on('found', (event, activeCount, totalCount) => {
  if(document) {
    document.querySelector('#matchCount').innerHTML = activeCount + '/' + totalCount;
  }
});
