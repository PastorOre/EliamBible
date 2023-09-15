const { app, BrowserWindow, ipcMain, Menu, dialog, webContents } = require('electron');
const path = require('path');
const fs = require('fs');
const { clipboard } = require('electron')
const { mainMenu, editorMenu } = require('./scripts/menu.js');
const mainmenu = Menu.buildFromTemplate(mainMenu)
const edtmenu = Menu.buildFromTemplate(editorMenu)
const sqlite3 = require('sqlite3').verbose();
const appDirectory = path.join(app.getPath("appData"), "eliam-bible/eliamdb/");
const noteDirectory =  path.join(app.getPath("home"), "OneDrive/eliam-bible");

let appColor = '#333';
let ctrlButtonsColor = '#ccc';
let mainWindow;
let obj = 0;
const clipboardText = clipboard.readText();
// const menu = Menu.buildFromTemplate(menuTemplate);

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1080,
    height: 720,
    minWidth:540,
    minHeight:375,
    icon: __dirname +'/bible.ico',
    titleBarStyle: 'hidden',
    titleBarOverlay: {
      color: appColor,
      symbolColor: ctrlButtonsColor,
      height: 32
    },
    webPreferences: {
      nodeIntegration: false,
      contextIsolation:true,
      sandbox: false,
      preload: path.join(__dirname, 'preload.js'),
    }
  });

  mainWindow.loadFile('index.html');
  // mainWindow.webContents.openDevTools();

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.on('ready', () => {
    createWindow();
    configureApp();
    queryDatabase();
    createAppMenu();
    createEditorMenu();
    getMySelections();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

function configureApp(){

  const nkjv = path.join(appDirectory, 'nkjv.db');
  const  dctry = path.join(appDirectory, 'smiths.db');
  const  cmtry = path.join(appDirectory, 'gill.db');
  const  note = path.join(noteDirectory, 'ebNote.db');
  const  strongs = path.join(noteDirectory, 'strongs.db');

    if (!fs.existsSync(appDirectory)){
      fs.mkdirSync(appDirectory, { recursive: true });
    }

    if (!fs.existsSync(noteDirectory)){
      fs.mkdirSync(noteDirectory, { recursive: true });
    }

    if(!fs.existsSync(nkjv)) {
        fs.copyFile(path.join(__dirname, 'db/nkjv.db'), nkjv, error => {
              if(error) return console.log(error)
        })
    }

    if(!fs.existsSync(cmtry)) {
        fs.copyFile(path.join(__dirname, 'db/gill.db'), cmtry, error => {
              if(error) return console.log(error)
        })
    }

    if(!fs.existsSync(dctry)) {
        fs.copyFile(path.join(__dirname, 'db/smiths.db'), dctry, error => {
              if(error) return console.log(error)
        })
    }

    if(!fs.existsSync(note)) {
      fs.copyFile(path.join(__dirname, 'db/ebNote.db'), note, error => {
            if(error) return console.log(error)
      })
    }

    if(!fs.existsSync(strongs)) {
      fs.copyFile(path.join(__dirname, 'db/strongs.db'), strongs, error => {
            if(error) return console.log(error)
      })
    }
}

function queryDatabase(){

  let  bibledb = new sqlite3.Database(path.join(appDirectory, 'nkjv.db'));
  let  cmtrydb = new sqlite3.Database(path.join(appDirectory, 'gill.db'));
  let  dictrydb = new sqlite3.Database(path.join(appDirectory, 'smiths.db'));
  let  notedb = new sqlite3.Database(path.join(noteDirectory, 'ebNote.db'));
  let  stgsdb = new sqlite3.Database(path.join(noteDirectory, 'strongs.db'));

      function getBookChapters(){
        ipcMain.on('book-chapters', (event, args) => {
          bibledb.all(`SELECT bookNum, chapter, info from chapters where bookNum = ${args}`, (err, rows) => {
              if (err) {
                console.error(err);
                return;
              }
              if(rows){
                mainWindow.webContents.send('feched-chapters', rows);
              }  
            });
        });
    }
    
    function getBibleBookNames(){
      bibledb.all(`SELECT * from bookNames`, (err, rows) => {
        if (err) {
          console.error(err);
          return;
        }
        if(rows){
          ipcMain.handle('load-bible', async (err, data) => {
            return rows;
          })
        }
          
      });
    }
    
    function getBibleChapter(){
      ipcMain.on('book-passage', (event, args) => {
        bibledb.all(`SELECT bookNum, bookName, chapter, info FROM chapters 
        LEFT JOIN bookNames on bookNames.bookID = chapters.bookNum
        WHERE bookNames.bookID = ${args.bookId} AND chapter = ${args.chapter}`, (err, rows) => {
          if (err) {
            console.error(err);
            return;
          }
          if(rows){
            mainWindow.webContents.send('bible-chapter', rows);
          }         
        });
      });
    }

    function getBibleReference(){
      ipcMain.on('get-bible-reference', (event, args) => {
        bibledb.all(`SELECT bookNum, bookName, chapter, verse, info FROM verses 
        LEFT JOIN bookNames on bookNames.bookID = verses.bookNum
        WHERE verses.bookNum = ${args.book} AND verses.chapter = ${args.chapter}
        AND verses.verse = ${args.verse}`, (err, rows) => {
          if (err) {
            console.error(err);
            return;
          }
          if(rows){
            mainWindow.webContents.send('bible-reference', rows);
          }         
        });
      });
    }
    
    function searchTheBible(){
      ipcMain.on('search-bible', (event, args) => {
        bibledb.all(`SELECT bookNum, bookName, chapter, verse, info from verses
        left JOIN bookNames on bookNames.bookID = verses.bookNum
        WHERE verses.info like '%${args}%'`, (err, rows) => {
          if (err) {
            console.error(err);
            return;
          }
          if(rows){
            mainWindow.webContents.send('searched-data', rows);
          }     
        });
      });
    }
    
    function commentaryOnBooks(){
      ipcMain.on('intro-to-books', (event, args) => {
        cmtrydb.all(`SELECT text FROM commentaries WHERE book_number = ${args} AND chapter_number_from = 0`, (err, rows) => {
          if (err) {
            console.error(err);
            return;
          }
          if(rows[0]){
            mainWindow.webContents.send('intro-books-data', rows);
          }     
        });
      });
    }
    
    function commentaryOnBookChapters(){
      ipcMain.on('cmntry-on-chapters', (event, args) => {
        cmtrydb.all(`SELECT text FROM commentaries WHERE book_number = ${args.bookId} 
        AND chapter_number_from = ${args.chapter} 
        AND verse_number_to = 0`, (err, rows) => {
          if (err) {
            console.error(err);
            return;
          }
          if(rows[0]){
            mainWindow.webContents.send('book-chapter-cmntry', rows);
          }     
        });
      });
    }
    
    function commentaryOnChapterVerses(){
      ipcMain.on('cmntry-on-verses', (event, args) => {
        cmtrydb.all(`SELECT text FROM commentaries WHERE book_number = ${args.bookId} 
        AND chapter_number_from = ${args.chapter} 
        AND verse_number_to = ${args.verse}`, (err, rows) => {
          if (err) {
            console.error(err);
            return;
          }
          if(rows[0]){
            mainWindow.webContents.send('chapter-verse-cmntry', rows);
          }     
        });
      });
    }
    
    function getFootnotes(){
      ipcMain.on('get-footnotes', (event, args) => {
        bibledb.all(`SELECT info from footnotes WHERE bookNum = ${args.bookId} 
        AND chapter = ${args.chapter}
        AND footnote = ${args.verse}`, (err, rows) => {
          if (err) {
            console.error(err);
            return;
          }
          if(rows[0]){
            mainWindow.webContents.send('fetched-footnotes', rows);
          }     
        });
      });
    }
    
    function getDictionaryWords(){
        dictrydb.all(`SELECT * FROM dictionary`, (err, rows) => {
          if (err) {
            console.error(err);
            return;
          }
          if(rows){
            ipcMain.handle('get-dictionary', async (err, data) => {
              return rows;
            })
          }
        });
    }

    function getNoteFoders(){
      notedb.all(`SELECT * FROM folders`, (err, rows) => {
        if (err) {
          console.error(err);
          return;
        }
        if(rows[0]){
          ipcMain.handle('get-note-folders', async (err, data) => {
            return rows;
          })
        }
      });
  }

  function getNotes(){
    ipcMain.on('get-notes', async (err, data) =>{
      notedb.all(`SELECT * FROM notes WHERE fID = ${data}`, (err, rows) =>{
        if (err) {
          console.error(err);
          return;
        }
        if(rows[0]){
          mainWindow.webContents.send('fetched-notes', rows);
        }
      })
    });
  }

  function saveNotes(){
    ipcMain.on('save-note', async (err, data) =>{
      notedb.run(`INSERT INTO notes (fID, title, note, time) VALUES (?,?,?,?)`, [data.fID, data.title, data.note, data.date], (err) =>{
        if (err) {
          console.error(err);
          return;
        }
        mainWindow.webContents.send('note-saved', data);
      })
    });
  }

  function updateNotes(){
    ipcMain.on('update-note', async (err, data) =>{
      notedb.run(`UPDATE notes SET note = ? WHERE nID = ?`, [data.note, data.noteId], (err) =>{
        if (err) {
          console.error(err);
          return;
        }
        mainWindow.webContents.send('note-updated', `Saving ${data.title}`);
      })
    });
  }

  function deleteNote(){
    ipcMain.on('delete-note', async (err, data) =>{
      notedb.run(`DELETE FROM notes WHERE nID = ?`, [data], (err) =>{
        if (err) {
          console.error(err);
          return;
        }
        mainWindow.webContents.send('note-deleted', data);
      })
    });
  }

  function createFolder(){
    ipcMain.on('new-folder', async (err, data) =>{
      notedb.run(`INSERT INTO folders (fdName) VALUES (?)`, [data], (err) =>{
        if (err) {
          console.error(err);
          return;
        }
        getFolders();
      })
    });
  }

  function deleteFolder(){
    ipcMain.on('delete-folder', async (err, data) =>{
      notedb.run(`DELETE FROM folders WHERE fID = ?`, [data], (err) =>{
        if (err) {
          console.error(err);
          return;
        }
        deleteNotesInFolder(data);
        mainWindow.webContents.send('folder-deleted', data);
      })
    });
  }

  function getFolders(){
    notedb.all(`SELECT * FROM folders`, (err, rows) =>{
      if (err) {
        console.error(err);
        return;
      }
      if(rows[0]){
        mainWindow.webContents.send('folder-created', rows)
      }
    });
  }

  function deleteNotesInFolder(folderId){
    notedb.run(`DELETE FROM notes WHERE fID = ?`, [folderId], (err) =>{
      if (err) {
        console.error(err);
        return;
      }
    });
  }

  function getStrongsNumbers(){
    stgsdb.all(`SELECT * FROM strongs`, (err, rows) => {
      if (err) {
        console.error(err);
        return;
      }
      if(rows[0]){
        ipcMain.handle('load-strongs', async (err, data) => {
          return rows;
        })
      }
        
    });
  }
      
    getBibleBookNames();
    getBookChapters();
    getBibleChapter();
    searchTheBible();
    getBibleReference();
    commentaryOnBooks();
    commentaryOnBookChapters();
    commentaryOnChapterVerses();
    getFootnotes();
    getDictionaryWords();
    getNoteFoders();
    getNotes();
    saveNotes();
    updateNotes();
    deleteNote();
    createFolder();
    deleteFolder();
    getStrongsNumbers();
}

function enablePasteMenu() {
  if(clipboardText){
    edtmenu.getMenuItemById('paste').enabled = true;
  }else{
    edtmenu.getMenuItemById('paste').enabled = false;
  }
}

function getMySelections(){
  ipcMain.on('selection', (evt, args) =>{ 
     if(parseInt(args) > 0){
      edtmenu.getMenuItemById('cut').enabled = true
      edtmenu.getMenuItemById('copy').enabled = true
     }else{
      edtmenu.getMenuItemById('cut').enabled = false
      edtmenu.getMenuItemById('copy').enabled = false
     }

      enablePasteMenu();
  });

      enablePasteMenu();
}

function createEditorMenu() {
  ipcMain.on(`display-editor-menu`, function(e, args) {  
    getMySelections()
    edtmenu.popup(BrowserWindow.fromWebContents(e.sender))
     if (mainWindow) {
      edtmenu.popup({
         window: mainWindow,
         x: args.x,
         y: args.y
       });
     }
   });
}

function createAppMenu() {
  ipcMain.on(`display-app-menu`, function(e, args) {  
    mainmenu.popup(BrowserWindow.fromWebContents(e.sender))
     if (mainWindow) {
      mainmenu.popup({
         window: mainWindow,
         x: args.x,
         y: args.y
       });
     }
   });
}



