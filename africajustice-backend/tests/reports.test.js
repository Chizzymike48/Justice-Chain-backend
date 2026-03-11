process.env.NODE_ENV = "test";

jest.mock("../src/models/Report", () => ({
  find: jest.fn(),
  countDocuments: jest.fn(),
}));

const request = require("supertest");
const app = require("../src/app");
const Report = require("../src/models/Report");

const buildQuery = (result) => ({
  populate() {
    return this;
  },
  sort() {
    return this;
  },
  skip() {
    return this;
  },
  limit() {
    return Promise.resolve(result);
  },
});

describe("Report routes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("lists public reports", async () => {
    const reports = [
      { _id: "report-1", title: "Report 1" },
      { _id: "report-2", title: "Report 2" },
    ];

    Report.find.mockReturnValue(buildQuery(reports));
    Report.countDocuments.mockResolvedValue(reports.length);

    const res = await request(app).get("/api/v1/reports");

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.count).toBe(2);
    expect(res.body.total).toBe(2);
  });
});
