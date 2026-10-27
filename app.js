const express = require("express");
const path = require("path");

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

let submissions = [];

function isValidUrl(string) {
  try {
    const url = new URL(string);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch (_) {
    return false;
  }
}

app.post("/api/submissions", (req, res) => {
  const { name, regNo, title, url } = req.body;

  // Validation: Required fields check
  if (!name || !regNo || !title || !url) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  // Validation: URL format check
  if (!isValidUrl(url)) {
    return res.status(400).json({ error: "Invalid submission URL" });
  }

  const submission = {
    id: submissions.length + 1,
    name,
    regNo,
    title,
    url,
    createdAt: new Date().toISOString(),
  };

  submissions.push(submission);
  return res
    .status(201)
    .json({ message: "Submission saved successfully", submission });
});

app.get("/api/submissions", (req, res) => {
  res.status(200).json(submissions);
});

module.exports = app;

if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}
