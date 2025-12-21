const request = require("supertest");
const app = require("../app/app");
const pool = require("../db/db");
const testUtils = require("./tests-util");

afterEach(async () => {
  await pool.query("DELETE FROM transactions");
  await pool.query("DELETE FROM categories");
  await pool.query("DELETE FROM users");
});

afterAll(async () => {
  await pool.end();
});
const testEmail = "categorytest@example.com";
const testPassword = "password123";
const categoriesRoute = "/api/categories";

describe("POST /api/categories", () => {
  let userId;
  let authToken;

  // Create test user
  beforeEach(async () => {
    const userResponse = await request(app).post("/api/auth/register").send({
      email: testEmail,
      password: testPassword,
    });

    userId = userResponse.body.user.id;

    const loginResponse = await request(app).post("/api/auth/login").send({
      email: testEmail,
      password: testPassword,
    });

    authToken = loginResponse.body.token;
  });

  // first test a valid category creation
  test("should create a category from a test user", async () => {
    const response = await request(app)
      .post(categoriesRoute)
      .set("Authorization", `Bearer ${authToken}`)
      .send({
        name: "Utilities",
        color: "FF5733",
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty(
      "message",
      "Category created successfully",
    );
    expect(response.body.category).toHaveProperty("id");
    expect(response.body.category).toHaveProperty("user_id", userId);
    expect(response.body.category).toHaveProperty("name", "Utilities");
    expect(response.body.category).toHaveProperty("color", "FF5733");
  });

  // Tests for token is present and invalid token
  test("should 401 error when no token provided", async () => {
    await testUtils.testError({
      route: categoriesRoute,
      testUnit: {
        name: "Utilities",
        color: "FF5733",
      },
      statusCode: 401,
      message: "No token provided",
      crudAction: "POST",
    });
  });

  test("should 401 error with invalid token", async () => {
    await testUtils.testError({
      route: categoriesRoute,
      testUnit: {
        name: "Utilities",
        color: "FF5733",
      },
      authToken: "invalid-token",
      statusCode: 401,
      message: "Invalid or expired token",
      crudAction: "POST",
    });
  });

  // Tests for required fields are present
  test("should 400 error when name is not present", async () => {
    await testUtils.testError({
      route: categoriesRoute,
      testUnit: {
        color: "FF5733",
      },
      authToken: authToken,
      statusCode: 400,
      message: "Name is required",
      crudAction: "POST",
    });
  });

  test("should 400 error when color is not present", async () => {
    await testUtils.testError({
      route: categoriesRoute,
      testUnit: {
        name: "Utilities",
      },
      authToken: authToken,
      statusCode: 400,
      message: "Color is required",
      crudAction: "POST",
    });
  });
});
