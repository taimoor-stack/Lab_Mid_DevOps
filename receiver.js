const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
app.use(express.json());

const PORT = 5000;

app.post("/report", (req, res) => {
  const reportData = req.body;
  const filePath = path.join(__dirname, "test-report.json");

  fs.writeFile(filePath, JSON.stringify(reportData, null, 2), (err) => {
    if (err) {
      console.error("Failed to save test report:", err);
      return res.status(500).json({ error: "Failed to write file" });
    }
    console.log(
      `[${new Date().toLocaleTimeString()}] Test report received and saved to test-report.json`,
    );
    return res.status(200).json({ message: "Report saved successfully" });
  });
});

app.listen(PORT, () => {
  console.log(`Local Report Receiver listening at http://localhost:${PORT}`);
});
