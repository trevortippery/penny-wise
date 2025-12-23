const jwt = require("jsonwebtoken");
const request = require("supertest");
const app = require("../app/app");

// Helper function to create an auth token
const createAuthToken = (userId, email) => {
  return jwt.sign({ userId, email }, process.env.JWT_SECRET, {
    expiresIn: "24h",
  });
};

const methodMap = {
  GET: "get",
  POST: "post",
  PUT: "put",
  DELETE: "delete",
};

async function testError({
  route,
  testUnit,
  authToken = null,
  statusCode,
  message,
  crudAction,
}) {
  if (!crudAction) {
    throw new Error("testError: crudAction is required");
  }

  const method = methodMap[crudAction];

  if (!method) {
    throw new Error(
      `testError: invalid crudAction "${crudAction}". Must be one of ${Object.keys(methodMap).join("")}`,
    );
  }

  // Dynamic object property lookup then puts route as the argument for the method property e.x. .post(route)
  let req = request(app)[method](route);

  if (authToken) {
    req = req.set("Authorization", `Bearer ${authToken}`);
  }

  const response = await req.send(testUnit);

  expect(response.status).toBe(statusCode);
  expect(response.body).toHaveProperty("error", message);
}

async function setupTestUser(app) {
  const testEmail = `test-${Date.now()}@example.com`;
  const testPassword = "testpass123";

  const userResponse = await request(app).post("/api/auth/register").send({
    email: testEmail,
    password: testPassword,
  });
  const userId = userResponse.body.user.id;

  const loginResponse = await request(app).post("/api/auth/login").send({
    email: testEmail,
    password: testPassword,
  });
  const authToken = loginResponse.body.token;

  return { userId, authToken, testEmail, testPassword };
}

async function setupTestUserWithCategory(app, pool) {
  const { userId, authToken, testEmail, testPassword } =
    await setupTestUser(app);

  const categoryResponse = await pool.query(
    "INSERT INTO categories (user_id, name, color) VALUES ($1, $2, $3) RETURNING *",
    [userId, "Test Category", "#FF5733"],
  );
  const categoryId = categoryResponse.rows[0].id;

  return { userId, authToken, categoryId, testEmail, testPassword };
}

module.exports = {
  createAuthToken,
  testError,
  setupTestUser,
  setupTestUserWithCategory,
};
