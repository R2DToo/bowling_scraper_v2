const { promiseReadDir, promiseReadJsonFile } = require("../utils");
var express = require("express");
var router = express.Router();

var all_bowler_history_data = [];

const getRoutes = async () => {
  all_bowler_history_data = [];
  console.log("get bowler history routes");
  var bowler_history_files = await promiseReadDir("bowler_history");
  bowler_history_files.map((file) => {
    var name = file.substring(0, file.indexOf("_"));
    var year = parseInt(
      file.substring(file.indexOf("_") + 1, file.indexOf("."))
    );
    var existing_entry_index = all_bowler_history_data.findIndex(
      (a) => a.name == name
    );
    if (existing_entry_index == -1) {
      all_bowler_history_data.push({ name: name, years: [year] });
    } else {
      all_bowler_history_data[existing_entry_index].years.push(year);
    }
  });
  console.log("all_bowler_history_data: ", all_bowler_history_data);
};

const fileExists = (name, year) => {
  var return_value = false;
  var existing_entry_index = all_bowler_history_data.findIndex(
    (a) => a.name == name
  );
  if (existing_entry_index != -1) {
    return_value = all_bowler_history_data[existing_entry_index].years.some(
      (y) => y == year
    );
  }
  return return_value;
};

router.get("/", (req, res) => {
  return res.json({ data: all_bowler_history_data });
});

router.get("/:name", async (req, res) => {
  var bowler_history = all_bowler_history_data.find(
    (a) => a.name == req.params.name
  );
  if (!bowler_history) {
    return res.status(404).send();
  }
  return res.json({ data: bowler_history.years });
});

router.get("/:name/:year", async (req, res) => {
  if (!fileExists(req.params.name, req.params.year)) {
    return res.status(404).send();
  }
  var file = `bowler_history/${req.params.name}_${req.params.year}.json`;
  var json_data = await promiseReadJsonFile(file);
  return res.json({ data: json_data });
});

getRoutes();
setTimeout(() => {
  setInterval(getRoutes, 60000);
}, 1000);

module.exports = router;
