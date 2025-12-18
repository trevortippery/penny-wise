const request = require("supertest");
const app = require("../app/app");
const pool = require("../db/db");

// Clean up after each test has ran
afterEach(async () => {
  await pool.query("DELETE FROM transactions");
  await pool.query("DELETE FROM categories");
  await pool.query("DELETE FROM users");
});

// Close pool after all tests have ran for transactions
afterAll(async () => {
  await pool.end();
});

const testEmail = "transactiontest@example.com";
const testPassword = "password123";

describe("POST /api/transactions", () => {
  let userId;
  let categoryId;

  beforeEach(async () => {
    // 1. Create user
    const userResponse = await request(app).post("/api/auth/register").send({
      email: testEmail,
      password: testPassword,
    });

    userId = userResponse.body.user.id;

    // 2. Create a test category
    const categoryResponse = await pool.query(
      "INSERT INTO categories (user_id, name, color) VALUES ($1, $2, $3) RETURNING *",
      [userId, "Test Category", "#FF5733"],
    );

    categoryId = categoryResponse.rows[0].id;
  });

  test("should create a transaction with valid data", async () => {
    const response = await request(app).post("/api/transactions").send({
      userId: userId,
      amount: 50.0,
      date: "2024-12-01",
      type: "deposit",
      categoryId: categoryId,
      description: "Test transaction",
    });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty(
      "message",
      "Transaction created successfully",
    );
    expect(response.body.transaction).toHaveProperty("id");
    expect(response.body.transaction).toHaveProperty("user_id", userId);
    expect(response.body.transaction).toHaveProperty("amount", "50.00");
    expect(response.body.transaction).toHaveProperty("type", "deposit");
  });

  test("should return 400 when user id is missing", async () => {
    await testPost400Error(
      {
        amount: 50.0,
        date: "2024-12-01",
        type: "deposit",
        categoryId: categoryId,
        description: "Test transaction",
      },
      "User id is required",
    );
  });

  test("should return 400 when amount is missing", async () => {
    await testPost400Error(
      {
        userId: userId,
        date: "2024-12-01",
        type: "deposit",
        categoryId: categoryId,
        description: "Test transaction",
      },
      "Amount for transaction is required",
    );
  });

  test("should return 400 when amount is zero", async () => {
    await testPost400Error(
      {
        userId: userId,
        amount: 0,
        date: "2024-12-01",
        type: "deposit",
        categoryId: categoryId,
        description: "Test transaction",
      },
      "Amount must be a non-zero number",
    );
  });

  test("should return 400 when date is missing", async () => {
    await testPost400Error(
      {
        userId: userId,
        amount: 50.0,
        type: "deposit",
        categoryId: categoryId,
        description: "Test transaction",
      },
      "Date is required for transaction",
    );
  });

  test("should return 400 for invalid date format", async () => {
    await testPost400Error(
      {
        userId: userId,
        amount: 50.0,
        date: "invalid-date",
        type: "deposit",
        categoryId: categoryId,
        description: "Test transaction",
      },
      "Invalid date format",
    );
  });

  test("should return 400 when type is missing", async () => {
    await testPost400Error(
      {
        userId: userId,
        amount: 50.0,
        date: "2024-12-01",
        categoryId: categoryId,
        description: "Test transaction",
      },
      "Transaction type is required",
    );
  });

  test("should return 400 for invalid transaction type", async () => {
    await testPost400Error(
      {
        userId: userId,
        amount: 50.0,
        date: "2024-12-01",
        type: "invalid_type",
        categoryId: categoryId,
        description: "Test transaction",
      },
      "Invalid type of transaction",
    );
  });

  test("should return 400 when categoryId is missing", async () => {
    await testPost400Error(
      {
        userId: userId,
        amount: 50.0,
        date: "2024-12-01",
        type: "deposit",
        description: "Test transaction",
      },
      "Category ID is required",
    );
  });

  test("should return 400 when categoryId is not a number", async () => {
    await testPost400Error(
      {
        userId: userId,
        amount: 50.0,
        date: "2024-12-01",
        type: "deposit",
        categoryId: "not-a-number",
        description: "Test transaction",
      },
      "Category ID must be a number",
    );
  });
});

