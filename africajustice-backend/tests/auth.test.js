process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "test-secret";

jest.mock("../src/models/User", () => ({
  findOne: jest.fn(),
  findById: jest.fn(),
}));

jest.mock("../src/services/emailService", () => ({
  sendEmail: jest.fn(),
}));

const request = require("supertest");
const jwt = require("jsonwebtoken");
const app = require("../src/app");
const User = require("../src/models/User");
const { sendEmail } = require("../src/services/emailService");

describe("Auth routes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("logs in with valid credentials", async () => {
    const user = {
      _id: "user-123",
      matchPassword: jest.fn().mockResolvedValue(true),
      loginHistory: [],
      save: jest.fn().mockResolvedValue(true),
    };

    User.findOne.mockResolvedValue({
      select: jest.fn().mockResolvedValue(user),
    });

    const res = await request(app).post("/api/v1/auth/login").send({
      email: "user@example.com",
      password: "password123",
    });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeDefined();
  });

  it("rejects login with invalid password", async () => {
    const user = {
      _id: "user-456",
      matchPassword: jest.fn().mockResolvedValue(false),
      loginHistory: [],
      save: jest.fn().mockResolvedValue(true),
    };

    User.findOne.mockResolvedValue({
      select: jest.fn().mockResolvedValue(user),
    });

    const res = await request(app).post("/api/v1/auth/login").send({
      email: "user@example.com",
      password: "wrong-password",
    });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it("sends a test email for authenticated users", async () => {
    const user = {
      _id: "user-789",
      email: "user@example.com",
    };

    User.findById.mockResolvedValue(user);
    sendEmail.mockResolvedValue({
      messageId: "msg-1",
      previewUrl: "http://preview",
      transport: "stream",
    });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);

    const res = await request(app)
      .post("/api/v1/auth/test-email")
      .set("Authorization", `Bearer ${token}`)
      .send({ email: "test@example.com" });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.messageId).toBe("msg-1");
    expect(res.body.data.previewUrl).toBe("http://preview");
  });
});
