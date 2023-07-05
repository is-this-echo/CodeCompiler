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
    <div class="Container">
      <nav class="navbar sticky-top bg-body-tertiary">
        <div class="container-fluid">
          <a class="navbar-brand" href="#">
            <h1 class="display-5"> Code Compiler</h1>
          </a>
        </div>
      </nav>

      <div class="container text-center">
        <div class="row row-cols-2">
          <div class="col">
            <div class="row">
              <div class="col">
                <div class="container text-center">
                  <div class="row">
                    <div class="col">Language :</div>
                    <div class="col">
                      <select
                        class="form-select"
                        aria-label="Default select example"
                        style={{ width: "100px" }}
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
                  </div>
                </div>
              </div>
              <div class="col">
                <button
                  type="button"
                  class="btn btn-outline-secondary"
                  onClick={setDefaultLanguage}
                >
                  Set default
                </button>
              </div>
            </div>
            <div class="form-floating">
              <textarea
                class="form-control"
                placeholder="Write code here..."
                id="floatingTextarea2"
                style={{ height: "460px" }}
                value={code}
                onChange={(e) => {
                  setCode(e.target.value);
                }}
              ></textarea>
            </div>
            <br />
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <button
                type="button"
                class="btn btn-outline-primary"
                onClick={resetStats}
              >
                Reset
              </button>
              <button
                type="button"
                class="btn btn-outline-danger"
                onClick={handleSubmit}
              >
                Submit Code
              </button>
            </div>
          </div>
          <div class="col">
            <br />
            <br />

            <div class="form-floating">
              <div class="card mb-5">
                <div class="card-body">
                  <h5 class="card-title">Result</h5>
                  <p class="card-text">{output && `${output}`}</p>
                </div>
              </div>
              <div class="card">
                <div class="card-body">
                  <h5 class="card-title">Code Analytics</h5>

                  <p class="card-text">{jobId && `JobID: ${jobId}`}</p>
                  <p class="card-text">{status && `Status: ${status}`}</p>
                  <p class="card-text">{renderJobDetails()}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