describe("GET /api/transactions", () => {
  let userId;
  let categoryId;

  beforeEach(async () => {
    // Create user
    const userResponse = await request(app).post("/api/auth/register").send({
      email: testEmail,
      password: testPassword,
    });

    userId = userResponse.body.user.id;

    // Create category
    const categoryResponse = await pool.query(
      "INSERT INTO categories (user_id, name, color) VALUES ($1, $2, $3) RETURNING *",
      [userId, "Test Category", "#FF5733"],
    );

    categoryId = categoryResponse.rows[0].id;

    // Create transactions
    await request(app).post("/api/transactions").send({
      userId: userId,
      amount: 50.0,
      date: "2024-12-01",
      type: "deposit",
      categoryId: categoryId,
      description: "Transaction 1",
    });

    await request(app).post("/api/transactions").send({
      userId: userId,
      amount: 75.0,
      date: "2024-12-02",
      type: "withdraw",
      categoryId: categoryId,
      description: "Transaction 2",
    });
  });

  test("should get all transactions for a user", async () => {
    const response = await request(app).get(
      `/api/transactions?userId=${userId}`,
    );

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("transactions");
    expect(response.body.transactions).toHaveLength(2);
    expect(response.body.transactions[0]).toHaveProperty("user_id", userId);
  });

  test("should return 400 when userId is missing", async () => {
    const response = await request(app).get("/api/transactions");

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty("error", "User ID is required");
  });

  test("should return 400 for invalid userId format", async () => {
    const response = await request(app).get("/api/transactions?userId=invalid");

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty("error", "Invalid user ID");
  });
});

describe("GET /api/transactions/:id", () => {
  let userId;
  let categoryId;
  let transactionId;

  beforeEach(async () => {
    // Create user
    const userResponse = await request(app).post("/api/auth/register").send({
      email: testEmail,
      password: testPassword,
    });

    userId = userResponse.body.user.id;

    // Create category
    const categoryResponse = await pool.query(
      "INSERT INTO categories (user_id, name, color) VALUES ($1, $2, $3) RETURNING *",
      [userId, "Test Category", "#FF5733"],
    );

    categoryId = categoryResponse.rows[0].id;

    // Create a transaction
    const transactionResponse = await request(app)
      .post("/api/transactions")
      .send({
        userId: userId,
        amount: 100.0,
        date: "2024-12-01",
        type: "deposit",
        categoryId: categoryId,
        description: "Test transaction",
      });

    transactionId = transactionResponse.body.transaction.id;
  });

  test("should get a single transaction by id", async () => {
    const response = await request(app).get(
      `/api/transactions/${transactionId}`,
    );

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("transaction");
    expect(response.body.transaction).toHaveProperty("id", transactionId);
    expect(response.body.transaction).toHaveProperty("user_id", userId);
    expect(response.body.transaction).toHaveProperty("amount", "100.00");
  });

  test("should return 400 for invalid transaction ID format", async () => {
    const response = await request(app).get("/api/transactions/invalid");

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty("error", "Invalid transaction ID");
  });

  test("should return 404 when transaction not found", async () => {
    const response = await request(app).get("/api/transactions/999");

    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty("error", "Transaction not found");
  });
});

