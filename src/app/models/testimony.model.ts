export interface ITestimony {
  id: string;
  prayer_id: string;
  user_id: string;
  text: string;
  created_at: string;
}

export interface ITestimonyWithPrayer extends ITestimony {
  prayers: { text: string } | null;
  profiles: {
    name: string;
    avatar_url: string | null;
  };
}
