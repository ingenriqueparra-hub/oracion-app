import { Injectable, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { SupabaseService } from './supabase.service';
import { IUser } from '../../models/user.model';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private _user = signal<IUser | null>(null);
  readonly user = this._user.asReadonly();
  readonly isLoggedIn = computed(() => !!this._user());

  constructor(private supabase: SupabaseService, private router: Router) {
    // Load session on startup
    this.supabase.client.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) this.fetchProfile(session.user.id).catch(console.error);
    });

    // Keep signal in sync on auth changes (login, logout, token refresh)
    this.supabase.client.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        this.fetchProfile(session.user.id).catch(console.error);
      } else {
        this._user.set(null);
      }
    });
  }

  async refreshProfile() {
    const { data: { session } } = await this.supabase.client.auth.getSession();
    if (session?.user) await this.fetchProfile(session.user.id);
  }

  private async fetchProfile(userId: string) {
    const { data, error } = await this.supabase.client
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    if (error) throw error;
    if (data) this._user.set(data as IUser);
  }

  async register(name: string, email: string, password: string) {
    const { data, error } = await this.supabase.client.auth.signUp({
      email,
      password,
      options: { data: { name } },
    });
    if (error) throw error;
    return data;
  }

  async login(email: string, password: string) {
    const { data, error } = await this.supabase.client.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    if (data.user) await this.fetchProfile(data.user.id);
    return data;
  }

  async logout() {
    await this.supabase.client.auth.signOut();
    this._user.set(null);
    this.router.navigate(['/login']);
  }

  async updateProfile(updates: Partial<Pick<IUser, 'name' | 'avatar_url'>>) {
    const user = this._user();
    if (!user) return;
    const { data, error } = await this.supabase.client
      .from('profiles')
      .update(updates)
      .eq('id', user.id)
      .select()
      .single();
    if (error) throw error;
    this._user.set(data as IUser);
  }
}
