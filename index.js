const express = require("express");
const app = express();
var bowlerHistoryRouter = require("./routes/bowler_history");
// app.use(express.json());
const { scrape_startup, scrape_daily } = require("./scrapers");

const startup = async () => {
  app.use("/bowler_history", bowlerHistoryRouter);
  app.listen(3131, async () => {
    console.log("Listening on post 3131");
  });
  app.get("/", (req, res) => {
    return res.status(200).send();
  });
  await scrape_startup();
  setInterval(async () => {
    await scrape_daily();
  }, 1440 * 60 * 1000);
};

startup();
