
import databaseSQLHandler from "./serverdbsql.mjs";
import databaseMongoDBHandler from "./serverdbmongo.mjs";

export default class databaseHandler {
    constructor() {       
        this.handler = null;        
        this.connect();
    }

    connect() {

        let connectionSSL = { rejectUnauthorized: false };

        //postgres://aifbwyhawkbluv:89af05513792017733e4eed809234260bb434c2bc670f2d59df4617a202d2d28@ec2-3-209-124-113.compute-1.amazonaws.com:5432/dejfdjtb11k4v3
        if (process?.env?.DATABASE_URL) {

            if (process.env.DATABASE_URL.substr(0, 11) !== "postgres://") {
                throw "Invalid DATABASE_URL";
            }

            const sqlConnectionData = process.env.DATABASE_URL.substr(11).split(":");

            if (sqlConnectionData.length != 3) {
                throw "Invalid DATABASE_URL";
            }

            const sqlSplitPassHost = sqlConnectionData[1].split("@");
            const sqlSplitPorName = sqlConnectionData[2].split("/");

            process.env.SQLDatabaseHost = sqlSplitPassHost[1];
            process.env.SQLDatabasePort = sqlSplitPorName[0];
            process.env.SQLDatabaseUser = sqlConnectionData[0];
            process.env.SQLDatabasePass = sqlSplitPassHost[0];
            process.env.SQLDatabaseName = sqlSplitPorName[1];        
            
            connectionSSL = true;
        }      

        if (!process?.env?.databaseMode || (process.env.databaseMode !== "PostgreSQL" && process.env.databaseMode !== "MongoDB")) {
            throw new Error("Could not init database connection");
        }
       
        if (process.env.databaseMode === "PostgreSQL") {
            this.handler = new databaseSQLHandler(connectionSSL);                                                    
        } else {
            this.handler = new databaseMongoDBHandler();  
        }
    }

    getAllUsers() {
        return this.handler.getAllUsers();  
    }

    getUserById(id, get_hash = false) {        
        return this.handler.getUserById(id, get_hash);       
    }

    getLatestImage(timestamp, user_id) {        
        return this.handler.getLatestImage(timestamp, user_id);       
    }

    getTopForUser(user_id, limit) {
        return this.handler.getTopForUser(user_id, limit);    
    }

    getUserLogin(email) {
        return this.handler.getUserLogin(email);
    }

    increaseUserEntries(id, imageURL, detectData) {
        return this.handler.increaseUserEntries(id, imageURL, detectData);            
    }
   
    insertUser(email, name, hashed_password, country) {
        return this.handler.insertUser(email, name, hashed_password, country);   
    }  
    
    updateUserProfile(user_id, name, country, new_password) {
        return this.handler.updateUserProfile(user_id, name, country, new_password);   
    }
};