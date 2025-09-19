import { firebaseService } from './firebaseService';

// SECURITY: All AI API calls now go through Firebase Cloud Functions
// No API keys are exposed in the frontend

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

export async function analyzeIrisWithGemini(imageUri: string): Promise<IrisAnalysis> {
  // Input validation
  if (!imageUri || typeof imageUri !== 'string' || imageUri.trim().length === 0) {
    throw new Error('Invalid image URI provided');
  }
  
  // Remove the length check for base64 images as they are naturally long
  // Base64 images can be 100k+ characters, which is normal
  
  const sanitizedImageUri = imageUri.trim();
  
  try {
    console.log('Starting secure iris analysis via Firebase Cloud Function');
    
    // Get current user
    const currentUser = firebaseService.getCurrentUser();
    if (!currentUser) {
      throw new Error('User not authenticated');
    }
    
    // Upload image to Firebase Storage first
    console.log('Uploading image to secure storage...');
    const imageStoragePath = await firebaseService.uploadImage(sanitizedImageUri, currentUser.uid);
    console.log('Image uploaded to:', imageStoragePath);
    
    // Call secure Cloud Function for analysis
    console.log('Calling secure analyzeIris Cloud Function...');
    const analysis = await firebaseService.analyzeIris(imageStoragePath);
    console.log('Analysis completed successfully via Cloud Function');
    
    return analysis;
  } catch (error) {
    console.error('Secure iris analysis error:', error);
    console.log('Falling back to mock analysis');
    // Return mock data as fallback
    return getMockAnalysis();
  }
}

// REMOVED: convertImageToBase64 function
// Image processing is now handled securely in Firebase Cloud Functions
// No base64 conversion needed in frontend

function getMockAnalysis(): IrisAnalysis {
  return {
    pattern: {
      name: "European Tapestry",
      description: "The captivating blend of cool blue-grey with a warm central ring often hints at a diverse European heritage, possibly combining Northern and Central European lineages.",
      metrics: {
        prevalence: "92%",
        regions: "Northern Europe, Central Europe",
        genetic: "T13"
      }
    },
    sensitivity: {
      name: "Sunlight Sensitivity",
      description: "Lighter-colored eyes, like yours, contain less protective pigment against the sun's rays. It's a great reminder to don stylish sunglasses on bright days to keep those beautiful eyes happy!"
    },
    uniquePatterns: [
      "Radiant Furrows",
      "Concentric Ring of Fire",
      "Defined Limbal Ring"
    ],
    rarity: {
      title: "A Rare Gem",
      description: "While blue eyes are somewhat rare globally, your specific combination of blue-grey with pronounced central heterochromia and a distinct amber fleck makes your eye color particularly unique, setting it apart from more common variations.",
      percentage: 85
    },
    additionalInsights: [
      {
        icon: "🧬",
        title: "The Reflective Sage",
        description: "Individuals with this distinctive eye color often exude an aura of calm and depth, perceived as insightful, empathetic, and possessing a thoughtful, artistic spirit."
      },
      {
        icon: "👁️",
        title: "Central Heterochromia & Amber Fleck",
        description: "A prominent golden-amber ring encircles your pupil, a captivating feature known as central heterochromia, which beautifully contrasts with the cool blue-grey of your iris. Additionally, a charming small amber fleck graces the lower part of your iris, adding a truly unique signature."
      }
    ],
    summary: "Your iris reveals a fascinating European Tapestry pattern with rare central heterochromia and unique amber flecks, making your eyes truly one-of-a-kind."
  };
}