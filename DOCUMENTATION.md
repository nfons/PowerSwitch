# PowerSwitch Application Documentation

## Quick Start Guide

### 1. Environment Setup
- Copy `sample.env` to `.env`:
  ```bash
  cp sample.env .env
  ```
- Edit `.env` and update the values as needed.

#### Example `.env` file:
```
DB_TABLE=powertable.db
CRON_TIME=0 0 10 * *
ELECTRIC_URL='https://www.papowerswitch.com/shop-for-rates-results?zip=15243&distributor=1180&distributorrate=RH%20-%20Residential%20Heating%20Service&servicetype=residential&usage=700&min-price=&max-price=&offerPreferences%5B%5D=no_cancellation&offerPreferences%5B%5D=no_enrollment&offerPreferences%5B%5D=no_monthly&offerPreferences%5B%5D=introductory_prices&sortby=est_a'
API_TYPE=web
GAS_URL=https://www.pagasswitch.com/shop-for-rates/?zipcode=15243&serviceType=residential&distributor=4420&usage=75&min-price=&max-price=&offerPreferences%5B%5D=no_cancellation&offerPreferences%5B%5D=no_deposit&offerPreferences%5B%5D=no_monthly&sortby=est_a
EMAIL_TEST=true
# GMAIL_USER=
# GMAIL_PASS=
```

> **Tip:** For email testing, get a fake SMTP account from [ethereal.email](https://ethereal.email/) and fill in the `GMAIL_USER` and `GMAIL_PASS` fields in your `.env` file.

---

### 2. Install Dependencies
Install dependencies for both the backend and frontend:

```bash
npm install
cd frontend && npm install
```

---

### 3. Running the Application

#### Backend (API Server)
From the `PowerSwitch` directory:
```bash
npm run start
```

#### Frontend (React App)
1. Set the API server URL:
   - In the `frontend` directory, set the environment variable:
     ```bash
     REACT_APP_API_HOST=http://localhost:8080
     ```
2. Start the frontend:
   ```bash
   cd frontend
   REACT_APP_API_HOST=http://localhost:8080 npm run start
   ```

---

## Additional Notes
- Make sure your `.env` file is properly configured before starting the application.
- The backend server runs on port `8080` by default.
- The frontend expects the API server to be available at the URL specified by `REACT_APP_API_HOST`.
- If you run the server on a different port, make sure to update the `REACT_APP_API_HOST` environment variable accordingly.

