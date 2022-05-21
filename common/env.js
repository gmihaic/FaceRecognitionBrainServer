import * as faceapi from "face-api.js";
// implements nodejs wrappers for HTMLCanvasElement, HTMLImageElement, ImageData
import canvas from "canvas";

faceapi.Box.prototype.toJSON = function() {
  return {
    x: this.x,
    y: this.y,
    width: this.width,
    height: this.height,
  };
};

// patch nodejs environment, we need to provide an implementation of
// HTMLCanvasElement and HTMLImageElement
const { Canvas, Image, ImageData } = canvas;
faceapi.env.monkeyPatch({ Canvas, Image, ImageData });

export { canvas };
