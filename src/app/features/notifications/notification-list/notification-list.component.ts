import { Component, inject, signal, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { SupabaseService } from '../../../core/services/supabase.service';
import { NotificationService } from '../../../core/services/notification.service';
import { INotification } from '../../../models/notification.model';

@Component({
  selector: 'app-notification-list',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './notification-list.component.html',
  styleUrl: './notification-list.component.scss',
})
export class NotificationListComponent implements OnInit {
  private auth = inject(AuthService);
  private supabase = inject(SupabaseService);
  private notificationService = inject(NotificationService);
  private router = inject(Router);

  notifications = signal<INotification[]>([]);
  loading = signal(true);
  error = signal('');

  async ngOnInit() {
    const userId = await this.resolveUserId();
    if (!userId) { this.router.navigate(['/login']); return; }

    try {
      const data = await this.notificationService.getAll(userId);
      this.notifications.set(data);
      if (data.some(n => !n.read)) {
        await this.notificationService.markAllRead(userId);
      }
    } catch (err: any) {
      console.error('[NotificationList]', err);
      this.error.set('No se pudieron cargar las notificaciones.');
    } finally {
      this.loading.set(false);
    }
  }

  onNotificationClick(notification: INotification) {
    if (notification.type === 'join_request') {
      const churchId = this.auth.user()?.church_id;
      if (churchId) this.router.navigate(['/churches', churchId, 'admin']);
    } else if (notification.prayer_id) {
      this.router.navigate(['/prayers', notification.prayer_id]);
    }
  }

  private async resolveUserId(): Promise<string | undefined> {
    const user = this.auth.user();
    if (user?.id) return user.id;
    const { data: { session } } = await this.supabase.client.auth.getSession();
    return session?.user?.id;
  }

  timeAgo(dateStr: string): string {
    const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000);
    if (diff < 1) return 'ahora';
    if (diff < 60) return `hace ${diff} min`;
    const h = Math.floor(diff / 60);
    if (h < 24) return `hace ${h} h`;
    const d = Math.floor(h / 24);
    return d < 7
      ? `hace ${d} d`
      : new Date(dateStr).toLocaleDateString('es-PE', { day: 'numeric', month: 'short' });
  }

  isClickable(n: INotification): boolean {
    return n.type === 'join_request' ? !!this.auth.user()?.church_id : !!n.prayer_id;
  }

  icon(type: INotification['type']): string {
    const icons: Record<INotification['type'], string> = {
      prayer_prayed:  '🙏',
      prayer_response: '💬',
      join_request:   '⛪',
    };
    return icons[type] ?? '🔔';
  }
}
