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

    if (foundDBUser === null) {
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

//image --> PUT --> user
app.put('/image', async (req, res) => {
    const { id } = req.body;

    if (!id) {
        res.status(400).json({'error': 'invalid_params'});       
        return;  
    }

    let updatedEntries = null;

    try {        
        updatedEntries = await db.increaseUserEntries(id);        
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

