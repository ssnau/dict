/**
 * Created with JetBrains WebStorm.
 * User: liuxijin
 * Date: 3/24/13
 * Time: 4:18 PM
 * To change this template use File | Settings | File Templates.
 */
var helper = require("../helper");
module.exports = function(app) {
    app.get("/", function(req, res, next) {
        var wordlist = helper.getWordList("collins", app.DICT_ROOT);
       res.render("index.ejs", {wordlist: JSON.stringify(wordlist)})
    });

    app.get("/lookup/:dict/:word", function(req, res) {
        var result = helper.getWordTemplate(req.params.dict, req.params.word, app.DICT_ROOT);
        res.send(result);
    })

    app.get("/voice/:word", function(req, res) {
        var audio = helper.getWordVoice(req.params.word, app.VOICE_ROOT);
        res.send(audio);
    })
}