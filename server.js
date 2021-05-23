require('dotenv').config();
const express = require('express');
const layouts = require('express-ejs-layouts');
const axios = require('axios'); 
const app = express();
const session = require('express-session');
const flash = require('connect-flash');
const passport = require('./config/ppConfig');
const isLoggedIn = require('./middleware/isLoggedIn');
const db = require('./models');

const SECRET_SESSION = process.env.SECRET_SESSION;
console.log(SECRET_SESSION);
app.set('view engine', 'ejs');

const methodOverride = require('method-override');
app.use(methodOverride('_method'));

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

app.use('/auth', require('./controllers/auth'));

app.get('/', isLoggedIn, (req, res) => {
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

app.get('/anime/:id',isLoggedIn, (req, res) => {
  axios.get(`http://www.omdbapi.com/?apikey=${process.env.API_KEY}&i=${req.params.id}`)
    .then(resp => {
      console.log(resp.data);
      res.render('animedetails', { details: resp.data });
    })
    .catch(error => {
      console.error(error);
    });
});

app.post('/favorites', isLoggedIn, (req, res) => {
  console.log('HELLO', req.body);
  db.favorites.create({
    title: req.body.title,
  })
  .then(results => {
    res.redirect('/favorites');
  })
  .catch(error => {
    console.error(error);
  });
});

  app.get('/favorites', isLoggedIn,(req, res) => {
    db.favorites.findAll().then((results) => {
      // res.redirect
      // console.log(results)
      res.render('favorites', { favorites: results })
    })
  });

  app.put("/favorites", isLoggedIn, (req,res)=>{
    db.favorites.update({
      title: req.body.title
    }, {where: {
      id: req.body.id
    }})
    .then(deletedAnime=>{
      console.log(req.body.title)
      res.redirect('/favorites')
    }).catch(err=>console.log(err))
    console.log(req.body)
  })


  // app.delete('/favorites/:id', (req, res) => {
  //   // db.favorites.destroy
  //     console.log(req.params.id)
  // })

  app.delete('/favorites/:id', isLoggedIn, function(req, res){
    console.log(req.params.id)
    db.favorites.destroy({where: {
      id: req.params.id
    }})
    .then(deletedAnime=>{
      console.log(deletedAnime)
      res.redirect('/favorites')
    })
  });
  
const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
  console.log(`🎧 You're listening to the smooth sounds of port ${PORT} 🎧`);
});

module.exports = server;
