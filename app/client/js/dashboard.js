let currentPage = 1;
let currentCategoryPage = 1;
const rowsPerPage = 5;
const categoriesPerPage = 5;

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

    const thead = document.createElement("thead");
    const headerRow = document.createElement("tr");

    const nameHeader = document.createElement("th");
    nameHeader.textContent = "NAME";

    const colorHeader = document.createElement("th");
    colorHeader.textContent = "COLOR";

    const actionsHeader = document.createElement("th");
    actionsHeader.textContent = "ACTIONS";

    headerRow.appendChild(nameHeader);
    headerRow.appendChild(colorHeader);
    headerRow.appendChild(actionsHeader);
    thead.appendChild(headerRow);

    table.insertBefore(thead, categoryBody);

    displayCategoryTable(currentCategoryPage, categories.categories);
  }
}

function displayCategoryTable(page, data) {
  const startIndex = (page - 1) * categoriesPerPage;
  const endIndex = startIndex + categoriesPerPage;
  const slicedData = data.slice(startIndex, endIndex);
  const categoryBody = document.querySelector(".category-body");

  categoryBody.innerHTML = "";

  slicedData.forEach((c) => {
    const row = document.createElement("tr");
    const nameCell = document.createElement("td");
    nameCell.textContent = c.name;

    const colorCell = document.createElement("td");
    const colorCircle = document.createElement("span");
    colorCircle.style.display = "inline-block";
    colorCircle.style.width = "var(--spacing5)";
    colorCircle.style.height = "var(--spacing3)";
    colorCircle.style.borderRadius = "3px";
    colorCircle.style.backgroundColor = c.color;
    colorCell.appendChild(colorCircle);

    const actionsCell = document.createElement("td");

    const editButton = document.createElement("button");
    const editIcon = document.createElement("span");
    editIcon.className = "fa-solid fa-pen";
    editButton.appendChild(editIcon);
    editButton.className = "edit-btn";
    editButton.onclick = function (e) {
      e.stopPropagation();
      window.location.href = `/category/edit/${c.id}`;
    };

    const deleteButton = document.createElement("button");
    const deleteIcon = document.createElement("span");
    deleteIcon.className = "fa-solid fa-trash-can";
    deleteButton.appendChild(deleteIcon);
    deleteButton.className = "delete-btn";
    deleteButton.onclick = async function (e) {
      e.stopPropagation();
      if (
        confirm(
          "Are you sure you want to delete this category? It will also delete the transaction(s) associated with the category?",
        )
      ) {
        await deleteCategory(c.id);
      }
    };

    actionsCell.appendChild(editButton);
    actionsCell.appendChild(deleteButton);

    row.appendChild(nameCell);
    row.appendChild(colorCell);
    row.append(actionsCell);

    categoryBody.appendChild(row);
  });

  updateCategoryPagination(page, data);
}

function updateCategoryPagination(currentPage, data) {
  const pageCount = Math.ceil(data.length / categoriesPerPage);
  let paginationContainer = document.querySelector(".category-pagination");

  // Create pagination container if it doesn't exist
  if (!paginationContainer) {
    paginationContainer = document.createElement("div");
    paginationContainer.className = "category-pagination";
    paginationContainer.style.marginTop = "10px";
    const categorySection = document.querySelector(".categories");
    categorySection.appendChild(paginationContainer);
  }

  paginationContainer.innerHTML = "";

  for (let i = 1; i <= pageCount; i++) {
    const pageLink = document.createElement("a");
    pageLink.href = "#";
    pageLink.innerText = i;
    pageLink.onclick = function (e) {
      e.preventDefault();
      currentCategoryPage = i;
      displayCategoryTable(i, data);
    };

    if (i === currentPage) {
      pageLink.style.fontWeight = "bold";
      pageLink.style.borderBottom = "1px solid var(--primary)";
    }
    paginationContainer.appendChild(pageLink);
    paginationContainer.appendChild(document.createTextNode(" "));
  }
}

async function fetchTransactionTable() {
  const table = document.querySelector(".transaction-table");
  const transactionSection = document.querySelector(".transactions");
  const transactionBody = document.querySelector(".transactions-body");

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

    const thead = document.createElement("thead");
    const headerRow = document.createElement("tr");

    const headers = ["DATE", "TYPE", "CATEGORY", "AMOUNT", "ACTIONS"];
    headers.forEach((headerText) => {
      const th = document.createElement("th");
      th.textContent = headerText;
      headerRow.appendChild(th);
    });

    thead.appendChild(headerRow);
    table.insertBefore(thead, transactionBody);
    displayTransactionTable(currentPage, transaction.transactions);
  }

  return transaction.transactions;
}

