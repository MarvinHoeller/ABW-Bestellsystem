# Migrate MongoDB to newer version

db.users.updateOne({ \_id: ObjectId("xxx") }, { $set: { new: false }})

db.pdfdatas.updateMany({rank: '2'}, {$set : {rank: '2. IT'}});
db.users.updateMany({rank: '2'}, {$set : {rank: '2. IT'}});

db.users.updateMany({permissionID: ''}, {$set : {permissionID: ''}})


db.users.updateMany({rank: '2'}, {$set : {rank: '2. IT'}});

## dump db:
docker exec <mongodb container> sh -c 'mongodump --authenticationDatabase admin -u <user> -p <password> --db <database> --archive' > db.dump

## restore db:
mongorestore --archive=db.dump

docker exec -i <mongodb container> sh -c 'mongorestore --authenticationDatabase admin -u <user> -p <password> --db <database> --archive' < db.dump
