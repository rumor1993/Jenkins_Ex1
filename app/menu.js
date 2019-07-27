const electron = require('electron');
const BrowserWindow = electron.BrowserWindow;
const Menu = electron.Menu;
const clipboard = electron.clipboard;
const nativeImage = electron.nativeImage;
const ipc = electron.ipcMain;

const main = require('./main.js');
const desktopSearch = require('./desktopSearch.js');
const settings = require('./settings.js');

let i18n = new(require('./i18n'));
let template

// contextMenu({
// 	prepend: (params, browserWindow) => [{
// 		label: 'cut',
// 		// Only show it when right-clicking images
// 	}]
// });

ipc.on('openContextMenu', (event, target) => {
  if(target === "set") {
    //let contextMenu = Menu.buildFromTemplate(template);
    BrowserWindow.getAllWindows().forEach(function (win) {
      //contextMenu.popup(win)
      win.maximize()
    })
  } else if (target === "fold") {
    BrowserWindow.getAllWindows().forEach(function (win) {
      win.minimize()
    })
  } else if (target === 'close') {
    BrowserWindow.getAllWindows().forEach(function (win) {
       win.close()
    })
  } else {
    // doen
  }
})
		

exports.createMenu = function() {
  initMenu();
  const menu = Menu.buildFromTemplate(template);
  menu.getMenuItemById
  Menu.setApplicationMenu(menu);
};



function menuIteminit() {
  return [
    {
      label: i18n.__("E30"), 
      submenu: [
        {
          label: i18n.__("E31"),
          role: 'undo'
        },
        {
          label: i18n.__("E32"),
          role: 'redo'
        },
        {
          type: 'separator'
        },
        {
          label: i18n.__("E33"),
          role: 'cut'
        },
        {
          label: i18n.__("E34"),
          role: 'copy'
        },
        {
          label: i18n.__("E35"),
          role: 'paste'
        },
        {
          label: i18n.__("E36"),
          role: 'selectall'
        },
        {
          label: i18n.__("E37"),
          accelerator: 'CmdOrCtrl+F',
          click: function (item, focusedWindow) {
            desktopSearch.openDesktopSearchFromWebContents(focusedWindow);
          }
        }
      ]
    },
    {
      label: i18n.__("E38"),
      submenu: [
        {
          label: i18n.__("E39"),
          accelerator: process.platform === 'darwin' ? 'Command+R' : 'F5',
          click: function (item, focusedWindow) {
              if (focusedWindow) {
                // on reload, start fresh and close any old
                // open secondary windows
                if (focusedWindow.id === 1) {
                  BrowserWindow.getAllWindows().forEach(function (win) {
                    if (win.id > 1) {
                      win.close();
                    }
                  });
                }
                if(!main.screenLockState()){
                  focusedWindow.reload();
                }
              }
          }
        },
        // {
        //   label: '새로고침(캐시비우기)',
        //   role: 'forcereload',
        //   accelerator: process.platform === 'darwin' ? 'Command+Shift+R' : 'Control+F5',
        // },
        {
          type: 'separator'
        },
        {
          label: i18n.__("E40"),
          role: 'resetzoom'
        },
        {
          label: i18n.__("E41"),
          role: 'zoomin',
          accelerator: 'CommandOrControl+='
        },
        {
          label: i18n.__("E42"),
          role: 'zoomout'
        },
        {
          type: 'separator'
        },
        {
          label: i18n.__("E43"),
          role: 'togglefullscreen'
        }
      ]
    },
    {
      label: i18n.__("E44"),
      submenu: [
        {
          label: i18n.__("E45"),
          role: 'minimize'
        },
        {
          label: i18n.__("E46"),
          role: 'close'
        }
      ]
    },
    {
      label: i18n.__("E47"),
      submenu: [
        {
          label: i18n.__("E47"), 
          click () { 
  
              electron.shell.openExternal('https://flow.zendesk.com/hc/ko'); }
            
        },
      ]
    },
  ];
}

function addUpdateMenuItems (items, position) {
  //if (process.mas) return;

  //const version = electron.app.getVersion();
  // let updateItems = [{
  //   label: `Version ${version}`,
  //   enabled: false
  // }, {
  //   label: i18n.__("E49"),
  //   enabled: false,
  //   key: 'checkingForUpdate'
  // }, {
  //   label: i18n.__("E50"),
  //   visible: false,
  //   key: 'checkForUpdate',
  //   click: function () {
  //     require('electron').autoUpdater.checkForUpdates();
  //   }
  // }, {
  //   label: i18n.__("E51"),
  //   enabled: false,
  //   key: 'downloadingInstaller',
  // }, {
  //   label: i18n.__("E52"),
  //   enabled: true,
  //   visible: false,
  //   key: 'restartToUpdate',
  //   click: function () {
  //     require('electron').autoUpdater.quitAndInstall();
  //   }
  // }];

  //items.splice.apply(items, [position, 0].concat(updateItems));
}

