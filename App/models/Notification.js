const time = require('./../libs/timeLib')

const mongoose = require('mongoose'),
  Schema = mongoose.Schema;

let notificationSchema = new Schema({
  userId: {
    type: String,
    default: '',
  },
   description: {
    type: [String],
    default: 'no descrition Given'
  },
  issueId: {
    type: String,
    default: ''
  },
  notificationCount:{
    type:Number,
    default:0
  },
  createdOn:{
      type:Date,
      default:time.now()
  }

})

module.exports = mongoose.model('IssueNotification', notificationSchema);