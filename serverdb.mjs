
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

    getUserById(id) {        
        return this.handler.getUserById(id);       
    }

    getUserLogin(email) {
        return this.handler.getUserLogin(email);
    }

    increaseUserEntries(id) {
        return this.handler.increaseUserEntries(id);            
    }
   
    insertUser(email, name, hashed_password) {
        return this.handler.insertUser(email, name, hashed_password);   
    }       
};