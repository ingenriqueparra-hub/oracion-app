export interface IPrayer {
  id: string;
  user_id: string;
  church_id: string | null;
  group_id: string | null;
  text: string;
  status: 'active' | 'answered';
  created_at: string;
}

export interface IPrayerFeedItem extends IPrayer {
  profiles: {
    name: string;
    avatar_url: string | null;
    level: string;
  };
  churches: { name: string } | null;
  prayer_prays: { user_id: string }[];
  pray_count: number;
  has_prayed: boolean;
}
