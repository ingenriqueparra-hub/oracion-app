import { Component, inject, signal, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { GamificationService } from '../../../core/services/gamification.service';
import { PrayerService } from '../../../core/services/prayer.service';
import { SupabaseService } from '../../../core/services/supabase.service';
import { BadgeListComponent } from '../../gamification/badge-list/badge-list.component';
import { IBadge } from '../../../models/badge.model';
import { IPrayerFeedItem } from '../../../models/prayer.model';

@Component({
  selector: 'app-profile-view',
  standalone: true,
  imports: [RouterLink, BadgeListComponent],
  templateUrl: './profile-view.component.html',
  styleUrl: './profile-view.component.scss',
})
export class ProfileViewComponent implements OnInit {
  private auth = inject(AuthService);
  private gamification = inject(GamificationService);
  private prayerService = inject(PrayerService);
  private supabase = inject(SupabaseService);

  user = this.auth.user;
  allBadges = signal<IBadge[]>([]);
  earnedIds = signal<Set<string>>(new Set());
  myPrayers = signal<IPrayerFeedItem[]>([]);

  get initials(): string {
    const name = this.user()?.name ?? '';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  }

  async ngOnInit() {
    let userId = this.user()?.id;
    if (!userId) {
      const { data: { session } } = await this.supabase.client.auth.getSession();
      userId = session?.user?.id;
    }
    if (!userId) return;
    try {
      const [badges, prayers] = await Promise.all([
        this.gamification.getUserBadges(userId),
        this.prayerService.getMyPrayers(userId, 3),
      ]);
      this.allBadges.set(badges.all);
      this.earnedIds.set(badges.earnedIds);
      this.myPrayers.set(prayers);
    } catch { /* non-critical */ }
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
