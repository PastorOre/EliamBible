const {ipcMain, nativeImage} = require('electron');
const path = require('path');

   const mainMenu = [
        {
            id: 'copy',
            label:"Copy",
            accelerator: 'CmdOrCtrl+C',
            role:'Copy',
        },
    ]
  

  const  editorMenu = [
        {  
            id: 'cut',
            label:"Cut",
            accelerator: 'CmdOrCtrl+X',
            role:'Cut',
        },
        {
            id: 'copy',
            label:"Copy",
            accelerator: 'CmdOrCtrl+C',
            role:'Copy',
        },
        {  
            id: 'paste',
            label:"Paste",
            accelerator: 'CmdOrCtrl+V',
            role:'Paste',
        }
    ]

module.exports  = {mainMenu, editorMenu}