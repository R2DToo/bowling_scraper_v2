const { promiseReadDir, promiseReadJsonFile } = require("../utils");
var express = require("express");
var router = express.Router();

const getRoutes = async () => {
  var all_bowler_names = [];
  var bowler_history_files = await promiseReadDir("./bowler_history");
  // bowler_history_files = bowler_history_files.filter((file) => {
  //   return file.includes(".json");
  // });
  all_bowler_names = bowler_history_files
    .filter((file) => file.includes(".json"))
    .map((file) => {
      return file.substring(0, file.indexOf(".json"));
    });
  // console.log("all_bowler_names: ", all_bowler_names);
  return all_bowler_names;
};

router.get("/", async (req, res) => {
  var all_bowler_names = await getRoutes();
  return res.json(all_bowler_names);
});

router.get("/table", async (req, res) => {
  var all_bowler_names = await getRoutes();
  // console.log("all_bowler_names: ", all_bowler_names);
  var table_results = await all_bowler_names.map(async (bowler_name) => {
    // console.log(bowler_name);
    var file = `./bowler_history/${bowler_name}.json`;
    var json_data = await promiseReadJsonFile(file);
    var result = json_data[json_data.length - 1];
    result["Name"] = bowler_name;
    return result;
  });
  table_results = await Promise.all(table_results);
  console.log(table_results);
  return res.json(table_results);
});

router.get("/history/:name", async (req, res) => {
  var all_bowler_names = await getRoutes();
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

module.exports = router;
