const {
  Builder,
  Browser,
  By,
  Key,
  until,
  Select,
} = require("selenium-webdriver");
const path = require("path");
const fs = require("fs");
const Chrome = require("selenium-webdriver/chrome");
const csv = require("csv-parser");
const { DateTime } = require("luxon");

async function scrape_startup() {
  console.log("scrape_startup");
  // await delete_old_files("./bowler_history");
  const options = new Chrome.Options();
  options.addArguments("--headless=new");
  options.addArguments("--no-sandbox");
  options.setUserPreferences({
    "download.default_directory": path.dirname(__filename) + "/bowler_history/",
  });
  let driver = await new Builder()
    .forBrowser("chrome")
    .setChromeOptions(options)
    .build();
  try {
    let listOfYearOptions = await getYearOptions(driver);
    // console.log("listOfYearOptions: ", listOfYearOptions);
    for (let yearIndex in listOfYearOptions) {
      let listOfBowlerOptions = await getBowlerOptions(
        driver,
        listOfYearOptions[yearIndex]
      );
      // console.log(listOfBowlerOptions);
      for (let bowlerIndex in listOfBowlerOptions) {
        try {
          let downloadedFilePath = await downloadBowlerScores(
            driver,
            listOfYearOptions[yearIndex],
            listOfBowlerOptions[bowlerIndex]
          );
          console.log(downloadedFilePath);
          await delay(1000);
          await addToPersonalJsonScores(
            downloadedFilePath,
            listOfYearOptions[yearIndex]
          );
          console.log("-----------------------------");
          await delay(500);
        } catch (e) {
          continue;
        }
      }
    }
    // await addToPersonalJsonScores("dennis-braun-history.csv");
  } catch (e) {
    console.error(`ERROR: ${e}`);
  } finally {
    console.log("CLOSING WEBDRIVER");
    await driver.quit();
  }
}

async function scrape_daily() {
  console.log("scrape_daily");
  const options = new Chrome.Options();
  options.addArguments("--headless=new");
  options.addArguments("--no-sandbox");
  options.setUserPreferences({
    "download.default_directory": path.dirname(__filename) + "/bowler_history/",
  });
  let driver = new Builder()
    .forBrowser("chrome")
    .setChromeOptions(options)
    .build();
  try {
    let listOfYearOptions = await getYearOptions(driver);
    let currentYear = listOfYearOptions[listOfYearOptions.length - 1];
    let listOfBowlerOptions = await getBowlerOptions(driver, currentYear);
    // console.log(listOfBowlerOptions);
    for (let bowlerIndex in listOfBowlerOptions) {
      try {
        let downloadedFilePath = await downloadBowlerScores(
          driver,
          currentYear,
          listOfBowlerOptions[bowlerIndex]
        );
        console.log(downloadedFilePath);
        await delay(1000);
        await addToPersonalJsonScores(downloadedFilePath, currentYear);
        console.log("-----------------------------");
      } catch (e) {
        continue;
      }
    }
    // await addToPersonalJsonScores("dennis-braun-history.csv");
  } catch (e) {
    console.error(`ERROR: ${e}`);
  } finally {
    console.log("CLOSING WEBDRIVER");
    await driver.quit();
  }
}

async function getYearOptions(driver) {
  const responsePromise = new Promise(async (resolve, reject) => {
    let yearOptions = [];
    try {
      await driver.get(
        "https://www.leaguesecretary.com/bowling-centers/rossmere-laneswinnipeg-manitoba/bowling-leagues/challengers/bowler-info/first-bowler/2018/fall/108372/0"
      );
      let yearSelectElement = await driver.wait(
        until.elementLocated(
          By.xpath(
            `//*[@id="ctl00_MainContent_BowlerHistoryGrid1_rddSeasonYear"]/select`
          )
        ),
        10000
      );
      const yearSelect = new Select(yearSelectElement);
      const yearOptionElement = await yearSelect.getOptions();
      for (const index in yearOptionElement) {
        let text = await yearOptionElement[index].getText();
        text = text.substring(5);
        yearOptions.push(text);
      }
      yearOptions.sort();
    } catch (e) {
      reject(e);
    }
    resolve(yearOptions);
  });
  return responsePromise;
}

