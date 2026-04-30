require("dotenv").config();

// FRONTEND and BACKEND come from .env
// Falls back to localhost for local development
const FRONTEND = process.env.VITE_FRONTEND_URL || process.env.FRONTEND;
const BACKEND  = process.env.VITE_BACKEND_URL  || process.env.BACKEND ;

module.exports = {
  PORT:                process.env.PORT || 5001,
  GEMINI_API_KEY:      process.env.GEMINI_API_KEY,
  TOMTOM_API_KEY:      process.env.TOMTOM_API_KEY,
  GOOGLE_API_KEY:      process.env.GOOGLE_API_KEY,
  OPENWEATHER_API_KEY: process.env.OPENWEATHER_API_KEY,
  FRONTEND,
  BACKEND,
  // CORS accepts both the frontend origin and the backend itself
  ALLOWED_ORIGINS: [
    FRONTEND,
    BACKEND,
    "http://localhost:5173",
    "http://localhost:5001",
  ].filter((v, i, a) => a.indexOf(v) === i), // deduplicate
};