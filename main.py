import requests
import pandas as pd
import json
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import Select
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException
from selenium.webdriver.common.keys import Keys

fireFoxOptions = webdriver.FirefoxOptions()
fireFoxOptions.set_headless()
driver = webdriver.Firefox(firefox_options=fireFoxOptions)

def main():
    # get_team_info()
    # get_bowler_history()

    driver.close()

def get_bowler_history():
    driver.get("https://www.leaguesecretary.com/bowling-centers/rossmere-laneswinnipeg-manitoba/bowling-leagues/challengers/bowler-info/first-bowler/2022/fall/108372/0")
    # print("page loaded")

    year_select_length = Select(driver.find_element(By.XPATH, '//*[@id="ctl00_MainContent_BowlerHistoryGrid1_rddSeasonYear"]/select'))
    # print(f"year_select has {len(year_select_length.options)} options")


    for i in range(0, len(year_select_length.options)):
        year_select = Select(driver.find_element(By.XPATH, '//*[@id="ctl00_MainContent_BowlerHistoryGrid1_rddSeasonYear"]/select'))
        year_select.select_by_index(str(i))
        driver.implicitly_wait(10)

        bowler_select_length = Select(driver.find_element(By.XPATH, '//*[@id="ctl00_MainContent_BowlerHistoryGrid1_rddBowler"]/select'))
        # print(f"team_select has {len(bowler_select_length.options)} options")

        for i in range(0, len(bowler_select_length.options)):
            bowler_select = Select(driver.find_element(By.XPATH, '//*[@id="ctl00_MainContent_BowlerHistoryGrid1_rddBowler"]/select'))
            bowler_select.select_by_index(str(i))
            try:
                driver.find_element(By.TAG_NAME, 'html').send_keys(Keys.END)
                history_presence = EC.presence_of_element_located((By.ID, 'ctl00_MainContent_BowlerHistoryGrid1_RadGrid1_ctl00'))
                WebDriverWait(driver, 10).until(history_presence)
                history_table = driver.find_element(By.ID, 'ctl00_MainContent_BowlerHistoryGrid1_RadGrid1_ctl00').get_attribute('outerHTML')
                # scrape_table_csv(history_table, get_bowler_history_file_name("csv"))
                scrape_table_json(history_table, get_bowler_history_file_name("json"))
            except TimeoutException:
                print(f"ERROR WHILE SCRAPING FOR {get_bowler_history_file_name('json')}")

def get_team_info():
    driver.get("https://www.leaguesecretary.com/bowling-centers/rossmere-laneswinnipeg-manitoba/bowling-leagues/challengers/team/history/first-team/2022/fall/108372/0")
    # print("page loaded")

    year_select_length = Select(driver.find_element(By.XPATH, '//*[@id="ctl00_MainContent_rddSeasonYear1"]/select'))
    # print(f"year_select has {len(year_select_length.options)} options")


    for i in range(0, len(year_select_length.options)):
        year_select = Select(driver.find_element(By.XPATH, '//*[@id="ctl00_MainContent_rddSeasonYear1"]/select'))
        year_select.select_by_index(str(i))
        driver.implicitly_wait(10)

        team_select_length = Select(driver.find_element(By.XPATH, '//*[@id="ctl00_MainContent_rddTeam1"]/select'))
        # print(f"team_select has {len(team_select_length.options)} options")

        for i in range(0, len(team_select_length.options)):
            team_select = Select(driver.find_element(By.XPATH, '//*[@id="ctl00_MainContent_rddTeam1"]/select'))
            team_select.select_by_index(str(i))
            try:
                driver.find_element(By.TAG_NAME, 'html').send_keys(Keys.END)
                team_history_presence = EC.presence_of_element_located((By.ID, 'ctl00_MainContent_RadGrid1_ctl00'))
                WebDriverWait(driver, 10).until(team_history_presence)
                team_history_table = driver.find_element(By.ID, 'ctl00_MainContent_RadGrid1_ctl00').get_attribute('outerHTML')
                scrape_table_json(team_history_table, get_team_info_file_name("json"))
                # scrape_table_csv(team_history_table, get_team_info_file_name("csv"))
            except TimeoutException:
                print(f"ERROR WHILE SCRAPING FOR {get_team_info_file_name('json')}")

def scrape_table_csv(element, csvFileName):
    df = pd.read_html(element)[0]
    df.to_csv(csvFileName, index=False)
    print(f"wrote {csvFileName} successfully")

def scrape_table_json(element, jsonFileName):
    df = pd.read_html(element)[0]
    json_data = df.to_json(orient='records')
    parsed_data = json.loads(json_data)
    parsed_data.pop()
    with open(jsonFileName, "w") as outfile:
        outfile.write(json.dumps(parsed_data, indent=2))
        print(f"wrote {jsonFileName} successfully")

def get_team_info_file_name(extension = ""):
    team_info_from_url = driver.current_url[driver.current_url.index("team-info/") + 10:]
    team_name = team_info_from_url[:team_info_from_url.index("/")]
    team_info_from_url = team_info_from_url[team_info_from_url.index("/") + 1:]
    year = team_info_from_url[:team_info_from_url.index("/")]
    team_info_from_url = team_info_from_url[team_info_from_url.index("/") + 1:]
    return f"team_info/{team_name}_{year}.{extension}"

def get_bowler_history_file_name(extension = ""):
    bowler_history_from_url = driver.current_url[driver.current_url.index("bowler-info/") + 12:]
    bowler_name = bowler_history_from_url[:bowler_history_from_url.index("/")]
    bowler_history_from_url = bowler_history_from_url[bowler_history_from_url.index("/") + 1:]
    year = bowler_history_from_url[:bowler_history_from_url.index("/")]
    bowler_history_from_url = bowler_history_from_url[bowler_history_from_url.index("/") + 1:]
    return f"bowler_history/{bowler_name}_{year}.{extension}"

if __name__ == "__main__":
    main()