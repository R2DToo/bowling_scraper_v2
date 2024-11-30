import knex from "knex"; // Use `import` for ES module
import * as cheerio from "cheerio";

const db = knex({
  client: "pg", // PostgreSQL client
  connection: {
    host: "192.168.2.10",
    port: "5432",
    user: "postgres",
    database: "postgres",
    password: "example",
  },
});

const scrapeData = async () => {
  console.log("Starting Scrape");
};

const scrapeYears = async () => {
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

const scrapeBowlers = (yearsArray) => {
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

const dbStartup = async () => {
  return new Promise(async (resolve, reject) => {
    try {
      console.log("Starting application...");

      // For Testing. Remove in final build
      await db.schema.dropTable("bowlers");
      //knex.schema.dropTableIfExists('weeklyScores');
      // End of testing block.

      // Check and create `bowlers` table if it doesn't exist
      const bowlersExists = await db.schema.hasTable("bowlers");
      if (!bowlersExists) {
        await db.schema.createTable("bowlers", (table) => {
          table.increments("id").primary(); // Primary key
          table.smallint("bowlerId").notNullable(); // ID of the bowler on league secretary
          table.string("bowlerName").notNullable(); // Name of the bowler
          table.smallint("bowlerYear").notNullable(); // Year
        });
        console.log("Created `bowlers` table");
        const yearsArray = await scrapeYears();
        const bowlersTableJson = await scrapeBowlers(yearsArray);
        console.log("Inserting into `bowlers` table");
        await db("bowlers").insert(bowlersTableJson);
      } else {
        console.log("`bowlers` table already exists");
      }
      console.log("`bowlers` table ready");

      // Check and create `weeklyScores` table if it doesn't exist
      const weeklyScoresExists = await db.schema.hasTable("weeklyScores");
      if (!weeklyScoresExists) {
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
        });
        console.log("Created `weeklyScores` table");
      } else {
        console.log("`weeklyScores` table already exists");
      }
      console.log("Startup complete");
      resolve();
    } catch (error) {
      reject("Error during startup:", error.message);
    }
  });

  // } finally {
  //   await db.destroy(); // Close the database connection
  // }
};

// Start the application
await dbStartup();
setInterval(() => {
  scrapeData();
}, 2 * 60 * 1000);
