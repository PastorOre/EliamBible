window.addEventListener("DOMContentLoaded", () => {  
    const {ipcRenderer, contextBridge } = require('electron');

    const btnOpenBible = document.getElementById('sel-passage'),
    bibleContainer = document.querySelector(".bible-container"),
    bibleContent = document.getElementById("content"),
    bibleBooks = document.querySelector(".bible-books"),
    booksDialog = document.querySelector(".books-dialog"),
    btnBack = document.getElementById('back'),
    btnUndo = document.getElementById("undo"),
    btnClose = document.getElementById('close-dialog'),
    booksOverlay = document.querySelector('.books-overlay'),
    bookName = document.querySelector('#book'),
    chapterNumber = document.querySelector('#chapter'),
    introToBook = document.querySelector('.btn-intro'),
    searchCard = document.querySelector("#search-card"),
    sidebar = document.querySelector(".sidebar-div"),
    searchCount = document.querySelector("#search-count"),
    comtryContent = document.querySelector('.comt-content'),
    footNoteDiv = document.getElementById('foot-note-div'),
    toolTip = document.querySelector('.tooltip'),
    commentryDiv = document.querySelector('.commentry-div'),
    folderContainer = document.querySelector(".folder-container"),
    folderSelect = document.querySelector(".folders-combo"),
    folderNameLabel = document.querySelector(".folder-name-label"),
    noteContainer = document.querySelector(".notes-container"),
    inputOverlay = document.querySelector('.input-overlay'),
    confirmOverlay = document.querySelector('.confirm-overlay'),
    dialogFooter = document.getElementById('fileDialog-footer'),
    filename = document.getElementById('fileName-input'),
    dictWordsList = document.querySelector('.word-list'),
    dictionaryDef =  document.querySelector('.dict-result'),
    dictSearchBox = document.getElementById("dict-search"),
    dictionaryList = document.querySelector('.dict-words-list'),
    strongsNumbersList = document.querySelector('.numbers-list'),
    strongsList = document.querySelector('.strongs-numbers-list'),
    strongsDescriptions = document.querySelector('.strongs-result'),
    strongsSearchBox = document.getElementById("strongs-search")

let bookname = "";
let noteFolders = [];
let bookID = 0;
let bookChapter = 0;
let clikedVerse = 0; 
let searchedText = "";
let folderIndex = 0;
let folderName = "";
let books = [];
let bookChapters = []
let searchResult = []
let navigation = [];
let currentBookId, prevDictWord = "Aarat";


  String.prototype.cleanUp = function () {
      return this.replaceAll(/<span>(.*?)<\/span>/gm, '$1')
          .replaceAll(/<div class="v"(.*?)<\/div>/gm, '<span class="v"$1</span>')
  }

//   function prefixVerse() {
//     let verses = document.querySelectorAll('.vno');
//     verses.forEach(verse => {
//         verse.innerHTML += '.'
//     });
// }

// function indexMatchingText(ele, text) {
//   for (var i = 0; i < ele.length; i++) {
//       if (ele[i].childNodes[0].nodeValue === text) {
//           return i;
//       }
//   }
//   return undefined;
// }

function highlightSearchText(text) {
  let element = document.querySelectorAll('.search-text')
  element.forEach(elem => {
      elem.innerHTML = elem.innerHTML.replaceAll(new RegExp(text + '(?!([^<]+)?<)', 'gi'),
          '<b style="font-size:100%">$&</b>')
  })
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

function scrollToVerse(verse) {
  let verseElement = document.querySelector(`.v[id="${verse}"`);
  if (verseElement == null)
      return;

    bibleContainer.scroll({
      top: verseElement.offsetTop - 150,
      behavior: 'smooth'
  });

  verseElement.click();
  toolTip.classList.remove('show-tooltip');
}

function bookObj(ref) {
  let psg = ref.getAttribute('href').split(':');
  let book_chapter = psg[1].replace('@', '').split(' ');
  let book = book_chapter[0].substring(0, book_chapter[0].length - 1)
  let chapter = book_chapter[1]
  let verse = psg[2]
  const bookObj = {
      book: book,
      chapter: chapter,
      verse: verse
  }
  return bookObj;
}

function myTooltip(elem) {
  const rect = elem.getBoundingClientRect();
  const top = rect.top - 10;
  const left = rect.left - (rect.width + 160);
  toolTip.style.top = top + 'px';
  toolTip.style.left = left + 'px';
  toolTip.classList.add('show-tooltip')
}

function getCommentryRef(myclass) {
  let cmtryRef = comtryContent.querySelectorAll(myclass);
  cmtryRef.forEach(ref => {
      const obj = bookObj(ref);

      ref.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();  
          toolTip.classList.remove('show-tooltip');       
      });

      ref.addEventListener('mouseover', (e) => {
        getBibleReference(obj.book, obj.chapter, obj.verse);
         myTooltip(ref)
      });

      ref.addEventListener('mouseleave', (e) => {
         toolTip.classList.remove('show-tooltip');
      });
   
  })
}

function activeContainer(pos) {
  const noteContainersDiv = document.getElementById('note-wrapper');
  let noteContainers = noteContainersDiv.children;
  for (let i = 0; i < noteContainers.length; i++) {
      if (noteContainers[i].classList.contains("active-note")) {
          noteContainers[i].classList.remove("active-note");
      }
  }
  noteContainers[pos].classList.add("active-note")
}

const clickedLink = (ref) => {
  let chapterVerses = document.querySelectorAll('.v[id]');
  const obj = bookObj(ref);
  getBibleChapter(obj.book, obj.chapter)
  scrollToVerse(obj.verse)
  chapterVerses.forEach(item => {
    let id = item.getAttribute('id');
    if(obj.verse == id){
      
      let search = {
        bookId: `${obj.book}0`,
        chapter: obj.chapter,
        verse: obj.verse
      }
      ipcRenderer.send('cmntry-on-verses', search)
    }     
  });
};

    const bookNames = async () => {
        const data =  await ipcRenderer.invoke('load-bible');
        if(data.length > 0){
            data.map(item => {
            const books = document.createElement('span');
            books.className = 'books-names';
            let bookName =  item.bookName.replace(" ", "");
            books.innerHTML = bookName.substring(0, 3);
            books.setAttribute('id', item.bookID)
            books.setAttribute('title', item.bookName);
          
            books.addEventListener('click', () =>{ 
                ipcRenderer.send('book-chapters', books.getAttribute('id'));
                bookname = item.bookName;
                bookID = item.bookID;

                while (bibleBooks.firstChild) {
                  bibleBooks.removeChild(bibleBooks.firstChild)
                }

                introductionToBooks(item.bookID)
            });  
            
            let bks = books.getAttribute('id')
            if (bks > 46) {
              books.style.background = '#636161';
            }

            bibleBooks.appendChild(books);

          })
        }  
    }

    const fetchedBookChapters = () => {
      ipcRenderer.on('feched-chapters', (event, args) =>{
        args.forEach(data => {
          const chapter = document.createElement('span');
          chapter.innerHTML = data.chapter;
          chapter.className = "book-chapters";
          chapter.setAttribute('id', data.chapter);
          chapter.setAttribute('info', data.info)
          btnBack.style.display = 'grid';

          chapter.addEventListener('click', (e) => {
              booksDialog.classList.remove("active");
              booksOverlay.style.display = 'none';
              btnBack.style.display = 'none';
              bookChapter = data.chapter;

              bibleContainer.scroll({
                  top: 0,
                  behavior: 'smooth'
               });

               let obj = {
                bookId: data.bookNum,
                book: bookname,
                chapter: data.chapter,
                text: chapter.getAttribute('info').cleanUp()
            }
              getCmntryOnChapters(data.bookNum, data.chapter); // get commentary on chapers
              setStorage('lastopened', obj)
              navigation.unshift(obj);
              displayPassage(data.bookNum, bookname, data.chapter, chapter.getAttribute('info').cleanUp())
          });
            bibleBooks.appendChild(chapter);
            let cmtryRef = comtryContent.querySelectorAll('a');
            cmtryRef.forEach(ref => {
              ref.addEventListener('click', (e) =>{
                  e.preventDefault();
                  e.stopPropagation();
        
                  clickedLink(ref);
              });
            })

        });    
      });
    }

    const fetchedBibleChapter = () => {
          ipcRenderer.on('bible-chapter', (event, args) =>{  
           if(args.length > 0) {
            let obj = {
              bookId: args[0].bookNum,
              book: args[0].bookName,
              chapter: args[0].chapter,
              text: args[0].info.cleanUp()
          }

          setStorage('lastopened', obj)
          navigation.unshift(obj);
          displayPassage(args[0].bookNum, args[0].bookName, args[0].chapter, args[0].info.cleanUp())
        }
           
      });
    }

  const feachedSearchData = () => {
      ipcRenderer.on('searched-data', (event, args) =>{
        while (searchCard.firstChild) {
            searchCard.removeChild(searchCard.firstChild)
            searchCount.innerHTML = `Returned 0 Result`;
        }
          args.forEach(data => {
            const searchResult = document.createElement('div');
            searchResult.setAttribute('data-bookid', data.bookNum);
            searchResult.setAttribute('data-chapter', data.chapter);
            searchResult.setAttribute('data-verse', data.verse);
            let passage = `${data.bookName} ${data.chapter}:${data.verse}`
            let verseText = data.info;
            searchResult.classList.add('search-result');
            searchResult.innerHTML = `<span class="search-chap">${passage}</span>
                                <span class="search-text">${verseText}</span>`;
            searchCard.appendChild(searchResult);
            let rows = args.length;
            if (rows > 1) searchCount.innerHTML = `Returned <b>${rows}</b> Results`
            else searchCount.innerHTML = `Returned <b>${rows}</b> Result`;
           
            searchResult.addEventListener('click', () => {
              let book = searchResult.getAttribute('data-bookid');
              let chapter = searchResult.getAttribute('data-chapter');
 
              scrollToVerse(searchResult.getAttribute('data-verse'));
              getBibleChapter(book, chapter);
              
              while (comtryContent.firstChild) {
                comtryContent.removeChild(comtryContent.firstChild); 
              }          
                           
            });
            SetPanelActive(1);
            setIconActive(1); 
            highlightSearchText(searchedText);

          });
      });
  }

  const fetchBibleReferences = () => {
    ipcRenderer.on('bible-reference', (evt, args) => {
        displayBibleRefTooltip(args);
    });
  }

  function displayBibleRefTooltip(args) {
    document.querySelector('.tip-verse').innerHTML = args[0].info
    document.querySelector('.tip-passage').innerHTML = (`${args[0].bookName} ${args[0].chapter}:${args[0].verse}`)
}

  const fetchCmntryOnChapters = () => {
    ipcRenderer.on('book-chapter-cmntry', (evt, args) => {
        displayCommentary(args);
    })
  }

  const fetchCmntryOnBooks = () =>{
    ipcRenderer.on('intro-books-data', (evt, args) => {
        displayCommentary(args);
    });
  }

  const fetchCmntryOnVerses = () =>{
    ipcRenderer.on('chapter-verse-cmntry', (evt, args) => {
        displayCommentaryOnVerse(args)
    });
  }

  const fetchFootnotes = () =>{
    let noteSpan = document.getElementById('footnote');
    ipcRenderer.on('fetched-footnotes', (evt, args) => {
        args.forEach(footnote => {
          noteSpan.innerHTML = footnote.info;
          noteSpan.querySelector('.fnvrs').remove()
          footNoteDiv.style.display = 'grid';
        })
    });
  }
  //======== Get folders, add them to notefolder array
  const fetchNoteFoders = async () => {
    let folders = await ipcRenderer.invoke('get-note-folders');
    folders.forEach(folder => {
        displayFolders(folder);
        let obj = {
          folderId: folder.fID,
          folderName: folder.fdName
        }
        noteFolders.push(obj);
    });
  };
   //======== Get folders and populate folders combo box
  function getFoldersOptions(){
      const editor = document.querySelector('.eliam-editor');
        editor.innerHTML = "";
        editor.focus();
        noteFolders.forEach(folder => {
          const option = document.createElement('option');
          option.setAttribute('value', folder.folderId);;
          option.textContent = folder.folderName;
          folderSelect.appendChild(option);
          folderNameLabel.innerHTML = "Folder Name"
          folderNameLabel.removeAttribute('noteId');
          folderSelect.style.display = 'inline';
        });

        folderSelect.addEventListener('change', () => {
            let selected = folderSelect.options[folderSelect.selectedIndex];
            folderIndex = selected.value;
            folderName = selected.textContent;
            folderNameLabel.innerHTML = `Folder: <b>${selected.textContent}</b>`;
        });
            
        folderIndex = noteFolders[0].folderId;
        folderName = noteFolders[0].folderName;
      return folderSelect;
  }
//======== Get notes from database
  const fetchNotes = async () => {
    ipcRenderer.on('fetched-notes', (evt, note) => {
        note.forEach(args => {
          displayNotes(args)
        });
    })
  }
//======== Display notes in notes list
function displayNotes(args){
  const noteCard = document.createElement('div');
  noteCard.className = "note-card";
  noteCard.setAttribute('note-text', args.note)
  noteCard.setAttribute('fId', args.fID);
  noteCard.setAttribute('nId', args.nID);
  let html = `<div class="note-title" title="${args.title}"> 
                    <span class="note-span">${args.title}</span>
                    <span class="delete-note" title="Delete">&#XE8BB;</span>
                </div>
                <div class="note-date">${args.time}</div>`;
    noteCard.innerHTML = html;
    noteContainer.appendChild(noteCard);
    let btnDelete = noteCard.querySelector('.delete-note');

    noteCard.addEventListener('click', (evt) => {
      if(evt.target.className == 'note-span'){
        const editor = document.querySelector('.eliam-editor');
        const noteDiv = document.querySelectorAll('.note-head button');
        editor.innerHTML = noteCard.getAttribute('note-text');
        activeContainer(2);
        noteDiv[3].style.display = 'block';
        let folder = folderNameLabel.getAttribute("name");
        let text = `${folder}/${args.title}`;
        folderNameLabel.innerHTML = text;
        folderNameLabel.setAttribute('noteId', noteCard.getAttribute('nId'));
      }else if(evt.target.className == 'delete-note'){
          const msg = "Are you sure you want to delete this note?";
          confirmDialog('delete-note', msg, noteCard.getAttribute('nId')) 
          noteDeleted(); //delete note from database by clicking on the delete button
      }

    });

    noteCard.addEventListener('mouseover', () => {
      btnDelete.style.display = "block";
    });

    noteCard.addEventListener('mouseleave', () => {
        btnDelete.style.display = "none";
    });
}
//======== Display folders in folders list

function displayFolders(folder){
  const folderCard = document.createElement('div');
  noteDiv = document.querySelectorAll('.note-head button'),
  folderCard.className = "folder-card";
  folderCard.setAttribute('id', folder.fID);
  folderCard.setAttribute('name', folder.fdName);
  let html = `<div title="${folder.fdName}">
                  <span><img src="./images/folder.svg"></img></span>
                  <span class="folder-name">${folder.fdName}</span>
                  <span class="delete-folder" title="Delete">&#XE8BB;</span>
              </div>`;
  folderCard.innerHTML = html
  folderContainer.appendChild(folderCard);
  
  let btnDelete = folderCard.querySelector('.delete-folder');

  folderCard.addEventListener('click', (evt) =>{
    while (noteContainer.firstChild) {
      noteContainer.removeChild(noteContainer.firstChild)
    }
    if(evt.target.className == 'folder-name'){
      activeContainer(1);
      noteDiv[0].style.display = 'block';
      noteDiv[1].style.display = 'none';
      noteDiv[2].style.display = 'none';
      noteDiv[3].style.display = 'none';
      folderNameLabel.setAttribute('name',  folderCard.getAttribute('name'));
      ipcRenderer.send('get-notes', folderCard.getAttribute('id'));
      folderSelect.style.display = 'none';
    }else if(evt.target.className == 'delete-folder'){
      const msg = "Are you sure you want to delete this folder?";
      confirmDialog('delete-folder', msg, folderCard.getAttribute('id'))
      folderDeleted();
    } 

    document.querySelector('.folder-opened').textContent = folderCard.getAttribute('name');
  });

  folderCard.addEventListener('mouseover', () => {
    btnDelete.style.display = "block";
  });

  folderCard.addEventListener('mouseleave', () => {
      btnDelete.style.display = "none";
  });

}
//======== Display commentary on bible books and book chapters
function displayCommentary(args){
  while (comtryContent.firstChild) {
    comtryContent.removeChild(comtryContent.firstChild)
  }
    let result = args[0].text.split(/<(.*)/s);
    let intro = result[0];
    let commentary = result[1].split(/>(.*)/s)[1]
    let html = `<div class="book-intro">${intro}</div>
            <div>${commentary}</div>`
      comtryContent.innerHTML = html;
      
      let cmtryRef = comtryContent.querySelectorAll('a');
      cmtryRef.forEach(ref => {
      ref.addEventListener('click', (e) =>{
          e.preventDefault();
          e.stopPropagation();

          clickedLink(ref);
      });
    });

    getCommentryRef('.comt-content a');
}
//======== Display commentary on bible verses
function displayCommentaryOnVerse(args) {
  while (comtryContent.firstChild) {
    comtryContent.removeChild(comtryContent.firstChild)
  }
  const comtryVerse = document.createElement('div');
  comtryVerse.classList.add('cmtry-content');
  let comtryRst = `${ bookName.textContent} ${chapterNumber.getAttribute('key')}:${clikedVerse}`
  comtryVerse.innerHTML = `<b>${comtryRst}</b><br/>${args[0].text}`;
  comtryVerse.lastChild.remove()
  comtryContent.appendChild(comtryVerse);

  let cmtryRef = comtryContent.querySelectorAll('a');
      cmtryRef.forEach(ref => {
      ref.addEventListener('click', (e) =>{
          e.preventDefault();
          e.stopPropagation();

          clickedLink(ref);
      });
    })

    getCommentryRef('.comt-content a');
}
//======== Display bookname, chapter number and chapter text
  function displayPassage(bookId, bookname, chapter, text){
      bookName.innerHTML = bookname;
      bookName.setAttribute('bookId', bookId)
      chapterNumber.innerHTML = `Chapter ${chapter}`;
      chapterNumber.setAttribute('key', chapter);
      btnOpenBible.innerHTML = `${bookname} ${chapter}`;
      document.querySelector('#content').innerHTML = text;

      introToBook.innerHTML = `<i>The Book of</i> <b>${bookname}</b>`;
      introToBook.setAttribute('title', `Introduction to the book of ${bookname}`)
      introToBook.setAttribute('id', bookname)
      displaFootnote(); //Footnotes of the passage page
      getClickedVerse();

      introToBook.addEventListener('click', () => {
          ipcRenderer.send('intro-to-books', parseInt(`${bookId}0`));
      });

  }
//========= Show book names dialog
    function openBibleDialog(){
      btnOpenBible.addEventListener('click', () => {
        while (bibleBooks.firstChild) {
          bibleBooks.removeChild(bibleBooks.firstChild)
        }
          const rect = btnOpenBible.getBoundingClientRect();
          booksDialog.style.top = rect.top + 'px';
          booksDialog.style.left = rect.left + 'px';
          booksOverlay.style.display = 'block';
  
          bookNames()        
      });
    }

  btnBack.addEventListener('click', () => {
      while (bibleBooks.firstChild) {
          bibleBooks.removeChild(bibleBooks.firstChild)
      }
      bookNames();
      btnBack.style.display = 'none';
  })

  btnClose.addEventListener('click', () => {
    booksOverlay.style.display = 'none';
  });
//========= Store last bible page opened into json file
  function setStorage(key, info) {
    localStorage.setItem(key, JSON.stringify(info));
}
//======== Get last bible page opened from json file
function getStorage(key) {
    var item = localStorage.getItem(key);
    return JSON.parse(item);
}
//======= Restore and display the last bible page opened
function restoreLastOpendBook() {
  let obj = getStorage('lastopened');
  if(obj){
    bookID = obj.bookId;
    bookChapter = obj.chapter;
    displayPassage(obj.bookId, obj.book, obj.chapter, obj.text);
    ipcRenderer.send('intro-to-books', parseInt(`${obj.bookId}0`));

    let cmtryRef = comtryContent.querySelectorAll('a');
      cmtryRef.forEach(ref => {
      ref.addEventListener('click', (e) =>{
          e.preventDefault();
          e.stopPropagation();

          clickedLink(ref);
      });
    })
  }else{
    getBibleChapter(1, 1);
  }

}
//======== Navigate through bible pages open since opened bible
function navigateBack() {
  btnUndo.addEventListener('click', () => {
    while (comtryContent.firstChild) {
      comtryContent.removeChild(comtryContent.firstChild)
    }
      navigation.push(navigation.shift()) 
      // if (navigation.length <= 1) return;
      let bookId = navigation[0].bookId;
      let book = navigation[0].book;
      let chapter = navigation[0].chapter;
      let text = navigation[0].text;

      displayPassage(bookId, book, chapter, text)
      navigation.push(navigation.shift());
      getCmntryOnChapters(bookId, chapter);
  });
}

function getClickedVerse() {
  let verses =  bibleContent.querySelectorAll('.v[id]');
  let verseId = 0;
  verses.forEach(verse => { 
      verse.addEventListener('click', (e) => {
        switch (e.target.className) {
          case 'cno':
            verseId = parseInt(e.target.children[0].getAttribute('v') + 1);
          break;
          case 'vno':
            verseId = parseInt(e.target.children[0].textContent);
          break;
          case 'v':
            verseId = parseInt(e.target.getAttribute('id'))
          break;
       }
          clikedVerse = verseId;
          getCmntryOnVerses(bookName.getAttribute('bookId'), chapterNumber.getAttribute('key'), verseId);

        for (let i = 0; i < verses.length; i++) {
          verses[i].classList.remove("highlighted");
        }
        verse.classList.add("highlighted") // hightlight clicked vers
          SetPanelActive(0);
          setIconActive(0);
      })
    })
}

function displaFootnote(){
  let note = document.querySelectorAll('.FOOTNO');
  note.forEach((elem) => {
      elem.addEventListener('mouseover', () => {
          let str = elem.getAttribute('href').split('_');
          getFootNotes(str[0], str[1], str[2])
      });

      elem.addEventListener('mouseleave', () => {
          footNoteDiv.style.display = 'none'
      });

      let footnote = elem.innerHTML;
      let supNote = `<sup>${footnote}</sup>`;
      elem.innerHTML = supNote;
  });
}
//========== Get book chapters
function getBibleChapter(bookId, chapterNumber) {
  let obj = {
      bookId: bookId,
      chapter: chapterNumber
  }
 if(obj.chapter == 0){
    return undefined;
 }

  ipcRenderer.send('book-passage', obj)
  getCmntryOnChapters(bookId, chapterNumber);
}
//=========== Get the search word or frase from the input element
function getSearchText(searchText){
  searchedText = searchText;
  ipcRenderer.send('search-bible', searchText)
}
//========= Get references to the links
function getBibleReference(bookId, chapter, verse){
    let obj = {
        book: bookId,
        chapter: chapter,
        verse: verse
    }

    ipcRenderer.send('get-bible-reference', obj);
}
//========== Get commentary for bible books
function introductionToBooks(bookId) {
    ipcRenderer.send('intro-to-books', parseInt(`${bookId}0`))
}
//========== Get commentary for Book chapters
function getCmntryOnChapters(bookId, chapter) {
  let obj = {
    bookId: `${bookId}0`,
    chapter: chapter
  }
  ipcRenderer.send('cmntry-on-chapters', obj)
}
//========= Get commentary for chaper verses
function getCmntryOnVerses(bookId, chapter, verse) {
  let obj = {
    bookId: `${bookId}0`,
    chapter: chapter,
    verse: verse
  }
  ipcRenderer.send('cmntry-on-verses', obj)
}
//======== Get footnote information from chapter
function getFootNotes(bookId, chapter, verse) {
  let obj = {
    bookId: bookId,
    chapter: chapter,
    verse: verse
  }
  ipcRenderer.send('get-footnotes', obj)
}

//================ Dictionary section ==================

const fetchDictionary = async () => {
  const data =  await ipcRenderer.invoke('get-dictionary'); 
    data.map(row => { 
      let dictWord = document.createElement('li')
      dictWord.className = 'dict-words';
      dictWord.setAttribute('title', row.topic);
      dictWord.setAttribute('definition', row.definition)
      dictWord.innerHTML = row.topic;

      dictWord.addEventListener('click', () => {  
        let definition = dictWord.getAttribute('definition');
        dictionaryDef.innerHTML = definition;
        goToDictionaryRef();

        setStorage('lastDicWord', dictWord.innerHTML)
        dictSearchBox.value = dictWord.innerHTML;

        highlighCurrentDictWord(dictWord);
      })

          dictWordsList.appendChild(dictWord);
    }); 
}

async function restoreDictionaryLastWord(){
  let lastWord = getStorage('lastDicWord');
  document.querySelector("#dict-search").value = lastWord;
  if(lastWord){
      setTimeout(() =>{
        searchDictionary(lastWord)
      }, 500)
  }
}

function goToDictionaryRef(){
  let link = document.querySelectorAll('.dict-result a')
  link.forEach(dicref => {
      if (dicref.innerHTML.includes(')'))
          dicref.removeAttribute('href') // This removes the href attribute to prevent error

      let refx = dicref.getAttribute('href')
      let index = refx.indexOf('-');

      if (index !== '')
          refx = refx.split('-')[0]

      let ref = refx.replace('B:', '').split(' ')[0];
      let book = ref.substring(0, ref.length - 1);
      let ref_ = dicref.innerText;
      let book_chapter = ref_.split(':')
      let chapter_ = book_chapter[0].split(' ')
      let chapter = chapter_[1]
      let verse = book_chapter[1]

      dicref.addEventListener('click', (e) => {
          e.preventDefault()

          if (refx.includes('S:')) {
              return;
          }

          if (!dicref.innerHTML.includes(':')) {
              chapter = refx.substring(refx.lastIndexOf(':') + 1);
              verse = dicref.innerHTML;
          }

          if (!dicref.innerHTML.includes(' ') && dicref.innerHTML.includes(':')) {
              let cv = dicref.innerHTML.split(':')
              chapter = cv[0];
              verse = cv[1];
          }

          getBibleChapter(book, chapter)
          scrollToVerse(verse);

      });

      dicref.addEventListener('mouseover', (e) => {
          if (refx.includes('S:')) {
              return
          }

          if (!dicref.innerHTML.includes(':')) {
              chapter = refx.substring(refx.lastIndexOf(':') + 1);
              verse = dicref.innerHTML;
          }

          if (!dicref.innerHTML.includes(' ') && dicref.innerHTML.includes(':')) {
              let cv = dicref.innerHTML.split(':')
              chapter = cv[0];
              verse = cv[1];
          }

          getBibleReference(book, chapter, verse);
          myTooltip(dicref)
      });

      dicref.addEventListener('mouseleave', (e) => {
          toolTip.classList.remove('show-tooltip')
      });
  })
}

function highlighCurrentDictWord(dictWord) {
  let dictlist = document.querySelectorAll('.dict-words');
  dictlist.forEach(elem => {
      if (elem.className.includes('active-word')) {
          elem.classList.remove('active-word')
      }
  })

  dictWord.classList.add('active-word')
}

function searchDictionary(text){
  let words = document.querySelectorAll('.dict-words');
  words.forEach(elem => {
      if (elem.innerText.toLowerCase().includes(text.toLowerCase())) {
        dictionaryList.scroll({
              top: elem.offsetTop - 150,
              behavior: 'smooth'
          })
          setTimeout(active => {
              elem.classList.add('active-word')
              elem.click()
          }, 200)
      }
      else
          elem.classList.remove('active-word')
  })
}

function searchDictionaryEvent(){
  dictSearchBox.addEventListener("keydown", (e) => {
    if (dictSearchBox.value !== "") {
        if (e.key == "Enter") {
            searchDictionary(dictSearchBox.value)
        }
    }
  })
}

//========= Get app context menu
function showMenu(x, y){
  ipcRenderer.send(`display-app-menu`, {x, y})
}

function showEditorMenu(x, y){
  ipcRenderer.send(`display-editor-menu`, {x, y})
}
//=========== Open App Context Menu
 document.addEventListener('contextmenu', (e) => {
  e.preventDefault();
 let selected = window.getSelection().toString().length
    if(e.target.classList.contains('v') ||
      e.target.parentNode.className === 'para'){
        if(selected > 0){
          showMenu(e.x, e.y);
        }
    }
    
    if(e.target.parentNode.className === 'comt-content' ||
    e.target.parentNode.className === 'cmtry-content'){
      if(selected > 0){
        showMenu(e.x, e.y);
      }
    }
    
    if(e.target.parentNode.className === 'eliam-editor' ||
    e.target.parentNode.className === 'editor-wrapper'){
        ipcRenderer.send('selection', selected);
        showEditorMenu(e.x, e.y);
    }

 });

//============ Save Note into Database
function getNoteData(data){
  let noteId = folderNameLabel.getAttribute('noteId');
    if(noteId){
      let updateNote = {
        note:data.note,
        title:data.title,
        noteId:noteId,
      }
      ipcRenderer.send('update-note', updateNote);
    }else{ 
      saveNoteDialog(data);
    } 

    getSavedNoteData();
}
//============ Get Save Note details 
function getSavedNoteData(){
  let text = folderNameLabel.textContent;
  ipcRenderer.on('note-saved', (evt, data) => {
    let text = `${folderName}/${data.title}`;
    folderNameLabel.innerHTML = text;
    folderNameLabel.setAttribute('noteId', data.nID);
    folderSelect.style.display = 'none';
  }); 
  
  ipcRenderer.on('note-updated', (evt, data) => {
    folderNameLabel.textContent = data;
      setTimeout(() => {
        folderNameLabel.textContent = text;
      }, 100); 
  });
}
//============= Open Save note dialog
function saveNoteDialog(data) {
    let btn = dialogFooter.querySelectorAll('button');
    document.getElementById('dragzone').textContent = 'Save Document';
    inputOverlay.style.display = 'flex';

    filename.value = data.title;

    btn[0].addEventListener('click', () => {
        let obj = {
          fID:folderIndex,
          title:filename.value,
          note:data.note,
          date:data.date
        } 
        ipcRenderer.send('save-note', obj); 
        inputOverlay.style.display = 'none';
    });

    btn[1].addEventListener('click', () => {
        inputOverlay.style.display = 'none';
    })
}
//====== Delete Note from Database =====
function noteDeleted(){
  ipcRenderer.on('note-deleted', (evt, data) => {
    let noteID = data
    let notes = noteContainer.querySelectorAll('.note-card');
    notes.forEach(note => {
        let id = note.getAttribute('nId');
        if (id == noteID) {
            note.parentNode.removeChild(note)
        }
    })
});
}
//========= Create new Note by clicking on new button 
function  getNewDocumwnt(){
  return getFoldersOptions();
}
//========= Get new folder name and create a new folder
function getFolderName(args){
  ipcRenderer.send('new-folder', args);
  while (folderContainer.firstChild) {
    folderContainer.removeChild(folderContainer.firstChild)
  } 
}
//======== Folder created result function 
function folderCreated(){
  ipcRenderer.on('folder-created', (evt, args) => {
    args.forEach(folder => {
      displayFolders(folder);
      let obj = {
        folderId: folder.fID,
        folderName: folder.fdName
      }
      noteFolders.push(obj);
    });
  });
}
//======== Folder deleted result function
function folderDeleted() {
  ipcRenderer.on('folder-deleted', (evt, args) =>{
    let folderID = args;
    let folders = folderContainer.querySelectorAll('.folder-card');
    folders.forEach(folder => {
        let id = folder.getAttribute('id');
        if (id == folderID) {
            folder.parentNode.removeChild(folder);
        }
    })
  }); 
}
//========= Delete folder / note confirmation dialog 
function confirmDialog(cmd, msg, id) {
    let footer = document.getElementById('confirmDialog-footer');
    let confirmDialogBody = document.getElementById('confirmDialog-body');
    confirmDialogBody.innerHTML = msg;
    let btn = footer.querySelectorAll('button');
    confirmOverlay.style.display = 'flex';

    btn[0].addEventListener('click', () => {
      ipcRenderer.send(cmd, id);
        confirmOverlay.style.display = 'none';
    });

    btn[1].addEventListener('click', () => {
        confirmOverlay.style.display = 'none';
    });
}

//========== Strongs Section =================
const getStrongs = async () => {
  const data =  await ipcRenderer.invoke('load-strongs');
  data.map(item => {
    const numbers = document.createElement('li');
    numbers.className = 'strongs-numbers';
    numbers.setAttribute('pronounce', item.pronounce);
    numbers.setAttribute('description', item.description);
    numbers.setAttribute('lemma', item.lemma);
    numbers.setAttribute('xlit', item.xlit);
    numbers.innerHTML = item.number;

    numbers.addEventListener('click', () => {
      const description = numbers.getAttribute('description');
      const pronounce = numbers.getAttribute('pronounce');
      const lemma = numbers.getAttribute('lemma');
      const xlit = numbers.getAttribute('xlit');
      let text = `<div class="strongs-info">
          <span><b>${lemma}</b></span> 
          <span style="color:#666;  font-style: italic;">( ${xlit} )</span>, 
          <span title="Pronunciation">${pronounce}</span><br/>
      </div>`;
      strongsDescriptions.innerHTML = `${text}${description}`;
      strongsSearchBox.value = numbers.innerText;

      highlighCurrentNumber(numbers)
    });

    strongsNumbersList.appendChild(numbers);
  })

}

function highlighCurrentNumber(numbers) {
  let strongsNumbers = document.querySelectorAll('.strongs-numbers');
  strongsNumbers.forEach(elem => {
      if (elem.className.includes('active-word')) {
          elem.classList.remove('active-word')
      }
  })
  numbers.classList.add('active-word')
}

function searchStrongs(text){
  let strongs = document.querySelectorAll('.strongs-numbers');
  strongs.forEach(elem => {
      if (elem.innerText.toLowerCase() == text.toLowerCase()) {
        strongsList.scroll({
              top: elem.offsetTop - 150,
              behavior: 'smooth'
          })
          setTimeout(active => {
              elem.classList.add('active-word')
              elem.click()
          }, 200)
      }
      else
          elem.classList.remove('active-word')
  })
}

function searchStrongsEvent(){
  strongsSearchBox.addEventListener("keydown", (e) => {
    if (strongsSearchBox.value !== "") {
        if (e.key == "Enter") {
          searchStrongs(strongsSearchBox.value)
        }
    }
  })
}

//============ End of Strongs Section
restoreLastOpendBook();
openBibleDialog(); 
fetchedBookChapters();
fetchedBibleChapter();
feachedSearchData();
fetchCmntryOnBooks();
fetchCmntryOnChapters();
fetchCmntryOnVerses();
navigateBack();
fetchFootnotes();
fetchBibleReferences();
fetchNoteFoders();
fetchNotes();
folderCreated();

fetchDictionary();
restoreDictionaryLastWord();
searchDictionaryEvent();

getStrongs();
searchStrongsEvent();

//================Exposing functions in the main
    const WINDOW_API = {  
      bibleChapter: (bookId, chapterNumber) => getBibleChapter(bookId, chapterNumber),
      searchText: (searchResult) => getSearchText(searchResult),
      configDatabase: (args) =>{ return setupNoteDatabase(args);},
      getNoteFolders: () => { return getFoldersOptions(); },
      saveData: (data) => { getNoteData(data); },
      newDocumwnt: () => { getNewDocumwnt(); },
      setFolderName: (args) => { getFolderName(args); },
    }

    contextBridge.exposeInMainWorld('api', WINDOW_API);
    
});

