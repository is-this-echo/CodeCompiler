const express = require("express");

const { createProgramFile } = require("./createProgramFile");
const { executeProgram } = require("./executeProgram");

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const PORT = process.env.PORT || 5000;

app.get("/", (req, res) => {
  return res.json({ code: "python" });
});

app.post("/run", async (req, res) => {
  const { language = "cpp", code } = req.body;

  if (code === undefined) {
    return res.status(400).json({ success: false, error: "Missing code body" });
  }

  /* 
    create a file with the correct extension depending on language, default c++
    run the file on local and send the output
  */
  try {
    const filePath = await createProgramFile(language, code);
    const output = await executeProgram(filePath);

    return res.json({ filePath, output });
  } catch (error) {
    res.status(500).json({ error });
  }
});

app.listen(PORT, () => {
  console.log(`Listening on port ${PORT}`);
});
