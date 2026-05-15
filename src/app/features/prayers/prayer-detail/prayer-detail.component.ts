import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { SupabaseService } from '../../../core/services/supabase.service';
import { PrayerService } from '../../../core/services/prayer.service';
import { ResponseService } from '../../../core/services/response.service';
import { IPrayerFeedItem } from '../../../models/prayer.model';
import { IResponseWithProfile } from '../../../models/response.model';
import { PrayerResponseComponent } from '../prayer-response/prayer-response.component';
import { PageHeaderComponent } from '../../../shared/layout/page-header/page-header.component';

@Component({
  selector: 'app-prayer-detail',
  standalone: true,
  imports: [RouterLink, PrayerResponseComponent, PageHeaderComponent],
  templateUrl: './prayer-detail.component.html',
  styleUrl: './prayer-detail.component.scss',
})
export class PrayerDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private auth = inject(AuthService);
  private supabase = inject(SupabaseService);
  private prayerService = inject(PrayerService);
  private responseService = inject(ResponseService);

  user = this.auth.user;
  prayer = signal<IPrayerFeedItem | null>(null);
  isOwner = computed(() => {
    const p = this.prayer();
    const u = this.user();
    return !!(p && u && p.user_id === u.id && p.status === 'active');
  });
  responses = signal<IResponseWithProfile[]>([]);
  loading = signal(true);
  prayLoading = signal(false);
  error = signal('');
  showCompose = signal(false);
  composeInitMode = signal<'text' | 'audio'>('text');
  prayJustAdded = signal(false);

  get prayerId(): string { return this.route.snapshot.paramMap.get('id')!; }

  async ngOnInit() {
    const user = this.user();
    let userId = user?.id;
    if (!userId) {
      const { data: { session } } = await this.supabase.client.auth.getSession();
      userId = session?.user?.id;
    }
    if (!userId) return;

    try {
      const [prayer, responses] = await Promise.all([
        this.prayerService.getById(this.prayerId, userId),
        this.responseService.getByPrayer(this.prayerId),
      ]);
      this.prayer.set(prayer);
      // newest first
      this.responses.set([...responses].reverse());
    } catch (err: any) {
      console.error('[PrayerDetail]', err);
      this.error.set('No se pudo cargar el pedido de oración.');
    } finally {
      this.loading.set(false);
    }
  }

  async onPray() {
    const user = this.user();
    const p = this.prayer();
    if (!user || !p || this.prayLoading()) return;

    const wasNotPrayed = !p.has_prayed;
    this.prayLoading.set(true);
    const prev = { has_prayed: p.has_prayed, pray_count: p.pray_count };
    this.prayer.update(cur => cur
      ? { ...cur, has_prayed: !cur.has_prayed, pray_count: cur.pray_count + (cur.has_prayed ? -1 : 1) }
      : cur
    );

    try {
      if (prev.has_prayed) {
        await this.prayerService.removePray(p.id, user.id);
        this.showCompose.set(false);
        this.prayJustAdded.set(false);
      } else {
        await this.prayerService.addPray(p.id, user.id);
        if (wasNotPrayed) {
          this.composeInitMode.set('text');
          this.prayJustAdded.set(true);
          this.showCompose.set(true);
        }
      }
    } catch {
      this.prayer.update(cur => cur ? { ...cur, ...prev } : cur);
    } finally {
      this.prayLoading.set(false);
    }
  }

  openCompose(mode: 'text' | 'audio') {
    if (!this.showCompose()) {
      this.composeInitMode.set(mode);
    }
    this.prayJustAdded.set(false);
    this.showCompose.set(true);
  }

  onResponseAdded(response: IResponseWithProfile) {
    this.responses.update(list => [response, ...list]);
    this.showCompose.set(false);
    this.prayJustAdded.set(false);
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
      : new Date(dateStr).toLocaleDateString('es-PE', { day: 'numeric', month: 'long', year: 'numeric' });
  }

  initials(name: string): string {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  }
}
