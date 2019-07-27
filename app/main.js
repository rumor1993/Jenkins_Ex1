const path = require('path');
const url = require('url');
const moment = require('moment');
const fs = require('fs');

const electron = require('electron');
const app = electron.app;
const BrowserWindow = electron.BrowserWindow;
const ipc = electron.ipcMain;
const shell = electron.shell;
const session = electron.session;
const crashReporter = electron.crashReporter;
const globalShortcut = electron.globalShortcut;

app.setAppUserModelId(`com.madrascheck.${app.getName()}`);

const autoUpdater = require('./autoUpdater.js');
const config = require('./config');
let i18n = new(require('./i18n'));
const desktopSearch = require('./desktopSearch.js');
const downloadDialog = require('./downloadDialog.js');
const menu = require('./menu.js');
const tray = require('./tray.js');

let noti = null;

let mainWindow = null;
let chatWindows = {};
let googleSignInWindow = null;
let googleDrivePostWindow = null;
let googleDriveChatWindow = null;
let googleDriveChatNum = null;
let lastFocusedTime = null;
let nodeIntegrationValue = false;
let version = electron.app.getVersion()
let screenLockState = false;
let projectWindow = null;
let targetWindow = null;
let userId = ""

// let mainURL = 'http://flowdev.info/FLOW_DESKTOP_SET.act'
// let mainURL = "https://flow.team/login.act"
// let mainURL = 'http://flowdev.info/login.act?electronYn=Y&version=1_0_7';   //dev
// let mainURL = 'http://flowdev.info/miniLogin.act';   //dev

// let mainURL =  'https://flow-wgpp.bizplay.co.kr/login.act'
// let mainURL =  'https://flow-wgpp.bizplay.co.kr/miniLogin.act'
// let mainURL = "https://flowmob-wgpp.bizplay.co.kr/miniLogin.act"

// let mainURL = "http://g-talk.gware.co.kr/miniLogin.act"
let mainURL = 'http://joins.flowdev.info/miniLogin.act'
// let mainURL = 'https://flow3.flow.team/miniLogin.act?';    //test
// let mainURL = 'https://flow.team/login.act?electronYn=Y&version=1_0_8';    //real

// let mainURL = 'https://seco.flow.team/miniLogin.act';
// let mainURL = "https://zoomok.flow.team/miniLogin.act"
// let mainURL = "https://hottracks.flow.team/miniLogin.act";
// let mainURL = "https://seoulsemicon.flow.team/miniLogin.act"







let fileDownloadQueue = new Map();

class DownloadNotification {
  constructor(fileInfo, item) {
    let filename
    if(fileInfo.getName().length >= 30) {
      filename = fileInfo.getName().substring(0,30) + "...."
    } else {
      filename = fileInfo.getName() + '.' + fileInfo.getExt();
    }
    let param = {
      TITLE   : i18n.__("E29"),
      BODY    : filename ,
      SIZE    : getReadableFileSize(fileInfo.getSize()),
      ICON    : '',
      PERCENT : 1,
      ITEM    : item
    };

    this.show = function() {
      return noti.showDesktopNotifier('download', param);
    };

    this.update = function(notiId, percentage) {
      noti.updateDownloadNotification(notiId, percentage);
    };

    this.cancel = function(notiId) {
      noti.updateDownloadNotification(notiId, 'cancelled');
    };

  }
}

