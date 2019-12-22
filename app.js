var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var serveIndex = require('serve-index');
const axios = require('axios');
const zlib = require('zlib');
const fs = require('fs');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({extended: false}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// app.use('/', indexRouter);
app.use('/users', usersRouter);

app.get('/try-sse', (req, res) => {
	let id = 30;
	res.writeHead(200, {
		'Content-Type': 'text/event-stream',
		'Cache-Control': 'no-cache',
		'Connection': 'keep-alive',
	});
	setInterval(function () {
		let now = new Date();
		res.write('id: ' + id++ + '\n');
		res.write('data: ' + now.toLocaleString() + '\n\n');
	}, 2000);
});

app.get('/bus-loc', (req, res) => {
    // 台北市交通開放資料： https://taipeicity.github.io/traffic_realtime/
    const url = 'https://tcgbusfs.blob.core.windows.net/blobbus/GetBusData.gz';
    res.writeHead(200, {
        'Content-Type': 'text/json; charset=UTF-8',
    });

    axios({
        method: 'get',
        url: url,
        responseType: 'stream'
    })
        .then(response=>{
            console.log(`response.data: ${response.data.constructor.name}`);
            // response.data.pipe(fs.createWriteStream('test1.gz'));
            response.data.pipe(zlib.createGunzip()).pipe(res);
        })
        .catch(error=>{
            console.log(error);
        });
});

app.use('/', serveIndex('public', {'icons': true}));

// catch 404 and forward to error handler
app.use(function (req, res, next) {
	next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
	// set locals, only providing error in development
	res.locals.message = err.message;
	res.locals.error = req.app.get('env') === 'development' ? err : {};

	// render the error page
	res.status(err.status || 500);
	res.render('error');
});

module.exports = app;
