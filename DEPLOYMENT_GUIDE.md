# Firebase Backend Deployment Guide

## Prerequisites

1. **Firebase CLI**: Install Firebase CLI globally
   ```bash
   npm install -g firebase-tools
   ```

2. **Login to Firebase**:
   ```bash
   firebase login
   ```

3. **Initialize Firebase Project** (if not already done):
   ```bash
   firebase init
   ```

## Step 1: Install Cloud Functions Dependencies

Navigate to the functions directory and install dependencies:

```bash
cd functions
npm install firebase-admin@^12.0.0 firebase-functions@^6.1.0 google-auth-library@^9.0.0 googleapis@^144.0.0
npm install --save-dev @types/node@^20.0.0 typescript@^5.0.0
```

## Step 2: Create TypeScript Configuration

Create `functions/tsconfig.json`:
```json
{
  "compilerOptions": {
    "module": "commonjs",
    "noImplicitReturns": true,
    "noUnusedLocals": true,
    "outDir": "lib",
    "sourceMap": true,
    "strict": true,
    "target": "es2017"
  },
  "compileOnSave": true,
  "include": [
    "src"
  ]
}
```

## Step 3: Set Environment Variables

Set the required environment variables for your Cloud Functions:

```bash
# For development (optional - Rork API doesn't require keys)
firebase functions:config:set rork.apikey="your-rork-api-key-if-needed"

# For Google Play billing (when ready for production)
firebase functions:config:set googleplay.serviceaccount="$(cat path/to/google-play-service-account.json)"
```

## Step 4: Build and Deploy Functions

```bash
# Build the functions
cd functions
npm run build

# Deploy functions only
firebase deploy --only functions

# Or deploy everything (functions, firestore rules, storage rules)
firebase deploy --only functions,firestore:rules,storage:rules
```

## Step 5: Verify Deployment

1. Check Firebase Console > Functions to see deployed functions:
   - `analyzeIris`
   - `verifyGooglePlayPurchase` 
   - `checkSubscriptionStatus`

2. Test functions in Firebase Console or through your app

## Step 6: Production Configuration

### For Google Play Billing (Production):

1. **Get Google Play Service Account**:
   - Go to Google Play Console > Setup > API access
   - Create or use existing service account
   - Download JSON key file

2. **Set Service Account**:
   ```bash
   firebase functions:config:set googleplay.serviceaccount="$(cat google-play-service-account.json)"
   ```

3. **Update functions/src/index.ts**:
   - Uncomment the real Google Play API call
   - Remove mock purchase data

### For Production Security:

1. **Enable App Check** (recommended):
   ```bash
   firebase init appcheck
   ```

2. **Set up CORS** if needed for web version

3. **Monitor Functions**:
   ```bash
   firebase functions:log
   ```

## Troubleshooting

### Common Issues:

1. **TypeScript Errors**:
   ```bash
   cd functions
   npm run build
   ```

2. **Permission Errors**:
   - Ensure Firebase project has billing enabled
   - Check IAM permissions for service accounts

3. **Function Timeout**:
   - Increase timeout in function configuration
   - Optimize image processing

4. **Storage Access**:
   - Verify storage rules are deployed
   - Check user authentication

### Logs and Monitoring:

```bash
# View function logs
firebase functions:log

# View specific function logs
firebase functions:log --only analyzeIris

# Real-time logs
firebase functions:log --follow
```

## Security Checklist

- ✅ No API keys in frontend code
- ✅ All AI analysis through Cloud Functions
- ✅ Firestore rules restrict access to user's own data
- ✅ Storage rules restrict uploads to user's folder
- ✅ Anonymous authentication enabled
- ✅ Custom claims for subscription status
- ✅ Purchase verification through Google Play API

## Next Steps

1. **Test thoroughly** in development
2. **Set up monitoring** and alerts
3. **Configure Google Play billing** for production
4. **Enable App Check** for additional security
5. **Set up CI/CD** for automated deployments

## Support

If you encounter issues:
1. Check Firebase Console logs
2. Verify all environment variables are set
3. Ensure billing is enabled on Firebase project
4. Check IAM permissions for service accounts