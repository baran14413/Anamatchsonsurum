

export type UserProfile = {
  id: string;
  uid: string;
  fullName?: string;
  email?: string;
  dateOfBirth?: string;
  profilePicture?: string;
  images: string[];
  bio?: string;
  interests?: string[];
  gender: 'male' | 'female' | 'other';
  genderPreference?: 'male' | 'female' | 'both';
  globalModeEnabled?: boolean;
  location?: {
    latitude: number | null;
    longitude: number | null;
  };
  locationLastUpdated?: any; // Using any for Firestore ServerTimestamp flexibility
  address?: {
    country?: string | null;
    state?: string | null;
    city?: string | null;
  }
  school?: string;
  lookingFor?: string;
  distancePreference?: number;
  ageRange?: {
    min: number;
    max: number;
  };
  expandAgeRange?: boolean;
  lifestyle?: {
    drinking?: string;
    smoking?: string;
    workout?: string;
    pets?: string[];
  };
  moreInfo?: {
    communicationStyle?: string;
    loveLanguage?: string;
    educationLevel?: string;
    zodiacSign?: string;
  }
};

export type Match = {
  id: string;
  user1Id: string;
  user2Id:string;
  matchDate: any; // Using 'any' for serverTimestamp flexibility
};

export type LikerInfo = {
  uid: string;
  fullName: string;
  profilePicture: string;
  age: number | null;
  matchId: string;
};


export type Post = {
  id: string;
  username: string;
  userAvatar: string;
  imageUrl?: string; // Image is now optional
  caption: string;
  language: string; // Language of the caption
  likes: number;
  comments: number;
  timestamp: Date;
};
