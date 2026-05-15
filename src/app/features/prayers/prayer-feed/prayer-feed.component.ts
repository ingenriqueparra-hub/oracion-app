import { Component, inject, signal, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { SupabaseService } from '../../../core/services/supabase.service';
import { PrayerService } from '../../../core/services/prayer.service';
import { IPrayerFeedItem } from '../../../models/prayer.model';
import { DailyPromiseComponent } from '../../promises/daily-promise/daily-promise.component';
type FeedFilter = 'all' | 'church' | 'group';

@Component({
  selector: 'app-prayer-feed',
  standalone: true,
  imports: [RouterLink, DailyPromiseComponent],
  templateUrl: './prayer-feed.component.html',
  styleUrl: './prayer-feed.component.scss',
})
export class PrayerFeedComponent implements OnInit {
  private prayerService = inject(PrayerService);
  private auth = inject(AuthService);
  private supabase = inject(SupabaseService);
  private router = inject(Router);
  user = this.auth.user;
  prayers = signal<IPrayerFeedItem[]>([]);
  loading = signal(true);
  error = signal('');
  filter = signal<FeedFilter>('all');

  async ngOnInit() {
    await this.loadFeed();
  }

  async loadFeed() {
    // user() signal may not be populated yet if onAuthStateChange hasn't fired.
    // Fall back to getSession() which the guard already confirmed is valid.
    const user = this.user();
    let userId = user?.id;
    if (!userId) {
      const { data: { session } } = await this.supabase.client.auth.getSession();
      userId = session?.user?.id;
    }
    if (!userId) return;

    this.loading.set(true);
    this.error.set('');
    try {
      const data = await this.prayerService.getFeed(
        userId,
        user?.church_id ?? null,
        this.filter(),
        user?.group_id ?? null
      );
      this.prayers.set(data);
    } catch (err: any) {
      console.error('[PrayerFeed]', err);
      this.error.set('No se pudo cargar el feed.');
    } finally {
      this.loading.set(false);
    }
  }

  async setFilter(f: FeedFilter) {
    this.filter.set(f);
    await this.loadFeed();
  }

  async onPray(prayer: IPrayerFeedItem, event: Event) {
    event.preventDefault();
    event.stopPropagation();
    const user = this.user();
    if (!user) return;

    // Optimistic update
    this.prayers.update(list =>
      list.map(p => p.id === prayer.id
        ? { ...p, has_prayed: !p.has_prayed, pray_count: p.pray_count + (p.has_prayed ? -1 : 1) }
        : p
      )
    );

    try {
      if (prayer.has_prayed) {
        await this.prayerService.removePray(prayer.id, user.id);
      } else {
        await this.prayerService.addPray(prayer.id, user.id);
      }
    } catch (err) {
      // Revert on error
      this.prayers.update(list =>
        list.map(p => p.id === prayer.id
          ? { ...p, has_prayed: prayer.has_prayed, pray_count: prayer.pray_count }
          : p
        )
      );
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
    return new Date(dateStr).toLocaleDateString('es-PE', { day: 'numeric', month: 'short' });
  }

  initials(name: string): string {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  }

  get canFilterChurch(): boolean { return !!this.user()?.church_id; }
  get canFilterGroup(): boolean { return !!this.user()?.group_id; }
}
