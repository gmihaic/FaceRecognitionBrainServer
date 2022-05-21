import * as faceapi from "face-api.js";
import { canvas } from "../common/env.js";
import { isValidUrl as isUrlValid } from "../utils/urlUtils.js";
import { db } from "../db.js";

export const imageController = {
  //recogniseImage/:imageURL --> GET = image parsed data
  handleImageDetect: async (req, res) => {
    const { userId, imageURL } = req.body;
    let response;
    let image;

    if (!isUrlValid(imageURL)) {
      res.status(400).json({ error: "invalid_params" });
      return;
    }

    try {
      image = await canvas.loadImage(imageURL);
    } catch (err) {
      res.status(500).json({ error: err.message });
      return;
    }

    try {
      const detections = await faceapi.detectAllFaces(
        image,
        new faceapi.TinyFaceDetectorOptions()
      );
      response = {
        boxes: detections.map((d) => d.relativeBox),
      };
    } catch (err) {
      res.status(500).json({ error: err.message });
      return;
    }

    let updatedEntries = null;

    try {
      updatedEntries = await db.increaseUserEntries(userId, imageURL);
    } catch (err) {
      console.log(err);
      res.status(500).json({ error: "db_error" });
      return;
    }

    if (updatedEntries === null) {
      res.status(500).json({ error: "db_error" });
      return;
    }

    res.json(response);
  },

  handleImageCompare: async (req, res) => {
    const {
      userId,
      images: [url1, url2],
    } = req.body;
    let image1, image2;

    if (!isUrlValid(url1) || !isUrlValid(url2)) {
      res.status(400).json({ error: "invalid_params" });
    }

    try {
      image1 = await canvas.loadImage(url1);
      image2 = await canvas.loadImage(url2);
    } catch (err) {
      res.status(500).json({ error: err.message });
      return;
    }

    try {
      const {
        descriptor: desc1,
        detection: { relativeBox: box1 },
      } = await faceapi
        .detectSingleFace(image1, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptor();
      const {
        descriptor: desc2,
        detection: { relativeBox: box2 },
      } = await faceapi
        .detectSingleFace(image2, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptor();
      const distance = faceapi.euclideanDistance(desc2, desc1);
      await db.increaseUserEntries(userId, url1);
      await db.increaseUserEntries(userId, url2);
      res.json({ distance, detections: [box1, box2] });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  //latestimage/:timestamp/:user_id --> GET = latest image
  handleUserLatestImage: async (req, res, db) => {
    const { timestamp, user_id } = req.params;

    let foundImage = null;

    try {
      foundImage = await db.getLatestImage(timestamp, user_id);
    } catch (err) {
      console.error(err);
      res.status(400).json({ error: "db_error" });
      return;
    }

    if (foundImage === null) {
      res.json(null);
      return;
    }

    if (typeof foundImage.detect_data === "string") {
      foundImage.detect_data = JSON.parse(foundImage.detect_data);
    }

    const retImage = {
      image_url: foundImage.image_url,
      date: foundImage.date,
      detect_data: foundImage.detect_data,
      detect_type: foundImage.detect_type,
      detections: foundImage.detections,
      user: {
        name: foundImage.user.name,
        country: foundImage.user.country,
      },
    };

    res.json(retImage);
  },

  handleUserImageIncrement: async (req, res, db) => {
    const { id, imageURL, detectData } = req.body;

    if (!id || isUrlValid(imageURL) || !detectData || !detectData.top_row) {
      res.status(400).json({ error: "invalid_params" });
      return;
    }
  },
};
