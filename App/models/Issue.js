const mongoose = require('mongoose')
 const Schema = mongoose.Schema;

let issueSchema = new Schema({
  issueId: {
    type: String,
    default: '',
    index: true,
    unique: true
  },
  status: {
    type: String,
    default: 'Backlog'
  },
  title: {
    type: String,
    default: 'none'
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
  assignedTo:{
    type:String,
    default:""
  },
  assignedToId:{
    type:String,
    default:""
  },
  images: [],
  createdOn :{
    type:Date,
    default:""
  },

})

issueSchema.index({'$**':'text'})

module.exports = mongoose.model('Issue', issueSchema);