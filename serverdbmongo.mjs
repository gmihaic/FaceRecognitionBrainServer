import { MongoClient, ObjectId } from "mongodb";
export default class databaseMongoDBHandler {
    constructor() {
        this.mongo = null;   //connection  
        this.mongodb = null;     //database
        this.mongodbCollection = null;     //collection

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
                        console.log(err);                        
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

    getUserById(id) {                        
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
                
                this.mongodbCollection.find(query).project(selectFields).toArray((err, result) => {
                    if (err) {
                        console.log(err);                        
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
                    "entries": 1,
                    "joined": 1
                };
                
                this.mongodbCollection.find(query).project(selectFields).toArray((err, result) => {
                    if (err) {
                        console.log(err);                       
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

    increaseUserEntries(id) {                       
        return new Promise((updateEntriesResolve) => {
            try {           
                
                const updateConditions = {
                    "_id": ObjectId(id)
                };

                const updateObject = {
                    "$inc": {"entries": 1}                         
                };
                                
                this.mongodbCollection.findOneAndUpdate(updateConditions, updateObject, { returnDocument: "after" }, (err, result) => {
                    if (err) {
                        console.log(err);
                        updateEntriesResolve(null);
                        return;
                    }
                                      
                    updateEntriesResolve(result.value.entries);
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
                        console.log(err);
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
}