
const toolBar = [
    {
        id:'btn-bold',
        title:'Bold',
        command:'bold',
        icon:'./images/editor/bold.svg',
    },
    {
        id:'btn-italic',
        title:'Italic',
        command:'italic',
        icon:'./images/editor/italic.svg',
    },
    {
        id:'btn-underline',
        title:'Underline',
        command:'underline',
        icon:'./images/editor/underline.svg',
    },
    {
        id:'btn-justify-left',
        title:'Align Left',
        command:'justifyLeft',
        icon:'./images/editor/align-left.svg',
    },
    {
        id:'btn-justify-center',
        title:'Align Center',
        command:'justifyCenter',
        icon:'./images/editor/align-center.svg',
    },
    {
        id:'btn-justify-right',
        title:'Align Right',
        command:'justifyRight',
        icon:'./images/editor/align-right.svg',
    },
    {
        id:'btn-justifu-full',
        title:'Justify Full',
        command:'justifyFull',
        icon:'./images/editor/align-justify.svg',
    },
    {
        id:'btn-orderedlist',
        title:'Insert Number',
        command:'insertOrderedList',
        icon:'./images/editor/list-ol.svg',
    },
    {
        id:'btn-unorderedlist',
        title:'Insert Bullet',
        command:'insertUnorderedList',
        icon:'./images/editor/list-ul.svg',
    },
    {
        id:'btn-indent',
        title:'Indent',
        command:'indent',
        icon:'./images/editor/indent.svg',
    },
    {
        id:'btn-outdent',
        title:'Outdent',
        command:'outdent',
        icon:'./images/editor/outdent.svg',
    },
    {
        id:'btn-unformat',
        title: 'Remove Format',
        command: 'removeFormat',
        icon:'./images/editor/erase.svg',
    },
    // {
    //     id:'btn-insert',
    //     title:'Insert Image',
    //     command:'insert-image',
    //     // icon:'./images/editor/outdent.svg',
    // },
    {
        id:'btn-new',
        title:'New Document',
        command:'new',
        icon:'./images/editor/file.svg',
    },
    {
        id:'btn-save',
        title:'Save Document into Database',
        command:'save',
        icon:'./images/editor/onedrive.svg',
    },
    {
        id:'btn-export',
        title:'Save As Word Document',
        command:'save-word',
        icon:'./images/editor/file-word.svg',
    },

]

const fontSizes = [10,12,14,18,24,36];

function getFonts(){
    const fonts = (`Arial,Arial Black,Bedrock,Book Antiqua,Calibri,
    Century Gothic,Comic sans MS,Consolas,Courier,Courier New,Cursive,
    Garamond,Georgia,Impact,Lucida Console,Monospace,Sans-Serif, system-ui,Tahoma,
    Times New Roman,Trebuchet MS,Verdana,WildWest`).split(',');

    return fonts;
}

function getSize(sizes){
    let fontSize = document.querySelector('.font-size')
    switch(sizes){
        case '13px':
            fontSize.selectedIndex = 0;
            break;
        case '16px':
            fontSize.selectedIndex = 1;
            break;
        case '18px':
            fontSize.selectedIndex = 2;
            break;
        case '24px':
            fontSize.selectedIndex = 3;
            break;
        case '32px':
            fontSize.selectedIndex = 4;
            break;
        case '48px':
            fontSize.selectedIndex = 5;
            break;
        default: 
            fontSize.selectedIndex = 1;
            break;
    }
}

function retunFontNameAndSize(editor, fontName){
    returnFontName(editor, fontName);
    returnFontSize();
}

function firstElementParent (node) {
    while (!node.parentElement) node = node.parentNode
    return node.parentElement
}

