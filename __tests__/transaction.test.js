const request = require("supertest");
const app = require("../app/app");
const pool = require("../db/db");
const testUtils = require("./tests-util");

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

// Test variables
const testEmail = "transactiontest@example.com";
const testPassword = "password123";
const registerRoute = "/api/auth/register";
const loginRoute = "/api/auth/login";
const transactionsRoute = "/api/transactions";

describe("POST /api/transactions", () => {
  let userId;
  let authToken;
  let categoryId;

  beforeEach(async () => {
    // Create user
    const userResponse = await request(app).post(registerRoute).send({
      email: testEmail,
      password: testPassword,
    });
    userId = userResponse.body.user.id;

    // Login to get token
    const loginResponse = await request(app).post(loginRoute).send({
      email: testEmail,
      password: testPassword,
    });
    authToken = loginResponse.body.token;

    // Create a test category
    const categoryResponse = await pool.query(
      "INSERT INTO categories (user_id, name, color) VALUES ($1, $2, $3) RETURNING *",
      [userId, "Test Category", "#FF5733"],
    );
    categoryId = categoryResponse.rows[0].id;
  });

  test("should create a transaction with valid data", async () => {
    const response = await request(app)
      .post(transactionsRoute)
      .set("Authorization", `Bearer ${authToken}`)
      .send({
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

  test("should return 401 when no token provided", async () => {
    await testUtils.testError({
      route: transactionsRoute,
      testUnit: {
        amount: 50.0,
        date: "2024-12-01",
        type: "deposit",
        categoryId: categoryId,
      },
      statusCode: 401,
      message: "No token provided",
      crudAction: "POST",
    });
  });

  test("should return 400 when amount is missing", async () => {
    await testUtils.testError({
      route: transactionsRoute,
      testUnit: {
        date: "2024-12-01",
        type: "deposit",
        categoryId: categoryId,
      },
      authToken: authToken,
      statusCode: 400,
      message: "Amount for transaction is required",
      crudAction: "POST",
    });
  });

  test("should return 400 when amount is zero", async () => {
    await testUtils.testError({
      route: transactionsRoute,
      testUnit: {
        amount: 0,
        date: "2024-12-01",
        type: "deposit",
        categoryId: categoryId,
      },
      authToken: authToken,
      statusCode: 400,
      message: "Amount must be a non-zero number",
      crudAction: "POST",
    });
  });

  test("should return 400 for invalid date format", async () => {
    await testUtils.testError({
      route: transactionsRoute,
      testUnit: {
        amount: 50.0,
        date: "invalid-date",
        type: "deposit",
        categoryId: categoryId,
      },
      authToken: authToken,
      statusCode: 400,
      message: "Invalid date format",
      crudAction: "POST",
    });
  });

  test("should return 400 for invalid transaction type", async () => {
    await testUtils.testError({
      route: transactionsRoute,
      testUnit: {
        amount: 50.0,
        date: "2024-12-01",
        type: "invalid_type",
        categoryId: categoryId,
      },
      authToken: authToken,
      statusCode: 400,
      message: "Invalid type of transaction",
      crudAction: "POST",
    });
  });

  test("should return 400 when categoryId is missing", async () => {
    await testUtils.testError({
      route: transactionsRoute,
      testUnit: {
        amount: 50.0,
        date: "2024-12-01",
        type: "deposit",
      },
      authToken: authToken,
      statusCode: 400,
      message: "Category ID is required",
      crudAction: "POST",
    });
  });
});

describe("GET /api/transactions", () => {
  let userId;
  let authToken;
  let categoryId;

  beforeEach(async () => {
    // Create user and login
    const userResponse = await request(app).post(registerRoute).send({
      email: testEmail,
      password: testPassword,
    });
    userId = userResponse.body.user.id;

    const loginResponse = await request(app).post(loginRoute).send({
      email: testEmail,
      password: testPassword,
    });
    authToken = loginResponse.body.token;

    // Create category
    const categoryResponse = await pool.query(
      "INSERT INTO categories (user_id, name, color) VALUES ($1, $2, $3) RETURNING *",
      [userId, "Test Category", "#FF5733"],
    );
    categoryId = categoryResponse.rows[0].id;

    // Create transactions
    await request(app)
      .post(transactionsRoute)
      .set("Authorization", `Bearer ${authToken}`)
      .send({
        amount: 50.0,
        date: "2024-12-01",
        type: "deposit",
        categoryId: categoryId,
        description: "Transaction 1",
      });

    await request(app)
      .post(transactionsRoute)
      .set("Authorization", `Bearer ${authToken}`)
      .send({
        amount: 75.0,
        date: "2024-12-02",
        type: "withdraw",
        categoryId: categoryId,
        description: "Transaction 2",
      });
  });

  test("should get all transactions for authenticated user", async () => {
    const response = await request(app)
      .get(transactionsRoute)
      .set("Authorization", `Bearer ${authToken}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("transactions");
    expect(response.body.transactions).toHaveLength(2);
    expect(response.body.transactions[0]).toHaveProperty("user_id", userId);
  });

  test("should return 401 when no token provided", async () => {
    await testUtils.testError({
      route: transactionsRoute,
      statusCode: 401,
      message: "No token provided",
      crudAction: "GET",
    });
  });

  test("should only return authenticated user's transactions", async () => {
    // Create second user
    const user2Response = await request(app).post(registerRoute).send({
      email: "user2@example.com",
      password: testPassword,
    });
    const user2Id = user2Response.body.user.id;

    const user2LoginResponse = await request(app).post(loginRoute).send({
      email: "user2@example.com",
      password: testPassword,
    });
    const user2Token = user2LoginResponse.body.token;

    // Create category for user 2
    const cat2Response = await pool.query(
      "INSERT INTO categories (user_id, name, color) VALUES ($1, $2, $3) RETURNING *",
      [user2Id, "User 2 Category", "#FF5733"],
    );

    // Create transaction for user 2
    await request(app)
      .post(transactionsRoute)
      .set("Authorization", `Bearer ${user2Token}`)
      .send({
        amount: 100.0,
        date: "2024-12-03",
        type: "deposit",
        categoryId: cat2Response.rows[0].id,
        description: "User 2 transaction",
      });

    // User 1 should only see their 2 transactions
    const response = await request(app)
      .get(transactionsRoute)
      .set("Authorization", `Bearer ${authToken}`);

    expect(response.status).toBe(200);
    expect(response.body.transactions).toHaveLength(2);
    expect(response.body.transactions.every((t) => t.user_id === userId)).toBe(
      true,
    );
  });
});

describe("GET /api/transactions/:id", () => {
  let userId;
  let authToken;
  let categoryId;
  let transactionId;

  beforeEach(async () => {
    // Create user and login
    const userResponse = await request(app).post(registerRoute).send({
      email: testEmail,
      password: testPassword,
    });
    userId = userResponse.body.user.id;

    const loginResponse = await request(app).post(loginRoute).send({
      email: testEmail,
      password: testPassword,
    });
    authToken = loginResponse.body.token;

    // Create category
    const categoryResponse = await pool.query(
      "INSERT INTO categories (user_id, name, color) VALUES ($1, $2, $3) RETURNING *",
      [userId, "Test Category", "#FF5733"],
    );
    categoryId = categoryResponse.rows[0].id;

    // Create a transaction
    const transactionResponse = await request(app)
      .post(transactionsRoute)
      .set("Authorization", `Bearer ${authToken}`)
      .send({
        amount: 100.0,
        date: "2024-12-01",
        type: "deposit",
        categoryId: categoryId,
        description: "Test transaction",
      });

    transactionId = transactionResponse.body.transaction.id;
  });

  test("should get a single transaction by id", async () => {
    const response = await request(app)
      .get(`${transactionsRoute}/${transactionId}`)
      .set("Authorization", `Bearer ${authToken}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("transaction");
    expect(response.body.transaction).toHaveProperty("id", transactionId);
    expect(response.body.transaction).toHaveProperty("user_id", userId);
    expect(response.body.transaction).toHaveProperty("amount", "100.00");
  });

  test("should return 404 when trying to access another user's transaction", async () => {
    // Create second user
    const user2Response = await request(app).post(registerRoute).send({
      email: "user2@example.com",
      password: testPassword,
    });

    const user2LoginResponse = await request(app).post(loginRoute).send({
      email: "user2@example.com",
      password: testPassword,
    });
    const user2Token = user2LoginResponse.body.token;

    // User 2 tries to access User 1's transaction
    await testUtils.testError({
      route: `${transactionsRoute}/${transactionId}`,
      authToken: user2Token,
      statusCode: 404,
      message: "Transaction not found",
      crudAction: "GET",
    });
  });

  test("should return 400 for invalid transaction ID format", async () => {
    await testUtils.testError({
      route: `${transactionsRoute}/invalid`,
      authToken: authToken,
      statusCode: 400,
      message: "Invalid transaction ID",
      crudAction: "GET",
    });
  });
});

describe("PUT /api/transactions/:id", () => {
  let userId;
  let authToken;
  let categoryId;
  let transactionId;

  beforeEach(async () => {
    const userResponse = await request(app).post(registerRoute).send({
      email: testEmail,
      password: testPassword,
    });
    userId = userResponse.body.user.id;

    const loginResponse = await request(app).post(loginRoute).send({
      email: testEmail,
      password: testPassword,
    });
    authToken = loginResponse.body.token;

    const categoryResponse = await pool.query(
      "INSERT INTO categories (user_id, name, color) VALUES ($1, $2, $3) RETURNING *",
      [userId, "Test Category", "#FF5733"],
    );
    categoryId = categoryResponse.rows[0].id;

    const transactionResponse = await request(app)
      .post(transactionsRoute)
      .set("Authorization", `Bearer ${authToken}`)
      .send({
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
      .put(`${transactionsRoute}/${transactionId}`)
      .set("Authorization", `Bearer ${authToken}`)
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

  test("should return 404 when trying to update another user's transaction", async () => {
    const user2Response = await request(app).post(registerRoute).send({
      email: "user2@example.com",
      password: testPassword,
    });

    const user2LoginResponse = await request(app).post(loginRoute).send({
      email: "user2@example.com",
      password: testPassword,
    });
    const user2Token = user2LoginResponse.body.token;

    await testUtils.testError({
      route: `${transactionsRoute}/${transactionId}`,
      testUnit: { amount: 150.0 },
      authToken: user2Token,
      statusCode: 404,
      message: "Transaction not found",
      crudAction: "PUT",
    });
  });

  test("should return 400 when amount is zero", async () => {
    await testUtils.testError({
      route: `${transactionsRoute}/${transactionId}`,
      testUnit: { amount: 0 },
      authToken: authToken,
      statusCode: 400,
      message: "Amount must be a non-zero number",
      crudAction: "PUT",
    });
  });

  test("should return 400 for invalid date format", async () => {
    await testUtils.testError({
      route: `${transactionsRoute}/${transactionId}`,
      testUnit: { date: "invalid-date" },
      authToken: authToken,
      statusCode: 400,
      message: "Invalid date format",
      crudAction: "PUT",
    });
  });
});

describe("DELETE /api/transactions/:id", () => {
  let userId;
  let authToken;
  let categoryId;
  let transactionId;

  beforeEach(async () => {
    const userResponse = await request(app).post(registerRoute).send({
      email: testEmail,
      password: testPassword,
    });
    userId = userResponse.body.user.id;

    const loginResponse = await request(app).post(loginRoute).send({
      email: testEmail,
      password: testPassword,
    });
    authToken = loginResponse.body.token;

    const categoryResponse = await pool.query(
      "INSERT INTO categories (user_id, name, color) VALUES ($1, $2, $3) RETURNING *",
      [userId, "Test Category", "#FF5733"],
    );
    categoryId = categoryResponse.rows[0].id;

    const transactionResponse = await request(app)
      .post(transactionsRoute)
      .set("Authorization", `Bearer ${authToken}`)
      .send({
        amount: 100.0,
        date: "2024-12-01",
        type: "deposit",
        categoryId: categoryId,
        description: "Test transaction",
      });

    transactionId = transactionResponse.body.transaction.id;
  });

  test("should delete a transaction successfully", async () => {
    const response = await request(app)
      .delete(`${transactionsRoute}/${transactionId}`)
      .set("Authorization", `Bearer ${authToken}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty(
      "message",
      "Transaction deleted successfully",
    );
    expect(response.body.transaction).toHaveProperty("id", transactionId);

    // Verify transaction is actually deleted
    const getResponse = await request(app)
      .get(`${transactionsRoute}/${transactionId}`)
      .set("Authorization", `Bearer ${authToken}`);

    expect(getResponse.status).toBe(404);
  });

  test("should return 404 when trying to delete another user's transaction", async () => {
    const user2Response = await request(app).post(registerRoute).send({
      email: "user2@example.com",
      password: testPassword,
    });

    const user2LoginResponse = await request(app).post(loginRoute).send({
      email: "user2@example.com",
      password: testPassword,
    });
    const user2Token = user2LoginResponse.body.token;

    await testUtils.testError({
      route: `${transactionsRoute}/${transactionId}`,
      authToken: user2Token,
      statusCode: 404,
      message: "Transaction not found",
      crudAction: "DELETE",
    });
  });
});
