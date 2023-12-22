import * as faceLandmarksDetection from "@tensorflow-models/face-landmarks-detection";
import "@tensorflow/tfjs-backend-webgl";

let detector, video, event, blinkRate;
const VIDEO_SIZE = 500;
let blinkCount = 0;
let tempBlinkRate = 0;
let rendering = true;
let rateInterval;
let canvas = document.createElement("canvas");
const MOFF_THRESHOLD = 0.2;

let blinkLength = 1;
let repeatBlink = 0;

function initBlinkRateCalculator() {
    rateInterval = setInterval(() => {
        blinkRate = tempBlinkRate * 6;
        tempBlinkRate = 0;
    }, 10000);
}

const loadModel = async () => {
    const model = faceLandmarksDetection.SupportedModels.MediaPipeFaceMesh;
    const detectorConfig = {
        runtime: "mediapipe",
        solutionPath: "https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh",
    };
    detector = await faceLandmarksDetection.createDetector(
        model,
        detectorConfig
    );
};

const setUpCamera = async (videoElement) => {
    video = videoElement;
    const mediaDevices = await global.navigator.mediaDevices.enumerateDevices();

    const defaultWebcam = mediaDevices.find(
        (device) =>
            device.kind === "videoinput" && device.label.includes("Built-in")
    );

    const cameraId = defaultWebcam ? defaultWebcam?.deviceId : undefined;

    const stream = await global.navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
            facingMode: "user",
            deviceId: cameraId,
            width: VIDEO_SIZE,
            height: VIDEO_SIZE,
        },
    });

    video.srcObject = stream;

    video.play();
    video.width = VIDEO_SIZE;
    video.height = VIDEO_SIZE;

    return new Promise((resolve) => {
        video.onloadedmetadata = () => {
            resolve(video);
            initBlinkRateCalculator();
        };
    });
};

function stopPrediction() {
    rendering = false;
    clearInterval(rateInterval);
}
function updateBlinkRate() {
    tempBlinkRate++;
}

function euclideanDist(p1, p2) {
    const x1 = p1.x;
    const y1 = p1.y;
    const x2 = p2.x;
    const y2 = p2.y;

    return Math.sqrt((x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1));
}

function getEAR(p) {
    return (
        (euclideanDist(p[1], p[5]) + euclideanDist(p[2], p[4])) /
        (2 * euclideanDist(p[0], p[3]))
    );
}

function isVoluntaryBlink(blinkDetected) {
    // NOTE: checking if blink is detected in at least 5 consecutive cycles, values lesser than that can be considered a normal blink.
    // NOTE: adding this to distinguish intentional blinks
    if (blinkDetected) {
        blinkCount++;
        if (blinkCount > blinkLength + repeatBlink) {
            blinkCount = 0;
            repeatBlink = 32;
            return true;
        }
    } else {
        blinkCount = 0;
        repeatBlink = 0;
    }
    return false;
}

async function renderPrediction() {
    const predictions = await detector.estimateFaces(video, {
        returnTensors: false,
        flipHorizontal: false,
        predictIrises: true,
    });

    if (predictions.length > 0) {
        predictions.forEach((prediction) => {
            // NOTE: Error in docs, rightEyeLower0 is mapped to rightEyeUpper0 and vice-versa
            const p = prediction.keypoints;
            const p1 = p[10];
            const p2 = p[152];

            const lip1 = p[13];
            const lip2 = p[14];
            const p0 = { x: (lip1.x + lip2.x) / 2, y: (lip1.y + lip2.y) / 2 };

            const lipOffset =
                Math.abs(
                    (p2.x - p1.x) * (p1.y - p0.y) -
                        (p1.x - p0.x) * (p2.y - p1.y)
                ) / euclideanDist(p1, p2);

            const lipLeft = p[61];
            const lipRight = p[291];
            const lipWidth = euclideanDist(lipLeft, lipRight);

            // const leftDepart = euclideanDist(p[75], p[61]) / lipWidth;

            // console.log(`${Math.floor(lipOffset * 1000 / lipWidth) / 1000}`);
            let blinked = lipOffset / lipWidth > MOFF_THRESHOLD;
            if (blinked) {
                updateBlinkRate();
            }
            event = {
                signal: blinked,
                longSignal: isVoluntaryBlink(blinked),
                rate: blinkRate,
            };
        });
    }
    return event;
}

const mouth = {
    loadModel: loadModel,
    setUpCamera: setUpCamera,
    stopPrediction: stopPrediction,
    getMouthPrediction: renderPrediction,
};

export default mouth;
