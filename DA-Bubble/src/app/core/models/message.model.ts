export interface Message {
  id: string;
  authorId: string;
  text: string;
  createdAt: string;
  channelId?: string;
  conversationId?: string;
  parentMessageId?: string;
}