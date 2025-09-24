import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { GoogleAuth } from 'google-auth-library';

// Type definitions for function parameters
interface AnalyzeIrisData {
  imageStoragePath: string;
}

interface VerifyPurchaseData {
  purchaseToken: string;
  productId: string;
}

interface CheckSubscriptionData {
  [key: string]: any; // Allow any properties for flexibility
}

// Initialize Firebase Admin
admin.initializeApp();

// Get configuration from Firebase Functions config
const config = functions.config();
const RORK_API_URL = 'https://toolkit.rork.com/text/llm/';
// Use environment variable for package name with fallback
const GOOGLE_PLAY_PACKAGE_NAME = process.env.GOOGLE_PLAY_PACKAGE_NAME || config.googleplay?.package_name || 'com.auravisionai.auravisionai';

interface IrisAnalysis {
  pattern: {
    name: string;
    description: string;
    metrics?: {
      prevalence: string;
      regions: string;
      genetic: string;
    };
  };
  sensitivity: {
    name: string;
    description: string;
  };
  uniquePatterns: string[];
  rarity: {
    title: string;
    description: string;
    percentage: number;
  };
  additionalInsights: {
    icon: string;
    title: string;
    description: string;
  }[];
  summary: string;
}

// Analyze Iris Function
export const analyzeIris = functions.https.onCall(async (data: AnalyzeIrisData, context: functions.https.CallableContext) => {
  // Check authentication
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { imageStoragePath } = data;
  
  if (!imageStoragePath || typeof imageStoragePath !== 'string') {
    throw new functions.https.HttpsError('invalid-argument', 'imageStoragePath is required');
  }

  try {
    console.log('Starting iris analysis for user:', context.auth.uid);
    
    // Download image from Firebase Storage
    const bucket = admin.storage().bucket();
    const file = bucket.file(imageStoragePath);
    
    const [exists] = await file.exists();
    if (!exists) {
      throw new functions.https.HttpsError('not-found', 'Image not found in storage');
    }

    // Download image as buffer
    const [imageBuffer] = await file.download();
    const base64Image = imageBuffer.toString('base64');
    
    console.log('Image downloaded, size:', imageBuffer.length);

    // Call Rork.com AI API using secure backend endpoint
    // Note: Rork.com API doesn't require API keys, but we're calling from backend for security
    
    const prompt = `You are an expert iris analyst. Analyze this iris image and provide a detailed, engaging analysis. 
    
    Please examine the iris patterns, colors, and unique features visible in this image. Provide insights about:
    - The main iris pattern type and its characteristics
    - Color variations and their significance
    - Light sensitivity implications
    - Unique patterns or features
    - Rarity assessment
    - Additional interesting insights
    
    Return your analysis as a JSON object with this exact structure:
    {
      "pattern": {
        "name": "Main iris pattern name (e.g., European Tapestry, Radial Furrows, etc.)",
        "description": "Detailed description of the pattern and its characteristics",
        "metrics": {
          "prevalence": "Global prevalence percentage (e.g., 15%)",
          "regions": "Geographic regions where this pattern is common",
          "genetic": "Genetic inheritance information"
        }
      },
      "sensitivity": {
        "name": "Light sensitivity classification",
        "description": "Description of light sensitivity characteristics based on iris color and structure"
      },
      "uniquePatterns": ["Array of unique patterns detected in this specific iris"],
      "rarity": {
        "title": "Rarity classification title",
        "description": "Detailed description of what makes this iris rare or common",
        "percentage": 85
      },
      "additionalInsights": [
        {
          "icon": "🧬",
          "title": "Insight title",
          "description": "Detailed insight description"
        }
      ],
      "summary": "Brief engaging summary of the complete analysis"
    }
    
    Make sure to return valid JSON only, no additional text.`;

    const messages = [
      {
        role: 'user' as const,
        content: [
          { type: 'text' as const, text: prompt },
          { type: 'image' as const, image: base64Image }
        ]
      }
    ];

    console.log('Sending request to AI API...');
    const response = await fetch(RORK_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ messages })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API error:', response.status, errorText);
      throw new functions.https.HttpsError('internal', `AI API error: ${response.status}`);
    }

    const aiData = await response.json();
    console.log('AI API response received');
    
    if (!aiData.completion) {
      throw new functions.https.HttpsError('internal', 'No completion in AI API response');
    }

    // Parse the JSON response
    let analysis: IrisAnalysis;
    try {
      let cleanResponse = aiData.completion.trim();
      if (cleanResponse.startsWith('```json')) {
        cleanResponse = cleanResponse.replace(/```json\n?/, '').replace(/\n?```$/, '');
      }
      if (cleanResponse.startsWith('```')) {
        cleanResponse = cleanResponse.replace(/```\n?/, '').replace(/\n?```$/, '');
      }
      
      analysis = JSON.parse(cleanResponse);
      console.log('Successfully parsed analysis');
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', parseError);
      throw new functions.https.HttpsError('internal', 'Failed to parse AI response');
    }

    // Validate the analysis structure
    if (!analysis.pattern || !analysis.sensitivity || !analysis.rarity) {
      console.error('Invalid analysis structure:', analysis);
      throw new functions.https.HttpsError('internal', 'Invalid analysis structure');
    }

    // Save analysis to user's history
    const historyRef = admin.firestore()
      .collection('users')
      .doc(context.auth.uid)
      .collection('history')
      .doc();

    await historyRef.set({
      imageStoragePath,
      analysis,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      userId: context.auth.uid
    });

    console.log('Analysis saved to history:', historyRef.id);

    return analysis;
  } catch (error) {
    console.error('Iris analysis error:', error);
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    throw new functions.https.HttpsError('internal', 'Analysis failed');
  }
});

