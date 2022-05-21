import "dotenv/config";
import express from "express";
import fs from "fs";
import cors from "cors";
import databaseHandler from "./serverdb.mjs";
import { ClarifaiStub, grpc } from "clarifai-nodejs-grpc";
import { is_email_valid } from "node-email-validation";
import bcrypt from "bcrypt";
import { URL } from "url";
import { userController } from "./controllers/user.mjs";
import { profileController } from "./controllers/profile.mjs";
import { imageController } from "./controllers/image.mjs";
import * as faceapi from "face-api.js";

const main = () => {
  const app = express();
  app.use(cors());

  app.use(express.json({ extended: false }));

  const db = new databaseHandler();

  // get all profiles
  app.get("/", (req, res) => {
    profileController.handleAllProfiles(req, res, db);
  });

  //profile/:userId --> GET = user profile
  app.get("/profile/:id", (req, res) => {
    profileController.handleUserProfile(req, res, db);
  });

  //topforuser/:user_id/:limit --> GET = top images for user
  app.get("/topforuser/:user_id/:limit", (req, res) => {
    profileController.handleUserTopImages(req, res, db);
  });

  ///signin --> POST = success/fail
  app.post("/signin", (req, res) => {
    userController.handleSignin(req, res, db, bcrypt, is_email_valid);
  });

  //register --> POST = user
  app.post("/register", (req, res) => {
    userController.handleRegister(req, res, db, bcrypt, is_email_valid);
  });

  //editprofile --> POST = user
  app.post("/editprofile", (req, res) => {
    userController.handleEditProfile(req, res, db, bcrypt);
  });

  //recogniseImage/:imageURL --> GET = image parsed data
  app.post("/recogniseImage", (req, res) => {
    imageController.handleImageDetect(req, res, ClarifaiStub, grpc);
  });

  app.post("/compare", imageController.handleImageCompare);

  //latestimage/:timestamp/:user_id --> GET = latest image
  app.get("/latestimage/:timestamp?/:user_id?", (req, res) => {
    imageController.handleUserLatestImage(req, res, db);
  });

  //image --> PUT --> user
  app.put("/image", (req, res) => {
    imageController.handleUserImageIncrement(req, res, db);
  });

  const SERVERPORT = process.env.PORT
    ? process.env.PORT
    : process.env.SERVERPORT;

  app.listen(SERVERPORT, () => {
    console.log(`app is running on port ${SERVERPORT}`);
  });
};

Promise.all([
  faceapi.nets.tinyFaceDetector.loadFromDisk("./models"),
  faceapi.nets.faceLandmark68Net.loadFromDisk("./models"),
  faceapi.nets.faceRecognitionNet.loadFromDisk("./models"),
  faceapi.nets.ssdMobilenetv1.loadFromDisk("./models"),
]).then(main);
