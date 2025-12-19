const request = require("supertest");
const app = require("../app/app");
const pool = require("../db/db");
const jwt = require("jsonwebtoken");

afterEach(async () => {
  await pool.query("DELETE FROM transactions");
  await pool.query("DELETE FROM categories");
  await pool.query("DELETE FROM users");
});

afterAll(async () => {
  await pool.end();
});

const testEmail = "testuser@example.com";
const testPassword = "password123";

// Helper function to create an auth token
function createAuthToken(userId, email = testEmail) {
  return jwt.sign({ userId, email }, process.env.JWT_SECRET, {
    expiresIn: "24h",
  });
}

// Reusable validation test helpers
function testMissingEmail(route) {
  test("should return 400 when email is missing", async () => {
    const response = await request(app).post(`/api/auth/${route}`).send({
      password: testPassword,
    });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty("error", "Email is required");
  });
}

function testMissingPassword(route) {
  test("should return 400 when password is missing", async () => {
    const response = await request(app).post(`/api/auth/${route}`).send({
      email: testEmail,
    });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty("error", "Password is required");
  });
}

function testInvalidEmailFormat(route) {
  test("should return 400 for invalid email format", async () => {
    const response = await request(app).post(`/api/auth/${route}`).send({
      email: "invalidemail@",
      password: testPassword,
    });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty("error", "Invalid email format");
  });
}

describe("POST /api/auth/register", () => {
  test("should create a new user with valid data", async () => {
    const response = await request(app).post("/api/auth/register").send({
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

  // Use helper functions for validation tests
  testMissingEmail("register");
  testMissingPassword("register");
  testInvalidEmailFormat("register");

  test("should return 400 when registering duplicate email", async () => {
    await request(app).post("/api/auth/register").send({
      email: testEmail,
      password: testPassword,
    });

    const response = await request(app).post("/api/auth/register").send({
      email: testEmail,
      password: testPassword,
    });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty("error", "Email already exists");
  });
});

describe("POST /api/auth/login", () => {
  // Use beforeEach to create a user before each login test
  beforeEach(async () => {
    await request(app).post("/api/auth/register").send({
      email: testEmail,
      password: testPassword,
    });
  });

  test("should login successfully with valid credentials and return token", async () => {
    const response = await request(app).post("/api/auth/login").send({
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
  testMissingEmail("login");
  testMissingPassword("login");
  testInvalidEmailFormat("login");

  test("should return 401 when user does not exist", async () => {
    // Note: beforeEach creates a user, but we're testing with different email
    const response = await request(app).post("/api/auth/login").send({
      email: "nonexistent@example.com",
      password: testPassword,
    });

    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty("error", "Invalid credentials");
  });

  test("should return 401 with incorrect password", async () => {
    const response = await request(app).post("/api/auth/login").send({
      email: testEmail,
      password: "wrongpassword",
    });

    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty("error", "Invalid credentials");
  });
});

describe("GET /api/auth/me", () => {
  let userId;
  let authToken;

  // Use beforeEach to create a user and store ID
  beforeEach(async () => {
    const response = await request(app).post("/api/auth/register").send({
      email: testEmail,
      password: testPassword,
    });
    userId = response.body.user.id;

    authToken = createAuthToken(userId, testEmail);
  });

  test("should return 401 when no token provided", async () => {
    const response = await request(app).get("/api/auth/me");

    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty("error", "No token provided");
  });

  test("should return 401 when invalid token provided", async () => {
    const response = await request(app)
      .get("/api/auth/me")
      .set("Authorization", "Bearer invalid-token");

    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty("error", "Invalid or expired token");
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
