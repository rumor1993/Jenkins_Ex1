const path = require("path")
const electron = require('electron')
const fs = require('fs');
const config = require('./config');

let app = electron.app ? electron.app : electron.remote.app.getLocale


module.exports = i18n;


function i18n() {
    //console.log("@@@@@@@")
    config.initialize();
    leng =  config.getConfig('lengCode','ko');
    if(fs.existsSync(path.join(__dirname + "/locales", leng + '.json'))) {
         loadedLanguage = JSON.parse(fs.readFileSync(path.join(__dirname + "/locales", leng + '.json'), 'utf8'))
    }
}

i18n.prototype.__ = function(phrase) {
    let translation = loadedLanguage[phrase]
    if(translation === undefined) {
         translation = phrase
    }
    return translation
}

exports.setlengCode = function(){
    i18n();
}

