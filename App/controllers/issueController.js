const mongoose = require('mongoose');
const shortId = require('shortid');
const time = require('./../libs/timeLib');
const response = require('./../libs/responseLib');
const logger = require('./../libs/loggerLib');
const check = require('./../libs/checkLib');
const events = require('events');
const eventEmitter = new events.EventEmitter();

const Issue = mongoose.model('Issue')
const Comment = mongoose.model('Comment');
const Notification = mongoose.model('IssueNotification');
const WatcherModel = mongoose.model('watch');

let getAllIssue = async (req, res) => {
    const result = await Issue.find().select(' -password -__v -_id').lean().exec() 
             
         try{
             if (check.isEmpty(result)) {
                 logger.captureInfo('No Issue Found', 'Issue Controller: getAllIssue')
                 let apiResponse = response.generate(true, 'No Issue Found', 404, null)
                 res.send(apiResponse)
             } else {
                 let apiResponse = response.generate(false, 'All Issue Details Found', 200, result)
                 res.send(apiResponse)
             }
         } catch(err) {
                 logger.captureError(err.message, 'Isuue Controller: getAllIssue', 10)
                 let apiResponse = response.generate(true, 'Failed To Find Issue Details', 500, null)
                 res.send(apiResponse)
         }
         
 }// end get all issues

 let getSingleIssue = async (req, res) => {
    const result = await Issue.findOne({ 'issueId': req.params.issueId }).select('-password -__v -_id').lean().exec();
         try{
             if (check.isEmpty(result)) {
                 logger.captureInfo('No Issue Found', 'Issue Controller:getSingleIssue')
                 let apiResponse = response.generate(true, 'No Issue Found', 404, null)
                 res.send(apiResponse)
             } else {
                 let apiResponse = response.generate(false, 'Issue Details Found', 200, result)
                 res.send(apiResponse)
             }
         } catch(err){
             console.log(err)
                 logger.captureError(err.message, 'Issue Controller: getSingleIssue', 10)
                 let apiResponse = response.generate(true, 'Failed To Find Issue Details', 500, null)
                 res.send(apiResponse)
         }
 }// end get single Issue

 let deleteIssue = async (req, res) => {

    const result = await Issue.findOneAndDelete({ 'issueId': req.params.issueId }).exec()
     
     try{
         if (check.isEmpty(result)) {
             logger.captureInfo('No Issue Found', 'Issue Controller: deleteIssue')
             let apiResponse = response.generate(true, 'No Issue Found', 404, null)
             res.send(apiResponse)
         } else {
             let apiResponse = response.generate(false, 'Deleted the Issue successfully', 200, result)
             res.send(apiResponse)
         }
     } catch(err){
         console.log(err)
             logger.captureError(err.message, 'issue Controller: deleteIssue', 10)
             let apiResponse = response.generate(true, 'Failed To delete issue', 500, null)
             res.send(apiResponse)
     }


    }// end delete issue

    let editIssue = async (req, res) => {
        const {status, title, issueId, description, reporter, reporterId, assignedTo, assignedToId, images} = req.body
        let options = {
            issueId,
            status,
            title,
            description,
            reporter,
            reporterId,
            assignedTo,
            assignedToId,
            images:images.split(',')
        }
        const result = await Issue.updateOne({ 'issueId': req.params.issueId }, options).exec()
         try{
            if (check.isEmpty(result)) {
                logger.captureInfo('No Issue Found', 'Issue Controller: editIssue')
                let apiResponse = response.generate(true, 'No Issue Found', 404, null)
                res.send(apiResponse)
            } else {
                        let options = {
                            $push: { 
                                description: 'Someone edited the issue following by you'
                            } 
                        }
                        options.notificationCount = 1
                        await Notification.updateMany({'issueId': req.params.issueId}, options)
                    

                logger.captureInfo(false, "issueController:editIssue", 0);
                let apiResponse = response.generate(false, "Issue Details Edited", 200, result);
                res.send(apiResponse);
            }
        } catch(err){
            console.log(err)
                logger.captureError(err.message, 'Issue Controller:editIssue', 10)
                let apiResponse = response.generate(true, 'Failed To edit Issue details', 500, null)
                res.send(apiResponse)
        }
    
    
    }// end edit user

    let createIssue = async(req, res)=>{
        const {status, title, description, reporter, reporterId, assignedTo, assignedToId, images} = req.body
        let newIssue = await new Issue({
            issueId: shortId.generate(),
            status,
            title,
            description,
            reporter,
            reporterId,
            assignedTo,
            assignedToId,
            createdOn: time.now(),
            images:images.split(',')
        })

      let issue =  await  newIssue.save()
        try{
            let data = await new Notification ({
                issueId: issue.issueId,
                description: "Your Issue has been posted successfully",
                userId: req.body.reporterId,
                createdOn: time.now(),
            })        
            data.notificationCount = 1    
            await data.save()
            
            let data2 = await new Notification ({
                issueId: issue.issueId,
                description: "Your have Assigned a new Issue",
                userId: req.body.assignedToId,
                createdOn: time.now(),
            })        
            data2.notificationCount = 1    
            await data2.save()

            let apiResponse = response.generate(false, "new Issue created", 200, issue);
            res.send(apiResponse)

        }  catch(err){
            logger.captureError(err.message, 'Issue Controller:createIssue', 10)
            let apiResponse = response.generate(true, "Failed to create new Issue", 500, null);
            res.send(apiResponse)
        }
    }

    let searchIssue = async (req, res) => {
        if (check.isEmpty(req.query.arg)) {
            logger.captureError(true, "issueController:SearchIssue", 10);
            let apiResponse = response.generate(true, "No argument entered for search", 500, null);
            res.send(apiResponse);
        } else {
          let result = await Issue.find({ $text: { $search: req.query.arg } }).limit(10).skip(parseInt(req.query.skip)).exec()
                   try{ 
                    if (check.isEmpty(result)) {
                        logger.captureError(true, "issueController:SearchIssue", 5);
                        let apiResponse = response.generate(true, "no data present by this search string", 404, null);
                        res.send(apiResponse);
                    } else {
                        logger.captureInfo(false, "issueController:SearchIssue", 0);
                        let apiResponse = response.generate(false, "data present by this search string", 200, result);
                        res.send(apiResponse);
                    }
                } catch(err){
                        logger.captureError(true, "issueController:SearchIssue", 10);
                        let apiResponse = response.generate(true, "error while retrieving data", 500, null);
                        res.send(apiResponse); 
                }
                
        }
    }

    let createWatchList = async (req, res)=>{
        let details = await WatcherModel.findOne({'issueId': req.body.issueId})
        if(details){
            let apiResponse = response.generate(true, "Issue Already present in Watch List", 500, null);
            res.send(apiResponse)
        }else{
        const {watcherId, issueId} = req.body
            let newWatcher = new WatcherModel({
                watcherId,
                issueId
            })

           let issue = await newWatcher.save()
            try{
                let data = await new Notification ({
                    issueId: req.body.issueId,
                    description: "Issue has been added in Watch List",
                    userId: req.body.watcherId,
                    createdOn: time.now(),
                })        
                data.notificationCount = 1    
                await data.save()
                let apiResponse = response.generate(false, "Issue Added to Your Watch List", 200, issue);
                res.send(apiResponse)
    
            }  catch(err){
                logger.captureError(err.message, 'Issue Controller:createWatcherlist', 10)
                let apiResponse = response.generate(true, "Failed to Add Issue", 500, null);
                res.send(apiResponse)
            }
        }  
    }

    let getWatcher = async (req, res) => {
        const result = await WatcherModel.find().select('-__v').lean().exec()
            try{
                if (check.isEmpty(result)) {
                    logger.captureInfo('No Watcher Found', 'Issue Controller: getWatcher')
                    let apiResponse = response.generate(true, 'No Issue in your Watch list', 404, null)
                    res.send(apiResponse)
                } else {
                    let apiResponse = response.generate(false, 'All Issue Details Found', 200, result)
                    res.send(apiResponse)
                }
            }catch(err){
                logger.captureError(err.message, 'Issue Controller:getWatcher', 10)
                let apiResponse = response.generate(true, "Failed to Add Issue", 500, null);
                res.send(apiResponse)
            }
    }
