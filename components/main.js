const chatForm = document.getElementById("chat-form");
const chatMessages = document.querySelector(".chat-messages");
const roomName = document.getElementById("room-name");
const userList = document.getElementById("users");

// Get username and room from URL
const { username, room, type } = Qs.parse(location.search, {
  ignoreQueryPrefix: true,
});

console.log({ username, room, type });

const socket = io();

// Join chatroom
socket.emit("joinRoom", { username, room, type });

// Get room and users
socket.on("roomUsers", ({ room, users }) => {
  outputRoomName(room);
  outputUsers(users);
});

// Message from server
socket.on("message", (message) => {
  console.log(message);
  outputMessage(message);

});

// Output message to DOM
function outputMessage(message) {
  if (message.username == "WebCage") {
    toastMessage(message.text);
  } else {
  }
}

// Add room name to DOM
function outputRoomName(room) {
  roomName.innerText = room;
}

// Add users to DOM
function outputUsers(users) {
  console.log({ users });
  userList.innerHTML = "";
  users.forEach((user) => {
    const li = document.createElement("li");
    li.innerText = user.username;
    userList.appendChild(li);
  });
}

//Prompt the user before leave chat room
document.getElementById("leave-btn").addEventListener("click", () => {
  const leaveRoom = confirm("Are you sure you want to leave the chatroom?");
  if (leaveRoom) {
    window.location = "../index.html";
  }
});

// Resizable
// Query the element
const ele = document.getElementById("sidebar");

// The current position of mouse
let x = 0;
// let y = 0;

// The dimension of the element
let w = 0;
// let h = 0;

// Handle the mousedown event
// that's triggered when user drags the resizer
const mouseDownHandler = function (e) {
  // Get the current mouse position
  console.log("mouse down");
    x = e.clientX;
  // y = e.clientY;

  // Calculate the dimension of element
  const styles = window.getComputedStyle(ele);
  w = parseInt(styles.width, 10);
  // h = parseInt(styles.height, 10);

  // Attach the listeners to `document`
  document.addEventListener("mousemove", mouseMoveHandler);
  document.addEventListener("mouseup", mouseUpHandler);
};

const mouseMoveHandler = function (e) {
  // How far the mouse has been moved
  console.log("mouse move");
  
  const dx = e.clientX - x;
  // const dy = e.clientY - y;

  // Adjust the dimension of element
  ele.style.width = `${w + dx}px`;
  // ele.style.height = `${h + dy}px`;
};

const mouseUpHandler = function () {
  // Remove the handlers of `mousemove` and `mouseup`
  console.log("mouse up");
  
  document.removeEventListener("mousemove", mouseMoveHandler);
  document.removeEventListener("mouseup", mouseUpHandler);
};

// Query all resizers
const resizers = ele.querySelectorAll(".resizer");

// Loop over them
[].forEach.call(resizers, function (resizer) {
  resizer.addEventListener("mousedown", mouseDownHandler);
});

// Toast
var toastTimeout;
function toastMessage(text) {
  var x = document.getElementById("snackbar");
  x.classList.add("show");
  x.innerHTML = text;
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(function () {
    x.className = x.classList.remove("show");
  }, 3000);
}