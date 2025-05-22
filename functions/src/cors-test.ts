import * as functions from 'firebase-functions';
import { Request, Response } from 'express';

// CORS test endpoint with explicit headers
export const corsTest = functions.https.onRequest(async (req: Request, res: Response) => {
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