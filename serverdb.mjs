import knex from "knex";

export default class databaseHandler {
    constructor() {
        this.postgres = null;
        this.mongodb = null;        

        this.connect();
    }

    connect() {

        if (!process?.env?.databaseMode || (process.env.databaseMode !== "PostgreSQL" && process.env.databaseMode !== "MongoDB")) {
            throw new Error("Could not init database connection");
        }

        if (process.env.databaseMode === "PostgreSQL") {
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
        
            /*this.postgres.select("*").from('users').then((data) => {
                console.log("done");
                console.log(data);
            });*/
        
        } else {
            //todo mongodb
        }
    }

    getUserById(id) {
        if (this.postgres) {
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
    }

    insertUser(email, name, hashed_password) {
        if (this.postgres) {
            return new Promise((insertUserResolve) => {
                try {
                    //insert into users table
                    this.postgres('users')
                    .returning("*")
                    .insert({
                        email: email,
                        name: name,
                        joined: new Date()
                    })
                    .then((insertUserResponse) => {
                        console.log("dbResponseInsertUser", insertUserResponse);

                        //if insert succesful, insert into login table
                        this.postgres('login')
                        .returning("*")
                        .insert({
                            email: email,
                            hash: hashed_password
                        })
                        .then((loginResponse) => {
                            //just log the login response
                            console.log("dbResponseInsertLogin", loginResponse);
                            
                            //the promise will resolve back to the API with only the user info, no login info
                            insertUserResolve(insertUserResponse[0]);
                        })
                        .catch((err) => {
                            console.error("dbInsertLoginError", err);
                            insertUserResolve(null);
                        })                        
                    })
                    .catch((err) => {
                        console.error("dbInsertUserError", err);
                        insertUserResolve(null);
                    });
                } 
                catch(err) {
                    console.error("dbError", err);
                    insertUserResolve(null);
                }             
            });
            
        }
    }
};