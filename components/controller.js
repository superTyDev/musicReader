var lastStop = 0;
var threshold = 18;
function handleOrientation(event) {
  const alpha = Math.abs(event.rotationRate.alpha);
  const beta = Math.abs(event.rotationRate.beta);
  const gamma = Math.abs(event.rotationRate.gamma);

  if (
    (alpha > threshold || beta > threshold || gamma > threshold) &&
    lastStop + 1000 < performance.now()
  ) {
    console.log("SHAKE");
    socket.emit("controlDir", "shake");
    lastStop = performance.now();
  }

  requestAnimationFrame(function () {
    document.body.style.background = "black";
  });
  // console.log(`${pad(parseInt(Math.abs(alpha)))}:${pad(parseInt(Math.abs(beta)))}:${pad(parseInt(Math.abs(gamma)))}`)
}

try {
  window.addEventListener("devicemotion", handleOrientation);
} catch (error) {
  console.error(error);
}

function allowOrientation() {
  if (typeof DeviceMotionEvent.requestPermission === "function") {
    // Handle iOS 13+ devices.
    DeviceMotionEvent.requestPermission()
      .then((state) => {
        if (state === "granted") {
          window.addEventListener("devicemotion", handleOrientation);
        } else {
          console.error("Request to access the orientation was rejected");
        }
      })
      .catch(console.error);
  } else {
    // Handle regular non iOS 13+ devices.
    window.addEventListener("devicemotion", handleOrientation);
  }
}

var slider = document.getElementById("myRange");

slider.oninput = function() {
  threshold = this.value;
}