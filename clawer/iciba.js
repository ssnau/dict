var http = require("http");
var util = require("./util");
var fs = require("fs");
var zlib = require("zlib");
var path = require('path');
var Time = require('./time').Time;
var i = 0;
var timeoutHandler = null;
var success = 0;
var continueFail = 0;
var continueSuccess = 0;
var lastStatus = true;
var cookies = new Array(3); //最大存储3个cookie
var globalTime = new Time();

var fail_word_file = path.join(path.dirname(require.main.filename), "fail_word.txt");
var fail_word_list = [];
if (fs.existsSync(fail_word_file)) {
	var fail_word_str = fs.readFileSync(fail_word_file, 'utf8');
	fail_word_list = fail_word_str.split("\n");
}

exports.get = function(word_list, beginCount){
	var list = word_list.concat();
	globalTime.start();
	i = beginCount;
	getWord(word_list);
}
function getWord(word_list) {
	console.log(word_list.length);
	console.log("success: " + success);
	console.log("continueSuccess: " + continueSuccess);
	console.log(new Date());
	globalTime.upToNow(true);//print up to now
	if (word_list.length === 0) {
		console.log('结束');
		console.log(fail_word_list.join(";"));
	}
	var word = word_list.shift();
	//如果已经证实此word失效，则直接跳至下一词
	if (/^\s*$/.test(word) || fail_word_list.indexOf(word)!= -1) {
		console.log("this word is an invalid one!")
		nextWord(1);
		return;
	}
	console.log('processing ' + (i) + " " + word);
	var filename = require("path").join("dict", "collins", word + '.txt');
	//如果文件已经存在，则直接下一词
	if (util.fileExists(filename)) {
		console.log(filename + ' already exists')
		nextWord(1);//立即执行，interval设为1,设为0的话在这里会有bug..
		return;
	}
	var config = req_config(word);
	
	var req = http.request(config, function(res) {
		console.log('STATUS: ' + res.statusCode);
		console.log('HEADERS: ' + JSON.stringify(res.headers));

		if (res.statusCode == 200) {
			cookies[randomInt(0,3)] = res.headers['set-cookie'] && res.headers['set-cookie'].join(';');
		}
		//如果取词失败
		if (res.statusCode != 200) {
			//累计连续失败的次数,用以增加间隔
			if(!lastStatus) continueFail++; else continueFail = 0;
			//if (res.statusCode == 502) word_list.slice(10); 
			lastStatus = false;
			//nextWord(continueFail * 60 * 30 * 1000);
			nextWord(1);
			return;
		}

		var unzip = zlib.createUnzip();//创建解压Object,用于处理已被压缩过的Stream
		//通过读取服务器返回的content-encoding来判断是否是压缩数据
		switch (res.headers['content-encoding']) {
		    case 'gzip':
		    case 'deflate':
			    console.log('unziping');
			    res.pipe(unzip);//将response stream通过管道传给gzunzip进行代理
			    res = unzip;//将response变量指向unzip
			    break;
		}

		//取正文
		var result = '';
		res.on('data', function (chunk) {
			result += chunk.toString('utf-8');
		});

		//结束
		res.on('end', function(){
            /*
			var position = result.indexOf('<div class="collins" >');
			if (position != -1) { 
				result = result.substring(position); //get the <div class="collins" ... to end
				final = getFirstDivContent(result);
				
				util.saveToFile(filename, final);  	
				success++;
				continueSuccess = lastStatus ? (continueSuccess + 1) : 0;
				lastStatus = true;
			} else {
				failWord(word);
			}
            */
            util.saveToFile(filename, result);
            success++;
            continueSuccess = lastStatus ? (continueSuccess + 1) : 0;
            lastStatus = true;

			//每成功80次，歇10分钟
			/*
			if (success % 80 == 0) {
				nextWord(600*1000);
			} else {
				nextWord();
			}
			*/
			nextWord();

		})

		res.on('error', function(){
			nextWord();
		})
	}); 

	req.end();

    req.on('error', function(){
        nextWord();
    });

	function failWord(word) {
		fail_word_list.push(word);
		console.log("fail word: " + word);
		util.saveToFile('fail_word.txt', fail_word_list.join("\n"));  	
	}

	function nextWord(interval) {
		i++;
		if (timeoutHandler) clearTimeout(timeoutHandler);
		interval = interval || randomInt(1000, 2000);
		console.log('waiting for next ' + interval/1000 + " seconds");
		timeoutHandler = setTimeout(function(){
			getWord(word_list);
		}, interval);
	}
}

