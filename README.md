# PowerSwitch

A NestJS-based application for managing and automating Utility Provider switching with a built-in web interface.

### Why?
In Pennsylvania, consumers have the power to choose their electricity and natural gas suppliers. By switching to a different provider, you can often find better rates and save 💰 💰 💰 .
Unfortunately, managing this system is cumbersome and time-consuming. Providers often have term limits on their rates and will often increase the rate for existing customers. PowerSwitch helps with this process, helping you save money by always being on the best available rate. and alerting you if a rate is found.

#### Aren't there other alternatives?

Yes, there are other alternatives like Arbor but they are a for-profit enterprise that gets money for referrals. This requires 2 things:

They require you to provide your personal information, which can be a privacy concern.
They have providers they partner with...which might not be the best rate for you
With Power Switch, The data is yours to control. And you can be sure you are getting the best possible rate.

## Features

- This will automatically parse (either via web or the CSV download option) current utility rates for PApower and PAgas.
- It will select the cheapest provider and compare your current rate with that of the cheapest provider. and alert you if there is a cheaper option via an email drop


## Quick Start

### Using Docker (Recommended)

The easiest way to get started is using Docker:

```bash
docker pull ghcr.io/nfons/powerswitch/powerswitch:latest
docker run -p 8080:8080  --env-file ./.env powerswitch
```

Access the application at `http://localhost:8080`

### From Source

**Prerequisites:**
- Node.js (v16 or higher)
- npm or yarn

**Installation:**

```bash
# Clone the repository
git clone git@github.com:nfons/PowerSwitch.git
cd PowerSwitch

# Install dependencies
npm install

# Copy sample environment file and configure
cp sample.env .env
# Edit .env with your settings
```

**Configuration:**

See [Configuration](CONFIGURATION.md) for detailed configuration options.
Edit the `.env` file to customize your setup:

```env
DB_TABLE=powertable.db
CRON_TIME=0 0 10 * *
ELECTRIC_URL='https://www.papowerswitch.com/'
API_TYPE=web
GAS_URL='someurl.com'

# optional
GMAIL_USER=you@gmail.com
GMAIL_PASS=yourAPP password
```

**Run the application:**

```bash
# start the application
npm run start

# Production mode
npm run build && npm run start:prod
```

## Development
Refer to the [Development Guide](DEVELOPMENT.md) for more information.
### API docs (Swagger)

The API is documented using Swagger (OpenAPI).

- Swagger UI: http://localhost:8080/docs
- All API routes are prefixed with `/api` (for example: `GET /api/putlity`, `GET /api/putility/best/:type`).


### Project Structure

```
PowerSwitch/
├── src/              # Source code
├── frontend/         # UI
```

## Testing

```bash
# Run unit tests
npm run test

# coverage tests
npm run test:cov
```

## Docker Deployment

### Pull from Registry

```bash
docker pull ghcr.io/nfons/powerswitch/powerswitch:latest
```

### Run Container

```bash
docker run -p 8080:8080 powerswitch
```
Access the application at `http://localhost:8080`

## Technology Stack

- **Framework:** [NestJS](https://nestjs.com/)
- **Language:** TypeScript
- **Database:** SQLite with TypeORM
- **Testing:** Jest
- **Frontend:** React (Via CRA)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Do some awesome stuff
3. Open a Pull Request

## License

This project is licensed under the GNU General Public License v3.0 - see the [LICENSE.md](LICENSE.md) file for details.

## Support

If you encounter any issues or have questions, please [open an issue](https://github.com/nfons/PowerSwitch/issues) on GitHub.
