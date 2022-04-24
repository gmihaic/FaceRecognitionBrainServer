export const imageController = {
    //recogniseImage/:imageURL --> GET = image parsed data
    handleImageDetect: async (req, res, ClarifaiStub, grpc) => {
        const { imageURL } = req.body;
       
        if (!imageURL) {
            res.status(400).json({'error': 'invalid_params'});       
            return;  
        }
    
        try {
            new URL(imageURL);        
        } 
        catch (err) {
            res.status(400).json({'error': 'invalid_params'});       
            return;  
        }
    
        const stub = ClarifaiStub.grpc();
    
        const metadata = new grpc.Metadata();
        metadata.set("authorization", `Key ${process.env.ClarifaiAPIKey}`);
        
        stub.PostModelOutputs(
            {            
                // This is the model ID of a publicly available General model. You may use any other public or custom model ID.
                model_id: "face-detection",
                inputs: [{data: {image: {url: imageURL}}}]
            },
            metadata,
            (err, response) => {
                if (err) {
                    res.status(400).json({'error': 'detect_error'});       
                    return;  
                }
        
                if (response.status.code !== 10000) {
                    console.error("Received failed status: " + response.status.description + "\n" + response.status.details);
                    res.status(400).json({'error': 'detect_error'});                       
                    return;
                }
                    
                res.json(response.outputs[0].data.regions[0].region_info.bounding_box);            
            }
        );           
    },

    //latestimage/:timestamp/:user_id --> GET = latest image
    handleUserLatestImage: async (req, res, db) => {
        const { timestamp, user_id } = req.params;
               
        let foundImage = null;
        
        try {        
            foundImage = await db.getLatestImage(timestamp, user_id);        
        }
        catch(err) {
            console.error(err);
            res.status(400).json({'error': 'db_error'});      
            return;  
        }
       
        if (foundImage === null) {            
            res.json(null);
            return;  
        }
    
        if (typeof(foundImage.detect_data) === "string") {
            foundImage.detect_data = JSON.parse(foundImage.detect_data);
        }
    
        const retImage = {
            "image_url": foundImage.image_url,
            "date": foundImage.date,
            "detect_data": foundImage.detect_data,
            "detect_type": foundImage.detect_type,
            "detections": foundImage.detections,
            "user": {
                "name": foundImage.user.name,
                "country": foundImage.user.country
            }
        };
        
        res.json(retImage);    
    },

    handleUserImageIncrement: async (req, res, db) => {
        const { id, imageURL, detectData } = req.body;
    
        if (!id || !imageURL || !detectData) {
            res.status(400).json({'error': 'invalid_params'});       
            return;  
        }
    
        try {
            new URL(imageURL);  
                    
            if (!detectData.top_row) {
                throw "Invalid detect data";
            }
        } 
        catch (err) {
            res.status(400).json({'error': 'invalid_params'});       
            return;  
        }
    
        let updatedEntries = null;
    
        try {        
            updatedEntries = await db.increaseUserEntries(id, imageURL, detectData);        
        }
        catch(err) {
            console.error(err);
            res.status(400).json({'error': 'db_error'});      
            return;  
        }
    
        if (updatedEntries === null) {
            res.status(400).json({'error': 'db_error'});       
            return;  
        }
        
        res.json(updatedEntries);    
    }
}