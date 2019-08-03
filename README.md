# Exercise Tracker REST API

#### A microservice project, part of Free Code Camp's curriculum

### Desciption
You can add users to the tracker. Additionally you can add several exercises to each user.
You can request all users and all exercises from a special user, defined by userId.
All tracks will be stored in mongodb.

### Commands

1. create a new user:
- POST /api/exercise/new-user
- input.username

2) create a new exercise (for a certain user):
- POST /api/exercise/add
- input.userId
- input.description
- input.duration
- input.date (yyyy-mm-dd); optional

3) get users's exercise log:
- GET /api/exercise/log?{userId}[&from][&to][&limit]
- { } = required, [ ] = optional
- from, to = dates (yyyy-mm-dd); limit = number

4) get all users:
- GET /api/exercise/users
