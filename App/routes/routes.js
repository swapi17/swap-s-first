const express = require('express');
const userController = require('../controllers/userController');
const issueController = require('../controllers/issueController');
const appConfig = require('../../config/appConfig');
const auth = require('../middlewares/auth')
const passport = require('passport')
const multer = require('./../services/multer')
const mongoose = require('mongoose')
const Grid = require('gridfs-stream')
let conn = mongoose.createConnection(appConfig.db.uri)
let gfs
conn.once('open', ()=>{
    
  gfs =Grid(conn.db, mongoose.mongo)
  gfs.collection('uploads')
})

module.exports.setRouter = (app)=>{
    let baseUrl =`/api/users`;



    app.post(`${baseUrl}/signup`, userController.signUpFunction);

    app.post(`${baseUrl}/login`, userController.loginFunction)

    app.post(`${baseUrl}/logout`,auth.isAuthorized, userController.logout)

    app.get(`${baseUrl}/view/all`,userController.getAllUser);

    app.get(`${baseUrl}/view/socialAll`,  userController.getSocialUser);

    app.get(`${baseUrl}/:userId/details`, auth.isAuthorized, userController.getSingleUser);

    app.put(`${baseUrl}/:userId/edit`, auth.isAuthorized, userController.editUser);

    app.post(`${baseUrl}/:userId/delete`,auth.isAuthorized, userController.deleteUser);

    app.get(`/auth/google`, passport.authenticate('google',{
        scope: ['profile', 'email']
    }))

    app.get(`/auth/google/callback` ,passport.authenticate('google'),(req, res)=>{
        let responseHTML = '<html><head><title>Main</title></head><body></body><script>res = %value%; window.opener.postMessage(res, "*");window.close();</script></html>'
         responseHTML = responseHTML.replace('%value%', JSON.stringify({
        user: req.user
    }));
    res.status(200).send(responseHTML);
    })

    app.get(`/api/current_user`, (req, res)=>{
       res.send(req.user)
    })
    app.get('/api/logout', (req, res)=>{
        res.send(req.logout())
        
    })

    app.get('/api/issue/all', issueController.getAllIssue);

    app.get('/api/view/:issueId', issueController.getSingleIssue)

    app.post('/api/issue/create', issueController.createIssue)

    app.post('/api/issue/:issueId/edit', issueController.editIssue)

    app.post('/api/issue/:issueId/delete', issueController.deleteIssue)

    app.post('/api/upload', multer.upload.single('file'), multer.uploadFile)

    app.get('/api/file', multer.getAllFile)

    app.get('/api/image/:filename', multer.getSingleFile);

    app.get('/api/download/:filename', multer.downloadFile)

    app.delete('/api/deleteFiles/:id', multer.deleteFile);

    app.get('/api/issue/search', issueController.searchIssue);

    app.post('/api/watch', issueController.createWatchList)

    app.get('/api/getwatcher', issueController.getWatcher)

    app.post('/deletewatch', issueController.deleteWatcher)

    app.post('/api/addcomment', issueController.addComment)

    app.get('/api/readcomment/:issueId', issueController.readComment)

    app.get('/api/notification/:userId', issueController.getAllNotification)

    app.post('/api/delete/notification', issueController.deleteNote)

    app.post('/api/notifycount', issueController.countUpdate)
}