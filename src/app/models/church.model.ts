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

export interface IGroupRequest {
  id: string;
  user_id: string;
  church_id: string;
  requested_group_id: string;
  notification_id: string | null;
  created_at: string;
  profiles?: { name: string; email: string; avatar_url: string | null };
  groups?: { name: string };
}

export interface IChurchMember {
  id: string;
  user_id: string;
  church_id: string;
  group_id: string | null;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  profiles?: {
    name: string;
    email: string;
    avatar_url: string | null;
  };
}
