export interface IChurch {
  id: string;
  name: string;
  description: string | null;
  photo_url: string | null;
  status: 'pending' | 'approved' | 'rejected' | 'suspended';
  admin_id: string;
  created_at: string;
}

export interface IGroup {
  id: string;
  name: string;
  church_id: string;
  created_at: string;
}

export interface IChurchMember {
  id: string;
  user_id: string;
  church_id: string;
  group_id: string | null;
  status: 'pending' | 'approved';
  created_at: string;
  profiles?: {
    name: string;
    email: string;
    avatar_url: string | null;
  };
}
