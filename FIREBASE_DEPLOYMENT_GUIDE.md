# Firebase Backend Deployment Guide

## Overview
This guide provides step-by-step instructions for deploying the secure Firebase backend for the Iris Analysis app.

## Prerequisites
- Firebase CLI installed: `npm install -g firebase-tools`
- Node.js 20+ installed
- Firebase project created: `onlyone-99913`

## 1. Environment Setup

### Install Dependencies
```bash
cd functions
npm install
```

### Set Environment Variables
```bash
# Set Rork API configuration (if needed in future)
firebase functions:config:set rork.apikey="your-api-key-here"

# Set Google Play Developer API credentials (for production)
firebase functions:config:set googleplay.serviceaccount="path-to-service-account.json"
firebase functions:config:set googleplay.packagename="com.auravisionai.auravisionai"

# View current config
firebase functions:config:get
```

## 2. Build and Deploy

### Build Functions
```bash
cd functions
npm run build
```

### Deploy All Services
```bash
# Deploy everything
firebase deploy

# Or deploy specific services
firebase deploy --only functions
firebase deploy --only firestore:rules
firebase deploy --only storage:rules
```

## 3. Security Configuration

### Firestore Rules
The deployed rules ensure:
- Users can only access their own data in `/users/{uid}`
- Users can only access their own history in `/users/{uid}/history/{historyId}`
- Anonymous feedback creation is allowed
- All other access is denied

### Storage Rules
The deployed rules ensure:
- Users can only upload to `/user-uploads/{uid}/`
- Users can only access their own uploaded files
- All other access is denied

### Cloud Functions Security
- All functions require authentication
- Image processing happens server-side
- No API keys exposed in frontend
- Secure image upload and analysis workflow

## 4. Testing

### Test Functions Locally
```bash
cd functions
npm run serve
```

### Test with Emulator
```bash
firebase emulators:start --only functions,firestore,storage
```

## 5. Monitoring

### View Logs
```bash
firebase functions:log
```

### Monitor Performance
- Firebase Console > Functions
- Firebase Console > Firestore
- Firebase Console > Storage

## 6. Production Considerations

### Google Play Billing Integration
For production, update the `verifyGooglePlayPurchase` function:

1. Uncomment the real Google Play API call
2. Remove the mock purchase data
3. Set up proper service account credentials
4. Configure the correct package name and product IDs

### API Rate Limiting
Consider implementing rate limiting for the analysis function to prevent abuse.

### Error Handling
All functions include comprehensive error handling and logging.

## 7. Troubleshooting

### Common Issues
1. **Permission Denied**: Check Firestore/Storage rules
2. **Function Timeout**: Increase timeout in function configuration
3. **Image Upload Fails**: Check storage rules and file size limits
4. **Analysis Fails**: Check function logs for detailed error messages

### Debug Commands
```bash
# Check function status
firebase functions:list

# View detailed logs
firebase functions:log --only analyzeIris

# Test rules
firebase firestore:rules:test
```

## Files Modified/Created

### Backend Files
- `/functions/src/index.ts` - Cloud Functions implementation
- `/firestore.rules` - Firestore security rules
- `/storage.rules` - Storage security rules
- `/firebase.json` - Firebase configuration

### Frontend Files
- `/services/geminiService.ts` - Refactored to use backend
- `/services/firebaseService.ts` - Enhanced with backend integration
- `/app/analyzing.tsx` - Updated to use secure workflow
- `/app/analysis.tsx` - Enhanced with save functionality

## Database Schema

### Users Collection (`/users/{uid}`)
```typescript
{
  scansUsed: number;
  weeklyLimit: number;
  subscriptionStatus: 'free' | 'premium';
  subscriptionExpiry?: Date;
  purchaseToken?: string;
  productId?: string;
  lastVerified?: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### History Subcollection (`/users/{uid}/history/{historyId}`)
```typescript
{
  userId: string;
  imageStoragePath: string;
  analysis: IrisAnalysis;
  timestamp: Timestamp;
}
```

## Security Features Implemented

✅ **API Key Security**: All AI API calls moved to backend
✅ **Authentication**: All functions require authenticated users
✅ **Data Isolation**: Users can only access their own data
✅ **Secure Storage**: Images stored in user-specific folders
✅ **Input Validation**: All function inputs validated
✅ **Error Handling**: Comprehensive error handling and logging
✅ **Rate Limiting**: Built-in Firebase function rate limiting
✅ **Audit Trail**: All operations logged for monitoring

## Next Steps

1. Deploy to production Firebase project
2. Set up Google Play billing integration
3. Configure monitoring and alerts
4. Test end-to-end functionality
5. Set up CI/CD pipeline for future updates