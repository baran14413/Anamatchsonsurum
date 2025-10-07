

export interface UserImage {
  url: string;
  public_id: string;
}

export type UserProfile = {
  id: string;
  uid: string;
  fullName?: string;
  email?: string;
  botPassword?: string;
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
  createdAt?: any;
  rulesAgreed?: boolean;
  isAdmin?: boolean;
  isBot?: boolean;
  superLikeBalance?: number;
  membershipType?: 'free' | 'gold';
  goldMembershipExpiresAt?: any;
  dailyUndoCount?: number;
  lastUndoTimestamp?: any;
};

export type Match = {
  id: string;
  user1Id: string;
  user2Id:string;
  user1_action?: 'liked' | 'disliked' | 'superliked';
  user1_timestamp?: any;
  user2_action?: 'liked' | 'disliked' | 'superliked';
  user2_timestamp?: any;
  status: 'pending' | 'matched' | 'superlike_pending';
  matchDate?: any; 
  isSuperLike?: boolean;
  superLikeInitiator?: string;
};

export type LikerInfo = {
  uid: string;
  fullName: string;
  profilePicture: string;
  age: number | null;
  matchId: string;
  status?: 'pending' | 'matched' | 'superlike_pending';
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
  isViewOnce?: boolean;
  viewed?: boolean;
  audioUrl?: string;
  audioDuration?: number;
  timestamp: any; 
  isRead: boolean;
  readTimestamp?: any;
  type?: 'user' | 'system_superlike_prompt' | 'audio' | 'view-once' | 'view-once-viewed';
  action?: 'accepted' | 'declined';
  actionTaken?: boolean;
  isEdited?: boolean;
  editedAt?: any;
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
    unreadCount?: number;
}

    