import { Component, inject, signal, effect } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { GamificationService } from '../../../core/services/gamification.service';
import { IBadge, IRankingEntry } from '../../../models/badge.model';
import { DailyPromiseComponent } from '../../../features/promises/daily-promise/daily-promise.component';

@Component({
  selector: 'app-right-panel',
  standalone: true,
  imports: [RouterLink, DailyPromiseComponent],
  templateUrl: './right-panel.component.html',
  styleUrl: './right-panel.component.scss',
})
export class RightPanelComponent {
  private auth = inject(AuthService);
  private gamification = inject(GamificationService);

  user = this.auth.user;
  earnedBadges = signal<IBadge[]>([]);
  ranking = signal<IRankingEntry[]>([]);
  loadingData = signal(false);

  constructor() {
    effect(() => {
      const user = this.user();
      if (user?.church_id) {
        this.loadData(user.id, user.church_id);
      }
    });
  }

  onInvite() {
    const msg = '¡Te invito a Intercede, la app donde oramos juntos en comunidad! 🙏 https://www.intercede.pe';
    if (navigator.share) {
      navigator.share({ text: msg, url: 'https://www.intercede.pe' });
    } else {
      navigator.clipboard.writeText(msg);
    }
  }

  private async loadData(userId: string, churchId: string) {
    this.loadingData.set(true);
    try {
      const [{ all, earnedIds }, ranking] = await Promise.all([
        this.gamification.getUserBadges(userId),
        this.gamification.getChurchRanking(churchId),
      ]);
      this.earnedBadges.set(all.filter(b => earnedIds.has(b.id)).slice(0, 4));
      this.ranking.set(ranking.slice(0, 5));
    } catch {
      // right panel is non-critical
    } finally {
      this.loadingData.set(false);
    }
  }
}
