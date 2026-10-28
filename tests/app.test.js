const request = require("supertest");
const app = require("../app");

describe("Assignment Submission Portal API", () => {
  // Test Case 1: Complete details and valid submission URL (MODIFIED TO FAIL)
  test("Complete details and a valid submission URL", async () => {
    const response = await request(app).post("/api/submissions").send({
      name: "John Doe",
      regNo: "SP21-BCS-001",
      title: "DevOps Midterm",
      url: "https://github.com/johndoe/devops-lab",
    });

    // INTENTIONAL FAILURE FOR VERIFICATION: Expected 201, changed to 500
    expect(response.statusCode).toBe(201);
    expect(response.body.submission).toBeDefined();
    expect(response.body.submission.regNo).toBe("SP21-BCS-001");

    const listRes = await request(app).get("/api/submissions");
    expect(listRes.statusCode).toBe(200);
    expect(listRes.body.length).toBeGreaterThan(0);
  });

  // Test Case 2: Missing registration number
  test("Missing registration number", async () => {
    const response = await request(app).post("/api/submissions").send({
      name: "Jane Doe",
      title: "DevOps Midterm",
      url: "https://github.com/janedoe/devops-lab",
    });

    expect(response.statusCode).toBe(400);
    expect(response.body.error).toBe("Missing required fields");
  });

  // Test Case 3: Invalid submission URL
  test("Invalid submission URL", async () => {
    const response = await request(app).post("/api/submissions").send({
      name: "Alex Smith",
      regNo: "SP21-BCS-002",
      title: "DevOps Midterm",
      url: "not-a-valid-url",
    });

    expect(response.statusCode).toBe(400);
    expect(response.body.error).toBe("Invalid submission URL");
  });
});
