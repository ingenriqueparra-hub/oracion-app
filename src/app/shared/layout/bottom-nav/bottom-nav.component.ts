import { Component, inject, signal, effect, OnDestroy } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { RealtimeChannel } from '@supabase/supabase-js';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-bottom-nav',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, MatIconModule],
  templateUrl: './bottom-nav.component.html',
  styleUrl: './bottom-nav.component.scss',
})
export class BottomNavComponent implements OnDestroy {
  private auth = inject(AuthService);
  private notificationService = inject(NotificationService);
  private router = inject(Router);
  user = this.auth.user;
  timestamp = Date.now();
  showSheet = signal(false);
  unreadCount = signal(0);

  private channel: RealtimeChannel | null = null;

  constructor() {
    effect(() => {
      const user = this.user();
      if (user?.id) {
        this.notificationService.getUnreadCount(user.id)
          .then(count => this.unreadCount.set(count))
          .catch(() => {});

        if (this.channel) {
          this.notificationService.unsubscribe(this.channel);
        }

        this.channel = this.notificationService.subscribeToNotifications(
          user.id,
          () => this.notificationService.getUnreadCount(user.id)
            .then(count => this.unreadCount.set(count))
            .catch(() => {})
        );
      }
    });
  }

  ngOnDestroy() {
    if (this.channel) {
      this.notificationService.unsubscribe(this.channel);
    }
  }

  get churchLink(): string[] {
    return ['/churches', this.user()?.church_id ?? ''];
  }

  openSheet() { this.showSheet.set(true); }
  closeSheet() { this.showSheet.set(false); }

  navigate(path: string) {
    this.closeSheet();
    this.router.navigate([path]);
  }

  onInvite() {
    this.closeSheet();
    const msg = '¡Te invito a Intercede, la app donde oramos juntos en comunidad! 🙏 https://www.intercede.pe';
    if (navigator.share) {
      navigator.share({ text: msg, url: 'https://www.intercede.pe' });
    } else {
      navigator.clipboard.writeText(msg);
    }
  }

  async logout() {
    this.closeSheet();
    await this.auth.logout();
  }
}
