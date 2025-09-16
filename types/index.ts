export interface IrisAnalysis {
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
  additionalInsights: Array<{
    icon: string;
    title: string;
    description: string;
  }>;
  summary: string;
}

export interface ScanHistory {
  id: string;
  imageUri: string;
  analysis: IrisAnalysis;
  timestamp: string;
}

export interface UserProfile {
  id: string;
  email?: string;
  subscriptionStatus: 'free' | 'premium';
  scansUsed: number;
  weeklyLimit: number;
  lastResetDate: string;
}