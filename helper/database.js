var mongo = require('mongodb');
var mongoose = require('mongoose');
// https://mongoosejs.com/docs/deprecations.html#-findandmodify-
mongoose.set('useFindAndModify', false);
mongoose.set('useCreateIndex', true);
var Schema = mongoose.Schema;

// connect --------------------------------
exports.connect = () => {
  // connect to database
  mongoose.connect(process.env.MONGOLAB_URI, {
      useNewUrlParser: true
    }).catch(err => { // Promise
      console.log(err);
    }).then(()=>console.log('db connected'));
}

// check connection -----------------------
exports.checkConnection = () => {
  /*
  0: disconnected
  1: connected
  2: connecting
  3: disconnecting
  */
  if(mongoose.connection.readyState==0 || mongoose.connection.readyState==3) {
    console.log("no-connection: "+mongoose.connection.readyState);
    return false;
  }  
  return true;
}

// schema --------------------------------
const exercisesSchema = new Schema({
  description: {type: String},
  duration: {type: String}, // ???
  date: {type: Date, default: Date.now}
});

const usersSchema = new Schema({
	username:  {type: String, unique:true},
	insert_date: {type: Date, default: Date.now},
  exercises: [exercisesSchema]
});



// model --------------------------------
const Users = mongoose.model('users', usersSchema );
const Exercises = mongoose.model('exercises', exercisesSchema );



// access-funcs -------------------------
// create a new user if not existing
// uses next()-func-pattern
exports.createUser = (username, next) =>{
  let usersObject = new Users({
    username:username
  });
  
  Users.findOne({username:username}, (err, docs)=>{
    if(docs==null) { // entry doesn't exist
      const pr = usersObject.save();
      pr.then(function (doc) {
        next(doc); // new doc created
      });         
    } else {
      // doc yet exists -> return false
      next(false);  
    }      
  });
}

// get a list of all users
// uses Promise()-pattern
exports.getAllUser = () => {
  return new Promise((resolve, reject)=>{
    Users.find({},(err, docs)=>{
      if(err) reject(err);
      else resolve(docs);
    });    
  });
}