import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { ITestimony, ITestimonyWithPrayer } from '../../models/testimony.model';

@Injectable({ providedIn: 'root' })
export class TestimonyService {
  constructor(private supabase: SupabaseService) {}

  async create(prayerId: string, userId: string, text: string): Promise<ITestimony> {
    const { data, error } = await this.supabase.client
      .from('testimonies')
      .insert({ prayer_id: prayerId, user_id: userId, text })
      .select()
      .single();
    if (error) throw error;

    const { error: prayerError } = await this.supabase.client
      .from('prayers')
      .update({ status: 'answered' })
      .eq('id', prayerId)
      .eq('user_id', userId);
    if (prayerError) throw prayerError;

    return data as ITestimony;
  }

  async getAll(): Promise<ITestimonyWithPrayer[]> {
    // prayer_id → public.prayers, so PostgREST resolves prayers(text) automatically
    const { data: testimonies, error } = await this.supabase.client
      .from('testimonies')
      .select('*, prayers(text)')
      .order('created_at', { ascending: false })
      .limit(50);
    if (error) throw error;
    if (!testimonies?.length) return [];

    const userIds = [...new Set(testimonies.map((t: any) => t.user_id))];
    const { data: profiles } = await this.supabase.client
      .from('profiles')
      .select('id, name, avatar_url')
      .in('id', userIds);

    const profileMap = new Map((profiles ?? []).map((p: any) => [p.id, p]));

    return testimonies.map((t: any) => ({
      ...t,
      profiles: profileMap.get(t.user_id) ?? { name: 'Usuario', avatar_url: null },
    })) as ITestimonyWithPrayer[];
  }
}
