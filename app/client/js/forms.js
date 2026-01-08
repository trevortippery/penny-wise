async function handleFormSubmit(event, endpoint, options = {}) {
  event.preventDefault();

  const formData = {};
  const form = event.target;

  const inputs = form.querySelectorAll("input, select, textarea");
  inputs.forEach((input) => {
    if (input.name) {
      formData[input.name] = input.value;
    }
  });

  if (options.fieldMap) {
    Object.keys(options.fieldMap).forEach((oldKey) => {
      const newKey = options.fieldMap[oldKey];
      if (formData[oldKey] !== undefined) {
        formData[newKey] = formData[oldKey];
        delete formData[oldKey];
      }
    });
  }

  const headers = {
    "Content-Type": "application/json",
  };

  if (options.requiresAuth) {
    const token = localStorage.getItem("token");
    headers.Authorization = `Bearer ${token}`;
  }

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers,
      body: JSON.stringify(formData),
    });

    const data = await response.json();

    if (response.ok) {
      if (data.token) {
        localStorage.setItem("token", data.token);
      }

      window.location.href = options.redirectTo || "/";
    } else {
      alert(data.error || "An error occurred");
    }
  } catch (error) {
    console.error("Error:", error);
    alert("An error occurred. Please try again.");
  }

  return false;
}

async function validateTransactionForm(event) {
  event.preventDefault();

  const form = event.target;
  const token = localStorage.getItem("token");

  const formData = {
    type: form.type.value,
    categoryId: parseInt(form.category.value),
    amount: parseFloat(form.amount.value),
    description: form.description.value,
    date: form.date.value,
  };

  try {
    const response = await fetch("/api/transactions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(formData),
    });

    const data = await response.json();

    if (response.ok) {
      window.location.href = "/dashboard";
    } else {
      alert(data.error || "An error occurred");
    }
  } catch (error) {
    console.error("Error:", error);
    alert("An error occurred. Please try again.");
  }

  return false;
}

function validateRegisterForm(event) {
  return handleFormSubmit(event, "/api/auth/register", {
    redirectTo: "/",
  });
}

function validateLoginForm(event) {
  return handleFormSubmit(event, "/api/auth/login", {
    redirectTo: "/dashboard",
  });
}

function validateCategoryForm(event) {
  return handleFormSubmit(event, "/api/categories", {
    requiresAuth: true,
    redirectTo: "/dashboard",
    fieldMap: { categoryColor: "color" },
  });
}

async function editTransactionForm(event) {
  event.preventDefault();

  const token = localStorage.getItem("token");
  const urlPath = window.location.pathname;
  const transactionId = urlPath.split("/").pop();

  const formData = {
    type: document.getElementById("type").value,
    category_id: document.getElementById("category").value,
    amount: document.getElementById("amount").value,
    description: document.getElementById("description").value,
    date: document.getElementById("date").value,
  };

  formData.amount = parseFloat(formData.amount);

  try {
    const response = await fetch(`/api/transactions/${transactionId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(formData),
    });

    if (response.ok) {
      alert("Transaction updated successfully!");
      window.location.href = "/dashboard";
    } else {
      const error = await response.json();
      alert(
        `Failed to update transaction: ${error.message || "Unknown error"}`,
      );
    }
  } catch (error) {
    console.error("Error updating transaction:", error);
    alert("An error occurred while updating the transaction");
  }
}

async function editCategoryForm(event) {
  event.preventDefault();

  const token = localStorage.getItem("token");
  const urlPath = window.location.pathname;
  const categoryId = urlPath.split("/").pop();

  const formData = {
    name: document.getElementById("name").value,
    color: document.getElementById("categoryColor").value,
  };

  try {
    const response = await fetch(`/api/categories/${categoryId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(formData),
    });

    if (response.ok) {
      alert("Category updated successfully!");
      window.location.href = "/dashboard";
    } else {
      const error = await response.json();
      alert(`Failed to update category: ${error.message || "Unknown error"}`);
    }
  } catch (error) {
    console.error("Error updating category:", error);
    alert("An error occurred while updating the category");
  }
}
