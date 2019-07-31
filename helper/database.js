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
// /api/exercise/add
// uses Promise()-pattern
exports.createExercise = (userId, exercise) => {
  return new Promise((resolve, reject)=>{
    let exerciseObject = new Exercises(exercise);

    Users.findOne({"_id":userId}, (err, user)=>{
      if(user==null) {
        reject("no user found for: "+userId);
      } else {
        user.exercises.push(exerciseObject); // modify user-object

        const pr = user.save(); // save user-object    
        pr.then(doc=>{
          resolve(doc);  
        }).catch(err=>{
          reject(err);  
        });       
      }
    });
  }); // new Promise
} // createExercise

// create a new user if not existing
// uses next()-func-pattern
exports.createUser = (username, next, nextErr) =>{
  let usersObject = new Users({
    username:username
  });
  
  Users.findOne({username:username}, (err, docs)=>{
    if(docs==null) { // entry doesn't exist
      const pr = usersObject.save();
      pr.then(doc => next(doc))
        .catch(err => nextErr(err));         
    } else {
      // doc yet exists
      nextErr("User-exists-error");  
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

// get a list of one user (exercises are included)
// this works but cleaning exercise is don per array-funcs
// TODO: solution probably with db.orders.aggregate?
exports.getUser = args => {
  let query = {_id:args.userId};
  
  // 0: don't show these columns
  let projection = {
    __v:0,
    insert_date:0
  };
  
  return new Promise((resolve, reject)=>{
    let queryObj = Users.findOne(query, projection);
    // doc is a Mongoose-object that CAN'T be modified
    // lean()+exec() will return a plain JS-object instead
    // https://stackoverflow.com/questions/14504385/why-cant-you-modify-the-data-returned-by-a-mongoose-query-ex-findbyid
    queryObj.lean().exec((err, doc)=>{
      if(doc==null) {
        reject("no user found");
      } else {
        // {"_id":"BkT0mzhGr","username":"moo","count":1,"log":[{"description":"ex1","duration":3,"date":"Mon Jul 29 2019"}]}
        doc.log=[];
        doc.exercises.forEach((v,i)=>{
          let cp = Object.assign({}, v);
          delete cp._id;
          doc.log.push(cp);
        });
        doc.count=doc.exercises.length;
        delete doc.exercises;
        doc.log = cleanupLog(doc.log, args);
        resolve(doc);
      }
    });
  });    
}

// array-solution (without database)
const cleanupLog = (log, args) => {
  let c = JSON.parse(JSON.stringify(log));
  c = log.filter((v,i)=>{
    let d1t = new Date(v.date);
    let d1 = new Date(d1t.getFullYear(), d1t.getMonth(), d1t.getDate()).getTime(); // set time  to 0
    let d2;
    
    if(args.from) {
      d2 = new Date(args.from).getTime();
      if(d1<d2) return false;
    }
    if(args.to) {
      d2 = new Date(args.to).getTime();
      if(d1>d2) return false;
    }    
    return true;
  });
  if(args.limit) c = c.slice(0, args.limit);
  return c;
}