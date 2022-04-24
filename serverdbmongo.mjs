import { MongoClient, ObjectId } from "mongodb";
export default class databaseMongoDBHandler {
    constructor() {
        this.mongo = null;   //connection  
        this.mongodb = null;     //database
        this.mongodbCollection = null;     //collection
        this.mongodbDetectionsCollection = null;     //collection

        this.connect();
    }

    async connect() {
        if (!process?.env?.mongoConnectionString) {
            throw new Error("mongoDB config invalid");
        } 

        this.mongo = new MongoClient(process.env.mongoConnectionString);

        try{           
            await this.mongo.connect((err) => {            
                if (err) {
                    process.exit(0);
                }                         
            });
           
            this.mongodb = this.mongo.db("smartbrain");
            this.mongodbCollection = this.mongodb.collection('users');
            this.mongodbDetectionsCollection = this.mongodb.collection('image_detections');
        }
        catch(err) {
            console.error("mongoDB connection error", err);
            await this.mongo.close();
            throw Error("Database error");         
        }
    }

    getAllUsers(id) {                               
        return new Promise((getUsersResolve) => {
            try {                
                const query = {};
                const selectFields = {
                    "_id": 1,
                    "name": 1,
                    "email": 1,
                    "country": 1,
                    "entries": 1,
                    "joined": 1
                };
                
                this.mongodbCollection.find(query).project(selectFields).toArray((err, result) => {
                    if (err) {
                        console.error(err);                        
                    }
                    
                    if (err || !result || result.length === 0) {
                        getUsersResolve([]);
                    } else {
                        const returnArr = result;
                        returnArr.map((elem) => {
                            elem.id = elem._id;
                            return elem;
                        });
                        getUsersResolve(returnArr);
                    }                    
                  });               
            } 
            catch(err) {
                console.error("dbError", err);
                getUsersResolve(null);
            }             
        });                    
    }

    getUserById(id, get_hash = false) {                        
        return new Promise((getUserByIdResolve) => {
            try {               
                const query = {
                    "_id": ObjectId(id)
                };

                const selectFields = {
                    "_id": 1,
                    "name": 1,
                    "email": 1,
                    "country": 1,
                    "entries": 1,
                    "joined": 1
                };

                if (get_hash) {
                    selectFields["hash"] = 1;
                }
                
                this.mongodbCollection.find(query).project(selectFields).toArray((err, result) => {
                    if (err) {
                        console.error(err);                        
                    }
                    
                    if (err || !result || result.length === 0) {
                        getUserByIdResolve([]);
                    } else {
                        const returnObj = result[0];
                        returnObj.id = result[0]._id;
                        getUserByIdResolve(returnObj);
                    }                    
                  });               
            } 
            catch(err) {
                console.error("dbError", err);
                getUserByIdResolve(null);
            }             
        });                
    }

    getUserLogin(email) {                        
        return new Promise((getUserLoginResolve) => {
            try {                
                const query = {
                    "email": email
                };

                const selectFields = {
                    "_id": 1,
                    "name": 1,
                    "email": 1,
                    "hash": 1,
                    "country": 1,
                    "entries": 1,
                    "joined": 1
                };
                
                this.mongodbCollection.find(query).project(selectFields).toArray((err, result) => {
                    if (err) {
                        console.error(err);                       
                    }
                    
                    if (err || !result || result.length === 0) {
                        getUserLoginResolve([]);
                    } else {
                        const returnObj = result[0];
                        returnObj.id = result[0]._id;
                        getUserLoginResolve(returnObj);
                    }                    
                  });               
            } 
            catch(err) {
                console.error("dbError", err);
                getUserLoginResolve(null);
            }             
        });                
    }

    _getUserData(id) {                        
        return new Promise((getUserDataResolve) => {
            try {               
                const query = {
                    "_id": ObjectId(id)
                };

                const selectFields = {
                    "_id": 1,
                    "name": 1,
                    "email": 1,
                    "country": 1,
                    "entries": 1,
                    "joined": 1
                };
                
                this.mongodbCollection.find(query).project(selectFields).toArray((err, result) => {
                    if (err) {
                        console.error(err);                        
                    }
                    
                    if (err || !result || result.length === 0) {
                        getUserDataResolve([]);
                    } else {
                        const returnObj = result[0];
                        returnObj.id = result[0]._id;
                        getUserDataResolve(returnObj);
                    }                    
                  });               
            } 
            catch(err) {
                console.error("dbError", err);
                getUserDataResolve(null);
            }             
        });                
    }    

    _getLatestImageDetection = (timestamp, user_id) => {
        return new Promise((getLatestImageDetectionResolve) => {
            try {                
                const query = {};
             
                if (timestamp) {
                    query.date = {"$gt": new Date(Number(timestamp))};
                }            
                
                if (user_id) {
                    query.user_id = {"$nin": [user_id]}
                }

                const selectFields = {
                    "_id": 1,
                    "image_url": 1,
                    "user_id": 1,
                    "date": 1,
                    "detect_data": 1,
                    "detect_type": 1,
                    "detections": 1
                };
                
                this.mongodbDetectionsCollection.find(query)
                                                .project(selectFields)
                                                .sort({date: -1})
                                                .limit(1)
                                                .toArray((err, result) => {
                    if (err) {
                        console.error(err);                       
                    }
                    
                    if (err || !result || result.length === 0) {
                        getLatestImageDetectionResolve(null);
                    } else {                                            
                        getLatestImageDetectionResolve(result[0]);
                    }                    
                  });               
            } 
            catch(err) {
                console.error("dbError", err);
                getUserLoginResolve(null);
            }             
        });
    }

