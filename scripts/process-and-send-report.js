const fs = require("fs");
const http = require("http");
const https = require("https");
const nodemailer = require("nodemailer");

let rawResults = {
  testResults: [],
  numTotalTests: 0,
  numPassedTests: 0,
  numFailedTests: 0,
  success: false,
};

try {
  if (fs.existsSync("test-results.json")) {
    rawResults = JSON.parse(fs.readFileSync("test-results.json", "utf8"));
  }
} catch (err) {
  console.error("Error reading test-results.json:", err);
}

const individualTests = [];
if (rawResults.testResults) {
  rawResults.testResults.forEach((suite) => {
    suite.assertionResults.forEach((t) => {
      individualTests.push({
        name: t.title,
        result: t.status,
        failureMessage:
          t.failureMessages.length > 0 ? t.failureMessages.join("\n") : null,
      });
    });
  });
}

const report = {
  repositoryName: process.env.GITHUB_REPOSITORY || "local/repo",
  branch: process.env.GITHUB_REF_NAME || "main",
  commitSHA: process.env.GITHUB_SHA || "local-commit",
  pipelineRunIdentifier: process.env.GITHUB_RUN_ID || "1",
  executionTimestamp: new Date().toISOString(),
  testSummary: {
    total: rawResults.numTotalTests || individualTests.length,
    passed:
      rawResults.numPassedTests ||
      individualTests.filter((t) => t.result === "passed").length,
    failed:
      rawResults.numFailedTests ||
      individualTests.filter((t) => t.result === "failed").length,
    overallStatus:
      rawResults.numFailedTests === 0 && individualTests.length > 0
        ? "PASSED"
        : "FAILED",
  },
  tests: individualTests,
};

console.log("Generated Report Payload:", JSON.stringify(report, null, 2));

const receiverUrl = process.env.RECEIVER_URL;
if (receiverUrl) {
  try {
    const url = new URL(
      receiverUrl.endsWith("/report") ? receiverUrl : `${receiverUrl}/report`,
    );
    const postData = JSON.stringify(report);
    const client = url.protocol === "https:" ? https : http;

    const req = client.request(
      url,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(postData),
          "bypass-tunnel-reminder": "true",
          "User-Agent": "CustomRunner",
        },
      },
      (res) => {
        console.log(`Receiver returned HTTP status: ${res.statusCode}`);
      },
    );

    req.on("error", (e) =>
      console.error(`Receiver Connection Error: ${e.message}`),
    );
    req.write(postData);
    req.end();
  } catch (err) {
    console.error("Invalid RECEIVER_URL provided:", err.message);
  }
} else {
  console.log("RECEIVER_URL secret missing; skipping HTTP report dispatch.");
}

async function sendEmailReport() {
  const { EMAIL_USER, EMAIL_PASS, EMAIL_TO } = process.env;
  if (!EMAIL_USER || !EMAIL_PASS || !EMAIL_TO) {
    console.log("Email credentials not configured; skipping email dispatch.");
    return;
  }

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user: EMAIL_USER, pass: EMAIL_PASS },
  });

  const mailOptions = {
    from: EMAIL_USER,
    to: EMAIL_TO,
    subject: `[CI Report] Run #${report.pipelineRunIdentifier} - Status: ${report.testSummary.overallStatus}`,
    text: `CI/CD Execution Details:
Repository: ${report.repositoryName}
Branch: ${report.branch}
Commit SHA: ${report.commitSHA}
Run Identifier: ${report.pipelineRunIdentifier}
Timestamp: ${report.executionTimestamp}

Overall Result: ${report.testSummary.overallStatus}
Total: ${report.testSummary.total} | Passed: ${report.testSummary.passed} | Failed: ${report.testSummary.failed}

Individual Test Results:
${report.tests.map((t) => `- ${t.name}: ${t.result.toUpperCase()}${t.failureMessage ? "\n Error: " + t.failureMessage : ""}`).join("\n")}
`,
    attachments: [
      {
        filename: "test-report.json",
        content: JSON.stringify(report, null, 2),
      },
    ],
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log("Email report dispatched successfully.");
  } catch (err) {
    console.error("Email dispatch failed:", err.message);
  }
}

sendEmailReport();
