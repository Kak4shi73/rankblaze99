"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.corsTest = void 0;
const functions = require("firebase-functions");
// CORS test endpoint with explicit headers
exports.corsTest = functions.https.onRequest(async (req, res) => {
    // Set CORS headers for preflight request
    res.set("Access-Control-Allow-Origin", "https://www.rankblaze.in");
    res.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.set("Access-Control-Allow-Headers", "Content-Type");
    res.set("Access-Control-Allow-Credentials", "true");
    // Handle preflight OPTIONS request
    if (req.method === "OPTIONS") {
        return res.status(204).send(""); // No content
    }
    // For GET and POST requests, return a test response
    res.status(200).json({
        success: true,
        message: 'CORS is working correctly!',
        origin: req.headers.origin || 'unknown',
        method: req.method,
        headers: req.headers
    });
});
//# sourceMappingURL=cors-test.js.map