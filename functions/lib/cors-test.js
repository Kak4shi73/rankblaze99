"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.corsTest = void 0;
const functions = require("firebase-functions");
// CORS test endpoint
exports.corsTest = functions.https.onRequest(async (req, res) => {
    // Enable CORS
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') {
        res.status(200).send('');
        return;
    }
    try {
        res.json({
            success: true,
            message: 'CORS test successful',
            timestamp: new Date().toISOString(),
            method: req.method,
            headers: req.headers
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: 'Internal server error',
            details: error.message
        });
    }
});
//# sourceMappingURL=cors-test.js.map