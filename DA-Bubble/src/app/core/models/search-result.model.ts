export interface SearchResult {
  id: string;
  type: 'channel-message' | 'direct-message';
  text: string;
  authorName: string;
  avatar: string;
  channelId?: string;
  profileId?: string;
  createdAt: string;
}