function displayTransactionTable(page, data) {
  // console.log(data);
  const startIndex = (page - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const slicedData = data.slice(startIndex, endIndex);
  const transactionBody = document.querySelector(".transaction-body");

  transactionBody.innerHTML = "";

  slicedData.forEach((t) => {
    const row = document.createElement("tr");
    const amount = parseFloat(t.amount);
    const sign = t.type === "withdraw" ? "-" : "";

    const date = t.date.split("T")[0].split("-");
    const dateCell = document.createElement("td");
    dateCell.textContent = `${date[1]}/${date[2]}/${date[0]}`;

    const typeCell = document.createElement("td");
    const typeBadge = document.createElement("span");
    typeBadge.className = `type-badge ${t.type}`;
    typeBadge.textContent = t.type === "deposit" ? "Deposit" : "Withdraw";
    typeCell.appendChild(typeBadge);

    const categoryCell = document.createElement("td");
    categoryCell.textContent = t.category_name;

    const amountCell = document.createElement("td");
    amountCell.className = `amount ${t.type}`;
    amountCell.textContent = `${sign}$${amount.toFixed(2)}`;

    const actionsCell = document.createElement("td");

    const editButton = document.createElement("button");
    const editIcon = document.createElement("span");
    editIcon.className = "fa-solid fa-pen";
    editButton.appendChild(editIcon);
    editButton.className = "edit-btn";
    editButton.onclick = function (e) {
      e.stopPropagation();
      window.location.href = `/transaction/edit/${t.id}`;
    };

    const deleteButton = document.createElement("button");
    const deleteIcon = document.createElement("span");
    deleteIcon.className = "fa-solid fa-trash-can";
    deleteButton.appendChild(deleteIcon);
    deleteButton.className = "delete-btn";
    deleteButton.onclick = async function (e) {
      e.stopPropagation();
      if (confirm("Are you sure you want to delete this transaction?")) {
        await deleteTransaction(t.id);
      }
    };

    actionsCell.appendChild(editButton);
    actionsCell.appendChild(deleteButton);

    row.appendChild(dateCell);
    row.appendChild(typeCell);
    row.appendChild(categoryCell);
    row.appendChild(amountCell);
    row.appendChild(actionsCell);

    transactionBody.appendChild(row);
  });

  updatePagination(page, data);
}

function updatePagination(currentPage, data) {
  const pageCount = Math.ceil(data.length / rowsPerPage);
  const paginationContainer = document.querySelector(".transaction-pagination");
  paginationContainer.innerHTML = "";

  for (let i = 1; i <= pageCount; i++) {
    const pageLink = document.createElement("a");
    pageLink.href = "#";
    pageLink.innerText = i;
    pageLink.onclick = function () {
      displayTransactionTable(i, data);
    };

    if (i === currentPage) {
      pageLink.style.fontWeight = "bold";
      pageLink.style.borderBottom = "1px solid var(--primary)";
    }
    paginationContainer.appendChild(pageLink);
    paginationContainer.appendChild(document.createTextNode(" "));
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  checkCategories();
  const transactions = await fetchTransactionTable();
  displaySummarySection(transactions);
});

function displaySummarySection(data) {
  const withdraws = data.filter((t) => t.type === "withdraw");
  const deposits = data.filter((t) => t.type === "deposit");

  const withdrawTotal = withdraws.reduce(
    (accumulator, withdraw) => accumulator + parseFloat(withdraw.amount),
    0,
  );
  const depositTotal = deposits.reduce(
    (accumulator, deposit) => accumulator + parseFloat(deposit.amount),
    0,
  );

  const remaining = depositTotal - withdrawTotal;

  const spentPercentage =
    depositTotal > 0 ? (withdrawTotal / depositTotal) * 100 : 0;

  // Build the HTML
  const summaryHTML = `
      <div class="summary-container">
        <h2>Summary</h2>
        <h3>Income: $${depositTotal.toFixed(2)}</h3>
        <div class="bar-container">
          <div class="bar-spent" style="width: ${spentPercentage}%"></div>
        </div>
        <div class="summary-labels">
          <span class="spent-label">Spent: $${withdrawTotal.toFixed(2)}</span>
          <span class="remaining-label">Remaining: $${remaining.toFixed(2)}</span>
        </div>
      </div>
    `;

  document.querySelector(".summary").innerHTML = summaryHTML;
}

async function deleteTransaction(transactionId) {
  try {
    const response = await fetch(`/api/transactions/${transactionId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.ok) {
      alert("Transaction deleted successfully!");
      window.location.reload();
    } else {
      alert("Failed to delete transaction");
    }
  } catch (err) {
    console.error("Error deleting transaction:", err);
    alert("An error occurred while deleting the transaction.");
  }
}

async function deleteCategory(categoryId) {
  try {
    const response = await fetch(`/api/categories/${categoryId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.ok) {
      alert("Category deleted successfully!");
      window.location.reload();
    } else {
      alert("Failed to delete category");
    }
  } catch (err) {
    console.error("Error deleting category:", err);
    alert("An error occurred while deleting the category.");
  }
}
