const token = localStorage.getItem("token");

if (!token) {
  window.location.href = "/";
}

const signOutButton = document.querySelector(".sign-out");
signOutButton.addEventListener("click", () => {
  localStorage.clear();
  window.location.href = "/";
});

const addTransactionButton = document.querySelector(".addTransaction");

async function checkCategories() {
  const categoryBody = document.querySelector(".category-body");
  const table = document.querySelector(".category-table");
  const categorySection = document.querySelector(".categories");
  const response = await fetch("/api/categories/", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const categories = await response.json();
  console.log(categories.categories);

  if (!categories.categories || categories.categories.length === 0) {
    addTransactionButton.disabled = true;
    addTransactionButton.style.pointerEvents = "none";
    addTransactionButton.style.opacity = "0.5";
    table.style.display = "none";
    const newPTag = document.createElement("p");
    newPTag.textContent = "No categories";
    categorySection.appendChild(newPTag);
  } else {
    table.style.display = "table";
    categories.categories.forEach((c) => {
      const row = document.createElement("tr");
      const nameCell = document.createElement("td");
      nameCell.textContent = c.name;

      const colorCell = document.createElement("td");
      colorCell.textContent = c.color;

      row.appendChild(nameCell);
      row.appendChild(colorCell);

      categoryBody.appendChild(row);
    });
  }
}

async function populateTransactionTable() {
  const transactionBody = document.querySelector(".transaction-body");
  const table = document.querySelector(".transaction-table");
  const transactionSection = document.querySelector(".transactions");

  const response = await fetch("/api/transactions/", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  const transaction = await response.json();

  if (!transaction.transactions || transaction.transactions.length === 0) {
    table.style.display = "none";
    const newPTag = document.createElement("p");
    newPTag.textContent = "No transactions";
    transactionSection.appendChild(newPTag);
  } else {
    table.style.display = "table";
    transaction.transactions.forEach((t) => {
      const row = document.createElement("tr");
      const amount = parseFloat(t.amount);
      const sign = t.type === "withdraw" ? "-" : "";
      const date = new Date(t.date).toISOString().split("T")[0];

      const dateCell = document.createElement("td");
      dateCell.textContent = date;

      const typeCell = document.createElement("td");
      const typeBadge = document.createElement("span");
      typeBadge.className = `type-badge ${t.type}`;
      typeBadge.textContent = t.type === "deposit" ? "Deposit" : "Withdraw";
      typeCell.appendChild(typeBadge);

      const categoryCell = document.createElement("td");
      categoryCell.textContent = t.category_name;

      const descCell = document.createElement("td");
      descCell.textContent = t.description;

      const amountCell = document.createElement("td");
      amountCell.className = `amount ${t.type}`;
      amountCell.textContent = `${sign}$${amount.toFixed(2)}`;

      // Append all cells to row
      row.appendChild(dateCell);
      row.appendChild(typeCell);
      row.appendChild(categoryCell);
      row.appendChild(descCell);
      row.appendChild(amountCell);

      transactionBody.appendChild(row);
    });
  }
}

document.addEventListener("DOMContentLoaded", () => {
  checkCategories();
  populateTransactionTable();
});
// document.addEventListener("DOMContentLoaded", populateTransactionTable);
