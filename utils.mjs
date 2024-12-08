import * as cheerio from "cheerio";

const createTables = async (db) => {
  await db.schema.dropTableIfExists("bowlers");
  await db.schema.createTable("bowlers", (table) => {
    table.increments("id").primary(); // Primary key
    table.smallint("bowlerId").notNullable(); // ID of the bowler on league secretary
    table.string("bowlerName").notNullable(); // Name of the bowler
    table.smallint("bowlerYear").notNullable(); // Year
  });
  console.log("Created `bowlers` table");

  await db.schema.dropTableIfExists("weeklyScores");
  await db.schema.createTable("weeklyScores", (table) => {
    table.increments("id").primary(); // Primary key
    table.string("bowlerName").notNullable(); // Name of the bowler
    table.smallint("week").notNullable(); // Week number
    table.date("date").notNullable(); // Date
    table.smallint("game_1").notNullable();
    table.smallint("game_2").notNullable();
    table.smallint("game_3").notNullable();
    table.smallint("scratch_score").notNullable();
    table.smallint("handicap").notNullable();
    table.smallint("final_score").notNullable();
    table.smallint("avg_before").notNullable(); // Average before the game
    table.smallint("avg_after").notNullable(); // Average after the game
    table.smallint("avg_today").notNullable(); // Average today
    table.smallint("avg_change").notNullable(); // Change in average
    table.unique(["bowlerName", "date", "week"]);
  });
  console.log("Created `weeklyScores` table");
};

const scrapeYears = async (db) => {
  return new Promise(async (resolve, reject) => {
    try {
      let res = await fetch(
        "https://www.leaguesecretary.com/bowling-centers/rossmere-lanes/bowling-leagues/challengers/bowler/history/108372"
      );
      if (!res.ok) {
        reject(`Error getting years. Response status: ${res.status}`);
      }
      const resHtml = await res.text();
      const $ = cheerio.load(resHtml);
      let yearScriptString = $(
        "body > div.page > div > div > div > div > div.main > div:nth-child(6) > div.col-7 > script"
      ).text();
      yearScriptString = yearScriptString.substring(
        yearScriptString.indexOf("dataSource") + 12,
        yearScriptString.length - 6
      );
      const yearJson = JSON.parse(yearScriptString);
      const cleanedYearJson = yearJson.map((yearObject) => yearObject.YearNum);
      resolve(cleanedYearJson);
    } catch (error) {
      reject(`Exception while getting years. Error: ${error.message}`);
    }
  });
};

const scrapeBowlers = (db, yearsArray) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (yearsArray.length == 0) {
        reject("No years to get bowlers for");
      }
      let bowlersTableJson = [];
      for (let i = 0; i < yearsArray.length; i++) {
        const year = yearsArray[i];
        let res = await fetch(
          `https://www.leaguesecretary.com/bowling-centers/rossmere-lanes/bowling-leagues/challengers/bowler/history/108372/${year}/f`
        );
        if (!res.ok) {
          console.log(
            `Error getting bowlers for ${year}. Response status: ${res.status}`
          );
          return;
        }
        const resHtml = await res.text();
        const $ = cheerio.load(resHtml);
        let bowlerScriptString = $(
          "body > div.page > div > div > div > div > div.main > div:nth-child(7) > div.col-7 > script"
        ).text();
        bowlerScriptString = bowlerScriptString.substring(
          bowlerScriptString.indexOf("dataSource") + 12,
          bowlerScriptString.length - 6
        );
        const bowlerJson = JSON.parse(bowlerScriptString);
        const cleanedBowlerJson = bowlerJson.map((bowlerObject) => {
          return {
            bowlerId: bowlerObject.BowlerID,
            bowlerName: bowlerObject.BowlerName,
            bowlerYear: year,
          };
        });
        bowlersTableJson.push(...cleanedBowlerJson);
      }
      resolve(bowlersTableJson);
    } catch (error) {
      reject(`Exception while getting bowlers. Error: ${error.message}`);
    }
  });
};

