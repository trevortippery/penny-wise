const token = localStorage.getItem("token");

if (!token) {
  // No token found, redirect to login
  window.location.href = "/";
}

const signOutButton = document.querySelector(".sign-out");
signOutButton.addEventListener("click", () => {
  localStorage.clear();
  window.location.href = "/";
});
