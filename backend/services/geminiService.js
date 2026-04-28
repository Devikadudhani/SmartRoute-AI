const axios = require("axios");
const { GEMINI_API_KEY } = require("../config");

const GEMINI_URL = `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent`;

/**
 * Calls the Gemini API with a given prompt and returns the raw text response.
 */
async function callGemini(prompt, timeout = 12000) {
  const response = await axios.post(
    `${GEMINI_URL}?key=${GEMINI_API_KEY}`,
    { contents: [{ parts: [{ text: prompt }] }] },
    { timeout }
  );
  return response.data.candidates?.[0]?.content?.parts?.[0]?.text || "";
}

/**
 * Scores the risk of a route based on weather, time, and any active disruption.
 * Returns { risk: "Low"|"Medium"|"High", reasons: string[] }
 */
async function scoreRouteRisk(path, weather, disruption) {
  const now = new Date();
  const timeStr = `${now.getHours()}:${now.getMinutes()}`;

  const disruptionNote = disruption
    ? `\nActive disruption on route: ${disruption.type} at ${disruption.streetName}. This route ${
        disruption.avoidStreet ? "AVOIDS" : "PASSES THROUGH"
      } that street.`
    : "";

  const prompt = `Analyze delivery route risk:
Weather: ${weather?.condition ?? "Clear"}, ${weather?.temp ?? 28}°C
Time: ${timeStr}
Route length: ${path.length} points${disruptionNote}

Return STRICT JSON only, no markdown:
{"risk":"Low","reasons":["reason1"]}
Valid risk values: Low, Medium, High`;

  try {
    const text = await callGemini(prompt);
    const cleaned = text.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(cleaned);
    return { risk: parsed.risk || "Low", reasons: parsed.reasons || [] };
  } catch {
    if (disruption && !disruption.avoidStreet) {
      return { risk: "High", reasons: ["Disruption on this route"] };
    }
    return { risk: "Low", reasons: ["Weather clear, no known hazards"] };
  }
}

/**
 * Analyzes traffic risk given traffic data, weather and time.
 * Returns a full parsed AI response object.
 */
async function analyzeTrafficRisk(traffic, weather, time) {
  const delayRatio = Number(traffic?.delayRatio);
  const speedRatio = traffic?.currentSpeed && traffic?.freeFlowSpeed
    ? traffic.currentSpeed / traffic.freeFlowSpeed
    : null;

  const prompt = `
Analyze traffic risk:

Traffic:
- Current Speed: ${traffic?.currentSpeed ?? "Not available"}
- Free Flow Speed: ${traffic?.freeFlowSpeed ?? "Not available"}
- Delay Ratio: ${traffic?.delayRatio ?? "Not available"}

Weather:
- Condition: ${weather?.condition ?? "Unknown"}
- Temperature: ${weather?.temp ?? "Unknown"}

Time: ${time}

Return STRICT JSON:
{
  "risk": "Low | Medium | High",
  "reasons": ["reason1", "reason2"]
}
`;

  try {
    const text = await callGemini(prompt);
    const cleaned = text.replace(/```json|```/g, "").trim();
    return JSON.parse(cleaned);
  } catch {
    const reasons = [];
    let riskScore = 0;

    if (delayRatio !== null && !Number.isNaN(delayRatio)) {
      if (delayRatio >= 1.8) {
        riskScore += 2;
        reasons.push("Heavy traffic delay detected");
      } else if (delayRatio >= 1.3) {
        riskScore += 1;
        reasons.push("Traffic is moving slower than normal");
      }
    }

    if (speedRatio !== null && !Number.isNaN(speedRatio)) {
      if (speedRatio < 0.4) {
        riskScore += 2;
      } else if (speedRatio < 0.7) {
        riskScore += 1;
      }
    }

    if (typeof weather?.temp === "number" && weather.temp >= 34) {
      riskScore += 1;
      reasons.push("High temperature may increase driving fatigue");
    }

    if (typeof weather?.temp === "number" && weather.temp <= 8) {
      riskScore += 1;
      reasons.push("Cold conditions may slow travel");
    }

    if (String(weather?.condition || "").toLowerCase().includes("rain")) {
      riskScore += 2;
      reasons.push("Rain may reduce road speed and visibility");
    }

    if (reasons.length === 0) {
      reasons.push("Traffic and weather look stable");
    }

    if (riskScore >= 3) return { risk: "High", reasons };
    if (riskScore >= 1) return { risk: "Medium", reasons };
    return { risk: "Low", reasons };
  }
}

/**
 * Lists all available Gemini models.
 */
async function listModels() {
  const response = await axios.get(
    `https://generativelanguage.googleapis.com/v1/models?key=${GEMINI_API_KEY}`
  );
  return response.data;
}

module.exports = { scoreRouteRisk, analyzeTrafficRisk, listModels };