const getBowlerHistory = async (year, id, name) => {
  return new Promise(async (resolve, reject) => {
    try {
      let formData = new URLSearchParams();
      formData.append("sort", "");
      formData.append("page", "1");
      formData.append("pageSize", "50");
      formData.append("group", "");
      formData.append(
        "aggregate",
        "Score1-average~Score2-average~Score3-average~Score4-average~Score5-average~Score6-average~SeriesTotal-average"
      );
      formData.append("filter", "");
      formData.append("leagueId", "108372");
      formData.append("year", year);
      formData.append("season", "f");
      formData.append("bowlerId", id);
      let res = await fetch(
        "https://www.leaguesecretary.com/Bowler/BowlerHistory_Read",
        {
          method: "POST",
          body: formData,
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
        }
      );
      if (!res.ok) {
        console.log(
          `Error getting weeklyScores for ${name} - ${year}. Response status: ${res.status}`
        );
        reject(
          `Error getting weeklyScores for ${name} - ${year}. Response status: ${res.status}`
        );
        // continue;
      }
      let jsonRes = await res.json();
      let bowlerHistory = jsonRes.Data.map((weeklyScore) => {
        return {
          bowlerName: name,
          week: weeklyScore.WeekNum,
          date: weeklyScore.DateBowled.substring(
            0,
            weeklyScore.DateBowled.indexOf("T")
          ),
          game_1: weeklyScore.Score1,
          game_2: weeklyScore.Score2,
          game_3: weeklyScore.Score3,
          scratch_score: weeklyScore.SeriesTotal,
          handicap: weeklyScore.HandicapBeforeBowling,
          final_score: weeklyScore.HandicapSeriesTotal,
          avg_before: weeklyScore.AverageBeforeBowling,
          avg_after: weeklyScore.AverageAfterBowling,
          avg_today: weeklyScore.TodaysAverage,
          avg_change: weeklyScore.PlusMinusAverage,
        };
      });
      resolve(bowlerHistory);
    } catch (error) {
      console.log(
        `Exception while getting weeklyScores for ${name} - ${year}: `,
        error.message
      );
      reject(
        `Exception while getting weeklyScores for ${name} - ${year}: ${error.message}`
      );
    }
  });
};

const insertBowlerHistory = async (db, bowler, bowlerHistory) => {
  try {
    console.log(
      "Inserting into `weeklyScores` table for " +
        bowler.bowlerName +
        " - " +
        bowler.bowlerYear
    );
    await db("weeklyScores")
      .insert(bowlerHistory)
      .onConflict(["bowlerName", "week", "date"])
      .merge();
  } catch (err) {
    console.log(
      "Error while inserting into `weeklyScores` table for " +
        bowler.bowlerName +
        " - " +
        bowler.bowlerYear +
        " Error: " +
        err.message
    );
  }
};

export const firstRun = async (db) => {
  console.log("starting firstRun");
  await createTables(db);

  const yearsArray = await scrapeYears(db);
  const bowlersTableJson = await scrapeBowlers(db, yearsArray);
  console.log("Inserting into `bowlers` table");

  await db("bowlers").insert(bowlersTableJson);

  const allBowlers = await db("bowlers")
    .select("bowlerId", "bowlerName", "bowlerYear")
    .orderBy([
      {
        column: "bowlerId",
        order: "asc",
      },
      {
        column: "bowlerYear",
        order: "asc",
      },
    ]);
  for (const bowler of allBowlers) {
    let bowlerHistory = await getBowlerHistory(
      bowler.bowlerYear,
      bowler.bowlerId,
      bowler.bowlerName
    );
    await insertBowlerHistory(db, bowler, bowlerHistory);
  }
  console.log("firstRun complete");
};

export const dailyRun = async (db) => {
  console.log("starting dailyRun");
  const currentBowlers = await db("bowlers")
    .select("bowlerId", "bowlerName", "bowlerYear")
    .where("bowlerYear", "=", db("bowlers").max("bowlerYear"))
    .orderBy([
      {
        column: "bowlerId",
        order: "asc",
      },
    ]);
  for (const bowler of currentBowlers) {
    // TODO This method returns an exception if an http error is received and then stops the flow of the program
    let bowlerHistory = await getBowlerHistory(
      bowler.bowlerYear,
      bowler.bowlerId,
      bowler.bowlerName
    );
    await insertBowlerHistory(db, bowler, bowlerHistory);
  }
  console.log("dailyRun complete");
};
