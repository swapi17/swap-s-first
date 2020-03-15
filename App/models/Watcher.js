const mongoose = require('mongoose'),
  Schema = mongoose.Schema;

let Watcher = new Schema({  
  watcherId: {
    type: String
  },
  issueId: String
})

mongoose.model('watch', Watcher);