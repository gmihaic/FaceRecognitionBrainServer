import "dotenv/config";
import express from "express";
import fs from "fs";
import bcrypt from "bcrypt-nodejs";
import cors from "cors";
import databaseHandler from "./serverdb.mjs";
import { ClarifaiStub, grpc } from "clarifai-nodejs-grpc";

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
        res.status(400).json('could not get users');      
        return;  
    }
            
    res.json(foundDBUsers); 
});

///signin --> POST = success/fail
app.post('/signin', async (req, res) => {    

    const {email, password} = req.body;

    if (!email || email.length === 0 || !password || password.length === 0) {
        res.status(400).json('could not sign in');      
        return;
    }

    let foundDBUser = null;

    try {        
        foundDBUser = await db.getUserLogin(email);        
    }
    catch(err) {
        console.error("signInDbError", err);
        res.status(400).json('could not sign in');      
        return;  
    }

    if (foundDBUser === null) {
        console.error(`not found in db ${email}`);
        res.status(400).json('could not sign in');  
        return;  
    }

    if (!bcrypt.compareSync(password, foundDBUser.hash)) {
        console.error("Password does not match");
        res.status(400).json('could not sign in');  
        return; 
    }
    
    delete foundDBUser["hash"];
    res.json(foundDBUser);        
});

//register --> POST = user
app.post('/register', async (req, res) => {    
    const {email, name, password} = req.body;

    if (!email || email.length === 0 || !name || name.length === 0 || !password || password.length === 0) {
        res.status(400).json('error registering user');      
        return;
    }
    
    const hashed_password = bcrypt.hashSync(password);

    let insertedUser = null;

    try {        
        insertedUser = await db.insertUser(email, name, hashed_password);        
    }
    catch(err) {
        console.error(err);
        res.status(400).json('error registering user');      
        return;  
    }

    if (insertedUser === null) {
        res.status(400).json('error registering user');  
        return;  
    }
    
    res.json(insertedUser);    
});

//profile/:userId --> GET = user
app.get('/profile/:id', async (req, res) => {
    const { id } = req.params;

    if (!id) {
        res.status(400).json('Invalid ID');       
        return;  
    }
   
    let foundUser = null;

    try {        
        foundUser = await db.getUserById(id);        
    }
    catch(err) {
        console.error(err);
        res.status(400).json('User not found');      
        return;  
    }

    if (foundUser === null) {
        res.status(400).json('User not found');       
        return;  
    }
    
    res.json(foundUser);    
});

//image --> PUT --> user
app.put('/image', async (req, res) => {
    const { id } = req.body;

    if (!id) {
        res.status(400).json('Invalid ID');       
        return;  
    }

    let updatedEntries = null;

    try {        
        updatedEntries = await db.increaseUserEntries(id);        
    }
    catch(err) {
        console.error(err);
        res.status(400).json('Could not update entries');      
        return;  
    }

    if (updatedEntries === null) {
        res.status(400).json('Could not update entries');       
        return;  
    }
    
    res.json(updatedEntries);    
});

//recogniseImage/:imageURL --> GET = image parsed data
app.post('/recogniseImage', async (req, res) => {
    const { imageURL } = req.body;
   
    if (!imageURL || (imageURL.substr(0, 7) != "http://" && imageURL.substr(0, 8) != "https://")) {
        res.status(400).json('Invalid image URL');       
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
                res.status(400).json('Error parsing image URL');       
                return;  
            }
    
            if (response.status.code !== 10000) {
                console.error("Received failed status: " + response.status.description + "\n" + response.status.details);
                res.status(400).json('Error parsing image URL');                       
                return;
            }
                
            res.json(response.outputs[0].data.regions[0].region_info.bounding_box);            
        }
    );           
});

app.listen(3610, () => {
    console.log("app is running on port 3610")
});

