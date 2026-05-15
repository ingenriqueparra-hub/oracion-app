export interface IBadge {
  id: string;
  name: string;
  description: string;
  icon: string;
  condition_type: string;
  condition_value: number;
}

export interface IUserBadge {
  id: string;
  user_id: string;
  badge_id: string;
  earned_at: string;
  badges: IBadge;
}

export interface IPublicProfile {
  id: string;
  name: string;
  avatar_url: string | null;
  level: string;
  points: number;
  streak_days: number;
  churches: { name: string } | null;
  groups: { name: string } | null;
  earnedBadges: IUserBadge[];
}

export interface IRankingEntry {
  id: string;
  name: string;
  avatar_url: string | null;
  level: string;
  points: number;
}
