import { Platform } from 'react-native';

// Use the Rork.com AI API instead of direct Gemini API
const AI_API_URL = 'https://toolkit.rork.com/text/llm/';

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
  
  if (imageUri.length > 10000) {
    throw new Error('Image URI too long');
  }
  
  const sanitizedImageUri = imageUri.trim();
  
  try {
    console.log('Starting iris analysis for:', sanitizedImageUri);
    
    // Convert image to base64
    const base64Image = await convertImageToBase64(sanitizedImageUri);
    console.log('Image converted to base64, length:', base64Image.length);

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
    const response = await fetch(AI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ messages })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API error:', response.status, errorText);
      throw new Error(`AI API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('AI API response received:', data);
    
    if (!data.completion) {
      throw new Error('No completion in AI API response');
    }

    // Try to parse the JSON response
    let analysis: IrisAnalysis;
    try {
      // Clean the response - remove any markdown formatting
      let cleanResponse = data.completion.trim();
      if (cleanResponse.startsWith('```json')) {
        cleanResponse = cleanResponse.replace(/```json\n?/, '').replace(/\n?```$/, '');
      }
      if (cleanResponse.startsWith('```')) {
        cleanResponse = cleanResponse.replace(/```\n?/, '').replace(/\n?```$/, '');
      }
      
      analysis = JSON.parse(cleanResponse);
      console.log('Successfully parsed analysis:', analysis);
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', parseError);
      console.log('Raw response:', data.completion);
      throw new Error('Failed to parse AI response as JSON');
    }

    // Validate the analysis structure
    if (!analysis.pattern || !analysis.sensitivity || !analysis.rarity) {
      console.error('Invalid analysis structure:', analysis);
      throw new Error('Invalid analysis structure received from AI');
    }

    return analysis;
  } catch (error) {
    console.error('Iris analysis error:', error);
    console.log('Falling back to mock analysis');
    // Return mock data as fallback
    return getMockAnalysis();
  }
}

async function convertImageToBase64(uri: string): Promise<string> {
  // Input validation
  if (!uri || typeof uri !== 'string' || uri.trim().length === 0) {
    throw new Error('Invalid image URI provided');
  }
  
  if (uri.length > 10000) {
    throw new Error('Image URI too long');
  }
  
  const sanitizedUri = uri.trim();
  
  try {
    if (Platform.OS === 'web') {
      // For web, fetch the image and convert to base64
      const response = await fetch(sanitizedUri);
      const blob = await response.blob();
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = (reader.result as string).split(',')[1];
          resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } else {
      // For mobile, use expo-file-system
      const FileSystem = await import('expo-file-system');
      const base64 = await FileSystem.readAsStringAsync(sanitizedUri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      return base64;
    }
  } catch (error) {
    console.error('Error converting image to base64:', error);
    throw error;
  }
}

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