describe("PUT /api/transactions/:id", () => {
  let userId;
  let categoryId;
  let transactionId;

  beforeEach(async () => {
    // Create user
    const userResponse = await request(app).post("/api/auth/register").send({
      email: testEmail,
      password: testPassword,
    });

    userId = userResponse.body.user.id;

    // Create category
    const categoryResponse = await pool.query(
      "INSERT INTO categories (user_id, name, color) VALUES ($1, $2, $3) RETURNING *",
      [userId, "Test Category", "#FF5733"],
    );

    categoryId = categoryResponse.rows[0].id;

    // Create a transaction
    const transactionResponse = await request(app)
      .post("/api/transactions")
      .send({
        userId: userId,
        amount: 100.0,
        date: "2024-12-01",
        type: "deposit",
        categoryId: categoryId,
        description: "Original description",
      });

    transactionId = transactionResponse.body.transaction.id;
  });

  test("should update a transaction successfully", async () => {
    const response = await request(app)
      .put(`/api/transactions/${transactionId}`)
      .send({
        amount: 150.0,
        description: "Updated description",
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty(
      "message",
      "Transaction updated successfully",
    );
    expect(response.body.transaction).toHaveProperty("amount", "150.00");
    expect(response.body.transaction).toHaveProperty(
      "description",
      "Updated description",
    );
  });

  test("should return 400 for invalid transaction ID format", async () => {
    const response = await request(app).put("/api/transactions/invalid").send({
      amount: 150.0,
    });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty("error", "Invalid transaction ID");
  });

  test("should return 404 when transaction not found", async () => {
    const response = await request(app).put("/api/transactions/999").send({
      amount: 150.0,
    });

    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty("error", "Transaction not found");
  });

  test("should return 400 when amount is zero", async () => {
    const response = await request(app)
      .put(`/api/transactions/${transactionId}`)
      .send({
        amount: 0,
      });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty(
      "error",
      "Amount must be a non-zero number",
    );
  });

  test("should return 400 for invalid date format", async () => {
    const response = await request(app)
      .put(`/api/transactions/${transactionId}`)
      .send({
        date: "invalid-date",
      });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty("error", "Invalid date format");
  });

  test("should return 400 when no fields to update", async () => {
    const response = await request(app)
      .put(`/api/transactions/${transactionId}`)
      .send({});

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty("error", "No fields to update");
  });

  test("should not allow updating protected fields", async () => {
    const response = await request(app)
      .put(`/api/transactions/${transactionId}`)
      .send({
        id: 999, // Try to change ID
        user_id: 999, // Try to change user_id
        amount: 200.0, // Valid update
      });

    expect(response.status).toBe(200);
    expect(response.body.transaction).toHaveProperty("id", transactionId); // ID unchanged
    expect(response.body.transaction).toHaveProperty("user_id", userId); // user_id unchanged
    expect(response.body.transaction).toHaveProperty("amount", "200.00"); // Amount updated
  });
});

describe("DELETE /api/transactions/:id", () => {
  let userId;
  let categoryId;
  let transactionId;

  beforeEach(async () => {
    // Create user
    const userResponse = await request(app).post("/api/auth/register").send({
      email: testEmail,
      password: testPassword,
    });

    userId = userResponse.body.user.id;

    // Create category
    const categoryResponse = await pool.query(
      "INSERT INTO categories (user_id, name, color) VALUES ($1, $2, $3) RETURNING *",
      [userId, "Test Category", "#FF5733"],
    );

    categoryId = categoryResponse.rows[0].id;

    // Create a transaction
    const transactionResponse = await request(app)
      .post("/api/transactions")
      .send({
        userId: userId,
        amount: 100.0,
        date: "2024-12-01",
        type: "deposit",
        categoryId: categoryId,
        description: "Test transaction",
      });

    transactionId = transactionResponse.body.transaction.id;
  });

  test("should delete a transaction successfully", async () => {
    const response = await request(app).delete(
      `/api/transactions/${transactionId}`,
    );

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty(
      "message",
      "Transaction deleted successfully",
    );
    expect(response.body.transaction).toHaveProperty("id", transactionId);

    // Verify transaction is actually deleted
    const getResponse = await request(app).get(
      `/api/transactions/${transactionId}`,
    );

    expect(getResponse.status).toBe(404);
  });

  test("should return 400 for invalid transaction ID format", async () => {
    const response = await request(app).delete("/api/transactions/invalid");

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty("error", "Invalid transaction ID");
  });

  test("should return 404 when transaction not found", async () => {
    const response = await request(app).delete("/api/transactions/999");

    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty("error", "Transaction not found");
  });
});

// Helper function for testing 400 errors
async function testPost400Error(testUnit, message) {
  const response = await request(app).post("/api/transactions").send(testUnit);

  expect(response.status).toBe(400);
  expect(response.body).toHaveProperty("error", message);
}
