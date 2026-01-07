let currentTheme = localStorage.getItem("theme") || "light"; // default to light
if (currentTheme === "dark") {
  document.body.classList.add("dark");
}

function toggle() {
  if (currentTheme === "dark") {
    currentTheme = "light";
    document.body.classList.remove("dark");
  } else {
    currentTheme = "dark";
    document.body.classList.add("dark");
  }
  localStorage.setItem("theme", currentTheme);
}
