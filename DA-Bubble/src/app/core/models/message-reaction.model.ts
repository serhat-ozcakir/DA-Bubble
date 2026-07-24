export interface MessageReaction {
  id: string;
  message_id: string | null;
  direct_message_id: string | null;
  user_id: string;
  emoji: string;
  created_at: string;
  profiles?: {
    name: string;
  };
}