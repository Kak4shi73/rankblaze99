import * as functions from 'firebase-functions';
import { Request, Response } from 'express';

// CORS test endpoint
export const corsTest = functions.https.onRequest(async (req: Request, res: Response): Promise<void> => {
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
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error.message
    });
  }
}); 