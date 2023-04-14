const express = require("express");
const { spawn } = require("child_process");
const app = express();
var teamInfoRouter = require("./routes/team_info");
var bowlerHistoryRouter = require("./routes/bowler_history");
// app.use(express.json());

const startup = async () => {
  promise_spawn("python", ["main.py"]);
  setInterval(() => {
    promise_spawn("python", ["main.py"]);
  }, 600000);

  app.use("/team_info", teamInfoRouter);
  app.use("/bowler_history", bowlerHistoryRouter);
  app.listen(3030, async () => {
    console.log("Listening on post 3030");
  });
  app.get("/", (req, res) => {
    return res.status(200).send();
  });
};

const promise_spawn = (arg1, arg2) => {
  return new Promise((resolve) => {
    const process = spawn(arg1, arg2);
    process.on("close", (code) => {
      console.log(`Python script complete. Code: ${code}`);
      resolve();
    });
  });
};

startup();
