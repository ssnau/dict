var Time = function(){
	this.startTime = null;
	this.endTime = null;
}

Time.prototype.start = function() {
	this.startTime = new Date();
}

Time.prototype.end = function() {
	this.endTime = new Date();
}

Time.prototype.upToNow = function(shouldPrint) {
	var diff = Time.util.easyTime(new Date() - this.startTime);
	shouldPrint && console.log(diff);
	return diff
}

Time.util = {};
Time.util.easyTime = function(time) {
	var time = Math.floor(time - 0);
	var second = Math.floor(time / 1000);
	var minute = Math.floor(second / 60);
	var hour = Math.floor(minute / 60);
	var day = Math.floor(hour / 24);


	if (day > 1) {
		return [day + "d", hour + "h", minute % 60 + "min", second % 60 + "s", time % 1000 + "ms"].join(':');
	} else if (hour >= 1) {
		return [hour + "h", minute % 60 + "min", second % 60 + "s", time % 1000 + "ms"].join(':');
	} else if (minute >= 1) {
		return [minute + "min", second % 60 + "s", time % 1000 + "ms"].join(':');
	} else if (second >= 1) {
		return [second + "s" , (time % 1000) + "ms"].join(":");
	} else {
		return time + "ms";
	}
}

exports.Time = Time;