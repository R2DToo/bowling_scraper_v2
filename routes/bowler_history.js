const { promiseReadDir, promiseReadJsonFile } = require("../utils");
var express = require("express");
var router = express.Router();

const getRoutes = async () => {
  var all_bowler_names = [];
  var bowler_history_files = await promiseReadDir("./bowler_history");
  all_bowler_names = bowler_history_files.map((file) => {
    return file.substring(0, file.indexOf(".json"));
  });
  // console.log("all_bowler_names: ", all_bowler_names);
  return all_bowler_names;
};

router.get("/", async (req, res) => {
  var all_bowler_names = await getRoutes();
  return res.json(all_bowler_names);
});

router.get("/:name", async (req, res) => {
  var all_bowler_names = await getRoutes();
  var found_bowler_name = [];
  if (req.params.name == "*") {
    found_bowler_name = all_bowler_names;
  } else {
    found_bowler_name = all_bowler_names.find(
      (name) => name == req.params.name
    );
  }

  if (!found_bowler_name) {
    return res.status(404).send();
  }
  var file = `./bowler_history/${found_bowler_name}.json`;
  var json_data = await promiseReadJsonFile(file);
  return res.json(json_data);
});

module.exports = router;
