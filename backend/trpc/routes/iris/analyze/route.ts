import { z } from "zod";
import { publicProcedure } from "@/backend/trpc/create-context";

const IrisAnalysisSchema = z.object({
  pattern: z.object({
    name: z.string(),
    description: z.string(),
    metrics: z.object({
      prevalence: z.string(),
      regions: z.string(),
      genetic: z.string(),
    }).optional(),
  }),
  sensitivity: z.object({
    name: z.string(),
    description: z.string(),
  }),
  uniquePatterns: z.array(z.string()),
  rarity: z.object({
    title: z.string(),
    description: z.string(),
    percentage: z.number(),
  }),
  additionalInsights: z.array(z.object({
    icon: z.string(),
    title: z.string(),
    description: z.string(),
  })),
  summary: z.string(),
});

// Helper function to compress image data
const compressImageForAI = (imageData: string): string => {
  // For very large images, we can implement compression here
  // For now, we'll just validate and truncate if needed
  const maxSize = 2 * 1024 * 1024; // 2MB limit for AI processing
  
  if (imageData.length > maxSize) {
    console.warn('Image too large for AI processing, using fallback');
    // In a real implementation, you'd compress the image here
    // For now, we'll throw an error to use fallback
    throw new Error('Image too large for processing');
  }
  
  return imageData;
};

export const analyzeIrisProcedure = publicProcedure
  .input(z.object({ 
    imageUri: z.string().min(100, 'Invalid image data').max(3 * 1024 * 1024, 'Image too large (max 3MB)'),
    userId: z.string().optional(),
  }))
  .mutation(async ({ input }) => {
    try {
      console.log('Backend: Starting iris analysis for user:', input.userId);
      
      // Validate image data
      if (!input.imageUri || input.imageUri.length < 100) {
        throw new Error('Invalid image data provided');
      }
      
      // Check if it's a valid data URI
      if (!input.imageUri.startsWith('data:image/')) {
        throw new Error('Image must be a valid data URI');
      }
      
      const imageSizeKB = Math.round(input.imageUri.length / 1024);
      console.log('Image size:', imageSizeKB, 'KB');
      
      // Additional size check to prevent 413 errors
      if (input.imageUri.length > 2.5 * 1024 * 1024) { // 2.5MB limit
        console.warn('Image too large for processing:', imageSizeKB, 'KB');
        throw new Error('Image too large for processing. Please use a smaller image.');
      }
      
      // Here you would typically:
      // 1. Check user quota
      // 2. Call AI service
      // 3. Save analysis to database
      // 4. Update user quota
      
      // For now, we'll use the Rork AI API
      const messages = [
        {
          role: 'user' as const,
          content: [
            { 
              type: 'text' as const, 
              text: `You are an expert iris analyst. Analyze this iris image and provide a detailed, engaging analysis. 
              
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
              
              Make sure to return valid JSON only, no additional text.`
            },
            { type: 'image' as const, image: input.imageUri }
          ]
        }
      ];

      const response = await fetch('https://toolkit.rork.com/text/llm/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ messages })
      });

      if (!response.ok) {
        throw new Error(`AI API error: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.completion) {
        throw new Error('No completion in AI API response');
      }

      // Clean and parse the response
      let cleanResponse = data.completion.trim();
      if (cleanResponse.startsWith('```json')) {
        cleanResponse = cleanResponse.replace(/```json\n?/, '').replace(/\n?```$/, '');
      }
      if (cleanResponse.startsWith('```')) {
        cleanResponse = cleanResponse.replace(/```\n?/, '').replace(/\n?```$/, '');
      }
      
      const analysis = JSON.parse(cleanResponse);
      
      // Validate the analysis
      const validatedAnalysis = IrisAnalysisSchema.parse(analysis);
      
      console.log('Backend: Analysis completed successfully');
      
      return {
        success: true,
        analysis: validatedAnalysis,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Backend: Iris analysis error:', error);
      
      // Return fallback mock data
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        analysis: {
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
        },
        timestamp: new Date().toISOString(),
      };
    }
  });