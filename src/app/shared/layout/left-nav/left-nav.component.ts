import { Component, inject, signal, effect, HostListener, OnDestroy } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { RealtimeChannel } from '@supabase/supabase-js';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-left-nav',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, MatIconModule],
  templateUrl: './left-nav.component.html',
  styleUrl: './left-nav.component.scss',
})
export class LeftNavComponent implements OnDestroy {
  auth = inject(AuthService);
  private notificationService = inject(NotificationService);

  user = this.auth.user;
  timestamp = Date.now();
  unreadCount = signal(0);
  showMenu = signal(false);

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

  get churchAdminLink(): string[] {
    return ['/churches', this.user()?.church_id ?? '', 'admin'];
  }

  get churchMemberLink(): string[] {
    return ['/churches', this.user()?.church_id ?? ''];
  }

  toggleMenu(event: MouseEvent) {
    event.stopPropagation();
    this.showMenu.update(v => !v);
  }

  closeMenu() {
    this.showMenu.set(false);
  }

  @HostListener('document:click')
  onDocumentClick() {
    this.showMenu.set(false);
  }
}
