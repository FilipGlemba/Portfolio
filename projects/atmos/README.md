# Atmos

Portfolio-grade weather dashboard built with vanilla HTML, CSS, JavaScript, and a lightweight Node proxy.

## Highlights

- Secure weather requests through a backend proxy instead of exposing the OpenWeather API key in the browser
- Current weather, hourly outlook, 5-day forecast, air quality, and geolocation support
- Dark and light themes, Celsius and Fahrenheit toggle, autocomplete city search, and recent searches
- Custom SVG weather icons, loading skeletons, subtle animations, and a built-in case-study section

## Stack

- Frontend: HTML, CSS, JavaScript
- Backend: Node.js `http` server
- APIs: OpenWeather current weather, forecast, geocoding, and air pollution

## Run Locally

1. Create a `.env` file based on `.env.example`
2. Add your OpenWeather key:

```env
OPENWEATHER_API_KEY=your_key_here
PORT=3000
```

3. Start the app:

```powershell
& "C:\Program Files\nodejs\npm.cmd" start
```

4. Open:

```text
http://localhost:3000
```

## Deploy

### Render

This repo includes [render.yaml](/C:/Users/filip/OneDrive/Desktop/Weather_App/render.yaml) so it can be deployed as a Render Web Service.

1. Push this project to GitHub
2. Create a new Render Blueprint or Web Service from the repo
3. Set `OPENWEATHER_API_KEY` in Render environment variables
4. Deploy and use the generated public URL as your portfolio live demo link

Render's docs note that public web services must bind to host `0.0.0.0`, which this server now does.

## Project Focus

Atmos was designed as a portfolio piece that shows more than API wiring. The project emphasizes product thinking, UI polish, responsive layout work, safer API architecture, and thoughtful weather presentation.
