import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { IPrayer, IPrayerFeedItem } from '../../models/prayer.model';

@Injectable({ providedIn: 'root' })
export class PrayerService {
  constructor(private supabase: SupabaseService) {}

  async getFeedScoped(
    userId: string,
    churchId: string | null,
    groupId: string | null,
    scope: 'group' | 'church' | 'all',
    offset = 0,
    limit = 5
  ): Promise<IPrayerFeedItem[]> {
    let query = this.supabase.client
      .from('prayers')
      .select('*, profiles(name, avatar_url, level), churches(name), prayer_prays(user_id)')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (scope === 'group' && groupId) {
      query = query.eq('group_id', groupId);
    } else if (scope === 'church' && churchId) {
      query = query.eq('church_id', churchId);
    } else if (scope === 'all' && churchId) {
      query = query.or(`church_id.is.null,church_id.neq.${churchId}`);
    }

    const { data, error } = await query;
    if (error) throw error;

    return (data as any[]).map(p => ({
      ...p,
      pray_count: p.prayer_prays?.length ?? 0,
      has_prayed: p.prayer_prays?.some((pp: any) => pp.user_id === userId) ?? false,
    })) as IPrayerFeedItem[];
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

  async getMyPrayers(userId: string, limit = 50): Promise<IPrayerFeedItem[]> {
    const { data, error } = await this.supabase.client
      .from('prayers')
      .select('*, profiles(name, avatar_url, level), churches(name), prayer_prays(user_id)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) throw error;
    return (data as any[]).map(p => ({
      ...p,
      pray_count: p.prayer_prays?.length ?? 0,
      has_prayed: true,
    })) as IPrayerFeedItem[];
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
