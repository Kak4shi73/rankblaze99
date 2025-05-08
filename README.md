# RANKBLAZE - Next-Gen Subscriptions

A React application for subscription management built with Vite, React, TypeScript, and Firebase.

## Features

- User authentication with email/password
- Email OTP verification for enhanced security
- Google Sign-in integration
- Modern, responsive UI with Tailwind CSS

## Setup

### Prerequisites

- Node.js 16+ and npm
- Firebase account

### Installation

1. Clone this repository
2. Install dependencies:
   ```
   npm install
   ```

3. Set up Firebase:
   - Create a new project in the [Firebase Console](https://console.firebase.google.com/)
   - Enable Authentication (Email/Password and Google providers)
   - Enable Realtime Database
   - Enable Functions

4. Deploy Firebase functions for email sending:
   ```
   cd functions
   npm install
   npm run build
   firebase deploy --only functions
   ```

5. Configure email sending:
   ```
   firebase functions:config:set email.user="your-email@gmail.com" email.password="your-app-password"
   ```
   
   Note: For Gmail, you'll need to create an app password. Go to your Google Account > Security > 2-Step Verification > App passwords.

6. Start the development server:
   ```
   npm run dev
   ```

## Development

### Running Locally

```
npm run dev
```

### Building for Production

```
npm run build
```

## Email OTP Authentication

This project uses Firebase Functions to send OTP verification emails:

1. When a user tries to log in or sign up, they enter email and password
2. A 6-digit OTP code is generated and sent to their email
3. User enters the OTP code to complete authentication
4. Upon successful verification, user is redirected to the dashboard

## Deployment

### Firebase Hosting

1. Build the project:
   ```
   npm run build
   ```

2. Deploy to Firebase Hosting:
   ```
   firebase deploy --only hosting
   ```

### Vercel Deployment

### Prerequisites

- A [Vercel](https://vercel.com) account
- A [GitHub](https://github.com) account
- [Git](https://git-scm.com/downloads) installed on your local machine

### Step 1: Push code to GitHub

1. Create a new GitHub repository
2. Initialize the local repository and push code:

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin YOUR_REPO_URL
git push -u origin main
```

### Step 2: Deploy on Vercel

1. Log in to your Vercel account
2. Click "Add New" > "Project"
3. Connect your GitHub account and select your repository
4. Configure project:
   - Framework Preset: Vite
   - Root Directory: Leave as default (should be `/`)
   - Build Command: Automatically detected (`npm run build`)
   - Output Directory: Automatically detected (`dist`)

5. Add Environment Variables:
   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_AUTH_DOMAIN`
   - `VITE_FIREBASE_DATABASE_URL`
   - `VITE_FIREBASE_PROJECT_ID`
   - `VITE_FIREBASE_STORAGE_BUCKET`
   - `VITE_FIREBASE_MESSAGING_SENDER_ID`
   - `VITE_FIREBASE_APP_ID`
   - `VITE_FIREBASE_MEASUREMENT_ID`
   - `VITE_RAZORPAY_KEY_ID` (if using Razorpay)

6. Click "Deploy"

### Troubleshooting

If you encounter build errors:

1. Check Vercel deployment logs
2. Verify that all environment variables are set correctly
3. Make sure all dependencies are installed (`npm install`)
4. Test build locally (`npm run build`) before deploying

### Additional Configuration

The project includes a `vercel.json` file to handle client-side routing. This ensures that all routes are correctly handled when deployed on Vercel.

## Local Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Session Sharing Protection

This project includes protection against session sharing extensions like "Session Share" and similar tools that allow users to share their login sessions by copying cookies.

## How It Works

The security system implements several mechanisms to prevent unauthorized access via shared cookies:

1. **Device Fingerprinting**: The application generates a unique fingerprint for each device based on browser properties, screen resolution, timezone, and language. This fingerprint is stored both in the database and locally.

2. **Session Token**: A unique session token is generated during login and stored in both the database and local storage.

3. **Validation System**: Each time a user performs an authenticated action, the system validates:
   - If the current device fingerprint matches the one stored in the database
   - If the session token in local storage matches the one in the database

4. **Session Monitoring**: The system monitors session tokens in real-time. If a new login occurs elsewhere, the previous session is invalidated.

5. **Admin Exemption**: Administrators are exempt from these security measures to facilitate system management.

## Implementation Details

The security system is implemented in the following files:

- `src/utils/securityUtils.ts`: Contains the core security utilities
- `src/context/AuthContext.tsx`: Uses security utilities during authentication flows
- `src/pages/AdminLogin.tsx` and `src/pages/Admin.tsx`: Admin-specific handling

## How to Test

1. Log in to the application from one browser
2. Try to copy cookies using Session Share extension
3. Paste the cookies in another browser
4. The system will detect the discrepancy and redirect to the login page

## Security Considerations

- This system prevents session sharing but isn't a complete security solution
- Always implement HTTPS, CSRF protection, and other security best practices
- Consider adding IP-based validation for additional security
- In production, implement rate limiting for failed validation attempts

## Additional Resources

For more information on web security best practices:
- [OWASP Session Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html)
- [Mozilla Web Security](https://developer.mozilla.org/en-US/docs/Web/Security)

## License

MIT 