export interface Profile {
  id: string;
  email: string | null;
  name: string;
  avatar: string;
  status: 'online' | 'offline';
  is_guest: boolean;
}