async function getBowlerOptions(driver, year) {
  let responsePromise = new Promise(async (resolve, reject) => {
    let bowlerOptions = [];
    try {
      await driver.get(
        `https://www.leaguesecretary.com/bowling-centers/rossmere-laneswinnipeg-manitoba/bowling-leagues/challengers/bowler-info/first-bowler/${year}/fall/108372/0`
      );
      let bowlerSelectElement = await driver.wait(
        until.elementLocated(
          By.xpath(
            `//*[@id="ctl00_MainContent_BowlerHistoryGrid1_rddBowler"]/select`
          )
        ),
        10000
      );
      const bowlerSelect = new Select(bowlerSelectElement);
      const bowlerOptionElement = await bowlerSelect.getOptions();
      for (const index in bowlerOptionElement) {
        let bowlerOptionValue = await bowlerOptionElement[index].getAttribute(
          "value"
        );
        let bowlerOptionText = await bowlerOptionElement[index].getText();
        let bowlerNameArray = bowlerOptionText.split(",");
        bowlerNameArray = bowlerNameArray.map((partOfName) => {
          partOfName = partOfName.replace(" ", "");
          partOfName = partOfName.replace(" ", "-");
          partOfName = partOfName.toLowerCase();
          return partOfName;
        });
        let firstName = bowlerNameArray[1];
        let lastName = bowlerNameArray[0];
        let bowlerObject = {
          id: bowlerOptionValue,
          name: `${firstName}-${lastName}`,
        };
        bowlerOptions.push(bowlerObject);
      }
    } catch (e) {
      reject(e);
    }
    resolve(bowlerOptions);
  });
  return responsePromise;
}

async function downloadBowlerScores(driver, year, bowlerObject) {
  return new Promise(async (resolve, reject) => {
    let downloadedFilePath = `${bowlerObject.name}-history.csv`;
    try {
      await driver.get(
        `https://www.leaguesecretary.com/bowling-centers/rossmere-laneswinnipeg-manitoba/bowling-leagues/challengers/bowler-info/${bowlerObject.name}/${year}/fall/108372/${bowlerObject.id}`
      );
      await delay(600);
      await driver.executeScript(
        "document.getElementById('ctl00_MainContent_BowlerHistoryGrid1_RadGrid1_ctl00_ctl02_ctl00_ExportToCsvButton').click()"
      );
      // await driver.executeScript(
      //   "document.getElementById('ctl00_MainContent_BowlerHistoryGrid1_RadGrid1_ctl00').scrollIntoView()"
      // );
      // await delay(200);
      // let downloadButtonElement = await driver.wait(
      //   until.elementLocated(
      //     By.id(
      //       "ctl00_MainContent_BowlerHistoryGrid1_RadGrid1_ctl00_ctl02_ctl00_ExportToCsvButton"
      //     )
      //   ),
      //   5000
      // );
      // await downloadButtonElement.click();

      await delay(2500);
      await fs.promises.access(
        `./bowler_history/${downloadedFilePath}`,
        fs.constants.F_OK
      );
      resolve(downloadedFilePath);
    } catch (e) {
      // Catches 2 errors.
      // Error while trying to click the download button
      // File not found after it was supposed to download
      console.error(
        `Error encountered while downloading scores for ${bowlerObject.name} ${year}`
      );
      console.error(e);
      reject(e);
    }
  });
}

