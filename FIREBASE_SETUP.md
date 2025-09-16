# AuraVision AI - Iris Analysis App

A secure, scalable Firebase-powered React Native Expo app for AI-driven iris analysis with Google Play subscription integration.

## 🏗️ Architecture Overview

### Frontend (React Native Expo)
- **Anonymous Authentication**: Users are automatically signed in anonymously
- **Real-time Data**: Firestore real-time listeners for user data and analysis history
- **Secure Storage**: Firebase Storage with user-scoped access rules
- **Subscription Management**: Google Play Billing integration with server-side verification

### Backend (Firebase Cloud Functions)
- **analyzeIris**: Securely processes uploaded images using Gemini AI API
- **verifyGooglePlayPurchase**: Validates subscription purchases with Google Play Developer API
- **checkSubscriptionStatus**: Helper function to verify current subscription status

### Security Features
- **Anonymous Auth**: Unique user identity without explicit sign-in
- **Custom Claims**: Server-side subscription status management
- **Firestore Rules**: Users can only access their own data (`users/{uid}`)
- **Storage Rules**: Users can only upload to `user-uploads/{uid}/`
- **Environment Variables**: All secrets stored securely in Firebase Functions config

## 🚀 Setup Instructions

### 1. Firebase Project Setup

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Firebase in project directory
firebase init

# Select:
# - Functions (TypeScript)
# - Firestore
# - Storage
# - Hosting (optional)
```

### 2. Environment Configuration

#### Firebase Functions Environment Variables
```bash
# Set Gemini API key (if using direct Gemini instead of Rork API)
firebase functions:config:set gemini.api_key="YOUR_GEMINI_API_KEY"

# Set Google Play Developer API credentials
firebase functions:config:set googleplay.service_account='{"type":"service_account",...}'
```

#### Service Account Setup
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your Firebase project
3. Navigate to IAM & Admin > Service Accounts
4. Create a new service account with Firebase Admin SDK permissions
5. Download the JSON key file
6. Upload to Firebase Functions config or use as environment variable

### 3. Google Play Console Setup

1. **Enable Google Play Developer API**:
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Enable "Google Play Android Developer API"

2. **Create Service Account for Play Console**:
   - Create service account with "Service Account User" role
   - Download JSON credentials
   - In Play Console, go to Setup > API access
   - Link the service account and grant necessary permissions

3. **Create Subscription Product**:
   - In Play Console, go to Monetization > Subscriptions
   - Create weekly $1.99 subscription
   - Note the product ID for your app

### 4. Firebase Deployment

```bash
# Deploy Firestore rules and indexes
firebase deploy --only firestore

# Deploy Storage rules
firebase deploy --only storage

# Deploy Cloud Functions
cd functions
npm install
npm run build
cd ..
firebase deploy --only functions
```

### 5. Frontend Configuration

Update `services/firebaseConfig.ts` with your Firebase project credentials:

```typescript
const firebaseConfig = {
  apiKey: "AIzaSyDCUfubbyWL01w1PWxQDzQGxkulbAcAxRE",
  authDomain: "onlyone-99913.firebaseapp.com",
  projectId: "onlyone-99913",
  storageBucket: "onlyone-99913.firebasestorage.app",
  messagingSenderId: "355889657524",
  appId: "1:355889657524:web:9854389af49862a0c789e1",
  measurementId: "G-Z6WMXCRJ9N"
};
```

## 📱 App Features

### Core Functionality
- **Anonymous Authentication**: Automatic user creation and management
- **Iris Analysis**: AI-powered analysis using Gemini API via secure Cloud Functions
- **Analysis History**: Real-time synchronized history across devices
- **Subscription Management**: Google Play Billing with server-side verification
- **Offline Support**: Cached data and offline-first approach

### User Flow
1. **App Launch**: Anonymous sign-in automatically
2. **Free Tier**: 3 iris scans before paywall
3. **Subscription**: $1.99/week Google Play subscription
4. **Analysis**: Upload iris image → Cloud Function → AI analysis → Save to history
5. **History**: View past analyses with real-time updates

## 🔒 Security Implementation

### Authentication & Authorization
```typescript
// Anonymous sign-in on app startup
const user = await signInAnonymously(auth);

// Custom claims for subscription status
await admin.auth().setCustomUserClaims(uid, { 
  isPro: true, 
  subscriptionExpiry: expiryTime 
});
```

### Firestore Security Rules
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      
      match /history/{historyId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
    }
  }
}
```

### Storage Security Rules
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /user-uploads/{userId}/{allPaths=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## 🛠️ Development

### Local Development
```bash
# Start Expo development server
npm start

# Start Firebase emulators (optional)
firebase emulators:start
```

### Testing
```bash
# Test Cloud Functions locally
cd functions
npm run serve

# Test with Firebase emulator
firebase emulators:start --only functions,firestore,storage
```

## 📦 Production Deployment

### Cloud Functions
```bash
# Deploy all functions
firebase deploy --only functions

# Deploy specific function
firebase deploy --only functions:analyzeIris
```

### Security Checklist
- [ ] Firebase project has proper IAM roles
- [ ] Service account keys are securely stored
- [ ] Firestore rules tested and deployed
- [ ] Storage rules tested and deployed
- [ ] Google Play API credentials configured
- [ ] Environment variables set in Firebase Functions
- [ ] CORS configured for web compatibility

## 🔧 Troubleshooting

### Common Issues

1. **Functions deployment fails**:
   ```bash
   # Check Node.js version (should be 20)
   node --version
   
   # Reinstall dependencies
   cd functions && npm install
   ```

2. **Authentication errors**:
   ```bash
   # Verify Firebase config
   firebase projects:list
   
   # Check auth domain in Firebase console
   ```

3. **Storage upload fails**:
   - Verify storage rules are deployed
   - Check user authentication status
   - Ensure correct storage bucket name

4. **Google Play verification fails**:
   - Verify service account permissions in Play Console
   - Check API is enabled in Google Cloud Console
   - Validate purchase token format

## 📊 Monitoring & Analytics

### Firebase Console
- **Authentication**: Monitor anonymous user creation
- **Firestore**: Track document reads/writes
- **Storage**: Monitor upload/download usage
- **Functions**: View execution logs and performance

### Error Handling
```typescript
// Comprehensive error handling in Cloud Functions
try {
  const result = await analyzeIris(imageStoragePath);
  return result;
} catch (error) {
  console.error('Analysis failed:', error);
  throw new functions.https.HttpsError('internal', 'Analysis failed');
}
```

## 🔄 Data Flow

1. **Image Upload**: Client → Firebase Storage (`user-uploads/{uid}/`)
2. **Analysis Request**: Client → Cloud Function (`analyzeIris`)
3. **AI Processing**: Cloud Function → Gemini API → Parse Response
4. **Save Results**: Cloud Function → Firestore (`users/{uid}/history`)
5. **Real-time Updates**: Firestore → Client (real-time listeners)

## 📈 Scaling Considerations

- **Firebase Quotas**: Monitor Firestore reads/writes and Storage usage
- **Function Concurrency**: Configure appropriate timeout and memory limits
- **Cost Optimization**: Implement caching and optimize AI API calls
- **Performance**: Use Firestore indexes for efficient queries

This architecture provides a secure, scalable foundation for your iris analysis app with proper separation of concerns and enterprise-grade security practices.