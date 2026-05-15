import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { IPrayer, IPrayerFeedItem } from '../../models/prayer.model';

@Injectable({ providedIn: 'root' })
export class PrayerService {
  constructor(private supabase: SupabaseService) {}

  async getFeed(
    userId: string,
    churchId: string | null,
    filter: 'all' | 'church' | 'group' = 'all',
    groupId: string | null = null
  ): Promise<IPrayerFeedItem[]> {
    let query = this.supabase.client
      .from('prayers')
      .select('*, profiles(name, avatar_url, level), churches(name), prayer_prays(user_id)')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(50);

    if (filter === 'church' && churchId) {
      query = query.eq('church_id', churchId);
    } else if (filter === 'group' && groupId) {
      query = query.eq('group_id', groupId);
    }

    const { data, error } = await query;
    if (error) throw error;

    const prayers = (data as any[]).map(p => ({
      ...p,
      pray_count: p.prayer_prays?.length ?? 0,
      has_prayed: p.prayer_prays?.some((pp: any) => pp.user_id === userId) ?? false,
    })) as IPrayerFeedItem[];

    if (filter === 'all' && churchId) {
      return [
        ...prayers.filter(p => p.church_id === churchId),
        ...prayers.filter(p => p.church_id !== churchId),
      ];
    }
    return prayers;
  }

  async getById(id: string, userId: string): Promise<IPrayerFeedItem> {
    const { data, error } = await this.supabase.client
      .from('prayers')
      .select('*, profiles(name, avatar_url, level), churches(name), prayer_prays(user_id)')
      .eq('id', id)
      .single();
    if (error) throw error;
    return {
      ...data,
      pray_count: data.prayer_prays?.length ?? 0,
      has_prayed: data.prayer_prays?.some((pp: any) => pp.user_id === userId) ?? false,
    } as IPrayerFeedItem;
  }

  async create(
    userId: string,
    text: string,
    churchId: string | null,
    groupId: string | null
  ): Promise<IPrayer> {
    const { data, error } = await this.supabase.client
      .from('prayers')
      .insert({ user_id: userId, text, church_id: churchId, group_id: groupId })
      .select()
      .single();
    if (error) throw error;
    return data as IPrayer;
  }

  async addPray(prayerId: string, userId: string): Promise<void> {
    const { error } = await this.supabase.client
      .from('prayer_prays')
      .insert({ prayer_id: prayerId, user_id: userId });
    if (error) throw error;
  }

  async removePray(prayerId: string, userId: string): Promise<void> {
    const { error } = await this.supabase.client
      .from('prayer_prays')
      .delete()
      .eq('prayer_id', prayerId)
      .eq('user_id', userId);
    if (error) throw error;
  }
}