function req_config(word) {
	var useCookie = Math.random() > 0.2 ;
	var cookie = cookies[randomInt(0,3)];
	useCookie && console.log("use Cookie:" + ((cookie && cookie.substr(0,30)) || ''));
	!useCookie && console.log("not use Cookie");

	var res = {
		hostname: 'www.iciba.com',
		port: 80,
		path: '/' + encodeURIComponent(word),
		method: 'GET',
		headers:{
			"User-Agent": "Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.11 (KHTML, like Gecko) Chrome/23.0.1271.97 Safari/537.11",
			"Accept":"text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
			"Accept-Charset":"GBK,utf-8;q=0.7,*;q=0.3",
			"Accept-Encoding":"gzip,deflate,sdch",
			"Accept-Language":"zh-CN,zh;q=0.8,en-US;q=0.6,en;q=0.4",
			"Connection":"keep-alive",
			//"Cookie":"_ustat=%7B%22i%22%3A0%2C%22n%22%3A%22%22%2C%22e%22%3A%22%22%2C%22s%22%3A%7B%22e%22%3Afalse%2C%22m%22%3Afalse%2C%22u%22%3Afalse%7D%2C%22sid%22%3A%22491eb7c7d1f5317bdb458c418a6b54e7%22%7D; iciba_u_rand=9ef2b4c812ce6a333cc620dd69e0d1a8%4058.100.64.21; iciba_u_rand_t=1359815034; ICIBA_OUT_SEARCH_USER_ID=4629321732%4058.100.64.21; iciba_a_rand=0; ICIBA_HUAYI_COOKIE=1; iciba_history=a%3A25%3A%7Bi%3A0%3Bs%3A4%3A%22deal%22%3Bi%3A1%3Bs%3A6%3A%22%E4%B9%B1%E5%BA%8F%22%3Bi%3A2%3Bs%3A10%3A%22breadboard%22%3Bi%3A3%3Bs%3A5%3A%22hello%22%3Bi%3A4%3Bs%3A17%3A%22American+football%22%3Bi%3A5%3Bs%3A10%3A%22after-care%22%3Bi%3A6%3Bs%3A8%3A%22air-drop%22%3Bi%3A7%3Bs%3A10%3A%22a+la+carte%22%3Bi%3A8%3Bs%3A9%3A%22aloe+vera%22%3Bi%3A9%3Bs%3A13%3A%22aptitude+test%22%3Bi%3A10%3Bs%3A12%3A%22aptitudetest%22%3Bi%3A11%3Bs%3A11%3A%22apple+sauce%22%3Bi%3A12%3Bs%3A15%3A%22approved+school%22%3Bi%3A13%3Bs%3A10%3A%22April+Fool%22%3Bi%3A14%3Bs%3A16%3A%22April+Fool%27s+Day%22%3Bi%3A15%3Bs%3A11%3A%22arcade+game%22%3Bi%3A16%3Bs%3A9%3A%22arc+light%22%3Bi%3A17%3Bs%3A4%3A%22lamp%22%3Bi%3A18%3Bs%3A8%3A%22arc+lamp%22%3Bi%3A19%3Bs%3A9%3A%22astronomy%22%3Bi%3A20%3Bs%3A9%3A%22uranology%22%3Bi%3A21%3Bs%3A3%3A%22ast%22%3Bi%3A22%3Bs%3A7%3A%22airship%22%3Bi%3A23%3Bs%3A7%3A%22academy%22%3Bi%3A24%3Bs%3A4%3A%22a+la%22%3B%7D; www-results=0; _kds2_uName=1359815035738755803370; _kds2_times=66; iciba_suggest_power=1",
			"Host":"www.iciba.com",
			"User-Agent":"Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.11 (KHTML, like Gecko) Chrome/23.0.1271.97 Safari/537.11",
	  }
	};
	if (useCookie) res['headers']['Cookie'] = (cookie || '');
	return res;
}

/**
 * 用于获取txt中第一个以<div开始并以</div结束的块。
 * <div和</div必须是在DOM中匹配的
 * 对于<div><div><span></span><div></div></div></div><div></div><table></table>
 * 返回<div><div><span></span><div></div></div></div>，因为这正好形成了闭环
 */
function getFirstDivContent(txt) {
	var mapDiv = "<div";
	var mapCloseDiv = "</div>";

	var i = 0, len = txt.length, div_stack = 0;
	while(i < len) {
		if (txt[i] == '<') {
			mark = true;
			i++;
			continue;
		}

		if (mark == true && txt[i] == 'd') {
			//console.log("checkingDiv:", i);
			checkDiv();
		}

		if (mark == true && txt[i] == '/') {
			//console.log("checkingCloseDiv:", i);
			checkCloseDiv();
			//检查当前div_stack是否是0，并且检查check是否成功，
			//若成功，则i已向前推4位
			if (div_stack == 0 && txt[i] != '/') {
				break;
			}
		}

		i++;
		mark = false;
	}

	return txt.substring(0, i);

	// Helper functions
	function checkDiv() {
		if ([txt[i], txt[i+1], txt[i+2]].join('') == 'div') {
			i = i + 3;
			div_stack++;
		}
	}

	function checkCloseDiv() {
		if ([txt[i], txt[i+1], txt[i+2], txt[i+3], txt[i+4]].join('') == '/div>') {
			i = i + 5;
			div_stack--;
		}
	}
}

/**
 * 生成一个随机整数，最小值为min,最大值为max
 * 如randomInt(5,10)，则可能的返回值为[5,6,7,8,9,10]
 * @param  {[type]}  min   [description]
 * @param  {[type]}  max   [description]
 * @return {[type]}        [description]
 */
function randomInt(min, max) {
	var diff = max - min;
	var rd = Math.random()*(diff + 1);
	var res = Math.floor(rd + min);
	return res > max ? max : res;
}
