const urlPath = window.location.pathname;
const categoryId = urlPath.split("/").pop();

async function loadCategoryData() {
  const token = localStorage.getItem("token");
  try {
    const response = await fetch(`/api/categories/${categoryId}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const { category } = await response.json();

    document.getElementById("name").value = category.name;
    document.getElementById("categoryColor").value = category.color;
  } catch (err) {
    console.error("Error loading category:", err);
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  loadCategoryData();
});
