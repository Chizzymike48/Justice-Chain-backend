process.env.NODE_ENV = "test";

jest.mock("../src/models/User", () => ({
  find: jest.fn(),
}));

const request = require("supertest");
const app = require("../src/app");
const User = require("../src/models/User");

const buildQuery = (result) => ({
  sort() {
    return this;
  },
  limit() {
    return this;
  },
  select() {
    return Promise.resolve(result);
  },
});

describe("Verify routes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns the verification leaderboard", async () => {
    const leaders = [
      { _id: "user-1", name: "Alex", trustScore: 75 },
      { _id: "user-2", name: "Sam", trustScore: 60 },
    ];

    User.find.mockReturnValue(buildQuery(leaders));

    const res = await request(app).get("/api/v1/verify/leaderboard");

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBe(2);
  });
});
