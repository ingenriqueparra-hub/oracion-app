import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { IBadge, IPublicProfile, IRankingEntry, IUserBadge } from '../../models/badge.model';

@Injectable({ providedIn: 'root' })
export class GamificationService {
  constructor(private supabase: SupabaseService) {}

  async getUserBadges(userId: string): Promise<{ all: IBadge[]; earnedIds: Set<string> }> {
    const [allResult, earnedResult] = await Promise.all([
      this.supabase.client.from('badges').select('*').order('condition_value'),
      this.supabase.client.from('user_badges').select('badge_id').eq('user_id', userId),
    ]);
    if (allResult.error) throw allResult.error;
    const earnedIds = new Set((earnedResult.data ?? []).map((ub: any) => ub.badge_id as string));
    return { all: (allResult.data ?? []) as IBadge[], earnedIds };
  }

  async getPublicProfile(userId: string): Promise<IPublicProfile | null> {
    const [profileResult, badgesResult] = await Promise.all([
      this.supabase.client
        .from('profiles')
        .select('id, name, avatar_url, level, points, streak_days, churches(name), groups(name)')
        .eq('id', userId)
        .maybeSingle(),
      this.supabase.client
        .from('user_badges')
        .select('*, badges(*)')
        .eq('user_id', userId)
        .order('earned_at', { ascending: false }),
    ]);
    if (profileResult.error) throw profileResult.error;
    if (!profileResult.data) return null;
    return {
      ...profileResult.data,
      earnedBadges: (badgesResult.data ?? []) as IUserBadge[],
    } as unknown as IPublicProfile;
  }

  async getChurchRanking(churchId: string): Promise<IRankingEntry[]> {
    const { data, error } = await this.supabase.client
      .from('profiles')
      .select('id, name, avatar_url, level, points')
      .eq('church_id', churchId)
      .order('points', { ascending: false })
      .limit(10);
    if (error) throw error;
    return (data ?? []) as IRankingEntry[];
  }
}