function initMenu() { 
  template = menuIteminit();
  if (process.platform === 'darwin') {
    const name = electron.app.getName();
    template.unshift({
      label: name,
      submenu: [{
        label: `About ${name}`,
        role: 'about'
      }, {
        type: 'separator'
      }, {
        label: i18n.__('E1'),
        accelerator: 'Command+,',
        click() {
          settings.openWindow();
        }
      },
      
      {
        label: i18n.__("E54"),
        accelerator: 'Command+L',
        click: function() {
          var allwindows = BrowserWindow.getAllWindows();
          allwindows.forEach(function(element){
            element.webContents.executeJavaScript('try { clearTimeout(timer) } catch (e) { } ')
            element.webContents.executeJavaScript('try { lockScreenOn() } catch (e) { } ')
          });
        }
      },

      {
        type: 'separator'
      },
      {
        label: `${name}` + i18n.__("E55"),
        accelerator: 'Command+H',
        role: 'hide'
      },
      {
        label: i18n.__("E56"),
        accelerator: 'Command+Alt+H',
        role: 'hideothers'
      },
      {
        label: i18n.__("E57"),
        role: 'unhide'
      },
      {
        type: 'separator'
      },
      {
        label: i18n.__("E58"),
        accelerator: 'Command+Q',
        click: function() {
          main.quit();
        }
      }]
    });
    addUpdateMenuItems(template[0].submenu, 1);
  }

  if (process.platform === 'win32') {
    const helpMenu = template[template.length - 1].submenu;
    addUpdateMenuItems(helpMenu, 0);
    template.unshift({
      label: i18n.__("E59"),
      submenu: [
        {
        label: i18n.__('E1'),
        accelerator: 'Control+,',
          click() {
            settings.openWindow();
          }
        },
        {
          label: i18n.__("E70"),
          accelerator: 'Control+L',
          click: function() {
            var allwindows = BrowserWindow.getAllWindows();
            allwindows.forEach(function(element){
              element.webContents.executeJavaScript('try { clearTimeout(timer) } catch (e) { } ')
              element.webContents.executeJavaScript('try { lockScreenOn() } catch (e) { } ')
            });
          }
        },
        {
          label: i18n.__("E62"),
          accelerator: 'Control+Q',
          click: function () {
            main.quit();
          }
        }
      ]
    });
  }
}
initMenu();


 


exports.openContextMenu = function(props, win) {

  let editFlags = props.editFlags;
  let hasText = props.selectionText.trim().length > 0;


  let contextMenuTemplate = [{
    label: i18n.__("E33"), // 잘라내기
    role: (editFlags.canCut && hasText) ? 'cut' : '',
    //enabled: editFlags.canCut && hasText,
    //visible: !props.hasImageContents && props.isEditable
  }, {
    label: i18n.__("E34"), // 복사
    role: (editFlags.canCopy && hasText) ? 'copy' : '',
    //enabled: editFlags.canCopy && hasText,
    //visible: !props.hasImageContents && hasText
  }, {
    label: i18n.__("E35"), // 붙여넣기
    role: editFlags.canPaste ? 'paste' : '',
    //enabled: editFlags.canPaste,
    //visible: !props.hasImageContents && props.isEditable
  }, {
    label: i18n.__("E64"), // 전체선택
    role: (props.isEditable && editFlags.canSelectAll) ? 'selectall' : '',
    //enabled: props.isEditable && editFlags.canSelectAll,
    //visible: !props.hasImageContents && props.isEditable
    // }, {
    // label: '이미지 복사',
    // click: () => {
    //   console.log("src URL " + props.srcURL);
    //   console.log(props.srcURL.trim());
    //   const img = nativeImage.createFromDataURL(props.srcURL.trim());
    //   clipboard.writeImage(img);
    //   // clipboard.write({image: img})
    //   console.log(img.isEmpty());
    //   // clipboard.writeText(props.srcURL.trim())
    // },
   // enabled: props.srcURL.trim().length > 0,
   // visible: props.hasImageContents
  }];

  const contextMenu = Menu.buildFromTemplate(contextMenuTemplate);
  contextMenu.popup(win);

};
