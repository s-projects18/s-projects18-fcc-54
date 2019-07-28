// ---------------- require ---------------------
const express = require('express')
const app = express()
const bodyParser = require('body-parser')

const cors = require('cors')

// mount database-helper lib
var database = require('./helper/database.js');


// ------------- configure app ------------------
// [1] middlleware -----------
app.use(cors())

app.use(bodyParser.urlencoded({extended: false}))
app.use(bodyParser.json())

app.use(express.static('public'))

// show error page if there is no database-connection
app.use((req, res, next)=>{
  if(database.checkConnection()) next();
  else res.status(500).type('txt').send('No database connection');
});

// Error Handling middleware
app.use((err, req, res, next) => {
  let errCode, errMessage

  if (err.errors) {
    // mongoose validation error
    errCode = 400 // bad request
    const keys = Object.keys(err.errors)
    // report the first validation error
    errMessage = err.errors[keys[0]].message
  } else {
    // generic or custom error
    errCode = err.status || 500
    errMessage = err.message || 'Internal Server Error'
  }
  res.status(errCode).type('txt')
    .send(errMessage)
})

// [2] url-commands -------------------------------
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

// [2.1] /api/exercise/new-user
// pattern 1: call a database-func and provide a next()-func
// next() will be called after database-action is done (async!)
// con: needs an extra-function
app.post("/api/exercise/new-user", (req, res) => {
  // TODO check: username exists?
    database.createUser(req.body.username, userCreated(res));
  }
);

// next()-func
const userCreated = res => doc => {
      res.json({"doc":doc});  
}

// [2.2] /api/exercise/users
// pattern 2: use a Promise within database-func
// -> looks much simpler than pattern 1
app.get("/api/exercise/users", (req, res)=>{
  database.getAllUser()
    .then(data=>{
      res.json({"data":data});  
    })
    .catch(err=>{
      res.json({"err":err});
    });  
});

// [2.3] /api/exercise/add
app.post("/api/exercise/add", 
  function(req, res, next) {
    res.json({"add":23});
  }
);

// Not found middleware
app.use(
  (req,res)=>{
    res.status(404).end('not found error');
  }
);


// --------------- start listening -----------------
database.connect();

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
