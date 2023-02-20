import * as faceLandmarksDetection from "@tensorflow-models/face-landmarks-detection";
import "@tensorflow/tfjs-backend-webgl";

let detector, video, event, blinkRate;
const VIDEO_SIZE = 500;
let blinkCount = 0;
let tempBlinkRate = 0;
let rendering = true;
let rateInterval;
let canvas = document.createElement("canvas");
const EAR_THRESHOLD = 0.27;

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
	detector = await faceLandmarksDetection.createDetector(model, detectorConfig);
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
		if (blinkCount > 8) {
			blinkCount = 0;
			return true;
		}
	} else {
		blinkCount = 0;
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
			const leftEye = [p[33], p[160], p[158], p[133], p[153], p[144]];
			const leftEAR = getEAR(leftEye);

			const rightEye = [p[362], p[385], p[387], p[263], p[373], p[380]];
			const rightEAR = getEAR(rightEye);

			let blinked = leftEAR <= EAR_THRESHOLD && rightEAR <= EAR_THRESHOLD;
			if (blinked) {
				updateBlinkRate();
			}
			event = {
				left: leftEAR <= EAR_THRESHOLD,
				right: rightEAR <= EAR_THRESHOLD,
				wink: leftEAR <= EAR_THRESHOLD || rightEAR <= EAR_THRESHOLD,
				blink: blinked,
				longBlink: isVoluntaryBlink(blinked),
				rate: blinkRate,
			};
		});
	}
	return event;
}

const blink = {
	loadModel: loadModel,
	setUpCamera: setUpCamera,
	stopPrediction: stopPrediction,
	getBlinkPrediction: renderPrediction,
};

export default blink;