class FileInfo {
  constructor(item) {
    let delimiterIdx = item.getFilename().lastIndexOf('.');
    let _fileExt = item.getFilename().substring(delimiterIdx+1, item.getFilename().length);
    let _fileName = getDownloadFileName(item.getFilename().substring(0, delimiterIdx), _fileExt);
    let _fileSize = 0;
    let fileId = (_fileName).replace(/[ \{\}\[\]\/?.,;:|\)*~`!^\-_+<>@\#$%&\\\=\(\'\"]/gi, '_');
    
    if (item.getTotalBytes() > 0) {
      _fileSize = item.getTotalBytes();
    } else {
      if (fileDownloadQueue.get(fileId)) {
        _fileSize = fileDownloadQueue.get(fileId);
      } else {
        _fileSize = 0;
      }
    }
    if (fileDownloadQueue.get(fileId)) {
      fileDownloadQueue.delete(fileId);
    }

    this.getName = function() {
      return _fileName;
    };
    this.getExt = function() {
      return _fileExt;
    };
    this.getSize = function() {
      return _fileSize;
    };
    this.getFullName = function() {
      return _fileName + '.' + _fileExt;
    };
  }
}

function getReadableFileSize(file_size){
  let size = 0;
	let vol = '';
	let fileSize = '';
	size = parseInt(file_size);
	if(file_size > 1024*1024){		//MB
		size = file_size/(1024*1024);
		vol = ' MB';
	} else if(file_size > 1024){	//KB
		size = file_size/1024;
		vol = ' KB';
	} else if(file_size > 0){		//BYTE
		size = file_size;
		vol = ' B';
	} else {
		return '0 B';
	}
	try{
		fileSize = size.toFixed(2)+vol;
	} catch(e){
    console.error(e);
		fileSize = size + vol;
	}

	return fileSize;
}

// 다운로드 파일의 올바른 이름을 가져온다
function getDownloadFileName(fileName, fileExt) {
  let duplicatedFileNameCount = getDuplicatedFileNameCount(fileName, fileExt);
  if (duplicatedFileNameCount > 0) {
    return fileName + ' (' + duplicatedFileNameCount + ')';
  } else {
    return fileName;
  }
}



// 다운로드 할 파일 경로에 중복된 이름이 있는지 체크한다.
function getDuplicatedFileNameCount(fileName, fileExt) {
  let count = 0;
  let downloadPath = getDownloadPath();
  let safeFileName = fileName.replace(/([\[\]\{\}\(\)\=\+\^\$\-])/g, '\\$&');
  let regexp = new RegExp('(' + safeFileName + ')(\\s\\((\\d)+\\)){0,1}(\\.){1}(' + fileExt + ')');
  fs.readdirSync(downloadPath).forEach(file => {
    if(regexp.test(file)) {
      count++;
    }
  });
  return count;
}

function getDownloadPath() {
  let path
  try {
    fs.readdirSync(config.getConfig('downloadPath', app.getPath('downloads')));
    path = config.getConfig('downloadPath', app.getPath('downloads'));
  } catch(e) {
    dialog.showErrorDialog("경로오류","다운로드 폴더가 존재하지 않습니다. 기본경로 ("+ app.getPath() + "로 저장됩니다.")
    path = config.getConfig(app.getPath());
  }
  return path
}

function createWindow(){
  if (mainWindow) {
    mainWindow.show();
    return;
  }


  let mainBrowserWindowParam = {
    title: 'flow | www.flow.team',
     //width: config.getConfig('mainWindowWidth', 1280),
     //height: config.getConfig('mainWindowHeight', 900),
     width: 360,
     height: 00,
     minWidth: 490,
    // maxWidth: 500,
     minHeight:582,
    // resizable: false,
    // frameless
    frame: false,
    fullscreenable: true,
    webPreferences: {
      nodeIntegration: nodeIntegrationValue,
      preload: path.join(__dirname, 'preload.js'),
      webSecurity: false, // http. dev only
      allowRunningInsecureContent: true,
      sandbox: false // should be false. (becasue of '*ForElectron' function)
    }
  };

  

  if (typeof config.getConfig('mainWindowPosX') === 'number') {
    mainBrowserWindowParam.x = config.getConfig('mainWindowPosX');
  }
  if (typeof config.getConfig('mainWindowPosY') === 'number') {
    mainBrowserWindowParam.y = config.getConfig('mainWindowPosY');
  }

  mainWindow = new BrowserWindow(mainBrowserWindowParam);
  
  mainWindow.on('close', (e) => {
    mainWindow.blur();
    if (!mainWindow.forceClose) {
      e.preventDefault();
      mainWindow.hide();
    }
  });


  mainWindow.on('closed', () => {
    noti.closeAllDownloadNotification();
    mainWindow = null;
  });

  mainWindow.on('focus', () => {
    blankHandler.run(mainWindow.webContents);
    tray.changeIcon(false);
    if(process.platform === 'win32') {
      mainWindow.flashFrame(false);
      //badge 없애기
      //mainWindow.setOverlayIcon(null, '')
    } else { // os X
      app.dock.setBadge('');
    }
  });

  mainWindow.on('app-command',(e,cmd) => {

  })

  mainWindow.on('resize', () => {
    config.setConfigs([
      {'key': 'mainWindowWidth', 'val': mainWindow.getBounds().width},
      {'key': 'mainWindowHeight', 'val': mainWindow.getBounds().height}
    ]);

    desktopSearch.setWindowPosition(mainWindow);
  });
  mainWindow.on('move', () => {
    config.setConfigs([
      {'key': 'mainWindowPosX', 'val': mainWindow.getBounds().x},
      {'key': 'mainWindowPosY', 'val': mainWindow.getBounds().y}
    ]);
    
   desktopSearch.setWindowPosition(mainWindow);
  });

  session.defaultSession.webRequest.onErrorOccurred((errInfo) => {
    if(errInfo.error.indexOf('ERR_INTERNET_DISCONNECTED') > -1) {
      show404Page();
    }
  });

  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    if (errorDescription === 'ERR_INTERNET_DISCONNECTED') {
      show404Page();
    }
  });

  mainWindow.webContents.on('did-finish-load', () => {
    blankHandler.run(mainWindow.webContents);
  });

  
   




  desktopSearch.closeDesktopSearch();
  mainWindow.loadURL(mainURL);

  

  
  var lengcode = config.getConfig('lengCode');
  mainWindow.webContents.executeJavaScript(`try {setlanguage('${lengcode}') } catch (e) {}`)

  //  mainWindow.webContents.on('context-menu', (e, props) => { 
  //        //e.preventDefault()
  //        menu.openContextMenu(props, mainWindow)
  //  })
  
}

const blankHandler = (function() {
  let maxCount = 6;
  let count = 0;
  let webContents = null;
  function check() {
    if (!webContents) {
      return;
    }
    webContents.executeJavaScript('(function() {if(document.body) { return document.body.childElementCount; } else { return 0; } })();', true).then((result) => {
      if (result === null) {
        return;
      } else {
        if (result) { // Boolean(result === 0) => false
          clear();
        } else {
          if (count < maxCount) {
            count++;
            webContents.reload();
          } else {
            show404Page();
            clear();
          }
        }
      }
    }, (error) => {
      console.error(error);
    });
  }

  function clear() {
    count = 0;
    webContents = null;
  }

  return {
    run: function(wc) {
      webContents = wc;
      check();
    }
  };

})();

function show404Page() {
  if(mainWindow) {
    desktopSearch.closeDesktopSearch();
    mainWindow.loadURL(`file://${__dirname}/resource/web/404page.html`);
    mainWindow.webContents.on('did-finish-load', ()=>{
        code = `document.getElementById("name").textContent = "${userId}"`;
        mainWindow.webContents.executeJavaScript(code);
    });

   
    // mainWindow.loadURL(url.format(
    //   {
    //     pathname: path.join(__dirname, '/resource/web/404page.html'),
    //     protocol: 'file:',
    //     slashes: true
    //   }
    // ));
  }
}

function initialize() {

  const gotTheLock = app.requestSingleInstanceLock();
  if (!gotTheLock) {
    app.quit();
    return;
  }

  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) {
        mainWindow.restore();
        mainWindow.focus();
      } else {
        mainWindow.show();
      }
    }
  });

  app.on('ready', () => {
    crashReporter.start({
      productName: 'flow-desktop',
      companyName: 'flowMini',
      submitURL: 'https://flow.sp.backtrace.io:6098/post?format=minidump&token=8c8e34db05be9a9ca9556d794bd888f10fe0bf9a0cb94734f437befd86c3eff8',
      uploadToServer: true
    });


    //console.log("app.getPath('userData')" + app.getPath('userData'))
    // 데탑 움직임 감지
    try{
      setInterval(() => {
        let screenPoint1 = electron.screen.getCursorScreenPoint()
        setTimeout(() => {
          //console.log("@")
          if(screenPoint1.x == electron.screen.getCursorScreenPoint().x && screenPoint1.y == electron.screen.getCursorScreenPoint().y){
            //console.log("123")
          } else {
            mainWindow.webContents.executeJavaScript("try {desktopIdleCheck() } catch(e) {}")
          }
        }, 1000);
      }, 1000); 
    } catch(e){
      console.log(e)
    }
    

    config.initialize();
    createWindow();
    menu.createMenu();
    tray.createTray();
    //autoUpdater.initialize();

    noti = require('./customNoti.js');
    noti.initializeDesktopNotification();

    lastFocusedTime = moment(new Date().getTime());

    globalShortcut.register('CmdOrCtrl+Alt+=', () => {
      if (BrowserWindow.getFocusedWindow()) {
        let focusedWindow = BrowserWindow.getFocusedWindow();
        focusedWindow.webContents.toggleDevTools();
      }
    });

    session.defaultSession.on('will-download', (event, item, webContents) => {
      const fileInfo = new FileInfo(item);
      item.setSavePath(path.join(getDownloadPath(), fileInfo.getFullName()));

      let downloadNotificationId = null;
      const downloadNotification = new DownloadNotification(fileInfo, item);

      if (fileInfo.getSize() > (1048576 * 5)) { //5MB 이상
        downloadNotificationId = downloadNotification.show();
        item.on('updated', (event, state) => {
          if (state === 'interrupted') {
            // download interrupted but can be resumed
          } else if (state === 'progressing') {
            downloadNotification.update(downloadNotificationId, Math.ceil(100 * (parseInt(item.getReceivedBytes()) / parseInt(fileInfo.getSize()))));
          }
        });
      }

      item.on('done', (event, state) => {
        if (state === 'completed') {
          try{
            downloadDialog.showCompleteDialog(BrowserWindow.fromWebContents(webContents), fileInfo.getFullName(), item.getSavePath());
          } catch (e) {
            console.error(e);
            if(mainWindow) {
              downloadDialog.showCompleteDialog(mainWindow, fileInfo.getFullName(), item.getSavePath());
            } else {
              shell.showItemInFolder(item.getSavePath());
            }
          }
        } else if (state === 'cancelled') {
          if (typeof downloadNotificationId === 'number') {
            downloadNotification.cancel(downloadNotificationId);
          } else {
            downloadDialog.showErrorDialog(BrowserWindow.fromWebContents(webContents), fileInfo.getFullName());
          }
        }
      });

    });
  });

  app.on('browser-window-focus', () => { // 업데이트 체크
    let tmpTime = moment(new Date().getTime());
    if(lastFocusedTime) {
      if(moment(new Date().getTime()).diff(lastFocusedTime) > (60000 * 60 * 6)) {
        autoUpdater.initialize();
      }
      lastFocusedTime = tmpTime;
    }
  });

  app.on('activate', (event, hasVisibleWindows) => { // osX only
    if(hasVisibleWindows) {
      if (mainWindow === null) {
        createWindow();
      } else {
        if(!mainWindow.isVisible()) {
          mainWindow.show();
        }
      }
    } else {
      createWindow();
    }
  });


  app.on('before-quit', () => {
    mainWindow.webContents.executeJavaScript("miniLayer.setStatus(1); miniLayer.updateUserPrfl('3',1)");
    desktopSearch.closeDesktopSearch();
    mainWindow.forceClose = true;
    //save mainWindow size and position to config.json file
  });

  ipc.on('flashFrame', (p1, p2) => {
    console.log("p2 == " + p1  + "22" + p2)
    if(!mainWindow.isFocused()) {
      if(process.platform === 'win32') {
        let flashWindow = p2 && chatWindows[p2] ? chatWindows[p2] : mainWindow;
        if(!flashWindow.isVisible()) {
          flashWindow.minimize();
        }
        flashWindow.flashFrame(true);

      } else if(process.platform === 'darwin') { // os X
        if(!mainWindow.isVisible()) {
          mainWindow.minimize();
        }
        app.dock.setBadge('•');
      }
      tray.changeIcon(true);
    }
  });


  ipc.on('openLink', (event, arg) => {
    shell.openExternal(arg);
  });

  ipc.on('mainFocus', () => {
    if(!mainWindow) {
      createWindow();
    } else {
      if(mainWindow.isMinimized()) {
        mainWindow.restore();
      }
      mainWindow.show();
    }
  });

  ipc.on('openChat', (event, arg1, arg2, arg3, arg4, arg5, arg6) => {
    desktopSearch.closeDesktopSearch();
    if(chatWindows[arg2]) {
      chatWindows[arg2].show();
    } else {
      let chatWindow = new BrowserWindow({
                                          width: arg3,
                                          height: arg4,
                                          x: mainWindow.getBounds().x + (mainWindow.getBounds().width - arg3) / 2,
                                          y: mainWindow.getBounds().y + (mainWindow.getBounds().height - arg4) / 2,
                                          webPreferences: {
                                            nodeIntegration: nodeIntegrationValue,
                                            preload: path.join(__dirname, 'preload.js'),
                                            webSecurity: false ,// http. dev only
                                            sandbox: false
                                          }
                                        });
      chatWindow.on('closed', () => {
        chatWindows[arg2] = null;
      });

      chatWindow.on('resize', () => {
        desktopSearch.setWindowPosition(chatWindow);
      });
      chatWindow.on('move', () => {
        desktopSearch.setWindowPosition(chatWindow);
      });      
      
      // chatWindow.webContents.on('context-menu', (e, props) => {
      //   //e.preventDefault()
      //   menu.openContextMenu(props, mainWindow)
      //})


      chatWindow.loadURL(arg1);
      chatWindow.setMenu(null);
      chatWindows[arg2] = chatWindow;

    }
  });


  
  ipc.on('openWindow', (event, arg1, arg2, arg3, arg4, arg5, arg6) => {
    desktopSearch.closeDesktopSearch();
    let popupWindow = new BrowserWindow({
                                        width: arg3,
                                        height: arg4,
                                        x: mainWindow.getBounds().x + (mainWindow.getBounds().width - arg3) / 2,
                                        y: mainWindow.getBounds().y + (mainWindow.getBounds().height - arg4) / 2,
                                        title: arg2,
                                        webPreferences: {
                                          nodeIntegration: nodeIntegrationValue,
                                          webSecurity: false, // http. dev only
                                          sandbox: false
                                        }
                                      });
    popupWindow.loadURL(arg1);
    popupWindow.setMenu(null);

    // popupWindow.webContents.on('context-menu', (e, props) => {
    //   //e.preventDefault()
    //   menu.openContextMenu(props, mainWindow)
    //})
    popupWindow.on('closed', () => {
      popupWindow = null;
    });
  });

  ipc.on('openProject', (event, url, colaboSrno, colaboCommtSrno, colaboRemarkSrno, screenLeft, screenTop) => {
    if(projectWindow){
      projectWindow.loadURL(url);
    } else {
      desktopSearch.closeDesktopSearch();
          projectWindow= new BrowserWindow({
                                              width: 1300,
                                              height: 900,
                                              x: screenLeft,
                                              y: screenTop,
                                              webPreferences: {
                                                nodeIntegration: nodeIntegrationValue,
                                                preload: path.join(__dirname, 'preload.js'),
                                                webSecurity: false, // http. dev only
                                                sandbox: false
                                              }
                                              
                                            });
          projectWindow.loadURL(url);
          projectWindow.setMenu(null);
    }
    if(colaboSrno != null) {
      projectWindow.webContents.executeJavaScript("flowProject.show(" + colaboSrno + " , " + colaboCommtSrno + " , " + colaboRemarkSrno + ");")
    }

    // projectWindow.webContents.on('context-menu', (e, props) => {
    //   //e.preventDefault()
    //   menu.openContextMenu(props, mainWindow)
    //})
    
    projectWindow.on('closed', () => {
      projectWindow = null;
    });
  });

  ipc.on('openTargetWindow', (event, url, target) => {
    if(targetWindow){
      targetWindow.show()
    } else {
      desktopSearch.closeDesktopSearch();
      targetWindow = new BrowserWindow({
                                              width: 800,
                                              height: 540,
                                              x: mainWindow.getBounds().x + (mainWindow.getBounds().width - 800) / 2,
                                              y: mainWindow.getBounds().y + (mainWindow.getBounds().height - 540) / 2,
                                              webPreferences: {
                                                nodeIntegration: nodeIntegrationValue,
                                                preload: path.join(__dirname, 'preload.js'),
                                                webSecurity: false, // http. dev only
                                                sandbox: false
                                              }
                                            });
      targetWindow.loadURL(url);
      targetWindow.setMenu(null);
      }

      // targetWindow.webContents.on('context-menu', (e, props) => {
      //   //e.preventDefault()
      //   menu.openContextMenu(props, mainWindow)
      // })
    
      targetWindow.on('closed', () => {
        targetWindow = null;
      });
  })

  ipc.on('googleDrivePost', (event, arg) => {
    desktopSearch.closeDesktopSearch();
    mainWindow.webContents.executeJavaScript('$.when(openGoogleDrive($("#openGoogleDriveParam").val(), "' + arg + '")).done(function() {$("#openGoogleDriveParam").val("");});', true).then(function(result) {

    }, function(err) {

    });
    googleDrivePostWindow.close();
  });

  ipc.on('openGoogleDrivePost', (event, arg1, arg2, arg3, arg4, arg5, arg6) => {
    desktopSearch.closeDesktopSearch();
    googleDrivePostWindow = new BrowserWindow({
                                        width: arg3,
                                        height: arg4,
                                        x: arg5,
                                        y: arg6,
                                        title: arg2,
                                        webPreferences: {
                                          nodeIntegration: nodeIntegrationValue,
                                          preload: path.join(__dirname, 'preload.js'),
                                          webSecurity: false, // http. dev only
                                          sandbox: true
                                        }
                                      });
    googleDrivePostWindow.loadURL(arg1);
    googleDrivePostWindow.setMenu(null);
    googleDrivePostWindow.on('closed', () => {
      googleDrivePostWindow = null;
    });
  });

  ipc.on('googleDriveChat', (event, arg) => {
    desktopSearch.closeDesktopSearch();
    chatWindows[googleDriveChatNum].webContents.executeJavaScript('g_comm_ly_id = $("#ROOM_SRNO").val();fn_Bb_atchPopup_CALLBACK(JSON.parse(\''+arg+'\'));', true).then(function(result) {

    }, function(err) {

    });
    googleDriveChatWindow.close();
    googleDriveChatNum = null;
  });

  ipc.on('openGoogleDriveChat', (event, arg1, arg2, arg3, arg4, arg5, arg6, arg7) => {
    desktopSearch.closeDesktopSearch();
    googleDriveChatWindow = new BrowserWindow({
                                        width: arg3,
                                        height: arg4,
                                        x: arg5,
                                        y: arg6,
                                        title: arg2,
                                        webPreferences: {
                                          nodeIntegration: nodeIntegrationValue,
                                          preload: path.join(__dirname, 'preload.js'),
                                          webSecurity: false, // http. dev only
                                          sandbox: true
                                        }
                                      });
    googleDriveChatWindow.loadURL(arg1);
    googleDriveChatWindow.setMenu(null);
    googleDriveChatWindow.on('closed', () => {
      googleDriveChatWindow = null;
    });
    googleDriveChatNum = arg7;
  });

  ipc.on('fileDownload', (event, url, fileName, totalSize, winInfo) => {

    let delimiterIdx = fileName.lastIndexOf('.');
    let _fileExt = fileName.substring(delimiterIdx+1, fileName.length);
    let key = getDownloadFileName(fileName.substring(0, delimiterIdx), _fileExt).replace(/[ \{\}\[\]\/?.,;:|\)*~`!^\-_+<>@\#$%&\\\=\(\'\"]/gi, '_');
    fileDownloadQueue.set(key, totalSize);
    
    if (winInfo) {
      chatWindows[winInfo].webContents.downloadURL(url);
    } else {
      mainWindow.webContents.downloadURL(url);
    }
  });

  ipc.on('onlineStatusChanged', (event, status) => {
    if(status === 'online') {
      desktopSearch.closeDesktopSearch();
      mainWindow.loadURL(mainURL);
    } 
  });

  ipc.on('openGoogleSignIn', (event, url) => {
    if (googleSignInWindow) {
      if(googleSignInWindow.isMinimized()) {
        googleSignInWindow.restore();
      }
      googleSignInWindow.show();
    } else {
      let googleSignInConfig = {
        title: 'login',
        width: 600,
        height: 600,
        fullscreenable: false,
        webPreferences: {
          nodeIntegration: false,
          preload: path.join(__dirname, 'preload.js'),
          webSecurity: false, // http. dev only
          sandbox: false
        }
      };
      googleSignInWindow = new BrowserWindow(googleSignInConfig);
      googleSignInWindow.loadURL(url);
      googleSignInWindow.setMenu(null);
      googleSignInWindow.on('closed', () => {
        googleSignInWindow = null;
      });
    }
  });

  ipc.on('googleSignIn', (event, params) => {
    mainWindow.webContents.executeJavaScript(`(function(){
      googleSignInCallback('${params}');
    })();`, true).then((result) => console.log(result), e => console.error(e));
    googleSignInWindow.close();
    googleSignInWindow = null;
  });
  
  ipc.on("electronVersionCheck", (event, arg) => {
    event.returnValue = electron.app.getVersion().replace(/\./g,"_")
    // 버전체크가 이루어지면 온라인으로 변경 로그인시
    // mainWindow.webContents.executeJavaScript("miniLayer.setStatus(0); miniLayer.updateUserPrfl('3',0)");
  })

  ipc.on("electronUrlCheck", (event, arg) => {
    event.returnValue = mainURL
  })

  ipc.on("electronUrlModify", (event, arg) => {
    mainWindow.loadURL(arg)
    mainURL = arg
  })

  ipc.on("lockScreenOn", (event) => {
    var allwindows = BrowserWindow.getAllWindows();
    var mainTtile = mainWindow.getTitle();
      allwindows.forEach(function(element){
        if(mainTtile != element.getTitle()){
          element.hide();
        }
      });
      screenLockState = true;
  })

  ipc.on("fn_lockScreenShow", (event) => {
    var allwindows = BrowserWindow.getAllWindows();
      allwindows.forEach(function(element){
        if(element.getTitle() != "downlaodNoti") {
          element.show();
        }
      });
      screenLockState = false;
  })

  ipc.on("lockScreenSettingState", (event) => {
    event.returnValue = config.getConfig('autoLock')
  })
}

  ipc.on('saveSettings', (event) => {
    var lockYn = config.getConfig('autoLock');
    var lockSec = config.getConfig('lockSec');
    var lengcode = config.getConfig('lengCode');
    if(lockYn){ 
      mainWindow.webContents.executeJavaScript('try{userStateCheck()} catch(e) {}')
      mainWindow.webContents.executeJavaScript('lockSec = '+ 60 * lockSec)
      } else {
          mainWindow.webContents.executeJavaScript('try{clearTimeout(timer)} catch(e){}')
      }
      mainWindow.webContents.executeJavaScript(`try{setlanguage('${lengcode}')} catch(e) {}`)
      menu.createMenu();
  })

  ipc.on('lockScreenInit', (event) => {
    mainWindow.webContents.executeJavaScript('lockScreenInit()')
  })

  ipc.on('lockScreenCheck', (event) => {
    var allwindows = BrowserWindow.getAllWindows();
    allwindows.forEach(function(element){
      element.addeventlistener()
    });
  })

  ipc.on('getUserId', (event, config) => {
		userId = config
	})
 
  ipc.on('logout', (event) => {
    var allwindows = BrowserWindow.getAllWindows();
    var mainTtile = mainWindow.getTitle();
    
    allwindows.forEach(function(element){
      if (mainTtile != element.getTitle()) {
        element.close();
      }
    })
    screenLockState = true;
  })


initialize();

exports.showBrowserWindow = function() {
  if(!mainWindow) {
    createWindow();
  } else {
    if(mainWindow.isMinimized()) {
      mainWindow.restore();
    }
    mainWindow.show();
  }
};

exports.screenLockState = function (){
  return screenLockState
}

exports.show = function () {
  mainWindow.show();
};

exports.mainWinX = function() {
  return mainWindow.getBounds().x
}

exports.mainWinY = function() {
  return mainWindow.getBounds().y
}

exports.quit = function () {
  app.quit();
};

exports.executeJavascript = function (sourceCode, resultFunction, errorFunction) {
  mainWindow.webContents.executeJavaScript(sourceCode, true).then(resultFunction, errorFunction);
};

exports.cancelDownload = function (item) {
  item.cancel();
};
