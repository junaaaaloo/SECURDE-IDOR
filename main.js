var express     = require('express');
var session     = require('express-session');
var bodyParser  = require("body-parser");
var path        = require("path");
var ejs         = require('ejs');

var app     = express();
var port    = 3000;

var handlers = require('./actions/handlers.js');

app.set('view engine', 'ejs');
app.use('', express.static(path.join(__dirname, "/web")));

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(session({resave:false, saveUninitialized: false, secret:"secret_key"}));
app.use(function(request, response, next) {
    response.set('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
    next();
});                        

app.use ('*', function  (request, response, next) {
    if(handlers.execute[request.baseUrl] != null) {
        console.log("[" + (new Date()).toLocaleString() + "] " + request.baseUrl);
        handlers.execute[request.baseUrl](request, response);
    } else {
        next()
    }
});       


app.use("/api/users/:id/grades/:name", handlers.controller.changeGrade);
app.use("/api/users/:id/grades", handlers.execute["/api/users/:id/grades"]);
app.use("/api/users/:id/username", handlers.controller.changeUsername);

app.listen(port);
var date = new Date();
console.log('[' + date.toLocaleString() + '] ' + 'Server has started');
console.log('[' + date.toLocaleString() + '] ' + 'Server running at http://localhost:' + port);


