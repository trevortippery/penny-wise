const request = require("supertest");
const app = require("../app/app");
const pool = require("../db/db");

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

// Reusable validation test helpers
function testMissingEmail(route) {
  test("should return 400 when email is missing", async () => {
    const response = await request(app)
      .post(`/api/auth/${route}`)
      .send({
        password: testPassword
      });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty("error", "Email is required");
  });
}

function testMissingPassword(route) {
  test("should return 400 when password is missing", async () => {
    const response = await request(app)
      .post(`/api/auth/${route}`)
      .send({
        email: testEmail
      });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty("error", "Password is required");
  });
}

function testInvalidEmailFormat(route) {
  test("should return 400 for invalid email format", async () => {
    const response = await request(app)
      .post(`/api/auth/${route}`)
      .send({
        email: "invalidemail@",
        password: testPassword,
      });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty("error", "Invalid email format");
  });
}

describe("POST /api/auth/register", () => {
  test("should create a new user with valid data", async () => {
    const response = await request(app)
      .post("/api/auth/register")
      .send({
        email: testEmail,
        password: testPassword,
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty("message", "User created successfully");
    expect(response.body.user).toHaveProperty("id");
    expect(response.body.user).toHaveProperty("email", testEmail);
    expect(response.body.user).not.toHaveProperty("password_hash");
  });

  // Use helper functions for validation tests
  testMissingEmail("register");
  testMissingPassword("register");
  testInvalidEmailFormat("register");

  test("should return 400 when registering duplicate email", async () => {
    await request(app)
      .post("/api/auth/register")
      .send({
        email: testEmail,
        password: testPassword
      });

    const response = await request(app)
      .post("/api/auth/register")
      .send({
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
    await request(app)
      .post("/api/auth/register")
      .send({
        email: testEmail,
        password: testPassword
      });
  });

  test("should login successfully with valid credentials", async () => {
    const response = await request(app)
      .post("/api/auth/login")
      .send({
        email: testEmail,
        password: testPassword,
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("message", "User successfully logged in");
  });

  // Use helper functions for validation tests
  testMissingEmail("login");
  testMissingPassword("login");
  testInvalidEmailFormat("login");

  test("should return 401 when user does not exist", async () => {
    // Note: beforeEach creates a user, but we're testing with different email
    const response = await request(app)
      .post("/api/auth/login")
      .send({
        email: "nonexistent@example.com",
        password: testPassword,
      });

    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty("error", "Invalid credentials");
  });

  test("should return 401 with incorrect password", async () => {
    const response = await request(app)
      .post("/api/auth/login")
      .send({
        email: testEmail,
        password: "wrongpassword",
      });

    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty("error", "Invalid credentials");
  });
});

describe("GET /api/auth/users/:id", () => {
  let userId;

  // Use beforeEach to create a user and store ID
  beforeEach(async () => {
    const response = await request(app)
      .post("/api/auth/register")
      .send({
        email: testEmail,
        password: testPassword
      });
    userId = response.body.user.id;
  });

  test("should return 400 for invalid user ID format", async () => {
    const response = await request(app)
      .get("/api/auth/users/hello");

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty("error", "Invalid user ID");
  });

  test("should return 404 when user not found", async () => {
    const response = await request(app)
      .get("/api/auth/users/999");

    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty("error", "User not found");
  });

  test("should return user data by id", async () => {
    const response = await request(app)
      .get(`/api/auth/users/${userId}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("user");
    expect(response.body.user).toHaveProperty("id", userId);
    expect(response.body.user).toHaveProperty("email", testEmail);
    expect(response.body.user).not.toHaveProperty("password_hash");
  });
});