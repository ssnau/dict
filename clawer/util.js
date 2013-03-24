var fs = require("fs");
var path = require('path');
/**
 * 将数据存入相对于main文件的filename路径
 * 若目标文件或文件夹不存在，则递归创建之
 * @param  {[type]} filename 文件路径,如"a/b/c"会处理为[main所在位置]/a/b/c
 * @param  {[type]} data     内容
 * @param  {[type]} encode   默认为"utf8"
 * @return {[type]}          [description]
 */
exports.saveToFile = function(filename, data, encode) {
	encode = encode || "utf8";
	//获得主文件所在目录
	main_folder_path = path.dirname(require.main.filename);
	filename = path.join(main_folder_path, filename);
	parent_path = path.resolve(filename, '..');
	//判断其父路径是否存在, 若不存在，则创建之
	if (!fs.existsSync(parent_path)) {
		this.createFolderRecursively(parent_path);
	}

	fs.writeFileSync(filename, data, encode);
}

/**
 * 判断所给文件是否存在，路径相对于main文件
 */
exports.fileExists = function(filename) {
	//获得主文件所在目录
	main_folder_path = path.dirname(require.main.filename);
	filename = path.join(main_folder_path, filename);
	return fs.existsSync(filename);
}

/**
 * 读入完整绝对路径，如"Z:\\dev\\lang\\hello"
 * 递归创建文件夹 
 * @param  {[type]} filename 完整绝对路径
 * @return {[type]}          
 */
exports.createFolderRecursively = function(filename) {
	file_path_array = filename.split(path.sep);
	if (!file_path_array.length) return;
	tmpPath = file_path_array.shift();

	while(true) {
		if(fs.existsSync(tmpPath)) {
			if (!file_path_array.length) break;
			tmpPath = path.join(tmpPath, file_path_array.shift());
		} else {
			fs.mkdirSync(tmpPath);
			console.log("create folder: " + tmpPath);
		}
	}
}
