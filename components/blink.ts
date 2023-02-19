import * as faceLandmarksDetection from "@tensorflow-models/face-landmarks-detection";
import * as tf from "@tensorflow/tfjs-core";
import "@tensorflow/tfjs-backend-webgl";

let detector, video, event, dataUintArray, blinkRate;
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
		runtime: "tfjs" as const,
		refineLandmarks: true,
		// solutionPath: "https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh",
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

	// Change it, since it does not expect anything to return
	// return new Promise((resolve) => {
	// 	video.onloadedmetadata = () => {
	// 		resolve(video);
	// 		initBlinkRateCalculator();
	// 	};
	// });
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

function getEucledianDistance(x1, y1, x2, y2) {
	return Math.sqrt((x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1));
}

function getEAR(upper, lower) {
	return (
		(getEucledianDistance(upper[5][0], upper[5][1], lower[4][0], lower[4][1]) +
			getEucledianDistance(
				upper[3][0],
				upper[3][1],
				lower[2][0],
				lower[2][1]
			)) /
		(2 *
			getEucledianDistance(upper[0][0], upper[0][1], upper[8][0], upper[8][1]))
	);
}

function isVoluntaryBlink(blinkDetected) {
	// NOTE: checking if blink is detected in at least 5 consecutive cycles, values lesser than that can be considered a normal blink.
	// NOTE: adding this to distinguish intentional blinks
	if (blinkDetected) {
		blinkCount++;
		if (blinkCount > 4) {
			blinkCount = 0;
			return true;
		}
	} else {
		blinkCount = 0;
	}
	return false;
}

async function renderPrediction() {
	if (rendering) {
		video = video as HTMLVideoElement;
		
		const nVideo = tf.browser.fromPixels(video);
		console.log(nVideo);
		console.log(video);
		console.log(typeof nVideo);
		const predictions = await detector.estimateFaces({
			input: {data: nVideo.data, width: nVideo.shape[0], height: nVideo.shape[1]},

			returnTensors: false,
			flipHorizontal: false,
			predictIrises: true,
		});

		//  {
		// 	data: inputArray,
		// 	width: bitmapFrame.width,
		// 	height: bitmapFrame.height,
		// }

		if (predictions.length > 0) {
			predictions.forEach((prediction) => {
				// NOTE: Error in docs, rightEyeLower0 is mapped to rightEyeUpper0 and vice-versa
				let lowerRight = prediction.annotations.rightEyeUpper0;
				let upperRight = prediction.annotations.rightEyeLower0;
				const rightEAR = getEAR(upperRight, lowerRight);
				// TODO: log this prediction
				let lowerLeft = prediction.annotations.leftEyeUpper0;
				let upperLeft = prediction.annotations.leftEyeLower0;
				const leftEAR = getEAR(upperLeft, lowerLeft);

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
