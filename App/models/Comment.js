const mongoose = require('mongoose'),
  Schema = mongoose.Schema;

let CommentSchema = new Schema({
  commentId: {
    type: String,
    default: '',
    index: true,
    unique: true
  },
  issueId:{
      type:String,
      default:""
  },
  description: {
    type: String,
    default: 'no descrition Given'
  },
  reporter: {
    type: String,
    default: ''
  },
  reporterId: {
    type: String,
    default: ""
  },
  createdOn :{
    type:Date,
    default:""
  }

})

module.exports = mongoose.model('Comment', CommentSchema);