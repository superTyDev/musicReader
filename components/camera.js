export default async function setupCamera(cameraParam) {
	if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
		throw new Error(
			"Browser API navigator.mediaDevices.getUserMedia not available"
		);
	}

	const videoConfig = {
		audio: false,
		video: {
			facingMode: "user",
		},
	};

	const stream = await navigator.mediaDevices.getUserMedia(videoConfig);

	const camera = new Camera();
	camera.video.srcObject = stream;

	await new Promise((resolve) => {
		camera.video.onloadedmetadata = () => {
			resolve(video);
		};
	});

	camera.video.play();

	const videoWidth = camera.video.videoWidth;
	const videoHeight = camera.video.videoHeight;
	// Must set below two lines, otherwise video element doesn't show.
	camera.video.width = videoWidth;
	camera.video.height = videoHeight;

	camera.canvas.width = videoWidth;
	camera.canvas.height = videoHeight;
	const canvasContainer = document.querySelector(".canvas-wrapper");
	canvasContainer.style = `width: ${videoWidth}px; height: ${videoHeight}px`;

	// Because the image from camera is mirrored, need to flip horizontally.
	camera.ctx.translate(camera.video.videoWidth, 0);
	camera.ctx.scale(-1, 1);

	return camera;
}