async function addToPersonalJsonScores(downloadedFilePath, year) {
  return new Promise((resolve, reject) => {
    let json = [];
    try {
      fs.createReadStream(`./bowler_history/${downloadedFilePath}`)
        .pipe(csv())
        .on("data", (row) => {
          // Process each row here
          let keys = Object.keys(row);
          row.Week =
            parseInt(row[keys[0]]) == NaN
              ? row[keys[0]]
              : parseInt(row[keys[0]]);
          delete row[keys[0]];
          row.Season = parseInt(year) == NaN ? year : parseInt(year);
          // row.Date =
          //   row["Date"].substring(
          //     0,
          //     getNthOccurrence(row["Date"], "/", 2) + 1
          //   ) + DateTime.now().year;
          row.Game1 =
            parseInt(row["Gm1"]) == NaN ? row["Gm1"] : parseInt(row["Gm1"]);
          delete row["Gm1"];
          row.Game2 =
            parseInt(row["Gm2"]) == NaN ? row["Gm2"] : parseInt(row["Gm2"]);
          delete row["Gm2"];
          row.Game3 =
            parseInt(row["Gm3"]) == NaN ? row["Gm3"] : parseInt(row["Gm3"]);
          delete row["Gm3"];
          row.ScratchScore =
            parseInt(row["SS"]) == NaN ? row["SS"] : parseInt(row["SS"]);
          delete row["SS"];
          row.Handicap =
            parseInt(row["HCP"]) == NaN ? row["HCP"] : parseInt(row["HCP"]);
          delete row["HCP"];
          row.FinalScore =
            parseInt(row["HS"]) == NaN ? row["HS"] : parseInt(row["HS"]);
          delete row["HS"];
          row.AvgBefore =
            parseInt(row["Avg<br />Before"]) == NaN
              ? row["Avg<br />Before"]
              : parseInt(row["Avg<br />Before"]);
          delete row["Avg<br />Before"];
          row.AvgAfter =
            parseInt(row["Avg<br />After"]) == NaN
              ? row["Avg<br />After"]
              : parseInt(row["Avg<br />After"]);
          delete row["Avg<br />After"];
          row.TodaysAvg =
            parseInt(row["Todays<br />Avg"]) == NaN
              ? row["Todays<br />Avg"]
              : parseInt(row["Todays<br />Avg"]);
          delete row["Todays<br />Avg"];
          row.PlusMinusAvg =
            parseInt(row["+/-<br />Avg"]) == NaN
              ? row["+/-<br />Avg"]
              : parseInt(row["+/-<br />Avg"]);
          delete row["+/-<br />Avg"];

          // console.log(row);
          json.push(row);
        })
        .on("end", async () => {
          // All rows have been processed
          console.log(
            `CSV file reading and parsing complete. ${downloadedFilePath} ${year}`
          );
          if (json.length == 0) {
            console.log("The downloaded CSV was blank!!");
            await fs.promises.unlink(`./bowler_history/${downloadedFilePath}`);
            // console.log(`Deleted ${downloadedFilePath}`);
            resolve();
            return;
          } else {
            // console.log(json);
          }
          let jsonFileName =
            downloadedFilePath.substring(
              0,
              downloadedFilePath.indexOf("-history")
            ) + ".json";
          let jsonFileExists = false;
          try {
            await fs.promises.access(
              `./bowler_history/${jsonFileName}`,
              fs.constants.F_OK
            );
            jsonFileExists = true;
          } catch (e) {
            // console.error(e);
          }
          // console.log(`${jsonFileName} Already Exists: ${jsonFileExists}`);
          if (jsonFileExists) {
            try {
              let existingJsonContent = await fs.promises.readFile(
                `./bowler_history/${jsonFileName}`
              );
              let existingJson = JSON.parse(existingJsonContent);
              let newJson = existingJson.filter((scoreEntry) => {
                var currentSeason =
                  parseInt(year) == NaN ? year : parseInt(year);
                return scoreEntry.Season != currentSeason;
              });
              newJson = newJson.concat(json);
              await fs.promises.writeFile(
                `./bowler_history/${jsonFileName}`,
                JSON.stringify(newJson, null, 2)
              );
              console.log(`Data updated successfully to ${jsonFileName}`);
            } catch (e) {
              console.error(e);
            }
          } else {
            await fs.promises.writeFile(
              `./bowler_history/${jsonFileName}`,
              JSON.stringify(json, null, 2)
            );
            console.log(`Data written successfully to ${jsonFileName}`);
          }
          await fs.promises.unlink(`./bowler_history/${downloadedFilePath}`);
          // console.log(`Deleted ${downloadedFilePath}`);
          resolve();
        })
        .on("error", (e) => {
          console.error(
            `Error while reading CSV ./bowler_history/${downloadedFilePath}`
          );
          console.error(e);
          reject(e);
        });
    } catch (e) {
      console.error(
        `Error while reading CSV ./bowler_history/${downloadedFilePath}`
      );
      console.error(e);
      reject(e);
    }
  });
}

const delete_old_files = async (folder) => {
  let files = await fs.promises.readdir(folder);
  for (const file of files) {
    await fs.promises.unlink(`${folder}/${file}`);
  }
  return;
};

// Function to get index of occurrence
function getNthOccurrence(str, subStr, i) {
  return str.split(subStr, i).join(subStr).length;
}

function delay(time) {
  return new Promise((resolve) => setTimeout(resolve, time));
}

module.exports = { scrape_startup, scrape_daily };
