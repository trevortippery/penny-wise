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
const testEmail = "categorytest@example.com";
const testPassword = "password123";

describe("POST /api/categories/", () => {
  let userId;
  // Create test user
  beforeEach(async () => {
    const userResponse = await request(app).post("/api/auth/register").send({
      email: testEmail,
      password: testPassword,
    });

    userId = userResponse.body.user.id;
  });

  //first test a valid category creation
  test("should create a category from a test user", async () => {
    const response = await request(app).post("/api/categories").send({
      userId: userId,
      name: "Utilies",
      color: "FF5733",
    });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty(
      "message",
      "Category created successfully",
    );
    expect(response.body.category).toHaveProperty("id");
    expect(response.body.category).toHavePropert("user_id", userId);
    expect(response.body.category).toHaveProperty("name", "Utilies");
    expect(response.body.category).toHaveProperty("color", "FF5733");
  });
});
