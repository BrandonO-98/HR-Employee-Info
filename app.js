if (process.env.NODE_ENV !== "production") {
  require('dotenv').config()
}

const express = require('express');
const app = express();
const path = require('path');
const mongoose = require('mongoose')
const ejsMate = require('ejs-mate')
const Employee = require('./models/employee')
const methodOverride = require('method-override')
const AppError = require('./AppError')
const Joi = require('joi')
const { storage, cloudinary } = require('./cloudinary.js')
const multer = require('multer')
const upload = multer({ storage })

mongoose.connect('mongodb://localhost:27017/employeeInfo')
.then(()=> {
  console.log("Mongo Connection Open!")
})
.catch(err => {
  console.log("Mongo Error!")
  console.log(err)
})

app.engine('ejs', ejsMate)
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
// parse incomming POST request
app.use(express.urlencoded({ extended: true }))
app.use(methodOverride('_method'))

// async wrapper function
function wrapAsync(fn) {
  return function(req,res,next) {
    fn(req,res,next).catch(e => next(e))
  }
}

validateEmployee = (req, res, next) => {
  const employeeValidationSchema = Joi.object({
    employee: Joi.object({
      name: Joi.string().required(), 
      employeeId: Joi.number().required(), 
      department: Joi.string().required(),
      employmentStatus: Joi.string().required(),
      email: Joi.string().required(), 
    }).required(),
    deleteImages: Joi.array(),
    deleteDocs: Joi.array()
  })

  const { error } = employeeValidationSchema.validate(req.body);
  if (error) {
    const msg = error.details.map(ele => ele.message).join(',')
    console.log(msg)
    throw new AppError(msg, 400)
  }
  else next()
}

app.get('/employees', wrapAsync(async (req,res)=> {
  if (!req.query.employee) {
    const employees = await Employee.find({})
    res.render('employees/index', {employees, title: 'All'})
  }
  else {
    Object.keys(req.query.employee).forEach(key => {
      if (!req.query.employee[key]) {
        delete req.query.employee[key];
      }
    });
    // console.log(req.query.employee)
    const employees = await Employee.find(req.query.employee)
    res.render('employees/index', {employees, title: 'Found'})
  }
}))

app.get('/employees/new', (req,res)=> {
  res.render('employees/new')
})

app.get('/employees/query', (req,res)=> {
  res.render('employees/query')
})

app.post('/employees', upload.fields([{ name: 'image', maxCount: 2 }, 
{ name: 'document', maxCount: 3 }]), validateEmployee, 
wrapAsync(async (req,res,next)=> {
    const newEmployee = new Employee(req.body.employee)

    if (req.files.image) {
    newEmployee.images = req.files.image.map(file => 
      ({url: file.path, filename: file.filename}))
    }
    console.log()
    if (req.files.document) {
    newEmployee.documents = req.files.document.map(file => 
      ({url: file.path, filename: file.filename, originalName: file.originalname, size: file.size}))
    }

    await newEmployee.save()
  res.redirect('/employees')
}))

app.get('/employees/:id', wrapAsync(async (req,res, next)=> {
  const employee = await Employee.findById(req.params.id)
  if (!employee) {
    return next(new AppError('Employee not found', 404)) 
  }
  res.render('employees/show', {employee})
}))

app.get('/employees/:id/edit', wrapAsync(async (req,res)=> {
  const editEmployee = await Employee.findById(req.params.id)
  res.render('employees/edit', {editEmployee})
}))

app.put('/employees/:id', upload.fields([{ name: 'image', maxCount: 2 }, 
{ name: 'document', maxCount: 3 }]), validateEmployee,
wrapAsync(async (req,res,next)=> {
  const editedEmployee = await Employee.findByIdAndUpdate(req.params.id, 
    // run mongoose validators on update and return doc after update
    req.body.employee, {runValidators: true, returnDocument:'after'})
  if ( req.files.image) {
  const images = req.files.image.map(file => 
    ({url: file.path, filename: file.filename}))
  editedEmployee.images.push(...images)
  }
  if ( req.files.document) {
  const docs = req.files.document.map(file => 
    ({url: file.path, filename: file.filename, originalName: file.originalname, size: file.size}))
  editedEmployee.documents.push(...docs)
  }
  await editedEmployee.save()

  if (req.body.deleteImages) {
    for (let file of req.body.deleteImages) {
      await cloudinary.uploader.destroy(file)
    }
    await editedEmployee.updateOne({ $pull: { images: { filename: { $in: req.body.deleteImages } }}})
  }

  if (req.body.deleteDocs) {
    for (let file of req.body.deleteDocs) {
      await cloudinary.uploader.destroy(file)
    }
    await editedEmployee.updateOne({ $pull: { documents: { filename: { $in: req.body.deleteDocs } }}})
  }

  res.redirect(`/employees/${editedEmployee._id}`)
}))

app.delete('/employees/:id', wrapAsync(async (req,res)=> {
  const employee = await Employee.findByIdAndDelete(req.params.id)
  for (let file of employee.images) {
    await cloudinary.uploader.destroy(file.filename)
  }
  for (let file of employee.documents) {
    await cloudinary.uploader.destroy(file.filename)
  }

  res.redirect('/employees')
}))

app.use((err, req, res, next) => {
  const {status = 500} = err
  if (!err.message) err.message = 'Sorry, Somthing went wrong!'
  res.status(status).send(err.message)
})

app.listen(3000, () => {
  console.log('Listening on Port 3000')
})