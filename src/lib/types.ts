

export interface UserImage {
  url: string;
  public_id: string;
  type?: 'image' | 'video';
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
  showGenderOnProfile?: boolean;
  globalModeEnabled?: boolean;
  location?: {
    latitude: number;
    longitude: number;
  } | null;
  address?: {
    country?: string;
    countryCode?: string;
    city?: string;
  } | null;
  locationLastUpdated?: any; 
  school?: string;
  lookingFor?: string;
  distancePreference?: number;
  ageRange?: {
    min: number;
    max: number;
  };
  expandAgeRange?: boolean;
  isOnline?: boolean;
  isPhotoVerified?: boolean;
  isNewUser?: boolean;
  lastSeen?: any;
  createdAt?: any;
  rulesAgreed?: boolean;
  welcomeGiftClaimed?: boolean;
  isAdmin?: boolean;
  isBot?: boolean;
  superLikeBalance?: number;
  membershipType?: 'free' | 'gold';
  goldMembershipExpiresAt?: any;
  dailyUndoCount?: number;
  lastUndoTimestamp?: any;
  fcmTokens?: string[];
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

export interface SystemMessage {
  id: string;
  timestamp: any;
  sentTo: string[];
  seenBy: string[];
  text: string;
}

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
  isRead?: boolean;
  readTimestamp?: any;
  type?: 'user' | 'system_superlike_prompt' | 'audio' | 'view-once' | 'view-once-viewed' | 'poll';
  action?: 'accepted' | 'declined';
  actionTaken?: boolean;
  isEdited?: boolean;
  editedAt?: any;
  pollQuestion?: string;
  pollOptions?: string[];
  pollResults?: { [key: string]: number };
  votedBy?: string[];
  createdAt?: any; // Kept for backward compatibility but should be migrated to timestamp
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
    lastSystemMessageId?: string;
    hasUnreadSystemMessage?: boolean;
}

export interface Report {
  id: string;
  reporterId: string;
  reportedId: string;
  matchId?: string;
  reason: string;
  description?: string;
  screenshotURL?: string;
  status: 'pending' | 'resolved' | 'banned';
  timestamp: any;
}
    