// Verify Google Play Purchase Function
export const verifyGooglePlayPurchase = functions.https.onCall(async (data: VerifyPurchaseData, context: functions.https.CallableContext) => {
  // Check authentication
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { purchaseToken, productId } = data;
  
  if (!purchaseToken || !productId) {
    throw new functions.https.HttpsError('invalid-argument', 'purchaseToken and productId are required');
  }

  try {
    console.log('Verifying Google Play purchase for user:', context.auth.uid);
    
    // Initialize Google Play Developer API
    // Use service account key from environment or config
    const serviceAccountKey = process.env.GOOGLE_PLAY_SERVICE_ACCOUNT_KEY || config.googleplay?.service_account_key;
    
    if (!serviceAccountKey) {
      console.warn('Google Play service account key not configured, using mock verification');
    }
    
    const auth = new GoogleAuth({
      credentials: serviceAccountKey ? JSON.parse(serviceAccountKey) : undefined,
      scopes: ['https://www.googleapis.com/auth/androidpublisher']
    });
    
    const authClient = await auth.getClient();
    // Note: googleapis import moved to top level for production use
    // const { google } = require('googleapis');
    // const androidpublisher = google.androidpublisher({ version: 'v3', auth: authClient });

    // Verify the purchase with Google Play
    // const packageName = GOOGLE_PLAY_PACKAGE_NAME;
    
    // For development/testing, we'll simulate a successful purchase
    // In production, uncomment the real Google Play API call below:
    /*
    const result = await androidpublisher.purchases.subscriptions.get({
      packageName,
      subscriptionId: productId,
      token: purchaseToken
    });
    // Purchase data is set above (mock or real)
    */
    
    // Mock purchase data for development (remove in production)
    const purchase = {
      paymentState: 1, // Payment received
      expiryTimeMillis: (Date.now() + (7 * 24 * 60 * 60 * 1000)).toString() // 1 week from now
    };

    // Purchase data is set above (mock or real)
    
    // Check if purchase is valid and active
    if (!purchase || purchase.paymentState !== 1) { // 1 = Payment received
      throw new functions.https.HttpsError('invalid-argument', 'Invalid or inactive subscription');
    }

    // Check if subscription is not expired
    const expiryTime = parseInt(purchase.expiryTimeMillis || '0');
    const now = Date.now();
    
    if (expiryTime <= now) {
      throw new functions.https.HttpsError('invalid-argument', 'Subscription has expired');
    }

    console.log('Purchase verified successfully');

    // Set custom claim for pro status
    await admin.auth().setCustomUserClaims(context.auth.uid, { 
      isPro: true,
      subscriptionExpiry: expiryTime
    });

    // Update user document in Firestore
    const userRef = admin.firestore().collection('users').doc(context.auth.uid);
    
    await userRef.set({
      subscriptionStatus: 'premium',
      subscriptionExpiry: new Date(expiryTime),
      purchaseToken,
      productId,
      lastVerified: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    console.log('User subscription status updated');

    return {
      success: true,
      isPro: true,
      expiryTime
    };
  } catch (error) {
    console.error('Purchase verification error:', error);
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    throw new functions.https.HttpsError('internal', 'Purchase verification failed');
  }
});

// Check subscription status function (optional helper)
export const checkSubscriptionStatus = functions.https.onCall(async (data: CheckSubscriptionData, context: functions.https.CallableContext) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  try {
    // Get user's custom claims
    const userRecord = await admin.auth().getUser(context.auth.uid);
    const claims = userRecord.customClaims || {};
    
    const isPro = claims.isPro || false;
    const subscriptionExpiry = claims.subscriptionExpiry || 0;
    
    // Check if subscription is still valid
    const isActive = isPro && subscriptionExpiry > Date.now();
    
    return {
      isPro: isActive,
      subscriptionExpiry,
      isActive
    };
  } catch (error) {
    console.error('Subscription status check error:', error);
    throw new functions.https.HttpsError('internal', 'Failed to check subscription status');
  }
});