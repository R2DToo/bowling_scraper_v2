const { promiseReadDir, promiseReadJsonFile } = require("../utils");
var express = require("express");
var router = express.Router();

var all_team_info_data = [];

const getRoutes = async () => {
  var team_info_files = await promiseReadDir("team_info");
  team_info_files.map((file) => {
    var name = file.substring(0, file.indexOf("_"));
    var year = parseInt(
      file.substring(file.indexOf("_") + 1, file.indexOf("."))
    );
    var existing_entry_index = all_team_info_data.findIndex(
      (a) => a.name == name
    );
    if (existing_entry_index == -1) {
      all_team_info_data.push({ name: name, years: [year] });
    } else {
      all_team_info_data[existing_entry_index].years.push(year);
    }
  });
};

const fileExists = (name, year) => {
  var return_value = false;
  var existing_entry_index = all_team_info_data.findIndex(
    (a) => a.name == name
  );
  if (existing_entry_index != -1) {
    return_value = all_team_info_data[existing_entry_index].years.some(
      (y) => y == year
    );
  }
  return return_value;
};

router.get("/", (req, res) => {
  return res.json({ data: all_team_info_data });
});

router.get("/:name", async (req, res) => {
  var team_info = all_team_info_data.find((a) => a.name == req.params.name);
  if (!team_info) {
    return res.status(404).send();
  }
  return res.json({ data: team_info.years });
});

router.get("/:name/:year", async (req, res) => {
  if (!fileExists(req.params.name, req.params.year)) {
    return res.status(404).send();
  }
  var file = `team_info/${req.params.name}_${req.params.year}.json`;
  var json_data = await promiseReadJsonFile(file);
  return res.json({ data: json_data });
});

getRoutes();
module.exports = router;
