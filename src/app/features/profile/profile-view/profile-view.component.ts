import { Component, inject, signal, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { GamificationService } from '../../../core/services/gamification.service';
import { SupabaseService } from '../../../core/services/supabase.service';
import { BadgeListComponent } from '../../gamification/badge-list/badge-list.component';
import { IBadge } from '../../../models/badge.model';

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
  private supabase = inject(SupabaseService);

  user = this.auth.user;
  allBadges = signal<IBadge[]>([]);
  earnedIds = signal<Set<string>>(new Set());

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
      const badges = await this.gamification.getUserBadges(userId);
      this.allBadges.set(badges.all);
      this.earnedIds.set(badges.earnedIds);
    } catch { /* non-critical */ }
  }
}
