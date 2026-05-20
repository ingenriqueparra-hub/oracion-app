import { Component, inject, signal, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { GamificationService } from '../../core/services/gamification.service';
import { PrayerService } from '../../core/services/prayer.service';
import { SupabaseService } from '../../core/services/supabase.service';
import { BadgeListComponent } from '../gamification/badge-list/badge-list.component';
import { IBadge } from '../../models/badge.model';
import { IPrayerFeedItem } from '../../models/prayer.model';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, BadgeListComponent],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss',
})
export class ProfileComponent implements OnInit {
  private auth = inject(AuthService);
  private fb = inject(FormBuilder);
  private gamificationService = inject(GamificationService);
  private prayerService = inject(PrayerService);
  private supabase = inject(SupabaseService);

  user = this.auth.user;
  timestamp = Date.now();
  loading = signal(false);
  error = signal('');
  saved = signal(false);
  allBadges = signal<IBadge[]>([]);
  earnedIds = signal<Set<string>>(new Set());
  myPrayers = signal<IPrayerFeedItem[]>([]);

  emailSaving = signal(false);
  emailSaved = signal(false);
  emailError = signal('');

  emailForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
  });

  async ngOnInit() {
    const user = this.auth.user();
    let userId = user?.id;
    if (!userId) {
      const { data: { session } } = await this.supabase.client.auth.getSession();
      userId = session?.user?.id;
    }
    if (!userId) return;
    try {
      const [badges, prayers] = await Promise.all([
        this.gamificationService.getUserBadges(userId),
        this.prayerService.getMyPrayers(userId, 3),
      ]);
      this.allBadges.set(badges.all);
      this.earnedIds.set(badges.earnedIds);
      this.myPrayers.set(prayers);
    } catch { /* non-critical */ }
  }

  form = this.fb.group({
    name: [this.user()?.name ?? '', [Validators.required, Validators.minLength(2)]],
  });

  get initials(): string {
    const name = this.user()?.name ?? '';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }

  async onSave() {
    if (this.form.invalid) return;
    this.loading.set(true);
    this.error.set('');
    this.saved.set(false);
    try {
      await this.auth.updateProfile({ name: this.form.value.name! });
      this.saved.set(true);
      setTimeout(() => this.saved.set(false), 3000);
    } catch {
      this.error.set('No se pudo guardar. Inténtalo de nuevo.');
    } finally {
      this.loading.set(false);
    }
  }

  async onLogout() {
    await this.auth.logout();
  }

  async onAddEmail() {
    this.emailForm.markAllAsTouched();
    if (this.emailForm.invalid) return;
    this.emailSaving.set(true);
    this.emailError.set('');
    this.emailSaved.set(false);
    try {
      await this.auth.addEmailToAccount(this.emailForm.value.email!);
      this.emailSaved.set(true);
    } catch {
      this.emailError.set('No se pudo guardar el email. Inténtalo de nuevo.');
    } finally {
      this.emailSaving.set(false);
    }
  }

  onInvite() {
    const msg = '¡Te invito a Intercede, la app donde oramos juntos en comunidad! 🙏 https://www.intercede.pe';
    if (navigator.share) {
      navigator.share({ text: msg, url: 'https://www.intercede.pe' });
    } else {
      navigator.clipboard.writeText(msg);
    }
  }

  timeAgo(dateStr: string): string {
    const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000);
    if (diff < 1) return 'ahora';
    if (diff < 60) return `hace ${diff} min`;
    const h = Math.floor(diff / 60);
    if (h < 24) return `hace ${h} h`;
    const d = Math.floor(h / 24);
    if (d < 7) return `hace ${d} d`;
    return new Date(dateStr).toLocaleDateString('es-PE', { day: 'numeric', month: 'short' });
  }
}
