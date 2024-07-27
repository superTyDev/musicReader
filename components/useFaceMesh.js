// hooks/useFaceMesh.js
import { useEffect, useRef } from 'react';
import '@tensorflow/tfjs';
import * as facemesh from '@tensorflow-models/facemesh';

const useFaceMesh = (onBlink) => {
  const videoRef = useRef(null);
  const modelRef = useRef(null);
  const rafId = useRef(null);
  const countThreshold = 3;
  const blinkDefault = -2;
  let blinkCount = {
    left: blinkDefault,
    right: blinkDefault,
  };

  useEffect(() => {
    const loadModel = async () => {
      modelRef.current = await facemesh.load({
        inputResolution: { width: 640, height: 480 },
        scale: 0.8
      });
      startVideo();
    };

    const startVideo = async () => {
      const video = videoRef.current;
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true
      });
      video.srcObject = stream;
      video.onloadedmetadata = () => video.play();
      video.onplay = () => {
        rafId.current = requestAnimationFrame(predictLandmarks);
      };
    };

    const predictLandmarks = async () => {
      const video = videoRef.current;
      if (modelRef.current && video?.readyState === 4) {
        const predictions = await modelRef.current.estimateFaces(video, false);
        if (predictions.length > 0) {
          const keypoints = predictions[0].scaledMesh;
          const leftEyePoints = LEFT_EYE_INDICES.map(index => keypoints[index]);
          const rightEyePoints = RIGHT_EYE_INDICES.map(index => keypoints[index]);

          const leftEAR = calcEAR(leftEyePoints);
          const rightEAR = calcEAR(rightEyePoints);

          // console.log("Left EAR:", Math.floor(leftEAR * 100), "Right EAR:", Math.floor(rightEAR * 100));
          console.log("Difference: ", Math.round((leftEAR - rightEAR) * 100));

          if (isBlink(leftEAR) && isBlink(rightEAR) || !(isBlink(leftEAR) || isBlink(rightEAR))) {
            blinkCount = {
              left: blinkDefault,
              right: blinkDefault,
            }
          }
          if (isBlink(leftEAR)) {
            blinkCount.left++;
            if (blinkCount.left >= countThreshold) {
              onBlink("camPrevious") 
            }
          }
          if (isBlink(rightEAR)) {
            blinkCount.right++;
            if (blinkCount.right >= countThreshold) {
              onBlink("camNext")
            }
          }
        }
        rafId.current = requestAnimationFrame(predictLandmarks);
      }
    };

    const stopVideo = () => {
      if (rafId.current) {
        cancelAnimationFrame(rafId.current);
      }
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject;
        const tracks = stream.getTracks();
        tracks.forEach(track => track.stop());
        videoRef.current.srcObject = null;
      }
    };

    loadModel();

    return () => {
      stopVideo();
    };
  }, [onBlink]);

  return videoRef;
};

const calcEAR = (p) => {
  const horizontalDist = distance(p[0], p[3]);
  const verticalDist1 = distance(p[2], p[4]);
  const verticalDist2 = distance(p[1], p[5]);
  return (verticalDist1 + verticalDist2) / (2.0 * horizontalDist);
};

const distance = (point1, point2) => {
  return Math.sqrt(
    Math.pow(point1[0] - point2[0], 2) + Math.pow(point1[1] - point2[1], 2)
  );
};

const isBlink = (aspectRatio) => {
  return aspectRatio < BLINK_THRESHOLD;
};

const LEFT_EYE_INDICES = [33, 160, 158, 133, 153, 144];
const RIGHT_EYE_INDICES = [362, 385, 387, 263, 373, 380];
const BLINK_THRESHOLD = 0.24;

export default useFaceMesh;
