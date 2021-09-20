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

const Exercise = new mongoose.model('Exercise',{
  user_id: String,
  description: String,
  duration: Number,
  date: Date
})
const User = mongoose.model('User', {
  username: String
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

app.get('/api/users', async (req, res) => {
  try {
    let users = await User.find()
    res.send(users)
  } catch (e) {
    res.send(e.message)
  }
})

app.get('/api/users/:_id/logs', async (req, res) => {
  try {
    let user = await User.findById(req.params._id)
    if (!user) {
      return res.status(404).send('Unable to find user.')
    }

    let limit = null
    if (req.query.limit) {
      limit = Number(req.query.limit)
    }

    let conditions = [{ user_id: user._id }]
    if (req.query.from) {
      conditions.push({ date: { $gte: req.query.from } })
    }
    if (req.query.to) {
      conditions.push({ date: { $lte: req.query.to } })
    }
    let filter = conditions.length ? { $and: conditions } : { }

    let exercises = await Exercise.find(filter).limit(limit)

    let log = exercises.map(exercise => {
      return {
        description: exercise.description,
        duration: exercise.duration,
        date: exercise.date.toDateString()
      }
    })

    res.json({
      username: user.username,
      count: log.length,
      _id: user._id,
      log: log
    })
  } catch (e) {
    res.send(e.message)
  }
})

app.post('/api/users', async (req, res) => {
  try {
    let user = new User({ username: req.body.username })
    await user.save()
    res.json({
      username: user.username,
      _id: user._id
    })
  } catch (e) {
    res.send(e.message)
  }
})

app.post('/api/users/:_id/exercises', async (req, res) => {
  try {
    let user = await User.findById(req.params._id)
    if (!user) {
      return res.status(404).send('Unable to find user.')
    }
    let date
    if (req.body.date) {
      date = new Date(req.body.date)
    } else {
      date = new Date()
    }
    let exercise = new Exercise({
      user_id: user._id,
      date: date,
      duration: req.body.duration,
      description: req.body.description
    })
    await exercise.save()
    let utcDateString = exercise.date.toLocaleString('en-US', { timeZone: "UTC", day: "2-digit", month: "short", year: "numeric", weekday: "short" })
    let formattedDate = utcDateString.replace(/,/g, "")
    res.json({
      username: user.username,
      description: exercise.description,
      duration: exercise.duration,
      date: formattedDate,
      _id: user._id,
    })
  } catch (e) {
    res.send(e.message)
  }
})

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
