const token = localStorage.getItem("token");

if (!token && window.location.pathname !== "/") {
  window.location.href = "/";
}

document.addEventListener("DOMContentLoaded", () => {
  const signOutButton = document.querySelector(".sign-out");
  signOutButton.addEventListener("click", () => {
    localStorage.clear();
    window.location.href = "/";
  });
});
