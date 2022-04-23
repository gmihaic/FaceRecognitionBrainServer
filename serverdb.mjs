
import databaseSQLHandler from "./serverdbsql.mjs";
import databaseMongoDBHandler from "./serverdbmongo.mjs";

export default class databaseHandler {
    constructor() {       
        this.handler = null;        
        this.connect();
    }

    connect() {
        if (!process?.env?.databaseMode || (process.env.databaseMode !== "PostgreSQL" && process.env.databaseMode !== "MongoDB")) {
            throw new Error("Could not init database connection");
        }
       
        if (process.env.databaseMode === "PostgreSQL") {
            this.handler = new databaseSQLHandler();                                                    
        } else {
            this.handler = new databaseMongoDBHandler();  
        }
    }

    getAllUsers() {
        return this.handler.getAllUsers();  
    }

    getUserById(id) {        
        return this.handler.getUserById(id);       
    }

    getLatestImage(timestamp, user_id) {        
        return this.handler.getLatestImage(timestamp, user_id);       
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
};