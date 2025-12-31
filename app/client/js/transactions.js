async function loadCategories() {
  const token = localStorage.getItem("token");

  try {
    const response = await fetch("/api/categories/", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const categories = await response.json();
    console.log(categories);

    if (categories.categories.length === 0) {
      alert("");
    }

    const categorySelect = document.getElementById("category");

    categorySelect.innerHTML =
      "<option value='' disabled selected>Select a category</option";

    categories.categories.forEach((category) => {
      const option = document.createElement("option");
      option.value = category.id;
      option.textContent = category.name;
      categorySelect.appendChild(option);
    });
  } catch (error) {
    console.error("Error loading categories:", error);
    alert("Failed to load categories");
  }
}

document.addEventListener("DOMContentLoaded", loadCategories());
