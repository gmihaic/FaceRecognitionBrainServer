db.users.createIndex( { "email": 1 }, { unique: true } );

db.image_detections.createIndex({"user_id": 1, "date": -1});
db.image_detections.createIndex({"date": -1});