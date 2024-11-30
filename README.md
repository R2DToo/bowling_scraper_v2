# Bowling Scraper V2

This program uses python and selenium in order to scrape data from [League Secretary](https://www.leaguesecretary.com/) and then utilizes node.js to serve the scraped data in an API.

## Build the Dockerfile

```
docker image build . -t r2dtoo/bowling_scrapper:latest
```

# Notice
New updates to League Secretary now appear to offer an api to gather bowler history rather than having to scrape the html. Updates to this repo are required

# New Plan
1. Scrape the script tags for both year and bowler because I don't see any other way to map ID to Name
2. Iterate through each year and bowler making an HTTP POST to https://www.leaguesecretary.com/Bowler/BowlerHistory_Read for the scores. This will return JSON instead of the previously used CSV.
3. Rewrite the function responsible for merging latest scraped scores with master score files to write to a database
4. Remove web routes portion of the application since Grafana can connect to the database directly instead of needing to serve the JSON master files
