import knex from "knex";

export default class databaseSQLHandler {
    constructor() {
        this.postgres = null;             
        this.connect();
    }

    connect() {
        if (!process?.env?.SQLDatabaseHost || !process?.env?.SQLDatabasePort || !process?.env?.SQLDatabaseUser || !process?.env?.SQLDatabasePass || !process?.env?.SQLDatabaseName) {
            throw new Error("PostgreSQL config invalid");
        } 

        this.postgres = knex({
            client: 'pg',
            connection: {
                host: process.env.SQLDatabaseHost,
                port: process.env.SQLDatabasePort,
                user: process.env.SQLDatabaseUser,
                password: process.env.SQLDatabasePass,
                database: process.env.SQLDatabaseName
            }
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
                        console.error("getUserById", err);
                        getUsersResolve(null);
                    });                   
            } 
            catch(err) {
                console.error("dbError", err);
                getUsersResolve(null);
            }             
        });                    
    }

    getUserById(id) {                        
        return new Promise((getUserResolve) => {
            try {
                //fetch from users table by id
                this.postgres
                    .select("*")
                    .from("users")
                    .where('id', '=', parseInt(id))                        
                    .then((response) => {                            
                        if (!response || response.length === 0) {
                            getUserResolve(null);
                        } else {
                            getUserResolve(response[0]);
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

    increaseUserEntries(id) {                       
        return new Promise((incrEntriesResolve) => {
            try {
                //fetch from users table by id
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
                            incrEntriesResolve(response[0].entries);
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
                            //console.log("dbResponseInsertUser", insertUserResponse);

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
}