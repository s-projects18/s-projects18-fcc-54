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
    }).then(()=>{
      console.log('db connected')}
    );
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
    if(userId=='') reject('no userId');
    if(exercise.description=='') reject('no description');
    if(exercise.duration=='') reject('no duration');
    
    Users.findOne({"_id":userId}, (err, user)=>{
      if(user==null) {
        reject("no user found for: "+userId);
      } else {
        user.exercises.push(exerciseObject); // modify user-object

        const pr = user.save(); // save user-object    
        pr.then(doc=>{
          let obj = {
            username:doc.username,
            _id:doc._id,
            description:exerciseObject.description,
            duration:exerciseObject.duration,
            date:exerciseObject.date
          };
          resolve(obj);  
        }).catch(err=>{
          reject(err);  
        });       
      }
    });
  }); // new Promise
} // createExercise

// create a new user if not existing
// uses next()-func-pattern
exports.createUser = (username, next, nextErr) => {
  if(username=='') {
    nextErr("Username is empty");
    // if en empty user-entry exists: code continues and
    // another json is sent -> headers already-sent error
    return;  
  } 
  
  let usersObject = new Users({
    username:username
  });
  
  Users.findOne({username:username}, (err, docs)=>{
    if(docs==null) { // entry doesn't exist
      // save() returns undefined if used with callback or a Promise otherwise
      const pr = usersObject.save();
      pr.then(doc => {
        next({username:doc.username, _id:doc._id})
      }).catch(err => nextErr(err));         
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
    Users.find({})
    .select({username:1, _id:1})
    .sort('username') // -username (reverse order)
    .exec((err, docs)=>{
      if(err) reject(err);
      else resolve(docs);
    });    
  });
}

// get a list of one user and filtered exercises -------------------
// [variant 2] db.orders.aggregate
// - pure mongo solution (there also exists mongoose.aggregate())
exports.getUser = args => {
  // access core mongo-collection
  const mongoUser = mongoose.connection.db.collection('users');
  let error = false;

  // pre-build "anded" date-conditions ---
  let ands = [];
  if(args.to) {
    ands.push( {$lte: ["$$temp.date", new Date(args.to)]} );
  }
  if(args.from) {
    ands.push( {$gte: ["$$temp.date", new Date(args.from)]} );
  }

  // pre-build aggregation-pipeline dynamically ---
  let pipeline = [];
  
  // (1) get that entry matching userId 
  if(args.userId && mongo.ObjectId.isValid(args.userId)) {
    let query = {_id:mongo.ObjectId(args.userId)}; // without ObjectId(): no hits!
    pipeline.push(
      {$match: query} 
    );
  } else {
    error = "No (valid) userId";
  }
  
  // hint:
  // filter and limit removes the top-level-fields and return only sub-array and _id of top-level
  // so we must add wanted fields explicitly
  
  // (2) filter by date
  if(ands.length>0) {
    pipeline.push(
      {$project: {
        exercises:{ // exercises-array
          $filter: { // filter exercises
            input: "$exercises", // must match prop-field
            as: "temp", // free, default: this
            cond: {
              $and: ands
            }
          }
        },
        username:1
      }}        
    );
  }

  
  // (3) TODO MAYBE: HOW TO SORT exercises IN PIPELINE BEFORE LIMIT ?
  
  
  // (4) limit array size
  const limit = parseInt(args.limit);
  if(limit>0) {
    pipeline.push(
      {$project: {
        exercises:{ // another exercises-array is needed for slicing
           $slice: ["$exercises", limit]
        },
        username:1
      }}         
    );
  }  

  
  // (5) remove _id from exercises
  // you have  either include fields or exclude them — not both ( no 0 / 1 combinations) !
  pipeline.push(
    {$project: { insert_date:0, __v:0, exercises: {_id:0} }}
  );
  
  // execute aggregation
  return new Promise((resolve, reject) => {
    if(error) reject(error);
    try {     
      let cursor = mongoUser.aggregate(pipeline);
      cursor.toArray((err,doc)=>{
        if(doc==null) throw("doc is null");       
        if(err) throw(err);
        
        doc[0].log=doc[0].exercises; // exercises -> log
        delete doc[0].exercises;
        doc[0].count = doc[0].log.length; // add count
        resolve(doc[0]);    
      });   
    } catch(e) {
      reject(e);
    }
  });
} // getUser


// [variant 1] this works but cleaning exercise is done per array-funcs
exports.getUser_OLD = args => {
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