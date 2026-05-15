export interface IResponse {
  id: string;
  prayer_id: string;
  user_id: string;
  text: string | null;
  audio_url: string | null;
  created_at: string;
}

export interface IResponseWithProfile extends IResponse {
  profiles: {
    name: string;
    avatar_url: string | null;
    level: string;
  };
}
