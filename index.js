const express = require("express"),
  morgan = require("morgan"),
  path = require("path"),
  uuid = require('uuid'),
  mongoose = require('mongoose'),
  Models = require('./models.js');

const Movies = Models.Movie;
const Users = Models.User;

mongoose.connect('mongodb://localhost:27017/myFlixDB', 
{ useNewUrlParser: true, useUnifiedTopology: true });

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(morgan("common"));

app.use(express.static("public"));

// GET requests
app.get("/", (req, res) => {
  res.send("Welcome to myFlix app!");
});

app.get("/documentation", (req, res) => {
   res.sendFile("documentation.html");
   });

// GET the list of all movies
app.get("/movies", async (req, res) => {
  await Movies.find()
  .then ((movies) => {
    res.status(201).json(movies);
  })
  .catch((err) => {
    console.error(err);
    res.status(500).send('Error:' + err);
  });
});

// GET the data about a single movie, by title
app.get('/movies/:Title', async (req, res) => {
  await Movies.findOne({ Title: req.params.Title})
  .then((movie) => {
    res.json(movie);
  })
  .catch((err) => {
    console.error(err);
    res.status(500).send('Error:' + err);
  });
});

//GET data about a genre, by name
app.get('/genres/:Name', async (req, res) => {
  const genreName = req.params.Name;
  await Movies.findOne({ 'Genre.Name': genreName })
  .then((movie) => {
    res.json(movie.Genre);
  })
  .catch((err) => {
    console.error(err);
    res.status(500).send('Error:' + err);
  });
});

//Gets data about a director (bio, birth year, death year) by name
app.get('/directors/:Name', async (req, res) => {
  const directorName = req.params.Name
  await Movies.findOne({'Director.Name': directorName })
  .then ((movie) => {
    res.json(movie.Director);
  })
  .catch((err) => {
    console.error(err);
    res.status(500).send('Error:' + err);
  });
});

//POST - Allow new users to register
/* We’ll expect JSON in this format
{
  ID: Integer,
  Username: String,
  Password: String,
  Email: String,
  Birthday: Date
}*/
app.post('/users', async (req, res) => {
  await Users.findOne({ Username: req.body.Username })
    .then((user) => {
      if (user) {
        return res.status(400).send(req.body.Username + 'already exists');
      } else {
        Users
          .create({
            Username: req.body.Username,
            Password: req.body.Password,
            Email: req.body.Email,
            Birthday: req.body.Birthday
          })
          .then((user) =>{res.status(201).json(user) })
        .catch((error) => {
          console.error(error);
          res.status(500).send('Error: ' + error);
        })
      }
    })
    .catch((error) => {
      console.error(error);
      res.status(500).send('Error: ' + error);
    });
});

// GET a user by username
app.get('/users/:Username', async (req, res) => {
  await Users.findOne({ Username: req.params.Username })
    .then((user) => {
      res.json(user);
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send('Error: ' + err);
    });
});

// PUT - Update a user's info, by username

app.put('/users/:Username', async (req, res) => {
  await Users.findOneAndUpdate({ Username: req.params.Username }, { $set:
    {
      Username: req.body.Username,
      Password: req.body.Password,
      Email: req.body.Email,
      Birthday: req.body.Birthday
    }
  },
  { new: true }) // This line makes sure that the updated document is returned
  .then((updatedUser) => {
    res.json(updatedUser);
  })
  .catch((err) => {
    console.error(err);
    res.status(500).send('Error: ' + err);
  })

});

// POST - Add a movie to a user's list of favorites
app.post('/users/:Username/movies/:MovieID', async (req, res) => {
  await Users.findOneAndUpdate({ Username: req.params.Username }, {
     $push: { FavoriteMovies: req.params.MovieID }
   },
   { new: true }) // This line makes sure that the updated document is returned
  .then((User) => {
    res.json(User);
  })
  .catch((err) => {
    console.error(err);
    res.status(500).send('Error: ' + err);
  });
});


//DELETE - Allow users to remove a movie from their list of favorites
app.delete('/users/:Username/movies/:MovieId', async (req, res) => {
  await Users.findOneAndUpdate(
    { Username: req.params.Username },
    { $pull: { FavoriteMovies: req.params.MovieId } },
    { new: true }
  )
    .then((user) => {
      res.json(user);
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send('Error: ' + err);
    });
});

// DELETE a user by username
app.delete('/users/:Username', async (req, res) => {
  await Users.findOneAndRemove({ Username: req.params.Username })
    .then((user) => {
      if (!user) {
        res.status(400).send(req.params.Username + ' was not found');
      } else {
        res.status(200).send(req.params.Username + ' was deleted.');
      }
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send('Error: ' + err);
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
  // Log the error to the terminal
  console.error("Application-level error:", err.stack);

  // Respond with a 500 Internal Server Error to the client
  res.status(500).send("Something went wrong on the server!");
});

// listen for requests
app.listen(8080, () => {
  console.log("Your app is listening on port 8080.");
});

