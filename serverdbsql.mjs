import knex from "knex";

export default class databaseSQLHandler {
    constructor() {
        this.postgres = null;             
        this.connect();        
    }

    connect() {
        if ((!process?.env?.DATABASE_URL) && (!process?.env?.SQLDatabaseHost || !process?.env?.SQLDatabasePort || !process?.env?.SQLDatabaseUser || !process?.env?.SQLDatabasePass || !process?.env?.SQLDatabaseName)) {
            throw new Error("PostgreSQL config invalid");
        } 

        let connectionObj = null;

        if (process?.env?.DATABASE_URL) {
            connectionObj = {
                connectionString: process.env.DATABASE_URL,
                ssl: process.env.DATABASE_URL ? true : false
            }
        } else {
            connectionObj = {
                host: process.env.SQLDatabaseHost,
                port: process.env.SQLDatabasePort,
                user: process.env.SQLDatabaseUser,
                password: process.env.SQLDatabasePass,
                database: process.env.SQLDatabaseName,
            }
        }

        this.postgres = knex({
            client: 'pg',
            connection: connectionObj
        });
    }

    getAllUsers() {                        
        return new Promise((getUsersResolve) => {
            try {
                //fetch from users table by id
                this.postgres
                    .select("*")
                    .from("users")                              
                    .then((response) => {                            
                        if (!response || response.length === 0) {
                            getUsersResolve([]);
                        } else {
                            getUsersResolve(response);
                        }
                    })
                    .catch((err) => {
                        console.error("getAllUsers", err);
                        getUsersResolve(null);
                    });                   
            } 
            catch(err) {
                console.error("dbError", err);
                getUsersResolve(null);
            }             
        });                    
    }

    getUserById(id, get_hash = false) {                        
        return new Promise((getUserResolve) => {
            try {
                //fetch from users table by id
                this.postgres
                    .select("u.*", "l.hash")
                    .from("users as u")
                    .join("login as l", "u.email", "l.email")
                    .where('u.id', '=', parseInt(id))                        
                    .then((response) => {                            
                        if (!response || response.length === 0) {
                            getUserResolve(null);
                        } else {

                            const resp = response[0];

                            if (!get_hash) {
                                delete resp["hash"];
                            }

                            getUserResolve(resp);
                        }
                    })
                    .catch((err) => {
                        console.error("getUserById", err);
                        getUserResolve(null);
                    });                   
            } 
            catch(err) {
                console.error("dbError", err);
                getUserResolve(null);
            }             
        });                    
    }

    getUserLogin(email) {                        
        return new Promise((getUserResolve) => {
            try {
                //fetch from users table by id
                this.postgres
                    ("users as u")
                    .join("login as l", "u.email", "l.email")
                    .select("u.*", "l.hash")
                    .where('u.email', '=', email) //escaped by knex                     
                    .then((response) => {                                          
                        if (!response || response.length === 0) {
                            getUserResolve(null);
                        } else {
                            getUserResolve(response[0]);
                        }
                    })
                    .catch((err) => {
                        console.error("getUserLoginDBError", err);
                        getUserResolve(null);
                    });                   
            } 
            catch(err) {
                console.error("dbError", err);
                getUserResolve(null);
            }             
        });                    
    }

