const express = require('express')
const app = express()
const cors = require('cors')
const bodyParser = require('body-parser')
const mongoose = require('mongoose')
require('dotenv').config()

// Set up database
mongoose.connect(process.env['DB_URI']).then(() => {
  console.log("Connected to database")
}).catch((err) => {
  console.log("Database connection error: ", err)
})

const ExerciseSchema = new mongoose.Schema({
  description: String,
  duration: Number,
  date: Date
})
const User = mongoose.model('User', {
  username: String,
  exercises: [ExerciseSchema]
})

app.use(cors())
app.use(express.static('public'))

// Mount POST requests body parser
app.use(bodyParser.urlencoded({ extended: false }))
// Support parsing of application/json type post data
app.use(bodyParser.json())

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
})

app.post('/api/users', async (req, res) => {
  try {
    let user = new User({ username: req.body.name })
    await user.save()
    res.json({
      username: user.username,
      _id: user._id
    })
  } catch (e) {
    console.log(e)
  }
})

app.post('/api/users/:_id/exercises', async (req, res) => {
  try {
    let exercise = {
      date: new Date(req.body.date),
      duration: req.body.duration,
      description: req.body.description
    }
    let user = await User.findOneAndUpdate({_id: req.params._id}, { $push: { exercises: exercise } })
    res.json({
      _id: user._id,
      username: user.username,
      date: exercise.date.toDateString(),
      duration: exercise.duration,
      description: exercise.description
    })
  } catch (e) {
    console.log(e)
    res.json(e.message)
  }
})

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
