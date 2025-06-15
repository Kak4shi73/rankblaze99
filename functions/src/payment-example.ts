import * as functions from 'firebase-functions';
import { Request, Response } from 'express';

exports.initializePayment = functions.https.onRequest(async (req: Request, res: Response): Promise<void> => {
  // Enable CORS
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).send('');
    return;
  }

  try {
    // Example payment initialization
    // const { amount, userId, toolId } = req.body; // Commented out as not used
    
    res.json({
      success: true,
      message: 'Payment example endpoint',
      note: 'This is a placeholder for payment initialization'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error.message
    });
  }
}); 