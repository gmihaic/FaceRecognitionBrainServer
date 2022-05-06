export const profileController = {

    // get all profiles
    handleAllProfiles: async (req, res, db) => {        

        let foundDBUsers = null;
    
        try {        
            foundDBUsers = await db.getAllUsers();        
        }
        catch(err) {
            console.error("getAllUserDBError", err);        
            res.status(400).json({'error': 'db_error'});      
            return;  
        }
                
        res.json(foundDBUsers); 
    },

    //profile/:userId --> GET = user profile
    handleUserProfile: async (req, res, db) => {
        const { id } = req.params;
    
        if (!id) {
            res.status(400).json({'error': 'invalid_params'});       
            return;  
        }
       
        let foundUser = null;
    
        try {        
            foundUser = await db.getUserById(id);        
        }
        catch(err) {
            console.error(err);
            res.status(400).json({'error': 'db_error'});      
            return;  
        }
    
        if (foundUser === null) {            
            res.json(null);
            return;  
        }
        
        res.json(foundUser);    
    },

    //topforuser/:user_id/:limit --> GET = top images for user
    handleUserTopImages: async (req, res, db) => {
        const { user_id, limit } = req.params;
               
        if (!user_id || !limit || isNaN(limit)) {
            res.status(400).json({'error': 'invalid_params'});       
            return;  
        }
    
        if (limit < 1 || limit > 100) {
            res.status(400).json({'error': 'invalid_params'});       
            return;  
        }
    
        let foundImages = null;
        
        try {        
            foundImages = await db.getTopForUser(user_id, limit);        
        }
        catch(err) {
            console.error(err);
            res.status(400).json({'error': 'db_error'});      
            return;  
        }
       
        if (foundImages === null) {            
            res.json(null);
            return;  
        }
    
        const retImages = foundImages.map((foundImage) => {
    
            const retImage = {
                "image_url": foundImage.image_url,
                "date": foundImage.date,
                "detect_type": foundImage.detect_type,
                "detections": foundImage.detections           
            };
    
            return retImage;
        });               
        
        res.json(retImages);    
    }
}