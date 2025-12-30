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

function validateTransactionForm(event) {
  return handleFormSubmit(event, "/api/transactions", {
    requiresAuth: true,
    redirectTo: "/",
    fieldMap: {},
  });
}
