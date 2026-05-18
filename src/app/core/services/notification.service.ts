import { Injectable } from '@angular/core';
import { RealtimeChannel } from '@supabase/supabase-js';
import { SupabaseService } from './supabase.service';
import { INotification } from '../../models/notification.model';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  constructor(private supabase: SupabaseService) {}

  async getAll(userId: string): Promise<INotification[]> {
    const { data, error } = await this.supabase.client
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);
    if (error) throw error;
    return (data ?? []) as INotification[];
  }

  async getUnreadCount(userId: string): Promise<number> {
    const { count, error } = await this.supabase.client
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('read', false);
    if (error) throw error;
    return count ?? 0;
  }

  subscribeToNotifications(userId: string, onNew: () => void): RealtimeChannel {
    return this.supabase.client
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        () => onNew()
      )
      .subscribe();
  }

  unsubscribe(channel: RealtimeChannel): void {
    this.supabase.client.removeChannel(channel);
  }

  async markAllRead(userId: string): Promise<void> {
    const { error } = await this.supabase.client
      .from('notifications')
      .update({ read: true })
      .eq('user_id', userId)
      .eq('read', false);
    if (error) throw error;
  }
}
