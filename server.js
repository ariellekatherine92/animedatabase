require('dotenv').config();
const express = require('express');
const layouts = require('express-ejs-layouts');
const axios = require('axios'); 
const app = express();
const session = require('express-session');
const flash = require('connect-flash');
const passport = require('./config/ppConfig');
const isLoggedIn = require('./middleware/isLoggedIn');
const SECRET_SESSION = process.env.SECRET_SESSION;

console.log(SECRET_SESSION);
app.set('view engine', 'ejs');

app.use(require('morgan')('dev'));
app.use(express.urlencoded({ extended: false }));
app.use(express.static(__dirname + '/public'));
app.use(layouts);

app.use(session({
  secret: SECRET_SESSION,    // What we actually will be giving the user on our site as a session cookie
  resave: false,             // Save the session even if it's modified, make this false
  saveUninitialized: true    // If we have a new session, we save it, therefore making that true
}));
app.use(flash());            // flash middleware

app.use(passport.initialize());      // Initialize passport
app.use(passport.session());         // Add a session

app.use((req, res, next) => {
  console.log(res.locals);
  res.locals.alerts = req.flash();
  res.locals.currentUser = req.user;
  next();
});

app.get('/', (req, res) => {
  res.render('index');
});

// app.get('/profile', (req, res) => {
//   res.render('profile');
// });

app.use('/auth', require('./controllers/auth'));

app.get('/profile', isLoggedIn, (req, res) => {
  const { id, name, email } = req.user.get(); 
  res.render('profile', { id, name, email });
});

app.get('/anime', (req, res) => {
  axios.get('https://ghibliapi.herokuapp.com/films')
    .then(function(response) {
      const promises = [];

      response.data.forEach(anime => {
        promises.push(new Promise((resolve, reject) => {
          axios.get(`http://www.omdbapi.com/?apikey=${process.env.API_KEY}&t=${encodeURI(anime.title)}`)
            .then(function(response) {
              resolve({
                ...anime,
                ...response.data,
              });
            })
            .catch(function(error) {
              reject(error);
            });
        }));
      }); 

      Promise.all(promises).then(animes => {
        res.render('animelist', { animes });
      });
    }).catch(function(error) {
      console.error(error);
    });

    
});

const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
  console.log(`🎧 You're listening to the smooth sounds of port ${PORT} 🎧`);
});

module.exports = server;
