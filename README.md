# Bowling Scraper V2

This program uses python and selenium in order to scrape data from [League Secretary](https://www.leaguesecretary.com/) and then utilizes node.js to serve the scraped data in an API.

## Build the Dockerfile

```
docker image build . -t r2dtoo/bowling_scrapper:latest
```

# Notice
New updates to League Secretary now appear to offer an api to gather bowler history rather than having to scrape the html. Updates to this repo are required
