export type UserProfile = {
  id: string;
  name: string;
  age: number;
  images: string[];
  bio: string;
  interests: string[];
};

export type Match = {
  id: string;
  userId: string;
  name: string;
  avatarUrl: string;
  lastMessage?: string;
  lastMessageTimestamp?: Date;
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