    async getLatestImage(timestamp, user_id) {          
        
        let latestImage = null;
        
        try {                        
            const latestImageData = await this._getLatestImageDetection(timestamp, user_id);        
            
            if (!latestImageData || !latestImageData.user_id) {
                throw "Not found";
            }

            const latestImageUserData = await this._getUserData(latestImageData.user_id); 

            latestImage = latestImageData;
            latestImage["user"] = latestImageUserData;
        } 
        catch(err) {            
            latestImage = null;
        }

        return new Promise((getImageResolve) => {
            getImageResolve(latestImage);         
        });               
    }

    _getTopImagesForUser = (user_id, limit) => {
        return new Promise((getTopUserImagesResolve) => {
            try {                
                const query = {"user_id": user_id};                             

                const selectFields = {
                    "_id": 1,
                    "image_url": 1,
                    "user_id": 1,
                    "date": 1,
                    "detect_data": 1,
                    "detect_type": 1,
                    "detections": 1
                };
                
                this.mongodbDetectionsCollection.find(query)
                                                .project(selectFields)
                                                .sort({detections: -1, date: -1})
                                                .limit(Number(limit))
                                                .toArray((err, result) => {
                    if (err) {
                        console.error(err);                       
                    }
                    
                    if (err || !result || result.length === 0) {
                        getTopUserImagesResolve(null);
                    } else {                                                           
                        getTopUserImagesResolve(result);
                    }                    
                  });               
            } 
            catch(err) {
                console.error("dbError", err);
                getTopUserImagesResolve(null);
            }             
        });
    }    
    
    async getTopForUser(user_id, limit) {    
        
        let topImagesDB = null;
        
        try {                        
            topImagesDB = await this._getTopImagesForUser(user_id, limit);        
            
            if (!topImagesDB || topImagesDB.length === 0) {
                throw "Not found";
            }                      
        } 
        catch(err) {            
            topImagesDB = null;
        }

        return new Promise((getTopImagesResolve) => {
            getTopImagesResolve(topImagesDB);         
        });                                 
    }     

    increaseUserEntries(id, imageURL, detectData) {                       
        return new Promise((updateEntriesResolve) => {
            try {           
                
                const updateConditions = {
                    "_id": ObjectId(id)
                };

                const updateObject = {
                    "$inc": {"entries": 1}                         
                };
                                
                //update the count for the user
                this.mongodbCollection.findOneAndUpdate(updateConditions, updateObject, { returnDocument: "after" }, (err, result) => {
                    if (err) {
                        console.error(err);
                        updateEntriesResolve(null);
                        return;
                    }

                    //upsert into detections collection        
                    const updatedEntries = result.value.entries;

                    const upsertDetectionConditionObject = {
                        "user_id": id,
                        "image_url": imageURL
                    };

                    const upsertDetectionUpdateObject = {
                        "$set": {
                            "date": new Date(),
                            "detect_type": "face",
                            "detect_data": detectData                          
                        },
                        "$inc": {detections: 1}
                    };
                              
                    this.mongodbDetectionsCollection.update(upsertDetectionConditionObject, upsertDetectionUpdateObject, {"upsert": true}, (err, result) => {
                        if (err) {
                            console.error(err);
                            updateEntriesResolve(null);
                            return;
                        }                      

                        updateEntriesResolve(updatedEntries);
                    });                                                          
                });                       
            } 
            catch(err) {
                console.error("dbError", err);
                updateEntriesResolve(null);
            }             
        }); 
    }

    insertUser(email, name, hashed_password, country) {       
        return new Promise((insertUserResolve) => {
            try {                
                const insertObject = {
                    "email": email,
                    "name": name,
                    "hash": hashed_password,
                    "country": country,
                    "entries": 0,                    
                    "joined": new Date()              
                };
                                
                this.mongodbCollection.insertOne(insertObject, (err, result) => {
                    if (err) {
                        console.error(err);
                        insertUserResolve(null);
                        return;
                    }
                    
                    const returnResult = {...insertObject};
                    delete returnResult["hash"];
                    returnResult["_id"] = result.insertedId;
                    returnResult["id"] = result.insertedId;
                    insertUserResolve(returnResult);
                });                       
            } 
            catch(err) {
                console.error("dbError", err);
                insertUserResolve(null);
            }             
        }); 
    }

    updateUserProfile = (user_id, name, country, new_password) => {       
        return new Promise((updateUserResolve) => {
            try {                
                const updateObject = {
                    "$set": {
                        name: name,
                        country: country           
                    }
                };

                if (new_password && new_password.length > 0) {
                    updateObject["$set"].hash = new_password;
                }
                                
                this.mongodbCollection.updateOne({"_id": ObjectId(user_id)}, updateObject, { returnDocument: "after" }, async (err, result) => {
                    if (err) {
                        console.error(err);
                        updateUserResolve(null);
                        return;
                    }
                                        
                    const updatedUser = await this.getUserById(user_id, false);
                    updateUserResolve(updatedUser);
                });                       
            } 
            catch(err) {
                console.error("dbError", err);
                updateUserResolve(null);
            }             
        }); 
    }
}