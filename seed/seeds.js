const mongoose = require('mongoose')
const Employee = require('../models/employee')

// seed data for development purposes
mongoose.connect('mongodb://localhost:27017/employeeInfo')
.then(()=> {
  console.log("Mongo Connection Open!")
})
.catch(err => {
  console.log("Mongo Error!")
  console.log(err)
})


const seedProducts = [
  {
    name: 'Oscar Martinez',
    employeeId: 823476, 
    department: 'Software',
    employmentStatus: 'Employed',
    email: 'Oscar@gmail.com',
    images: []
  },
  {
    name: 'Jeff Smith',
    employeeId: 874085, 
    department: 'Design',
    employmentStatus: 'Employed',
    email: 'jeff56@gmail.com',
    images: []
  },
  {
    name: 'Dina Morales',
    employeeId: 345798, 
    department: 'Sales',
    employmentStatus: 'Unemployed',
    email: 'dinamor45@gmail.com',
    images: []
  },
  {
    name: 'Jake Johnson',
    employeeId: 978466, 
    department: 'Sales',
    employmentStatus: 'Employed',
    email: 'Johnson@gmail.com',
    images: []
  },
  {
    name: 'Mike Daniel',
    employeeId: 987453,
    department: 'Sales',
    employmentStatus: 'Unemployed',
    email: 'Daniel@gmail.com',
    images: []
  },
]

Employee.deleteMany({}).then(msg => console.log(msg))
Employee.insertMany(seedProducts).
then(data => {
  console.log(data)
})
.catch(e=> {
  console.log(e)
})