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

const testPassword = "password123";
const categoriesRoute = "/api/categories";
const registerRoute = "/api/auth/register";
const loginRoute = "/api/auth/login";

describe("POST /api/categories", () => {
  let userId;
  let authToken;

  // Create test user
  beforeEach(async () => {
    const setup = await testUtils.setupTestUser(app);
    userId = setup.userId;
    authToken = setup.authToken;
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

  // Test for not being able to have duplicate categories
  test("should 400 error when creating a category that already exists", async () => {
    duplicateCategory = {
      route: categoriesRoute,
      testUnit: {
        name: "Utilities",
        color: "FF5733",
      },
      authToken: authToken,
      crudAction: "POST",
    };

    await request(app)
      .post(categoriesRoute)
      .set("Authorization", `Bearer ${authToken}`)
      .send({
        name: "Utilities",
        color: "FF5733",
      });

    await testUtils.testError({
      statusCode: 400,
      message: "Category already exists",
      ...duplicateCategory,
    });
  });
});

describe("GET /api/categories", () => {
  let userId;
  let authToken;
  let categoryId;

  beforeEach(async () => {
    const setup = await testUtils.setupTestUserWithCategory(app, pool);
    userId = setup.userId;
    authToken = setup.authToken;
    categoryId = setup.categoryId;
  });

  // Test to get all categories associated with the user
  test("should return all categories from a test user", async () => {
    // Adds another category to get two
    await request(app)
      .post(categoriesRoute)
      .set("Authorization", `Bearer ${authToken}`)
      .send({ name: "Utilities", color: "FF5733" });

    const response = await request(app)
      .get(categoriesRoute)
      .set("Authorization", `Bearer ${authToken}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("categories");
    expect(response.body.categories).toHaveLength(2);
    expect(response.body.categories[0]).toHaveProperty("user_id", userId);
  });
});

describe("GET /api/categories/:id", () => {
  let userId;
  let authToken;
  let categoryId;

  beforeEach(async () => {
    const setup = await testUtils.setupTestUserWithCategory(app, pool);
    userId = setup.userId;
    authToken = setup.authToken;
    categoryId = setup.categoryId;
  });

  test("should return appropriate category based off of id", async () => {
    const response = await request(app)
      .get(`${categoriesRoute}/${categoryId}`)
      .set("Authorization", `Bearer ${authToken}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("category");
    expect(response.body.category).toHaveProperty("id", categoryId);
    expect(response.body.category).toHaveProperty("user_id", userId);
    expect(response.body.category).toHaveProperty("name", "Test Category");
    expect(response.body.category).toHaveProperty("color", "#FF5733");
  });

  test("should 404 error when trying to access another user's categories", async () => {
    await request(app).post(registerRoute).send({
      email: "user2@example.com",
      password: testPassword,
    });

    const user2LoginResponse = await request(app).post(loginRoute).send({
      email: "user2@example.com",
      password: testPassword,
    });
    const user2Token = user2LoginResponse.body.token;

    await testUtils.testError({
      route: `${categoriesRoute}/${categoryId}`,
      authToken: user2Token,
      statusCode: 404,
      message: "Category not found",
      crudAction: "GET",
    });
  });

  test("should return 400 for invalid category ID format", async () => {
    await testUtils.testError({
      route: `${categoriesRoute}/invalid`,
      authToken: authToken,
      statusCode: 400,
      message: "Invalid category id",
      crudAction: "GET",
    });
  });
});

describe("PUT /api/categories/:id", () => {
  let userId;
  let authToken;
  let categoryId;

  beforeEach(async () => {
    const setup = await testUtils.setupTestUserWithCategory(app, pool);
    userId = setup.userId;
    authToken = setup.authToken;
    categoryId = setup.categoryId;
  });

  test("should update a category successfully", async () => {
    const response = await request(app)
      .put(`${categoriesRoute}/${categoryId}`)
      .set("Authorization", `Bearer ${authToken}`)
      .send({ name: "Food", color: "Green" });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty(
      "message",
      "Category updated successfully",
    );
    expect(response.body.category).toHaveProperty("name", "Food");
    expect(response.body.category).toHaveProperty("color", "Green");
  });

  test("should return 404 when trying to update another user's categories", async () => {
    await request(app).post(registerRoute).send({
      email: "user2@example.com",
      password: testPassword,
    });

    const user2LoginResponse = await request(app).post(loginRoute).send({
      email: "user2@example.com",
      password: testPassword,
    });
    const user2Token = user2LoginResponse.body.token;

    await testUtils.testError({
      route: `${categoriesRoute}/${categoryId}`,
      testUnit: { name: "Food" },
      authToken: user2Token,
      statusCode: 404,
      message: "Category not found",
      crudAction: "PUT",
    });
  });

  test("should return 400 when name is null", async () => {
    await testUtils.testError({
      route: `${categoriesRoute}/${categoryId}`,
      testUnit: { name: null },
      authToken: authToken,
      statusCode: 400,
      message: "Name is required",
      crudAction: "PUT",
    });
  });
});

describe("DELETE /api/categories/:id", () => {
  let userId;
  let authToken;
  let categoryId;

  beforeEach(async () => {
    const setup = await testUtils.setupTestUserWithCategory(app, pool);
    userId = setup.userId;
    authToken = setup.authToken;
    categoryId = setup.categoryId;
  });

  test("should delete a category successfully", async () => {
    const response = await request(app)
      .delete(`${categoriesRoute}/${categoryId}`)
      .set("Authorization", `Bearer ${authToken}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty(
      "message",
      "Category deleted successfully",
    );
    expect(response.body.category).toHaveProperty("id", categoryId);

    // Verify category is actually deleted
    const getResponse = await request(app)
      .get(`${categoriesRoute}/${categoryId}`)
      .set("Authorization", `Bearer ${authToken}`);

    expect(getResponse.status).toBe(404);
  });

  test("should return 404 when trying to delete another user's categories", async () => {
    await request(app).post(registerRoute).send({
      email: "user2@example.com",
      password: testPassword,
    });

    const user2LoginResponse = await request(app).post(loginRoute).send({
      email: "user2@example.com",
      password: testPassword,
    });
    const user2Token = user2LoginResponse.body.token;

    await testUtils.testError({
      route: `${categoriesRoute}/${categoryId}`,
      authToken: user2Token,
      statusCode: 404,
      message: "Category not found",
      crudAction: "DELETE",
    });
  });
});
