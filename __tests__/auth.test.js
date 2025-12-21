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

// test variables
const testEmail = "testuser@example.com";
const testPassword = "password123";
const registerRoute = "/api/auth/register";
const loginRoute = "/api/auth/login";
const meRoute = "/api/auth/me";

describe("POST /api/auth/register", () => {
  test("should create a new user with valid data", async () => {
    const response = await request(app).post(registerRoute).send({
      email: testEmail,
      password: testPassword,
    });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty(
      "message",
      "User created successfully",
    );
    expect(response.body.user).toHaveProperty("id");
    expect(response.body.user).toHaveProperty("email", testEmail);
    expect(response.body.user).not.toHaveProperty("password_hash");
  });

  test("should return 400 when email is missing", async () => {
    await testUtils.testError({
      route: registerRoute,
      testUnit: {
        password: testPassword,
      },
      statusCode: 400,
      message: "Email is required",
      crudAction: "POST",
    });
  });

  test("should return 400 when password is missing", async () => {
    await testUtils.testError({
      route: registerRoute,
      testUnit: {
        email: testEmail,
      },
      statusCode: 400,
      message: "Password is required",
      crudAction: "POST",
    });
  });

  test("should return 400 for invalid email format", async () => {
    await testUtils.testError({
      route: registerRoute,
      testUnit: {
        email: "invalidemail@",
        password: testPassword,
      },
      statusCode: 400,
      message: "Invalid email format",
      crudAction: "POST",
    });
  });

  test("should return 400 when registering duplicate email", async () => {
    await request(app).post(registerRoute).send({
      email: testEmail,
      password: testPassword,
    });

    await testUtils.testError({
      route: registerRoute,
      testUnit: {
        email: testEmail,
        password: testPassword,
      },
      statusCode: 400,
      message: "Email already exists",
      crudAction: "POST",
    });
  });
});

describe("POST /api/auth/login", () => {
  // Use beforeEach to create a user before each login test
  beforeEach(async () => {
    await request(app).post(registerRoute).send({
      email: testEmail,
      password: testPassword,
    });
  });

  test("should login successfully with valid credentials and return token", async () => {
    const response = await request(app).post(loginRoute).send({
      email: testEmail,
      password: testPassword,
    });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty(
      "message",
      "User successfully logged in",
    );
    expect(response.body).toHaveProperty("token");
    expect(typeof response.body.token).toBe("string");
  });

  // Use helper functions for validation tests
  test("should return 400 when email is missing", async () => {
    await testUtils.testError({
      route: loginRoute,
      testUnit: {
        password: testPassword,
      },
      statusCode: 400,
      message: "Email is required",
      crudAction: "POST",
    });
  });

  test("should return 400 when password is missing", async () => {
    await testUtils.testError({
      route: loginRoute,
      testUnit: {
        email: testEmail,
      },
      statusCode: 400,
      message: "Password is required",
      crudAction: "POST",
    });
  });

  test("should return 400 for invalid email format", async () => {
    await testUtils.testError({
      route: loginRoute,
      testUnit: {
        email: "invalidemail@",
        password: testPassword,
      },
      statusCode: 400,
      message: "Invalid email format",
      crudAction: "POST",
    });
  });

  test("should return 401 when user does not exist", async () => {
    // Note: beforeEach creates a user, but we're testing with different email
    await testUtils.testError({
      route: loginRoute,
      testUnit: {
        email: "nonexistent@example.com",
        password: testPassword,
      },
      statusCode: 401,
      message: "Invalid credentials",
      crudAction: "POST",
    });
  });

  test("should return 401 with incorrect password", async () => {
    await testUtils.testError({
      route: loginRoute,
      testUnit: {
        email: testEmail,
        password: "wrongpassword",
      },
      statusCode: 401,
      message: "Invalid credentials",
      crudAction: "POST",
    });
  });
});

describe("GET /api/auth/me", () => {
  let userId;
  let authToken;

  // Use beforeEach to create a user and store ID
  beforeEach(async () => {
    const response = await request(app).post(registerRoute).send({
      email: testEmail,
      password: testPassword,
    });
    userId = response.body.user.id;

    authToken = testUtils.createAuthToken(userId, testEmail);
  });

  test("should return 401 when no token provided", async () => {
    await testUtils.testError({
      route: meRoute,
      statusCode: 401,
      message: "No token provided",
      crudAction: "GET",
    });
  });

  test("should return 401 when invalid token provided", async () => {
    await testUtils.testError({
      route: meRoute,
      statusCode: 401,
      authToken: "invalid-token",
      message: "Invalid or expired token",
      crudAction: "GET",
    });
  });

  test("should return current user data with valid token", async () => {
    const response = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${authToken}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("user");
    expect(response.body.user).toHaveProperty("id", userId);
    expect(response.body.user).toHaveProperty("email", testEmail);
    expect(response.body.user).not.toHaveProperty("password_hash");
  });

  test("should work with token from login", async () => {
    // Login to get real token
    const loginResponse = await request(app).post("/api/auth/login").send({
      email: testEmail,
      password: testPassword,
    });

    const token = loginResponse.body.token;

    // Use that token to get user data
    const response = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.user).toHaveProperty("email", testEmail);
  });
});
