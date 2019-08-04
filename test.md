# Test: compare with outputs by example page
https://fuschia-custard.glitch.me

### create new user *foo-test*
```
{"username":"foo-test","_id":"ry6vTA7mS"}
```

```
// own
{"username":"foo-test","_id":"5d46746966278425a43de80f"}
```


### add *exercises* to foo-test (userId: ry6vTA7mS)
* ex1, 1, 2019-08-01
* ex2, 2, 2019-08-02
* ex3, 3, 2019-08-03
* ex4, 4, 2019-08-04
* ex5, 5, 2019-08-05

```
{"username":"foo-test","description":"ex1","duration":1,
"_id":"ry6vTA7mS","date":"Thu Aug 01 2019"}
```

```
// own
// - duration as string (no exact requirement)
{"username":"foo-test","_id":"5d46746966278425a43de80f","description":"ex1"
,"duration":"1","date":"2019-08-01T00:00:00.000Z"}
```


### get all users
- https://fuschia-custard.glitch.me/api/exercise/users
```
[...
,{"_id":"ry6vTA7mS","username":"foo-test","__v":0}]
]
```

```
// own
[...
,{"_id":"5d46746966278425a43de80f","username":"foo-test"}]
```

### get users's exercise log
- https://fuschia-custard.glitch.me/api/exercise/log
```
unknown userId
```

```
// own
{"error":"no userId defined"}
```

- https://fuschia-custard.glitch.me/api/exercise/log?userId=ry6vTA7mS
```
// count=4 ?
{"_id":"ry6vTA7mS","username":"foo-test","count":4,
"log":[{"description":"ex4","duration":4,"date":"Sun Aug 04 2019"},
{"description":"ex3","duration":3,"date":"Sat Aug 03 2019"},
{"description":"ex2","duration":2,"date":"Fri Aug 02 2019"},
{"description":"ex1","duration":1,"date":"Thu Aug 01 2019"}]}
```

```
// own
{"_id":"5d46746966278425a43de80f","username":"foo-test"
,"log":[{"description":"ex1","duration":"1","date":"2019-08-01T00:00:00.000Z"}
,{"description":"ex2","duration":"2","date":"2019-08-02T00:00:00.000Z"}
,{"description":"ex3","duration":"3","date":"2019-08-03T00:00:00.000Z"}
,{"description":"ex4","duration":"4","date":"2019-08-04T00:00:00.000Z"}
,{"description":"ex5","duration":"5","date":"2019-08-05T00:00:00.000Z"}]
,"count":5}
```


- https://fuschia-custard.glitch.me/api/exercise/log?userId=ry6vTA7mS&limit=1
```
{"_id":"ry6vTA7mS","username":"foo-test","count":1,
"log":[{"description":"ex4","duration":4,"date":"Sun Aug 04 2019"}]}
```

```
// own
// other result (reason: no way found to order in pipeline)
{"_id":"5d46746966278425a43de80f","username":"foo-test",
"log":[{"description":"ex1","duration":"1","date":"2019-08-01T00:00:00.000Z"}],"count":1}
```


- https://fuschia-custard.glitch.me/api/exercise/log?userId=ry6vTA7mS&from=2019-08-03
```
// from-entry NOT included (not clearly defined in requirements)
// 2019-08-05 not stored in example-page?
{"_id":"ry6vTA7mS","username":"foo-test","from":"Sat Aug 03 2019","count":1,
"log":[{"description":"ex4","duration":4,"date":"Sun Aug 04 2019"}]}
```

```
// own
// field from/ to not required
{"_id":"5d46746966278425a43de80f","username":"foo-test",
"log":[{"description":"ex3","duration":"3","date":"2019-08-03T00:00:00.000Z"},
{"description":"ex4","duration":"4","date":"2019-08-04T00:00:00.000Z"},
{"description":"ex5","duration":"5","date":"2019-08-05T00:00:00.000Z"}],
"count":3}
```

- https://fuschia-custard.glitch.me/api/exercise/log?userId=ry6vTA7mS&from=2019-08-03
```
// to-entry not included (requirement?)
{"_id":"ry6vTA7mS","username":"foo-test","from":"Sat Aug 03 2019","count":1,
"log":[{"description":"ex4","duration":4,"date":"Sun Aug 04 2019"}]}
```

```
// own
{"_id":"5d46746966278425a43de80f","username":"foo-test",
"log":[{"description":"ex3","duration":"3","date":"2019-08-03T00:00:00.000Z"},
{"description":"ex4","duration":"4","date":"2019-08-04T00:00:00.000Z"},
{"description":"ex5","duration":"5","date":"2019-08-05T00:00:00.000Z"}],
"count":3}
```


- https://fuschia-custard.glitch.me/api/exercise/log?userId=ry6vTA7mS&from=2019-08-02&to=2019-08-04
```
// to/ from not included
{"_id":"ry6vTA7mS","username":"foo-test","from":"Fri Aug 02 2019","to":"Sun Aug 04 2019",
"count":1,
"log":[{"description":"ex3","duration":3,"date":"Sat Aug 03 2019"}]}
```

```
// own
{"_id":"5d46746966278425a43de80f","username":"foo-test",
"log":[{"description":"ex2","duration":"2","date":"2019-08-02T00:00:00.000Z"},
{"description":"ex3","duration":"3","date":"2019-08-03T00:00:00.000Z"},
{"description":"ex4","duration":"4","date":"2019-08-04T00:00:00.000Z"}],
"count":3}
```

