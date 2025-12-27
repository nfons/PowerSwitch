List of available configuration options:


## Required ENV config params
### Gas and electric urls
you can get these from your papowerswitch.com and pagasswitch.com
- `GAS_URL`: The URL for fetching gas power usage data. 
- `ELECTRIC_URL`: The URL for fetching electric power usage data.

In order to get the correct url, visit the site above, and then input your zip code, and select your current power delivery company (i.e PPL, PECO, etc)

<img src="docs/img/zip" alt="drawing" width="500"/>

After that, you will be taken to a page with your current rates, copy the url from that page and paste it into the `GAS_URL` or `ELECTRIC_URL` env variable.

***note:*** if using "web" as API_TYPE, make sure to filter `rate options` and `Terms and Conditions` to filter out bad providers


## Optional ENV config params
- `DB_TABLE`: The name of the database table to store power usage data. Default is `powertable.db`.
- `CRON_TIME`: The cron schedule for running the power usage check. Default is `* * * * *` (every minute).
- `API_TYPE`: The type of API to use for fetching power usage data. Default is `csv`.
