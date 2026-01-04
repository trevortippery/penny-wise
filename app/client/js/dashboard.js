const token = localStorage.getItem("token");
let currentPage = 1;
let currentCategoryPage = 1;
const rowsPerPage = 5;
const categoriesPerPage = 5;

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

    headerRow.appendChild(nameHeader);
    headerRow.appendChild(colorHeader);
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

    row.appendChild(nameCell);
    row.appendChild(colorCell);

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

    const headers = ["DATE", "TYPE", "CATEGORY", "DESCRIPTION", "AMOUNT"];
    headers.forEach((headerText) => {
      const th = document.createElement("th");
      th.textContent = headerText;
      headerRow.appendChild(th);
    });

    thead.appendChild(headerRow);
    table.insertBefore(thead, transactionBody);
    displayTransactionTable(currentPage, transaction.transactions);
  }
}

function displayTransactionTable(page, data) {
  const startIndex = (page - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const slicedData = data.slice(startIndex, endIndex);
  const transactionBody = document.querySelector(".transaction-body");

  transactionBody.innerHTML = "";

  slicedData.forEach((t) => {
    const row = document.createElement("tr");
    const amount = parseFloat(t.amount);
    const sign = t.type === "withdraw" ? "-" : "";
    const date = new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date(t.date));
    // Date(t.date).toISOString().split("T")[0];

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

    row.appendChild(dateCell);
    row.appendChild(typeCell);
    row.appendChild(categoryCell);
    row.appendChild(descCell);
    row.appendChild(amountCell);

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

document.addEventListener("DOMContentLoaded", () => {
  checkCategories();
  fetchTransactionTable();
});
