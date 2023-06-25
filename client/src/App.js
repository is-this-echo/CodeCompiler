import React, { useState } from "react";

import axios from "axios";

import "./App.css";

const App = () => {
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState("cpp");
  const [output, setOutput] = useState("");
  const [status, setStatus] = useState("");
  const [jobId, setJobId] = useState();

  const handleSubmit = async () => {
    const payload = {
      language,
      code,
    };

    try {
      setJobId("");
      setStatus("");
      setOutput("");

      const { data } = await axios.post("http://localhost:5000/run", payload);
      setJobId(data.jobId);

      let polling;
      polling = setInterval(async () => {
        const { data: dataRes } = await axios.get(
          "http://localhost:5000/status",
          { params: { id: data.jobId } }
        );

        const { success, error, job } = dataRes;
        console.log(dataRes);

        if (success) {
          const { status: jobStatus, output: jobOutput } = job;
          setStatus(jobStatus);

          if (jobStatus === "Pending") return;

          setOutput(jobOutput);
          clearInterval(polling);
        } else {
          console.error(error);

          setStatus("Error: Please check if code is valid..");
          setOutput(error);
          clearInterval(polling);
        }
      }, 1500);
    } catch ({ response }) {
      if (response) {
        const errMsg = response.data.error.stderr;
        setOutput(errMsg);
      } else setOutput("Error connection to server...");
    }
  };

  const resetStats = () => {
    setCode("");

    setJobId("");
    setStatus("");
    setOutput("");
  };

  return (
    <div className="App">
      <h1>Code Compiler</h1>
      <div>
        <label>Language: </label>
        <select
          value={language}
          onChange={(e) => {
            setLanguage(e.target.value);
          }}
        >
          <option value="cpp">C++</option>
          <option value="py">Python</option>
        </select>
      </div>
      <br />
      <textarea
        rows="25"
        cols="75"
        value={code}
        onChange={(e) => {
          setCode(e.target.value);
        }}
      ></textarea>
      <br />
      <div style={{ display: "flex", justifyContent: "space-evenly" }}>
        <button onClick={handleSubmit}>Submit Code</button>
        <button onClick={resetStats}>Reset</button>
      </div>

      <p>{jobId && `JobID: ${jobId}`}</p>
      <p>{status && `Status: ${status}`}</p>
      <p>{output && `Result: ${output}`}</p>
    </div>
  );
};

export default App;
