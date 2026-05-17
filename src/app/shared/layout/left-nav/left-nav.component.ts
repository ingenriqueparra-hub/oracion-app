import { Component, inject, signal, effect, HostListener } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-left-nav',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, MatIconModule],
  templateUrl: './left-nav.component.html',
  styleUrl: './left-nav.component.scss',
})
export class LeftNavComponent {
  auth = inject(AuthService);
  private notificationService = inject(NotificationService);

  user = this.auth.user;
  unreadCount = signal(0);
  showMenu = signal(false);

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
