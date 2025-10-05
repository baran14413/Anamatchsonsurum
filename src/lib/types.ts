

export interface UserImage {
  url: string;
  public_id: string;
}

export type UserProfile = {
  id: string;
  uid: string;
  fullName?: string;
  email?: string;
  dateOfBirth?: string;
  profilePicture?: string;
  images: UserImage[];
  bio?: string;
  interests?: string[];
  gender: 'male' | 'female' | 'other';
  genderPreference?: 'male' | 'female' | 'both';
  globalModeEnabled?: boolean;
  location?: {
    latitude: number | null;
    longitude: number | null;
  };
  locationLastUpdated?: any; 
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
  isOnline?: boolean;
  lastSeen?: any;
};

export type Match = {
  id: string;
  user1Id: string;
  user2Id:string;
  matchDate: any; 
  isSuperLike?: boolean;
  status: 'pending' | 'matched' | 'superlike_pending';
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
  imageUrl?: string; 
  caption: string;
  language: string; 
  likes: number;
  comments: number;
  timestamp: Date;
};

export type ChatMessage = {
  id: string;
  matchId: string;
  senderId: string; // "system" for system messages
  text?: string;
  imageUrl?: string;
  imagePublicId?: string;
  audioUrl?: string;
  audioDuration?: number;
  timestamp: any; 
  isRead: boolean;
  readTimestamp?: any;
  type?: 'user' | 'system_superlike_prompt' | 'audio';
  action?: 'accepted' | 'declined';
  actionTaken?: boolean;
};

export interface DenormalizedMatch {
    id: string;
    matchedWith: string;
    lastMessage: string;
    timestamp: any;
    fullName: string;
    profilePicture: string;
    isSuperLike?: boolean;
    status?: 'pending' | 'matched' | 'superlike_pending';
    superLikeInitiator?: string;
}
