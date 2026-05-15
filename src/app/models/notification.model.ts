export type NotificationType = 'prayer_prayed' | 'prayer_response';

export interface INotification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  body: string;
  prayer_id: string | null;
  read: boolean;
  created_at: string;
}
