// // Check if token exists
// const token = localStorage.getItem("token");

// if (!token) {
//   // No token found, redirect to login
//   window.location.href = "/";
// }

const body = document.querySelector("body");
const newDiv = document.createElement("div");
const newH1 = document.createElement("h1");
newH1.textContent = "Made it to the dashboard!";
newDiv.appendChild(newH1);
body.appendChild(newDiv);
