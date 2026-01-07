const urlPath = window.location.pathname;
const transactionId = urlPath.split("/").pop();

async function loadTransactionData() {
  try {
    const response = await fetch(`/api/transactions/${transactionId}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const { transaction } = await response.json();

    document.getElementById("type").value = transaction.type;
    document.getElementById("category").value = transaction.category_id;
    document.getElementById("amount").value = transaction.amount;
    document.getElementById("description").value =
      transaction.description || "";

    document.getElementById("date").value = transaction.date.split("T")[0];
  } catch (err) {
    console.error("Error loading transaction:", err);
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  await loadCategories();
  await loadTransactionData();
});
