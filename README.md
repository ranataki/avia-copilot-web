# Avia Copilot Web

Web application for Avia AI Copilot - Your intelligent aviation companion.

## Features

- Real-time METAR data from AVWX
- Interactive AI copilot demo
- Email signup functionality
- Modern, responsive design

## Setup

1. Clone the repository:
```bash
git clone https://github.com/ranataki/avia-copilot-web.git
cd avia-copilot-web
```

2. Install dependencies:
```bash
npm install
cd netlify/functions && npm install && cd ../..
```

3. Set up environment variables:
- Copy `env.example` to `.env`
- Add your AVWX API token (get one from https://account.avwx.rest/)

4. Run locally:
```bash
npm start
```

The server will start on http://localhost:4000

## Deployment

This project is configured for deployment on Netlify:

1. Connect your GitHub repository to Netlify
2. Add the `AVWX_TOKEN` environment variable in Netlify's dashboard
3. Deploy!

## Development

- `server.js` - Express server for local development
- `netlify/functions/` - Serverless functions for production
- `index.html` - Main landing page
- `admin.html` - Admin interface
