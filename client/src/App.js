import React, { useState, useEffect } from "react";

import axios from "axios";
import moment from "moment";
import Stubs from "./Stubs";

import "./App.css";

const App = () => {
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState("cpp");
  const [output, setOutput] = useState("");
  const [status, setStatus] = useState("");
  const [jobId, setJobId] = useState();
  const [jobDetails, setJobDetails] = useState();

  useEffect(() => {
    const defaultLang = localStorage.getItem("default-language") || "cpp";
    setLanguage(defaultLang);
  }, []);

  useEffect(() => {
    setCode(Stubs[language]);
  }, [language]);

  const setDefaultLanguage = () => {
    localStorage.setItem("default-language", language);
  };

  const resetStats = () => {
    setCode("");
    setJobId("");
    setStatus("");
    setOutput("");
    setJobDetails();
  };

  const renderJobDetails = () => {
    if (!jobDetails) {
      return "";
    }
    // calculate time taken to run code
    let result = "";
    let { submittedAt, startedAt, completedAt } = jobDetails;
    submittedAt = moment(submittedAt).toString();
    result += `Submitted at: ${submittedAt}`;

    if (!completedAt || !submittedAt) return result;

    const start = moment(startedAt);
    const end = moment(completedAt);
    const executionTime = end.diff(start, "seconds", true);
    result += ` Execution time: ${executionTime}s`;

    return result;
  };
  const handleSubmit = async () => {
    const payload = {
      language,
      code,
    };

    try {
      setJobId("");
      setStatus("");
      setOutput("");
      setJobDetails();

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
          setJobDetails(job);

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

  return (
    <div className="App">
      <h1>Code Compiler</h1>
      <div>
        <label>Language: </label>
        <select
          value={language}
          onChange={(e) => {
            let response = window.confirm(
              "WARNING: Switching the language will erase the current code. Do you wish to proceed?"
            );
            if (response) setLanguage(e.target.value);
          }}
        >
          <option value="cpp">C++</option>
          <option value="py">Python</option>
        </select>
      </div>
      <br />
      <div>
        <button onClick={setDefaultLanguage}>Set default</button>
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
      <p>{renderJobDetails()}</p>
      <p>{output && `Result: ${output}`}</p>
    </div>
  );
};

export default App;
