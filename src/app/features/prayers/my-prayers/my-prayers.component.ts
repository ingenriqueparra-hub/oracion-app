import { Component, inject, signal, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { SupabaseService } from '../../../core/services/supabase.service';
import { PrayerService } from '../../../core/services/prayer.service';
import { IPrayerFeedItem } from '../../../models/prayer.model';
import { PageHeaderComponent } from '../../../shared/layout/page-header/page-header.component';

@Component({
  selector: 'app-my-prayers',
  standalone: true,
  imports: [RouterLink, PageHeaderComponent],
  templateUrl: './my-prayers.component.html',
  styleUrl: './my-prayers.component.scss',
})
export class MyPrayersComponent implements OnInit {
  private prayerService = inject(PrayerService);
  private auth = inject(AuthService);
  private supabase = inject(SupabaseService);
  private router = inject(Router);

  prayers = signal<IPrayerFeedItem[]>([]);
  loading = signal(true);
  error = signal('');

  async ngOnInit() {
    const user = this.auth.user();
    let userId = user?.id;
    if (!userId) {
      const { data: { session } } = await this.supabase.client.auth.getSession();
      userId = session?.user?.id;
    }
    if (!userId) return;

    try {
      const data = await this.prayerService.getMyPrayers(userId);
      this.prayers.set(data);
    } catch (err: any) {
      console.error('[MyPrayers]', err);
      this.error.set('No se pudieron cargar tus pedidos.');
    } finally {
      this.loading.set(false);
    }
  }

  goToDetail(id: string) {
    this.router.navigate(['/prayers', id]);
  }

  timeAgo(dateStr: string): string {
    const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000);
    if (diff < 1) return 'ahora';
    if (diff < 60) return `hace ${diff} min`;
    const h = Math.floor(diff / 60);
    if (h < 24) return `hace ${h} h`;
    const d = Math.floor(h / 24);
    if (d < 7) return `hace ${d} d`;
    return new Date(dateStr).toLocaleDateString('es-PE', { day: 'numeric', month: 'short', year: 'numeric' });
  }
}