let deleteWatcher = async (req, res)=>{
    const result = await WatcherModel.findOnndDelete({'_id': req.body.id})
            if(!result){
                res.send('not found')
            } else{
                res.send('deleted')
            }
}

    let addComment = async (req, res) => {

        let newComment = await new Comment({
            commentId: shortId.generate(),
            issueId: req.body.issueId,
            description: req.body.description,
            reporter: req.body.reporter,
            reporterId: req.body.reporterId,
            createdOn: time.now()
        })
    
      let result = await newComment.save()
         try{   
            if (check.isEmpty(result)) {
                logger.captureError(true, "issueController:addComment", 5);
                let apiResponse = response.generate(true, "comment not stored", 404, null)
                res.send(apiResponse);
                } else {
                    let options = {
                        $push: { 
                            description: 'Someone Commented on the issue following by you'
                        } 
                    }
                    options.notificationCount = 1
                    await Notification.updateMany({'issueId': req.body.issueId}, options)
                
                logger.captureInfo(false, "issueController:addComment", 0);
                let apiResponse = response.generate(false, "Comment Created", 200, result)
                res.send(apiResponse);
            }
        } catch(err){
                logger.captureError(true, "issueController:addComment", 10);
                let apiResponse = response.generate(true, "DB error in creating Comment", 500, null)
                res.send(apiResponse); 
        }  
    
    }

    let readComment = async (req, res) => {

        if (check.isEmpty(req.params.issueId)) {
            let apiResponse = response.generate(true, "issueId missing", 500, null);
            res.send(apiResponse);
        } else {
             let result = await Comment.find({ 'issueId': req.params.issueId })
                try{
                if (check.isEmpty(result)) {
                    let apiResponse = response.generate(true, "no Comment present By this Id", 404, null);
                    res.send(apiResponse);
                } else {
                    let apiResponse = response.generate(false, "Comments", 200, result);
                    res.send(apiResponse);
                }
            } catch(err){
                let apiResponse = response.generate(true, "error while retrieving comment", 500, null);
                    res.send(apiResponse);
            }    
        }
    }

    let getAllNotification = async(req, res) =>{
        const result = await Notification.find({'userId': req.params.userId})
        try{
            if (check.isEmpty(result)) {
                logger.captureInfo('No Notification Found', 'Issue Controller: getAllNotification')
                let apiResponse = response.generate(true, 'No Issue Found', 404, null)
                res.send(apiResponse)
            } else {
                let apiResponse = response.generate(false, 'All Notification Details Found', 200, result)
                res.send(apiResponse)
            }
        } catch(err) {
                logger.captureError(err.message, 'Isuue Controller: getAllNotification', 10)
                let apiResponse = response.generate(true, 'Failed To Find Notification Details', 500, null)
                res.send(apiResponse)
        }
    }

    let deleteNote = async(req, res) =>{
        const result = await Notification.findOneAndDelete({'userId': req.body.userId})
            if(result){
                res.send('deleted')
            }else(
                res.send('err')
            )
    }
   
    let countUpdate = async(req, res)=>{
        let options = {
            notificationCount : 0
        }
        const result = await Notification.updateMany({'userId': req.body.userId}, options)
            if(result){
                let apiResponse = response.generate(false, 'All Notification count updated', 200, result)
                res.send(apiResponse)
            }else{
                logger.captureError('some error occured', 'Isuue Controller: getAllNotification', 10)
                let apiResponse = response.generate(true, 'Failed To Find Notification Details', 500, null)
                res.send(apiResponse)
            }
    }

    module.exports = {
        createIssue : createIssue,
        editIssue: editIssue,
        getAllIssue: getAllIssue,
        getSingleIssue: getSingleIssue,
        deleteIssue:deleteIssue,
        searchIssue: searchIssue,
        addComment: addComment,
        readComment: readComment,
        createWatchList: createWatchList,
        getWatcher: getWatcher,
        deleteWatcher: deleteWatcher,
        getAllNotification: getAllNotification,
        deleteNote: deleteNote,
        countUpdate: countUpdate
    }