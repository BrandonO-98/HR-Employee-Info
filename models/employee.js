const mongoose = require('mongoose')
const { Schema } = mongoose

const employeeSchema = new Schema({
  name: {
    type: String,
    required: true
  },
  employeeId: {
    type: Number,
    required: true
  },
  department: {
    type: String,
    required: true
  },
  employmentStatus: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  }, 
  images: [{
    url: String,
    filename: String
  }],
  documents: [{
    url: String,
    filename: String,
    originalName: String, 
    size: Number
  }]
}) 

module.exports = mongoose.model('Employee', employeeSchema);;