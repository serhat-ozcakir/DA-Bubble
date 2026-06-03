export interface MessageView {
  id: string;
  authorName: string;
  avatar: string;
  text: string;
  time: string;
  isOwnMessage: boolean;
  threadCount?: number;
}