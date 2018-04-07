const fs = require('fs');
const path = require('path');

let getStaticFile = (url) => new Promise((resolve, reject) => {
    let rootPath = path.resolve(__dirname,'../www');
    let filePath = `${rootPath}${url}`;    
    let fileExtension = path.extname(filePath);
    (!fileExtension) && (() => {filePath = `${rootPath}/index.html`; fileExtension = '.html'})();
    let contentType = getContentType(fileExtension);
    fs.readFile(filePath, (err,fileData) => err ? reject(err) : resolve({fileData, contentType}));
}) 

let getContentType = (extension) => {
    switch(extension){
        case '.html': return 'text/html';
        case '.js'  : return 'text/javascript';
        case '.css' : return 'text/css';       
        case '.json': return 'application/json';       
        case '.png' : return 'image/png';             
        case '.jpg' : return 'image/jpg';
        case '.jpeg': return 'image/jpeg';       
        case '.svg' : return 'image/svg+xml';       
        case '.wav' : return 'audio/wav'; 
        case '.otf' : return 'application/x-font-otf';
        case '.ttf' : return 'application/x-font-ttf';      
    }
}

module.exports = getStaticFile;