    _getLatestImageDetection = (timestamp, user_id) => {

        return new Promise((getLatestImageDetectionResolve) => {
            try {               
                const queryObj = this.postgres
                    ("image_detections as idt")
                    .join("users as u", "idt.user_id", "u.id")
                    .select("idt.*", "u.*")
                    .orderBy("date", "desc")
                    .limit(1);

                if (timestamp) {
                    queryObj.where('idt.date', '>', new Date(Number(timestamp))); //escaped by knex             
                }    

                if (user_id) {
                    queryObj.where('idt.user_id', '!=', user_id); //escaped by knex      
                }
                                                                                    
                queryObj.then((response) => {                                          
                        if (!response || response.length === 0) {
                            getLatestImageDetectionResolve(null);
                        } else {
                            getLatestImageDetectionResolve(response[0]);
                        }
                    })
                    .catch((err) => {
                        console.error(err);
                        getLatestImageDetectionResolve(null);
                    });                   
            } 
            catch(err) {
                console.error("dbError", err);
                getLatestImageDetectionResolve(null);
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
           
            latestImage = latestImageData;

            const userDataKeys = ["email", "country", "name", "user_id"];
            const imageUser = {};

            userDataKeys.forEach((elem) => {
                imageUser[elem] = latestImage[elem];
                delete latestImage[elem];
            });

            latestImage["user"] = imageUser;
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
                const queryObj = this.postgres
                    ("image_detections as idt")
                    .join("users as u", "idt.user_id", "u.id")
                    .where('idt.user_id', '=', user_id) //escaped by knex      
                    .select("idt.*", "u.*")
                    .orderBy("date", "desc")
                    .limit(Number(limit));
                                                                                                   
                queryObj.then((response) => {                                          
                        if (!response || response.length === 0) {
                            getTopUserImagesResolve(null);
                        } else {
                            getTopUserImagesResolve(response);
                        }
                    })
                    .catch((err) => {
                        console.error(err);
                        getTopUserImagesResolve(null);
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

    increaseUserEntries(id, imageURL) {                       
        return new Promise((incrEntriesResolve) => {
            try {                              
                //increase user entries
                this.postgres("users")
                    .returning("*")
                    .where('id', '=', parseInt(id))                              
                    .update({
                        entries: this.postgres.raw('?? + 1', ['entries'])
                    })         
                    .then((response) => {                                 
                        if (!response || response.length == 0) {
                            incrEntriesResolve(null);
                        } else {                  
                            
                            const newEntries = response[0].entries;

                            //check to insert or update image detection entry
                            this.postgres("image_detections as idts")                               
                                .select("idts.*")
                                .where('idts.user_id', '=', id) //escaped by knex         
                                .where('idts.image_url', '=', imageURL) //escaped by knex                
                                .then((response) => {    
                                    
                                    if (!response) {                                        
                                        incrEntriesResolve(null);
                                    }

                                    if (response.length === 0) {
                                        //insert the image detection data
                                        this.postgres("image_detections")
                                            .returning("*")
                                            .insert({
                                                user_id: id,
                                                image_url: imageURL,
                                                date: new Date(),
                                                detect_type: "face",
                                                detect_data: "",
                                                detections: 1
                                            })
                                            .then((insertResponse) => {                                                
                                                incrEntriesResolve(newEntries);
                                            })
                                            .catch((err) => {
                                                console.error("insertUserImageDetectionEntryError", err);
                                                incrEntriesResolve(null);
                                            })              
                                    } else {
                                        //update the image update entry
                                        this.postgres("image_detections")
                                            .returning("*")
                                            .where('user_id', '=', parseInt(id))
                                            .where('image_url', '=', imageURL)                              
                                            .update({
                                                detections: this.postgres.raw('?? + 1', ['detections']),
                                                date: new Date(),
                                                detect_type: "face"
                                            }) 
                                            .then((updateResponse) => {                                                
                                                incrEntriesResolve(newEntries);
                                            })
                                            .catch((err) => {
                                                console.error("insertUserImageDetectionEntryError", err);
                                                incrEntriesResolve(null);
                                            })         
                                    }
                                })
                                .catch((err) => {
                                    console.error("insertUserImageDetectionEntryError", err);
                                    incrEntriesResolve(null);
                                });
                            
                            
                            //todo move 
                            //incrEntriesResolve(response[0].entries);
                        }
                    })
                    .catch((err) => {
                        console.error("incrUserEntries", err);
                        incrEntriesResolve(null);
                    });
            } 
            catch(err) {
                console.error("dbError", err);
                incrEntriesResolve(null);
            }             
        });                    
    }

    insertUser(email, name, hashed_password, country) {       
        return new Promise((insertUserResolve) => {
            try {
                //insert into users table

                this.postgres.transaction((trx) => {
                    trx('users')
                        .returning("*")
                        .insert({
                            email: email,
                            name: name,
                            country: country,
                            joined: new Date()
                        })
                        .then((insertUserResponse) => {                            

                            //if insert succesful, insert into login table
                            trx('login')
                            .returning("*")
                            .insert({
                                email: email,
                                hash: hashed_password
                            })
                            .then((loginResponse) => {
                                //just log the login response
                                //console.log("dbResponseInsertLogin", loginResponse);
                                
                                //the promise will resolve back to the API with only the user info, no login info
                                trx.commit();
                                insertUserResolve(insertUserResponse[0]);
                            })
                            .catch((err) => {
                                console.error("dbInsertLoginError", err);
                                trx.rollback();
                                insertUserResolve(null);
                            })              
                        })
                        .catch((err) => {
                            console.error("dbInsertUserError", err);
                            trx.rollback();
                            insertUserResolve(null);
                        });
                });                   
            } 
            catch(err) {
                console.error("dbError", err);
                insertUserResolve(null);
            }             
        });                   
    }

    updateUserProfile = (user_id, name, country, new_password) => {       
        return new Promise(async (updateUserResolve) => {
            try {
                //update users table

                const updateObj = {                   
                    name: name,
                    country: country                   
                };

                let updateLoginConditions = {
                    "email": "-1"
                };

                const updateLoginFields = {
                    "hash": new_password
                };

                if (new_password && new_password.length > 0) {
                    const userToUpdate = await this.getUserById(user_id, false);
                    updateLoginConditions.email = userToUpdate.email;
                }                

                this.postgres.transaction((trx) => {
                    trx('users')
                        .returning("*")
                        .update(updateObj)
                        .where("id", "=", user_id)
                        .then((updateUserResponse) => {                            
                            trx('login')
                            .returning("*")
                            .update(updateLoginFields)
                            .where(updateLoginConditions)
                            .then((updateLoginResponse) => {
                                trx.commit();
                                updateUserResolve(updateUserResponse[0]);                                
                            })
                            .catch((err) => {
                                console.error("dbUpdateProfileError", err);
                                trx.rollback();
                                updateUserResolve(null);
                            })              
                        })
                        .catch((err) => {
                            console.error("dbUpdateProfileError", err);
                            trx.rollback();
                            updateUserResolve(null);
                        });
                });                   
            } 
            catch(err) {
                console.error("dbError", err);
                updateUserResponse(null);
            }             
        });                   
    }
}