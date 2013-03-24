var collins = require("./collins");
var fs = require('fs');

var collins_word_list_file = "Longman.words";
var word_str = fs.readFileSync(collins_word_list_file, 'utf8');

var word_list = word_str.split("\n");

var args = process.argv;
var beginCount = process.argv[2] || 0; 
var mode = process.argv[3] || "normal"; 
console.log('beginCount:' + beginCount);

if (mode) {
	if (mode == "reverse") {
		word_list.reverse();
	}

	if (mode == "disorder") {
		word_list.sort(function(a, b){
			return Math.random() - 0.5;
		});
	}
}

collins.get(word_list.slice(beginCount), beginCount);
