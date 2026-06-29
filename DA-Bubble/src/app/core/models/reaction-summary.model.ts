export interface ReactionSummary{
  messageId: string;
  emoji: string;
  count: number;
  reactedByCurrentUser: boolean;
  userNames:string[]
}