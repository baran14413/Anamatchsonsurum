

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
  location?: {
    latitude: number;
    longitude: number;
  };
  address?: {
    city?: string | null;
    district?: string | null;
    country?: string | null;
  }
  school?: string;
  lookingFor?: string;
  distancePreference?: number;
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
