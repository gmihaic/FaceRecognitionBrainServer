import "dotenv/config";
import express from "express";
import fs from "fs";
import cors from "cors";
import databaseHandler from "./serverdb.mjs";
import { ClarifaiStub, grpc } from "clarifai-nodejs-grpc";
import {is_email_valid} from 'node-email-validation';
import bcrypt from "bcrypt";
import {URL} from "url";

const app = express();
app.use(cors());

app.use(express.json({extended: false}));

const db = new databaseHandler();

// --> res = this is working
app.get("/", async (req, res) => {        

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
});

///signin --> POST = success/fail
app.post('/signin', async (req, res) => {    

    const {email, password} = req.body;

    if (!email || email.length === 0 || !password || password.length === 0) {
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
});

//register --> POST = user
app.post('/register', async (req, res) => {    
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
});

//editprofile --> POST = user
app.post('/editprofile', async (req, res) => {    
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
});

//profile/:userId --> GET = user
app.get('/profile/:id', async (req, res) => {
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
});

//latestimage/:timestamp/:user_id --> GET = latest image
app.get('/latestimage/:timestamp?/:user_id?', async (req, res) => {
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
});

//topforuser/:user_id/:limit --> GET = top images for user
app.get('/topforuser/:user_id/:limit', async (req, res) => {
    const { user_id, limit } = req.params;
           
    if (!user_id || !limit || isNaN(limit)) {
        res.status(400).json({'error': 'invalid_params'});       
        return;  
    }

    if (limit < 1 || limit > 12) {
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
        if (typeof(foundImage.detect_data) === "string") {
            foundImage.detect_data = JSON.parse(foundImage.detect_data);
        }

        const retImage = {
            "image_url": foundImage.image_url,
            "date": foundImage.date,
            "detect_data": foundImage.detect_data,
            "detect_type": foundImage.detect_type,
            "detections": foundImage.detections           
        };

        return retImage;
    });               
    
    res.json(retImages);    
});

//image --> PUT --> user
app.put('/image', async (req, res) => {
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
});

//recogniseImage/:imageURL --> GET = image parsed data
app.post('/recogniseImage', async (req, res) => {
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
});

app.listen(3610, () => {
    console.log("app is running on port 3610")
});