function returnFontName(editor, fontName){
    let selection = window.getSelection();
    let fonts = window.getComputedStyle(
        firstElementParent(selection.anchorNode)
      ).fontFamily;
  
      var optn = fontName.options;
      
      if(editor.innerHTML != '')
        fonts = fonts.replace(/['"]+/g, ''); 
      for (var opt, i = 0; opt = optn[i]; i++) {    
          if (opt.value == fonts) {
              fontName.selectedIndex = i;
          }
      }
}

function returnFontSize(){
    let fontSize = document.querySelector('.font-size')
    let selection = window.getSelection();
    let sizes = window.getComputedStyle(
        firstElementParent(selection.anchorNode)
      ).fontSize;
  
      var opts = fontSize.options;
      for (var opt, i = 0; opt = opts[i]; i++) {
          getSize(sizes);  
      }  
}

function FindCurrentTags(editor){
    let fontName = document.querySelector('.fonts-name')
    const toolbar = document.querySelector('.editor-toolbar')
    const btn = toolbar.querySelectorAll('span')	
    // hideDivs();
    highlightAlign(btn); 
    retunFontNameAndSize(editor, fontName);
    // retunSelectionColor();

    // No of ranges
    var num_ranges = window.getSelection().rangeCount;
    // Will hold parent tags of a range
    var range_parent_tags;
    // Will hold parent tags of all ranges
    var all_ranges_parent_tags = [];     
    // Current menu tags
    var menu_tags = ['B', 'I', 'U', 'UL', 'OL'];     
    // Will hold common tags from all ranges
     var menu_tags_common = [];
    var start_element,
        end_element,
        cur_element;
    // For all ranges
    for(var i=0; i<num_ranges; i++) {
        // Start container of range
        start_element = window.getSelection().getRangeAt(i).startContainer;       
        // End container of range
        end_element = window.getSelection().getRangeAt(i).endContainer;       
        // Will hold parent tags of a range
        range_parent_tags = [];
        // If starting node and final node are the same
        if(start_element.isEqualNode(end_element)) {
            // If the current element lies inside the editor container then don't consider the range
            // This happens when editor container is clicked
            if(editor.isEqualNode(start_element)) {
                all_ranges_parent_tags.push([]);
                continue;
            }
            cur_element = start_element.parentNode;          
            // Get all parent tags till editor container    
            while(!editor.isEqualNode(cur_element)) {
                range_parent_tags.push(cur_element.nodeName);
                cur_element = cur_element.parentNode;
            }           
        }
        // Push tags of current range 
        all_ranges_parent_tags.push(range_parent_tags);
    }
    // Find common parent tags for all ranges
    for(i=0; i<menu_tags.length; i++) {
        var common_tag = 1;
        for(var j=0; j<all_ranges_parent_tags.length; j++) {
            if(all_ranges_parent_tags[j].indexOf(menu_tags[i]) == -1) {
                common_tag = -1;
                break;
            }
        }
        if(common_tag == 1)
            menu_tags_common.push(menu_tags[i]);
             // Highlight menu for common tags

            // console.log(menu_tags_common)
            highlightMenus(menu_tags_common, btn)  
            
            // highlightMenus()
    }  
}

function highlightMenus(tags, btn){
    // Highlight menu for common tags
    if(tags.indexOf('B') != -1)
        btn[0].classList.add("highight-menu");
    else
        btn[0].classList.remove("highight-menu");

    if(tags.indexOf('I') != -1)
        btn[1].classList.add("highight-menu");
    else
        btn[1].classList.remove("highight-menu");

    if(tags.indexOf('U') != -1)
        btn[2].classList.add("highight-menu");
    else
        btn[2].classList.remove("highight-menu");

    if(tags.indexOf('UL') != -1)
        btn[8].classList.add("highight-menu");
    else
        btn[8].classList.remove("highight-menu");

    if(tags.indexOf('OL') != -1)
        btn[7].classList.add("highight-menu");
    else
        btn[7].classList.remove("highight-menu");

}

function highlightAlign(btn){ 
    // const toolbar = document.querySelector('.editor-toolbar')
    // const btn = toolbar.querySelectorAll('span') 
    const selection = window.getSelection();
    let align = window.getComputedStyle(
      firstElementParent(selection.anchorNode)
    ).textAlign;
    if(align == 'left')
        btn[3].classList.add("highight-menu");
    else
        btn[3].classList.remove("highight-menu");

    if(align == 'center')
        btn[4].classList.add("highight-menu");
    else
        btn[4].classList.remove("highight-menu");

    if(align == 'right')
        btn[5].classList.add("highight-menu");
    else
        btn[5].classList.remove("highight-menu");

    if(align == 'justify')
        btn[6].classList.add("highight-menu");
    else
        btn[6].classList.remove("highight-menu");
}

function returnFontsStyle(fontName){
    for(var i = 0; i < fontName.length; i++){
        fontName[i].style.fontFamily = fontName[i].value;
    }
}

function size(e){
    document.execCommand('FontSize', false, e.target.value);
}

function FontSizes(wrapper){
    const sizes = document.createElement('select');
    sizes.className = 'font-size';
    for(let i = 0; i < fontSizes.length; i++){
        const size = document.createElement('option');
        size.value = i + 1
        size.innerText = fontSizes[i]  
        
        sizes.appendChild(size);
    }
    sizes.selectedIndex = 1;
    sizes.addEventListener('change', (e) => {
        size(e)
    });
    wrapper.appendChild(sizes);
    return sizes;
}

function fontsFamily(wrapper){
    const fonts = document.createElement('select');
    fonts.className = 'fonts-name';
    getFonts().forEach(fnt => {
        const font = document.createElement('option');
        font.value = fnt
        font.innerText = fnt
        fonts.appendChild(font);
    });

    fonts.selectedIndex = 4;

    fonts.addEventListener('change', () => {
        changeFont(fonts);
    });
    
    wrapper.appendChild(fonts);
    returnFontsStyle(fonts)
    return fonts
}

function changeFont(fontName){   
    var selectedValue = fontName.options[fontName.selectedIndex].value; 
    document.execCommand('FontName', false, selectedValue);
}

function toolbar(wrapper, editor) {
    const toolbar = document.createElement('div');
    toolbar.className = 'editor-toolbar';
    toolBar.forEach(tool => {
        const btn = document.createElement('span');
        const img = document.createElement('img');
        btn.setAttribute('id', tool.id);
        img.setAttribute('src',  tool.icon)
        btn.className = tool.id;
        btn.setAttribute('title', tool.title);
        // btn.textContent = tool.title;
        btn.appendChild(img);

        if(tool.command == 'new') {
            btn.onclick = () => {
                window.api.newDocumwnt();
            }
        }else if(tool.command == 'save') {
            btn.onclick = () =>{
                if(editor.innerHTML !== ""){
                    let title = getFileName(editor);
                    let date = new Date();
                    let dd = String(date.getDate()).padStart(2, '0');
                    let mm = String(date.getMonth() + 1).padStart(2, '0'); //January is 0!
                    let yyyy = date.getFullYear();
                    date = mm + '/' + dd + '/' + yyyy;

                    let obj = {
                        title: title,
                        date: date,
                        note:editor.innerHTML
                    }
                    window.api.saveData(obj);
                }     
            }
        }else if(tool.command == 'save-word') {
                btn.onclick = () =>{
                    exportHTML(editor);
                }
        }else{
            btn.onclick = () =>{
                document.execCommand(tool.command, false, null)
            }
        }
        toolbar.appendChild(btn);
    })
    fontsFamily(toolbar)
    FontSizes(toolbar)
    wrapper.appendChild(toolbar);
    return toolbar;
}

function insertTabAtCaret(event){
    if(event.key === 'Tab'){
        event.preventDefault();
        if (!window.getSelection) return; 
        const sel = window.getSelection();
        if (!sel.rangeCount) return;
        const range = sel.getRangeAt(0);
        range.collapse(true);
        const span = document.createElement('span');
        span.appendChild(document.createTextNode('\t'));
        span.style.whiteSpace = 'pre';
        range.insertNode(span);
        // Move the caret immediately after the inserted span
        range.setStartAfter(span);
        range.collapse(true);
        sel.removeAllRanges();
        sel.addRange(range)
    }
}

function getFileName(editor){
    if(editor.innerText == "") return;
    let filename = editor.innerText.split('\n')[0];

    return filename
}

function exportHTML(editor){
    let header = `<html xmlns:o='urn:schemas-microsoft-com:office:office' "+
         "xmlns:w='urn:schemas-microsoft-com:office:word' "+
         "xmlns='http://www.w3.org/TR/REC-html40'>"+
         "<head><meta charset='utf-8'><title>Export HTML to Word Document with JavaScript</title></head><body style="font-family:Calibri">`;
    let footer = "</body></html>";
    let sourceHTML = header + editor.innerHTML+footer;

    let source = 'data:application/vnd.ms-word;charset=utf-8,' + encodeURIComponent(sourceHTML);
    let fileDownload = document.createElement("a");
    document.body.appendChild(fileDownload);
    fileDownload.href = source;
    fileDownload.download = `${getFileName(editor)}.doc`;
    if(editor.innerHTML !== ""){
        fileDownload.click();
    };
    
    document.body.removeChild(fileDownload);
}

export const eliamEditor = (editorDiv) => {
    const wrapper = document.createElement('div');
    wrapper.className = 'wrapper';
    const editorWrapper = document.createElement('div');
    editorWrapper.className = 'editor-wrapper';
    const editor = document.createElement('div');
    editor.className = 'eliam-editor';
    editor.setAttribute('contenteditable', true);

    const statusbar = document.createElement('div');
    statusbar.className = 'folder-info';
    const html = `<div class="folder-combo-div">
                    <span class="folder-name-label">Folder Name</span>
                    <select class="folders-combo"></select>
                </div>`;
    statusbar.innerHTML = html;

    toolbar(wrapper, editor);
    editorWrapper.append(editor)
    wrapper.appendChild(editorWrapper);
    wrapper.appendChild(statusbar);
    editorDiv.appendChild(wrapper);

    editor.addEventListener('keydown', insertTabAtCaret, false);
    editor.addEventListener('click', () => {
        FindCurrentTags(editor)
    });
    editor.addEventListener('keyup', () => {FindCurrentTags(editor)});

    return wrapper;
};