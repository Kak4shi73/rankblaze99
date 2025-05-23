# RankBlaze API Functions

## CORS Configuration

This project uses Express.js with a properly configured CORS middleware to handle cross-origin requests.

### CORS Setup

```js
// Configure CORS
const corsHandler = cors({
  origin: ['https://www.rankblaze.in', 'https://rankblaze.in', 'http://localhost:3000', 'http://localhost:5173'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-VERIFY'],
  credentials: true
});

// Apply CORS to all routes
app.use(corsHandler);

// Handle OPTIONS pre-flight requests globally
app.options('*', corsHandler);
```

### Important Notes

1. The `app.options('*', corsHandler)` line is crucial as it ensures all OPTIONS pre-flight requests are handled properly.

2. For individual route handlers, use the corsHandler middleware directly:

```js
app.post('/routePath', (req, res) => {
  corsHandler(req, res, async () => {
    // Route handler code here
  });
});
```

## Deployment

To deploy the functions:

```bash
firebase deploy --only functions
``` 