import {eliamEditor} from './scripts/editor.js';
import {dragElement} from './scripts/dragable.js';

const comtryContent = document.querySelector('.comt-content'),
commentryDiv = document.querySelector('.commentry-div'),
sidebar = document.querySelector(".sidebar-div"),
searchBox = document.querySelector(".searchInput"),
noteDiv = document.querySelectorAll('.note-head button'),
noteWrapper = document.getElementById('note-wrapper'),
editorDiv = document.querySelector('.editor-container'),
noteWrapperDiv = noteWrapper.querySelectorAll('div'),
inputOverlay = document.querySelector('.input-overlay'),
confirmOverlay = document.querySelector('.confirm-overlay'),
dialogFooter = document.getElementById('fileDialog-footer'),
filename = document.getElementById('fileName-input'),
appLogo = document.getElementById('banner'),
booksDialog = document.querySelector(".books-dialog"),
dragable = document.getElementById('header')

const aboutdialog = document.getElementById('aboutDialog');
const dragzone = document.getElementById('dragzone');

function getStorage(key) {
    var item = localStorage.getItem(key);
    return JSON.parse(item);
}

function nextChapter() {
    document.querySelector('.btnNext').addEventListener('click', () => {
        let obj = getStorage('lastopened')
        window.api.bibleChapter(obj.bookId, parseInt(obj.chapter + 1));
    })
}

function prevChapter() {
    document.querySelector('.btnPrev').addEventListener('click', () => {
        let obj = getStorage('lastopened')
        window.api.bibleChapter(obj.bookId, parseInt(obj.chapter - 1));
    })
}

function navigateWithKeys(){
    document.addEventListener("keydown", (e) => {
        let obj = getStorage('lastopened')
        if (obj) {
            switch (e.key) {
                case 'ArrowLeft':
                    window.api.bibleChapter(obj.bookId, parseInt(obj.chapter - 1));
                    break
                case 'ArrowRight':
                    window.api.bibleChapter(obj.bookId, parseInt(obj.chapter + 1));
                    break
            }
        }
       
    });
}

function SetNotePanelActive(pos) {
    for (let i = 0; i < noteWrapperDiv.length; i++) {
        if (noteWrapperDiv[i].classList.contains("active-note")) {
            noteWrapperDiv[i].classList.remove("active-note");
        }
    }
    noteWrapperDiv[pos].classList.add("active-note")
}

function SetPanelActive(pos) {
   
    let sidebarDivs = sidebar.children;
    for (let i = 0; i < sidebarDivs.length; i++) {
        if (sidebarDivs[i].classList.contains("active")) {
            sidebarDivs[i].classList.remove("active");
            setIconActive(i)
        }
    }
    sidebarDivs[pos].classList.add("active")
}

function setIconActive(pos) {
    const iconList = document.querySelector(".iconsbar > ul");
    let sidebarIcons = iconList.children;

    for (let i = 0; i < sidebarIcons.length; i++) {
        if (sidebarIcons[i].classList.contains("focus")) {
            sidebarIcons[i].classList.remove("focus");
        } 
        sidebarIcons[i].addEventListener('click', (e) => {
            SetPanelActive(i);
            sidebarIcons[i].classList.add("focus");     
        })
    }

    sidebarIcons[pos].classList.add("focus");
}

function searchTheBible(){
    searchBox.addEventListener('keydown', (e) => {
        if (e.key == "Enter") {
           if(searchBox.value == "") return;
            window.api.searchText(searchBox.value)
        }
    })
}

noteDiv.forEach((btn, index) => {
    btn.addEventListener('click', () => {
          switch(index){
              case 0:
                noteDiv[0].style.display = 'none';
                noteDiv[1].style.display = 'block';
                noteDiv[2].style.display = 'block';
                noteDiv[3].style.display = 'none';
                SetNotePanelActive(0)
              break;
              case 1:
                    saveNoteDialog();
                break;
              case 2:
                noteDiv[0].style.display = 'block';
                noteDiv[1].style.display = 'none';
                noteDiv[2].style.display = 'none'
                noteDiv[3].style.display = 'block';
                SetNotePanelActive(2);
                window.api.getNoteFolders();
              break;
              case 3:
                    const editorToolbar = document.querySelector('.editor-toolbar');
                    const editor = document.querySelector('.eliam-editor');
                    editorToolbar.classList.toggle('hide-toolbar');
                    if (editorToolbar.classList.contains('hide-toolbar')){
                        editor.setAttribute('contenteditable', false);
                        btn.textContent = 'Edit';
                    }else{
                        editor.setAttribute('contenteditable', true);
                        btn.textContent = 'Read';
                        editor.focus();
                    }
              break;
          }
    })
 });

 function saveNoteDialog() {
    let btn = dialogFooter.querySelectorAll('button');
    document.getElementById('dragzone').textContent = 'Folder';
    inputOverlay.style.display = 'flex';

    btn[0].addEventListener('click', () => {
        if(filename.value == "") return;
        window.api.setFolderName(filename.value);
        inputOverlay.style.display = 'none';
    });

    btn[1].addEventListener('click', () => {
        inputOverlay.style.display = 'none';;
    })
}

 function setEditor() {  
    eliamEditor(editorDiv)
 }

 function openAboutDialog(){
    const overlay = document.querySelector('.about-overlay');
    const btnExit = document.querySelectorAll('.btn-exit-about');

    appLogo.addEventListener('click', () =>{ 
        overlay.style.display = 'block';
    });

    btnExit.forEach(btnClose => {
        btnClose.addEventListener('click', () => {
            overlay.style.display = 'none';
        });
    });
 }

SetNotePanelActive(0)
SetPanelActive(0);
setIconActive(0);
nextChapter();
prevChapter();
navigateWithKeys();
searchTheBible();
setEditor();
openAboutDialog();

dragElement(aboutdialog, dragzone);
dragElement(booksDialog, dragable)

