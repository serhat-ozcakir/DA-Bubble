export interface Profile {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  status: 'online' | 'offline';
  created_at?: string;
}