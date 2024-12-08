// import "./tracing.mjs";
import "dotenv/config";
import knex from "knex";
import * as cheerio from "cheerio";
import { dailyRun, firstRun } from "./utils.mjs";

(async () => {
  // Initialize the database connection
  const db = knex({
    client: "pg",
    connection: {
      host: "192.168.2.10",
      port: "5432",
      user: "postgres",
      database: "postgres",
      password: "example",
    },
  });
  console.log("Database Connected");

  // Drop the table if it exists for testing purposes
  await db.schema.dropTableIfExists("bowlers");
  const bowlersExists = await db.schema.hasTable("bowlers");
  const weeklyScoresExists = await db.schema.hasTable("weeklyScores");

  console.log(
    `bowlers table exists: ${bowlersExists} & weeklyScores table exists: ${weeklyScoresExists}`
  );

  if (bowlersExists && weeklyScoresExists) {
    console.log("Program will proceed with daily run flow");
    await dailyRun(db);
    setInterval(async () => {
      await dailyRun(db);
    }, 5 * 60 * 1000);
  } else {
    console.log("Program will proceed with first run flow");
    await firstRun(db);
    setInterval(async () => {
      await dailyRun(db);
    }, 5 * 60 * 1000);
  }
})();
