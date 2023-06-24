const { exec } = require("child_process");
const fs = require("fs");
const path = require("path");

const outputDir = path.join(__dirname, "outputs");

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const escapeBackslash = (arg) => arg.replace(/\\/g, "\\\\");

const executeCpp = (filePath) => {
  // server\codes\100b2585-166f-43ab-9492-2717c8b88752.cpp
  const jobId = path.basename(filePath).split(".")[0];
  const outputFilePath = path.join(outputDir, `${jobId}.exe`);

  return new Promise((resolve, reject) => {
    exec(
      `g++ ${escapeBackslash(filePath)} -o ${escapeBackslash(
        outputFilePath
      )} && cd ${escapeBackslash(outputDir)} && ${jobId}.exe`,
      (error, stdout, stderr) => {
        error && reject({ error, stderr });
        stderr && reject(stderr);
        resolve(stdout);
      }
    );
  }).catch((error) => {
    // Handle the error here
    // console.error("Error in executeProgram:", error);
    throw error; // Rethrow the error to propagate it further
  });
};

module.exports = { executeCpp };
