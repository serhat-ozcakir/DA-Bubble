export interface MessageView {
  id: string;
  authorName: string;
  avatar: string;
  text: string;
  time: string;
  createdAt: string;
  isOwnMessage: boolean;
  threadCount?: number;
  lastThreadReplyTime?: string | null;
}