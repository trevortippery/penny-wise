const token = localStorage.getItem("token");

if (!token) {
  // No token found, redirect to login
  window.location.href = "/";
}
