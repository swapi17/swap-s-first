const express = require("express");
const appConfig = require("./config/appConfig")
const fs = require('fs');
const mongoose = require("mongoose")
const models = [require('./App/models/User'),
                require('./App/models/Auth'),
                require('./App/models/SocialUser'),
                require('./App/models/Issue'),
                require('./App/models/Comment'),
                require('./App/models/Notification'),
                require('./App/models/Watcher')]
const multer = require('multer')
const passportConfig = require('./App/services/passport')
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser')
const cookieSession = require('cookie-session')
const http = require('http');
const logger = require('./App/libs/loggerLib')
const passport = require('passport')
const cors = require('./App/middlewares/cors')
const method = require('method-override')
const app = express()


app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended: false}))
app.use(method('_method'))
app.use(cookieParser())
app.use(
  cookieSession({
      maxAge: 30 * 24 * 60 * 60 * 1000,
      keys: ["asdfghjklzxcvbnm"]
  })
)
app.use(
  passport.initialize()
)
app.use(
  passport.session()
)

app.use(cors.isCors)


let routesPath = './App/routes'

fs.readdirSync(routesPath).forEach(function (file) {
    if(-file.indexOf('.js')){
        console.log('including files')
        console.log(routesPath + '/' + file)
        let route = require(routesPath + '/' + file);
       route.setRouter(app)
    }
});

const server = http.createServer(app);
console.log(appConfig);
server.listen(appConfig.port);
server.on('error', onError);
server.on('listening', onListening);

function onError(error) {
    if (error.syscall !== 'listen') {
      logger.captureError(error.code + ' not equal listen', 'serverOnErrorHandler', 10)
      throw error;
    }
  
  
    // handle specific listen errors with friendly messages
    switch (error.code) {
      case 'EACCES':
        logger.captureError(error.code + ':elavated privileges required', 'serverOnErrorHandler', 10);
        process.exit(1);
        break;
      case 'EADDRINUSE':
        logger.captureError(error.code + ':port is already in use.', 'serverOnErrorHandler', 10);
        process.exit(1);
        break;
      default:
        logger.captureError(error.code + ':some unknown error occured', 'serverOnErrorHandler', 10);
        throw error;
    }
  }

function onListening() {
  
    var addr = server.address();
    var bind = typeof addr === 'string'
      ? 'pipe ' + addr
      : 'port ' + addr.port;
    ('Listening on ' + bind);
    logger.captureInfo('server listening on port' + addr.port, 'serverOnListeningHandler', 10);
    mongoose.connect(appConfig.db.uri, {useNewUrlParser: true});
  }
  
  process.on('unhandledRejection', (reason, p) => {
    console.log('Unhandled Rejection at: Promise', p, 'reason:', reason);
    // application specific logging, throwing an error, or other logic here
  });
   
   mongoose.connection.on('error', function(err){
       console.log('database connection error');
       console.log(err)
   });
   
   mongoose.connection.on('open', function(err){
       if(err){
           console.log('database error');
           console.log(err);
       } else{
           console.log('database connection open success')
       }
   })
