export interface IUser {
  id: string;
  email: string;
  name: string;
  avatar_url: string | null;
  church_id: string | null;
  group_id: string | null;
  level: string;
  points: number;
  streak_days: number;
  role: 'member' | 'church_admin' | 'super_admin';
  suspended: boolean;
  created_at: string;
}
