import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { IDailyPromise } from '../../models/promise.model';

@Injectable({ providedIn: 'root' })
export class PromiseService {
  constructor(private supabase: SupabaseService) {}

  async getToday(): Promise<IDailyPromise | null> {
    const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

    // Try exact date match first
    const { data: exact } = await this.supabase.client
      .from('promises')
      .select('*')
      .eq('date', today)
      .maybeSingle();
    if (exact) return exact as IDailyPromise;

    // Fallback: most recent promise with any date
    const { data: latest } = await this.supabase.client
      .from('promises')
      .select('*')
      .not('date', 'is', null)
      .order('date', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (latest) return latest as IDailyPromise;

    // Last resort: any promise
    const { data: any } = await this.supabase.client
      .from('promises')
      .select('*')
      .limit(1)
      .maybeSingle();
    return any ? (any as IDailyPromise) : null;
  }
}
