const Queue = require("bull");

const { Job } = require("./models/Job");
const { executeCpp } = require("./ExecuteCpp");
const { executePy } = require("./ExecutePy");

const jobQueue = new Queue("job-queue");
const NUM_WORKERS = 5;

jobQueue.process(NUM_WORKERS, async ({ data }) => {
  const { id: jobId } = data;
  const job = await Job.findById(jobId);

  if (job === undefined) throw Error("Job with given id not found");

  try {
    let output;
    job["startedAt"] = new Date();

    switch (job.language) {
      case "cpp":
        output = await executeCpp(job.filepath);
        break;
      case "py":
        output = await executePy(job.filepath);
        break;
    }

    job["completedAt"] = new Date();
    job["output"] = output;
    job["status"] = "Completed";

    await job.save();
  } catch (error) {
    job["completedAt"] = new Date();
    job["output"] = JSON.stringify(error);
    job["status"] = "Error";

    await job.save();
  }
  return true;
});

// error event emit handler, catches the error throw
jobQueue.on("failed", (error) => {
  console.log(error.data.id, " failed ", error.failedReason);
});

const addJobToQueue = async (jobId) => {
  await jobQueue.add({ id: jobId });
};

module.exports = { addJobToQueue };
