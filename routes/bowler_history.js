const { promiseReadDir, promiseReadJsonFile } = require("../utils");
var express = require("express");
var router = express.Router();

var all_bowler_names = [];

const getRoutes = async () => {
  all_bowler_names = [];
  console.log("refresh bowler history routes");
  var bowler_history_files = await promiseReadDir("./bowler_history");
  all_bowler_names = bowler_history_files.map((file) => {
    return file.substring(0, file.indexOf(".json"));
  });
  // console.log("all_bowler_names: ", all_bowler_names);
};

router.get("/", (req, res) => {
  return res.json(all_bowler_names);
});

router.get("/:name", async (req, res) => {
  var found_bowler_name = all_bowler_names.find(
    (name) => name == req.params.name
  );
  if (!found_bowler_name) {
    return res.status(404).send();
  }
  var file = `./bowler_history/${found_bowler_name}.json`;
  var json_data = await promiseReadJsonFile(file);
  return res.json(json_data);
});

getRoutes();
setInterval(getRoutes, 60000);

module.exports = router;
