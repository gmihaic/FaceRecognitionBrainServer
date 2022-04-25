export const userController = {

    //register --> POST = user
    handleRegister: async (req, res, db, bcrypt, is_email_valid) => {    
        const {email, name, password, country} = req.body;
    
        if (!email || email.length === 0 || !is_email_valid(email) || !name || name.length === 0 || !password || password.length < 8 || !country || country.length < 2) {
            res.status(400).json({'error': 'invalid_params'});      
            return;
        }
               
        const hashed_password = bcrypt.hashSync(password, bcrypt.genSaltSync(10));
    
        let insertedUser = null;
    
        try {        
            insertedUser = await db.insertUser(email, name, hashed_password, country);        
        }
        catch(err) {
            console.error(err);
            res.status(400).json({'error': 'db_error'});      
            return;  
        }
    
        if (insertedUser === null) {
            res.status(400).json({'error': 'register_error'});  
            return;  
        }
        
        res.json(insertedUser);    
    },

    ///signin --> POST = success/fail
    handleSignin: async (req, res, db, bcrypt, is_email_valid) => {    

        const {email, password} = req.body;
    
        if (!email || email.length === 0 || !is_email_valid(email) || !password || password.length < 8) {
            res.status(400).json({'error': 'invalid_params'});      
            return;
        }
    
        let foundDBUser = null;
    
        try {        
            foundDBUser = await db.getUserLogin(email);        
        }
        catch(err) {
            console.error("signInDbError", err);
            res.status(400).json({'error': 'db_error'});      
            return;  
        }
    
        if (foundDBUser === null || !foundDBUser.hash) {
            console.error(`not found in db ${email}`);
            res.status(400).json({'error': 'login_error'});  
            return;  
        }
            
        if (!bcrypt.compareSync(password, foundDBUser.hash)) {
            console.error("Password does not match");
            res.status(400).json({'error': 'db_login_error'});  
            return; 
        }
        
        delete foundDBUser["hash"];
        res.json(foundDBUser);        
    },

    //editprofile --> POST = user
    handleEditProfile: async (req, res, db, bcrypt) => {    
        let {user_id, name, country, current_password, new_password} = req.body;
    
        if (!user_id || user_id.length === 0 || !name || name.length === 0 || !country || country.length < 2) {
            res.status(400).json({'error': 'invalid_params'});      
            return;
        }
    
        if (current_password.length > 0 || new_password.length > 0) {
            if (current_password.length < 8 || new_password.length < 8) {
                errors.push("If changing the password, the new password must be at least 8 characters");
            }
        }
    
        let currentUser = null;
    
        try {
            currentUser = await db.getUserById(user_id, true);
            
            if (!currentUser || !currentUser.email) {
                throw "User not found";
            }
    
            if (current_password && current_password.length > 0) {
                if (!bcrypt.compareSync(current_password, currentUser.hash)) {               
                    throw "Current password does not match";
                }
            }        
        }
        catch (err) {
            console.error(err);
            res.status(400).json({'error': 'could not update profile'});      
            return; 
        }
                   
        if (new_password && new_password.length > 0) {
            new_password = bcrypt.hashSync(new_password, bcrypt.genSaltSync(10));
        }
    
        let updatedUser = null;
    
        try {        
            updatedUser = await db.updateUserProfile(user_id, name, country, new_password);        
        }
        catch(err) {
            console.error(err);
            res.status(400).json({'error': 'db_error'});      
            return;  
        }
    
        if (updatedUser === null) {
            res.status(400).json({'error': 'profile_update_error'});  
            return;  
        }
        
        res.json(updatedUser);    
    }
} 