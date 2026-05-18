import { Component, inject, signal, effect } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-bottom-nav',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, MatIconModule],
  templateUrl: './bottom-nav.component.html',
  styleUrl: './bottom-nav.component.scss',
})
export class BottomNavComponent {
  private auth = inject(AuthService);
  private notificationService = inject(NotificationService);
  private router = inject(Router);
  user = this.auth.user;
  timestamp = Date.now();
  showSheet = signal(false);
  unreadCount = signal(0);

  constructor() {
    effect(() => {
      const user = this.user();
      if (user?.id) {
        this.notificationService.getUnreadCount(user.id)
          .then(count => this.unreadCount.set(count))
          .catch(() => {});
      }
    });
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

  async logout() {
    this.closeSheet();
    await this.auth.logout();
  }
}
