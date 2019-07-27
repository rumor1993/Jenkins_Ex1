const path = require('path');
const eNotify = require('electron-notify');
const main = require('./main.js');

let downloadingItems = new Map();

function chatClick (event) { //deprecated
  let openChatFunc = 'cmf_chatOpen("", cnts_Null2Void("' + event.param.ROOM_SRNO + '", ""), "");';
  main.executeJavascript(openChatFunc, function(result) {console.log('result:' + result);}, function(error) {console.error('error:' + error);});
  event.closeNotification();
}

function activityClick (event) { //deprecated
  let openCollaboFunc = 'fn_setAlamRead(' + event.param.COLABO_SRNO + ', ' + event.param.COLABO_COMMT_SRNO + ', "-1");'
  + 'fn_setAlamRead(' + event.param.COLABO_SRNO + ', ' + event.param.COLABO_COMMT_SRNO + ', ' + event.param.COLABO_REMARK_SRNO + ');'
  + 'fn_getCollaboDirect(' + event.param.COLABO_SRNO + ', ' + event.param.COLABO_COMMT_SRNO + ');';
  main.executeJavascript(openCollaboFunc, function(result) {console.log('result:' + result);}, function(error) {console.error('error:' + error);});
  main.show();
  event.closeNotification();
}

function downloadClick (event) {
  //do nothing
}

function handleClose(event) {
     //console.dir(event)
}

function handleDownloadClose(args) {
  if(args.event == 'close') {
    if(args.eventDetail && (args.eventDetail == 'btnClose')) {
      if(downloadingItems.get(args.id)) {
        try{
          main.cancelDownload(downloadingItems.get(args.id));
        } catch(e) {
          console.log(e)
        }
      } else {
        //already download finished.
      }
    } else {
      // download finished and noti closed.
    }
    downloadingItems.delete(args.id);
  } else {
    // error
  }
}

module.exports = {
  initializeDesktopNotification : function () {
    eNotify.setConfig({
      height: 110,
      width: 400,
      borderRadius: 0,
      defaultStyleContainer: {
        backgroundColor: '#ffffff',
        border: '1px solid rgba(66, 66, 68, 0.1)',
        overflow: 'hidden',
        height: 110,
        width: 400,
        fontFamily: 'Malgun Gothic, AppleSDGothicNeo, "돋움", "굴림", Arial, sans-serif',
      },
      displayTime: 6000
    });
    eNotify.setDefaultWindowConfig({
      title: "downlaodNoti",
      transparent: false,
      backgroundColor: '#ffffff'
    });
  },

  showDesktopNotifier: function (category, arg) {
    if (category === 'download') {
      let id = eNotify.notify({
        sound: path.join(__dirname, 'resource/sound/notification.wav'),
        title: arg.TITLE,
        text: arg.BODY,
        icon: arg.ICON,
        size: arg.SIZE,
        percent: arg.PERCENT,
        displayTime: 2147483647, //max timeout value
        cat: category,
        onClickFunc: downloadClick,
        onCloseFunc: handleDownloadClose
      });
      downloadingItems.set(id, arg.ITEM);
      return id;
    }
  },

  updateDownloadNotification: function (id, data) {
    try {
      eNotify.updateNoti(id, data);
    } catch (e) {
      console.error(e);
    }
  },

  closeAllDownloadNotification: function () {
    let iter = downloadingItems.values();
    let isDone = false;
    while (!isDone) {
        let v = iter.next();
        if(v.value) {
          main.cancelDownload(v.value);
        }
        isDone = v.done;
    }
  },

};
