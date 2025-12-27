# PowerSwitch

A NestJS-based application for managing and automating Utility Provider switching with a built-in web interface.

## Features

- This will automtically parse (either via web or the CSV download option) current utility rates for PApower and PAgas.
- It will select the cheapest provider and alert compare your current rate with that of the cheapest provider. and alert you if there is a cheaper option


## Quick Start

### Using Docker (Recommended)

The easiest way to get started is using Docker:

```bash
docker pull ghcr.io/nfons/powerswitch/powerswitch:latest
docker run -p 8080:8080 powerswitch
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
CRON_TIME=* * * * *
ELECTRIC_URL='https://www.papowerswitch.com/'
API_TYPE=web
GAS_URL='someurl.com'
```

**Run the application:**

```bash
# Development mode with hot reload
npm run start:dev

# Production mode
npm run build && npm run start:prod
```

## Development

### Available Scripts

```bash
# Start development server
npm run start:dev

# Build the project
npm run build
```

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
