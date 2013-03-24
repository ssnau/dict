var _ = require("underscore");

var app, express, route, path;

express = require('express');
path = require("path");

app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.logger());
app.use(express.methodOverride());
app.use(express.bodyParser());
app.use(express["static"](path.join(__dirname, 'public')));

app.configure('development', function() {
    app.use(express.errorHandler({
        dumpExceptions: true,
        showStack: true
    }));
});

app.configure('production', function() {
    app.use(express.errorHandler());
});

route = require('./routes');
route(app);

app.listen(3000);
console.log("listenning" + 3000);

/* some constant */
app.DICT_ROOT = path.join(__dirname, '..', "data", "dict");
app.VOICE_ROOT = path.join(__dirname, '..', "data", "voice");