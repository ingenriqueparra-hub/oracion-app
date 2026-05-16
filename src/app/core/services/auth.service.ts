import { Injectable, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { SupabaseService } from './supabase.service';
import { IUser } from '../../models/user.model';
import { environment } from '../../../environments/environment';

export interface IPinAccount {
  fake_email: string;
  user_id: string;
  name: string;
  church_id: string | null;
}

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

  async signInWithGoogle(): Promise<void> {
    const { error } = await this.supabase.client.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    });
    if (error) throw error;
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
    this.router.navigate(['/welcome']);
  }

  // ── PIN account methods ─────────────────────────────────────────────────

  async registerWithPin(name: string, pin: string): Promise<void> {
    const nameSlug = this.normalizeNameSlug(name);
    const randomSuffix = this.generateRandomSuffix(4);
    const fakeEmail = `${nameSlug}.${randomSuffix}@intercede.app`;
    const password = pin + environment.pinSalt;

    const { data, error } = await this.supabase.client.auth.signUp({
      email: fakeEmail,
      password,
      options: { data: { name } },
    });
    if (error) throw error;
    if (!data.user) throw new Error('No se pudo crear la cuenta');

    await Promise.all([
      this.supabase.client
        .from('profiles')
        .update({ name, is_pin_account: true })
        .eq('id', data.user.id),
      this.supabase.client
        .from('pin_accounts')
        .insert({ user_id: data.user.id, fake_email: fakeEmail, name_slug: nameSlug }),
    ]);

    await this.fetchProfile(data.user.id);
  }

  async findPinAccounts(name: string): Promise<IPinAccount[]> {
    const nameSlug = this.normalizeNameSlug(name);
    const { data, error } = await this.supabase.client
      .from('pin_accounts')
      .select('fake_email, user_id, profiles(name, church_id)')
      .eq('name_slug', nameSlug);
    if (error) throw error;
    return ((data ?? []) as any[]).map(a => ({
      fake_email: a.fake_email,
      user_id: a.user_id,
      name: a.profiles?.name ?? name,
      church_id: a.profiles?.church_id ?? null,
    }));
  }

  async loginWithPinEmail(fakeEmail: string, pin: string): Promise<void> {
    const password = pin + environment.pinSalt;
    const { data, error } = await this.supabase.client.auth.signInWithPassword({
      email: fakeEmail,
      password,
    });
    if (error) throw new Error('PIN incorrecto');
    if (data.user) await this.fetchProfile(data.user.id);
  }

  async addEmailToAccount(email: string): Promise<void> {
    const { error } = await this.supabase.client.auth.updateUser({ email });
    if (error) throw error;
    const user = this._user();
    if (user) {
      await this.supabase.client
        .from('profiles')
        .update({ is_pin_account: false })
        .eq('id', user.id);
      this._user.set({ ...user, is_pin_account: false });
    }
  }

  private normalizeNameSlug(name: string): string {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/\s+/g, '')
      .replace(/[^a-z0-9]/g, '');
  }

  private generateRandomSuffix(length: number): string {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
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
