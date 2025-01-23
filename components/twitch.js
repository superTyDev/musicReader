import * as faceapi from "face-api.js";

let video = null;

const loadModels = async () => {
  await faceapi.nets.tinyFaceDetector.loadFromUri("/models");
  await faceapi.nets.faceLandmark68Net.loadFromUri("/models");
};

const startVideo = () => {
  return new Promise((resolve, reject) => {
    navigator.mediaDevices
      .getUserMedia({
        video: {
          width: { max: 640 / 2 },
          height: { max: 480 / 2 },
        },
      })
      .then(
        (stream) => {
          if (video) {
            video.srcObject = stream;
            video.onloadedmetadata = () => {
              video.play();
              resolve(true);
            };
          } else {
            reject(new Error("No video element found"));
          }
        },
        (err) => reject(err)
      );
  });
};

const getPrediction = async () => {
  if (video && video.readyState === 4) {
    // console.log(video.videoHeight + " x " + video.videoWidth);
    const detection = await faceapi
      .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks();
    if (detection) {
      const resizedDetections = faceapi.resizeResults(detection, {
        width: video.videoWidth,
        height: video.videoHeight,
      });
      const angle = detectMouthTwitch(resizedDetections.landmarks);
      return angle;
    }
  }
};

const detectMouthTwitch = (landmarks) => {
  const getCenterPoint = (points) => {
    const sum = points.reduce(
      (acc, point) => {
        acc._x += point._x;
        acc._y += point._y;
        return acc;
      },
      { _x: 0, _y: 0 }
    );
    return { _x: sum._x / points.length, _y: sum._y / points.length };
  };

  const calculateAngle = (point1, point2) => {
    return (
      Math.atan2(point2._y - point1._y, point2._x - point1._x) * (180 / Math.PI)
    );
  };

  const mouthCenter = getCenterPoint(landmarks.getMouth());
  const noseTop = landmarks.getNose()[0];
  const leftEyebrowInner = landmarks.getLeftEyeBrow()[2]; // Inner point of the left eyebrow
  const rightEyebrowInner = landmarks.getRightEyeBrow()[2]; // Inner point of the right eyebrow

  const noseToMouthAngle = calculateAngle(noseTop, mouthCenter);
  const eyebrowToEyebrowAngle = calculateAngle(
    leftEyebrowInner,
    rightEyebrowInner
  );

  const angleDifference = noseToMouthAngle - eyebrowToEyebrowAngle;

  return angleDifference - 90;
};

const twitch = {
  loadModels,
  startVideo,
  getPrediction,
  setVideoRef: (videoRef) => {
    video = videoRef;
  },
};

export default twitch;
