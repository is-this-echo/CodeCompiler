const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

const { createProgramFile } = require("./CreateProgramFile");
const { executeCpp } = require("./ExecuteCpp");
const { executePy } = require("./ExecutePy");
const { Job } = require("./models/Job");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const PORT = process.env.PORT || 5000;

app.get("/status", async (req, res) => {
  const jobId = req.query.id;

  if (jobId === undefined) {
    res
      .status(400)
      .send({ success: false, error: "Missing Job-id in query params" });
  }

  try {
    const job = await Job.findById(jobId);
    if (job === undefined) {
      res
        .status(404)
        .send({ success: false, error: "Invalid Job-id provided" });
    }
    return res.status(200).send({ success: true, job });
  } catch (error) {
    return res
      .status(500)
      .send({ success: false, error: JSON.stringify(error) });
  }
});

app.post("/run", async (req, res) => {
  const { language = "cpp", code } = req.body;
  console.log(language);

  if (code === undefined) {
    return res.status(400).json({ success: false, error: "Missing code body" });
  }

  /* 
    create a file with the correct extension depending on language, default c++
    run the file on local and send the output
  */
  let job;

  try {
    const filepath = await createProgramFile(language, code);
    job = await new Job({ language, filepath }).save();
    const jobId = job["_id"];

    res.status(201).json({ success: true, jobId });

    let output;
    job["startedAt"] = new Date();
    console.log(job);

    switch (language) {
      case "cpp":
        output = await executeCpp(filepath);
        break;
      case "py":
        output = await executePy(filepath);
        break;
    }

    job["completedAt"] = new Date();
    job["output"] = output;
    job["status"] = "Completed";

    await job.save();
    console.log(job);
    // return res.json({ filepath, output });
  } catch (error) {
    job["completedAt"] = new Date();
    job["output"] = JSON.stringify(error);
    job["status"] = "Error";

    await job.save();
    console.log(job);
    // res.status(500).json({ error });
  }
});

const start = async () => {
  try {
    await mongoose.connect("mongodb://127.0.0.1:27017/codecompiler");
    console.log("Successfully connected to Mongodb database..");
  } catch (error) {
    console.log(error);
    process.exit(1);
  }
  app.listen(PORT, () => {
    console.log(`Listening on port ${PORT}`);
  });
};

start();
