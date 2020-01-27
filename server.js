if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

const express = require('express');
const app = express();
const bcrypt = require('bcrypt');
const passport = require('passport');
const flash = require('express-flash');
const session = require('express-session');
const methodOverride = require('method-override');
const fs = require('fs');
const uuidv1 = require('uuid/v1');
const arraySort = require('array-sort');

const initializePassport = require('./passport-config');
initializePassport(
  passport, 
  email => users.find(user => user.email === email),
  id => users.find(user => user.id === id)
);

app.use(express.static('public'))
app.set('view-engine', 'ejs');
app.use(express.urlencoded({ extended: false }));
app.use(flash());
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: true,
  saveUninitialized: true
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(methodOverride('_method'));
app.use(require('connect-flash')());
app.use(function (req, res, next) {
  res.locals.messages = require('express-messages')(req, res);
  next();
});

// Users will be stored in users.json. Create it
// if it doesn't exist and load it into memory.
const usersFile = './data/users.json';
try {
  fs.accessSync(usersFile);
} catch {
  fs.writeFileSync(usersFile, '[]');
}
let users = JSON.parse(fs.readFileSync(usersFile, { encoding: 'utf8'}));

// Exercises will be stored in exercises.json. Create it
// if it doesn't exist and load it into memory.
const exercisesFile = './data/exercises.json'
try {
  fs.accessSync(exercisesFile);
} catch {
  fs.writeFileSync(exercisesFile, '[]');
}
let exercises = JSON.parse(fs.readFileSync(exercisesFile, { encoding: 'utf8' }));

// routes
app.get('/', checkAuthenticated, (req, res) => {
  const completedExercises = exercises.filter(exercise => {
    return exercise.userId == req.user.id;
  });
  arraySort(completedExercises, 'date', {reverse: true});

  //Pagination
  const pageSize = 10;
  let exercisesArray = [];
  let exercisesList = [];
  let currentPage;
  let isPrevious = false;
  let isNext = false;
  if (req.query.currentPage) {
    currentPage = req.query.currentPage;
    
  } else {
    currentPage = 1;
  }
  while (completedExercises.length > 0) {
    exercisesArray.push(completedExercises.splice(0, pageSize));
  }
  exercisesList = exercisesArray[+ currentPage -1];
  //is there a previous page?
  if (exercisesArray[currentPage -2]) {
    isPrevious = true;
  } 
  //is there a next page?
  if (exercisesArray[currentPage]) {
    isNext = true;
  } 

  res.render('index.ejs', { 
    name: req.user.name, 
    id: req.user.id, 
    exercisesList,
    currentPage,
    isPrevious,
    isNext });
});

app.get('/login', checkNotAuthenticated, (req, res) => {
  res.render('login.ejs');
});

app.post('/login', checkNotAuthenticated, passport.authenticate('local', {
  successRedirect: '/',
  failureRedirect: '/login',
  failureFlash: true
}));

app.get('/register', checkNotAuthenticated, (req, res) => {
  res.render('register.ejs');
});

app.post('/register', checkNotAuthenticated, checkEmailUsed, checkPasswordGood, async (req, res) => {
  try {
    const hashedPassword = await bcrypt.hash(req.body.password, 10);
    users.push({ 
      id: Date.now().toString(),
      name: req.body.name,
      email: req.body.email,
      password: hashedPassword
    });

    // add the new user to the users.json file
    fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));

    res.redirect('/login');
  } catch {
    res.redirect('/register');
  }
});

app.post('/addexercise', checkAuthenticated, (req, res) => {
  exercises.push({
    userId: req.user.id,
    exerciseId: uuidv1(),
    exercise: req.body.exercise,
    reps: req.body.reps,
    sets: req.body.sets,
    weight: req.body.weight,
    date: req.body.date
  });
  fs.writeFileSync(exercisesFile, JSON.stringify(exercises, null, 2));
  res.redirect('/');
});

app.post('/deleteexercise', checkAuthenticated, (req, res) => {
  let index;
  for (let exercise of exercises) {
    if (exercise.exerciseId == req.body.exerciseId) {
      index = exercises.indexOf(exercise);
    }
  }
  exercises.splice(index, 1);
  fs.writeFileSync(exercisesFile, JSON.stringify(exercises, null, 2));
  res.redirect('/');
});

app.delete('/logout', (req, res) => {
  req.logOut();
  res.redirect('/login');
});

// middleware functions

// if the user is not logged in, send them to the login page
function checkAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect('/login');
}

// if the user is logged in, send them to the index page
function checkNotAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return res.redirect('/');
  }
  next();
}

// check if user already exists
function checkEmailUsed(req, res, next) {
  const emailList = [];
  for (let user of users) {
    emailList.push(user.email);
  }
  if (emailList.find(e => e === req.body.email)) {
    req.flash('error', `The email ${req.body.email} is already in use.`);
    return res.render('register.ejs');
  }
  next();
}

// check if the password is at least 8 characters, 
// contains a capital letter, lowercase letter and a number
function checkPasswordGood(req, res, next) {
  const reCapital = /[A-Z]/.test(req.body.password);
  const reLower = /[a-z]/.test(req.body.password);
  const reNumber = /[0-9]/.test(req.body.password);
  const reminder = `
    Make sure you use at least 8 characters, 
    at least one lower case letter,
    at least one upper case letter and at least one number.
  `;
  if (req.body.password.length < 8) {
    req.flash('error', `
      The password you entered was not long enough.
      ${reminder}
    `);
    return res.render('register.ejs');
  } 
  if (!reCapital) {
    req.flash('error', `
      The password must contain at least one capital letter.
      ${reminder}
    `);
    return res.render('register.ejs');
  }
  if (!reLower) {
    req.flash('error', `
      The password must contain at least one lower case letter.
      ${reminder}
    `);
    return res.render('register.ejs');
  }
  if (!reNumber) {
    req.flash('error', `
      The password must contain at least one number.
      ${reminder}
    `);
    return res.render('register.ejs');
  }
  next();
}

// listen on port 3000
app.listen(3000);
