const express = require("express");
const PORT = process.env.PORT || 5001;
const { corsMiddleware, corsPreFlight } = require("./middleware/cors");

// Route modules
const trafficRoutes = require("./routes/traffic");
const vehicleRoutes = require("./routes/vehicles");
const routeRoutes  = require("./routes/routes");
const aiRoutes     = require("./routes/ai");

const app = express();

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(corsMiddleware);
app.options("*", corsPreFlight); // Handle pre-flight for all routes
app.use(express.json());

// ── Routes ────────────────────────────────────────────────────────────────────
app.get("/", (req, res) => res.send("API is running"));

app.use("/", trafficRoutes); // /traffic-flow, /route-traffic-summary, /traffic
app.use("/", vehicleRoutes); // /update-location, /vehicle-locations, /driver/:id
app.use("/", routeRoutes);   // /optimize-route, /simulate-disruption, /smart-reroute
app.use("/", aiRoutes);      // /ai-risk, /list-models




// // TEMP DEBUG - remove after fixing
// app.get("/debug-cors", (req, res) => {
//   res.json({ ALLOWED_ORIGINS: require("../config").ALLOWED_ORIGINS });
// });

// ── Start ─────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
