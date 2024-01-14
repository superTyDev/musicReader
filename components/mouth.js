import * as faceLandmarksDetection from "@tensorflow-models/face-landmarks-detection";
import "@tensorflow/tfjs-backend-webgl";

let detector, video, event, turnRate;
const VIDEO_SIZE = 500;
let turnCount = 0;
let tempTurnRate = 0;
let rendering = true;
let rateInterval;
let canvas = document.createElement("canvas");
const MOFF_THRESHOLD = 0.25;

let turnLength = 1;
let repeatTurn = 0;

function initTurnRateCalculator() {
    rateInterval = setInterval(() => {
        turnRate = tempTurnRate * 6;
        tempTurnRate = 0;
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
            width: VIDEO_SIZE * 2,
            height: VIDEO_SIZE,
        },
    });

    video.srcObject = stream;

    video.play();
    video.width = VIDEO_SIZE * 2;
    video.height = VIDEO_SIZE;

    return new Promise((resolve) => {
        video.onloadedmetadata = () => {
            resolve(video);
            initTurnRateCalculator();
        };
    });
};

function stopPrediction() {
    rendering = false;
    clearInterval(rateInterval);
}
function updateTurnRate() {
    tempTurnRate++;
}

function euclideanDist(p1, p2) {
    const x1 = p1.x;
    const y1 = p1.y;
    const x2 = p2.x;
    const y2 = p2.y;

    return Math.sqrt((x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1));
}

function isVoluntaryTurn(turnDetected) {
    // NOTE: checking if blink is detected in consecutive cycles
    // NOTE: also increase time between triggers

    if (turnDetected) {
        turnCount++;
        if (turnCount > turnLength + repeatTurn) {
            turnCount = 0;
            repeatTurn = 60;
            return true;
        }
    } else {
        turnCount = 0;
        repeatTurn = 0;
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
            const p = prediction.keypoints;
            const p1 = p[10];
            const p2 = p[152];

            const lip1 = p[13];
            const lip2 = p[14];
            const p0 = { x: (lip1.x + lip2.x) / 2, y: (lip1.y + lip2.y) / 2 };

            const lipOffset =
                ((p2.x - p1.x) * (p1.y - p0.y) -
                    (p1.x - p0.x) * (p2.y - p1.y)) /
                euclideanDist(p1, p2);

            const lipLeft = p[61];
            const lipRight = p[291];
            const lipWidth = euclideanDist(lipLeft, lipRight);

            let turned = Math.abs(lipOffset / lipWidth) > MOFF_THRESHOLD;
            // console.log(`${lipOffset > 0 ? "left " : "right"}: ${turned ? "yes" : "no "}: ${Math.floor(Math.abs(lipOffset / lipWidth) * 100) / 100}`);

            if (turned) {
                updateTurnRate();
            }
            event = {
                signal: turned,
                longSignal: isVoluntaryTurn(turned),
                rate: turnRate,
                direction: lipOffset > 0 ? "left" : "right",
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
