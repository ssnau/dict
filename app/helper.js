var _ = require("underscore");
var path = require("path");
var fs = require("fs");

/**
 * read the dictionary directory and then return all its word as an arry
 * @param dictName such as "collins"
 * @param root the root path to the dictonary directory
 * @returns {Boolean|Array}
 */
var getWordList = function (dictName, root) {
	var dict_path = path.join(root, dictName);

    // check if the folder exists
    if (!fs.existsSync(dict_path)) {
        console.log("dictionary not exists!")
        return false;
    }

    // get the file list
    var subPaths = fs.readdirSync(dict_path);
    var list = [];
    _.each(subPaths, function(v) {
        var extname = path.extname(v); //will be ".txt"
        var word = v.substring(0, v.length - extname.length); //strip off the extname
        list.push(word);
    });
    return list;
}

/**
 * Get the HTML of a specific word
 * @param dictName such as "collins"
 * @param word the word we need to fetch its template
 * @param root
 * @returns {*}
 */
var getWordTemplate = function(dictName, word, root) {
    var wordpath = path.join(root, dictName, word + '.txt');
    // check if the folder exists
    if (!fs.existsSync(wordpath)) {
        console.log("word not exists!")
        return false;
    }

    return fs.readFileSync(wordpath, "utf8");
}

/**
 *
 * @param word
 * @param root
 * @returns {*}
 */
var getWordVoice = function(word, root) {
    var subpath = word.slice(0, 1).toLowerCase();
    var voicepath = path.join(root, "english", subpath,  word + '.wav');
    // check if the folder exists
    if (!fs.existsSync(voicepath)) {
        console.log("voice not exists!")
        return false;
    }

    return fs.readFileSync(voicepath);
}

exports.getWordList = getWordList;
exports.getWordTemplate = getWordTemplate;
exports.getWordVoice = getWordVoice;

/* TEST */
/*
console.log(
    getWordTemplate("collins", "abuse", __dirname +"/../data/dict")
)
*/