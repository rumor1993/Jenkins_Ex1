window.nodeRequire = require;
delete window.require;
delete window.exports;
delete window.module;

const ipc = require('electron').ipcRenderer;







global.fn_browserNotificationForElectron = function(param) {
  ipc.send('flashFrame', param);
};

global.fn_browserCustomNotificationForElectron = function(category, param) { //deprecated!
   //ipc.send('noti', category, param)
};

global.fn_browserFocusForElectron = function() {
  ipc.send('mainFocus');
};

global.fn_openExternalLinkforElectron = function(url) {
  ipc.send('openLink', url);
};

global.fn_chatOpenForElectron = function(arg1, arg2, arg3, arg4, arg5, arg6) {
  ipc.send('openChat', arg1, arg2, arg3, arg4, arg5, arg6);
};

global.fn_windowOpenForElectron = function(arg1, arg2, arg3, arg4, arg5, arg6) {
  ipc.send('openWindow', arg1, arg2, arg3, arg4, arg5, arg6);
};

global.fn_openGoogleDrivePostForElectron = function(arg1, arg2, arg3, arg4, arg5, arg6) {
  ipc.send('openGoogleDrivePost', arg1, arg2, arg3, arg4, arg5, arg6);
};

global.fn_openGoogleDriveChatForElectron = function(arg1, arg2, arg3, arg4, arg5, arg6, arg7) {
  ipc.send('openGoogleDriveChat', arg1, arg2, arg3, arg4, arg5, arg6, arg7);
};

global.fn_googleDrivePostForElectron = function(param) {
  ipc.send('googleDrivePost', param);
};

global.fn_googleDriveChatForElectron = function(param) {
  ipc.send('googleDriveChat', param);
};

global.fn_fileDownloadForElectron = function(param1, param2, param3) {
  ipc.send('fileDownload', param1, param2, param3);
};

global.fn_chatFileDownloadForElectron = function(param1, param2, param3, param4) {
  ipc.send('fileDownload', param1, param2, param3, param4);
};

global.fn_updateOnlineStatus = function(status) {
  ipc.send('onlineStatusChanged', status);
};

global.fn_openGoogleSignInForElectron = function(url) {
  ipc.send('openGoogleSignIn', url);
};

global.fn_googleSignInForElectron = function(params) {
  ipc.send('googleSignIn', params);
};

global.fn_ElectronVersionCheck = function() {
  return ipc.sendSync('electronVersionCheck')
}

global.fn_getElectronUrl = function() {
  return ipc.sendSync('electronUrlCheck')
}

global.fn_setElectronUrl = function(arg) {
  ipc.send('electronUrlModify',arg)
}

// 메인화면만 남기고 나머지는 Tray해주기
global.fn_lockScreenOnForElectron = function() {
  ipc.send('lockScreenOn')
}

global.fn_lockScreenShowForElectron= function(){
 ipc.send('fn_lockScreenShow')
}

global.fn_lockScreenSettingStateForElectron = function(){
  return ipc.sendSync('lockScreenSettingState')
}

global.fn_lockScreenInitForElectron = function() {
  ipc.send('lockScreenInit')
}

global.fn_openProjectForElectron = function(url, colaboSrno, colaboCommtSrno, colaboRemarkSrno, screenLeft, screenTop) {
  ipc.send('openProject',url,colaboSrno, colaboCommtSrno, colaboRemarkSrno, screenLeft, screenTop)
}

global.fn_openTargetWindowForElectron = function(url,target) {
  ipc.send('openTargetWindow', url , target);
}

global.fn_getUserIdForElectron = function(arg) {
  ipc.send("getUserId", arg)
}

global.fn_logoutForElectron = function(arg) {
  ipc.send('logout')
}

global.fn_openContextMenuForElectron  = function(target) {
  ipc.send('openContextMenu', target);
}




