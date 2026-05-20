import {
  Component, inject, signal, computed,
  OnInit, AfterViewInit, OnDestroy,
  ElementRef, ViewChild,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { SupabaseService } from '../../../core/services/supabase.service';
import { PrayerService } from '../../../core/services/prayer.service';
import { IPrayerFeedItem } from '../../../models/prayer.model';
import { DailyPromiseComponent } from '../../promises/daily-promise/daily-promise.component';
import { PageHeaderComponent } from '../../../shared/layout/page-header/page-header.component';

type MainTab = 'group' | 'church' | 'all' | 'mine';
type SubTab = 'new' | 'prayed';

const PAGE_SIZE = 5;

@Component({
  selector: 'app-prayer-feed',
  standalone: true,
  imports: [RouterLink, DailyPromiseComponent, PageHeaderComponent],
  templateUrl: './prayer-feed.component.html',
  styleUrl: './prayer-feed.component.scss',
})
export class PrayerFeedComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('scrollSentinel') sentinelRef?: ElementRef;

  private prayerService = inject(PrayerService);
  private auth = inject(AuthService);
  private supabase = inject(SupabaseService);
  private router = inject(Router);

  user = this.auth.user;
  prayers = signal<IPrayerFeedItem[]>([]);
  loading = signal(true);
  loadingMore = signal(false);
  hasMore = signal(true);
  error = signal('');
  mainTab = signal<MainTab>('all');
  subTab = signal<SubTab>('new');
  showInviteCard = signal(false);
  private userId = '';
  private currentOffset = 0;
  private scrollContainer: Element | null = null;
  private scrollHandler = () => this.checkAndLoadMore();

  nuevos = computed(() =>
    this.prayers().filter(p => !p.has_prayed && p.user_id !== this.userId)
  );
  yaOre = computed(() =>
    this.prayers().filter(p => p.has_prayed)
  );
  visiblePrayers = computed(() => {
    if (this.mainTab() === 'mine') return this.prayers();
    return this.subTab() === 'new' ? this.nuevos() : this.yaOre();
  });

  get hasGroup(): boolean { return !!this.user()?.group_id; }
  get hasChurch(): boolean { return !!this.user()?.church_id; }

  // Fix 1: ensure profile is loaded before resolving default tab
  async ngOnInit() {
    let user = this.user();
    if (!user) {
      await this.auth.refreshProfile();
      user = this.user();
    }
    if (!user) return;
    this.userId = user.id;

    if (user.group_id) {
      this.mainTab.set('group');
    } else if (user.church_id) {
      this.mainTab.set('church');
    } else {
      this.mainTab.set('all');
    }

    this.checkInviteCard();
    await this.loadFeed();
  }

  ngAfterViewInit() {
    // Walk up DOM to find the scrollable container (shell's center column)
    let el = this.sentinelRef?.nativeElement?.parentElement as Element | null;
    while (el && el !== document.body) {
      const oy = getComputedStyle(el).overflowY;
      if (oy === 'auto' || oy === 'scroll') { this.scrollContainer = el; break; }
      el = el.parentElement;
    }
    const target = (this.scrollContainer ?? document) as EventTarget;
    target.addEventListener('scroll', this.scrollHandler, { passive: true } as any);
  }

  ngOnDestroy() {
    const target = (this.scrollContainer ?? document) as EventTarget;
    target.removeEventListener('scroll', this.scrollHandler);
  }

  private checkAndLoadMore() {
    if (this.loading() || this.loadingMore() || !this.hasMore()) return;
    const sentinel = this.sentinelRef?.nativeElement as HTMLElement | undefined;
    if (!sentinel) return;
    const sentinelTop = sentinel.getBoundingClientRect().top;
    const containerBottom = this.scrollContainer
      ? this.scrollContainer.getBoundingClientRect().bottom
      : window.innerHeight;
    if (sentinelTop <= containerBottom + 300) {
      this.loadMore();
    }
  }

  private async loadFeedPage(offset: number): Promise<IPrayerFeedItem[]> {
    const tab = this.mainTab();
    if (tab === 'mine') {
      return this.prayerService.getMyPrayers(this.userId, PAGE_SIZE, offset);
    }
    const user = this.user();
    return this.prayerService.getFeedScoped(
      this.userId,
      user?.church_id ?? null,
      user?.group_id ?? null,
      tab,
      offset,
      PAGE_SIZE
    );
  }

  async loadFeed() {
    this.currentOffset = 0;
    this.hasMore.set(true);
    this.loading.set(true);
    this.error.set('');
    try {
      const data = await this.loadFeedPage(0);
      this.prayers.set(data);
      this.currentOffset = data.length;
      if (data.length < PAGE_SIZE) this.hasMore.set(false);
    } catch (err: any) {
      console.error('[PrayerFeed]', err);
      this.error.set('No se pudo cargar el feed.');
    } finally {
      this.loading.set(false);
      // Auto-load if sentinel already visible after initial render
      setTimeout(() => this.checkAndLoadMore(), 0);
    }
  }

  async loadMore() {
    if (this.loadingMore() || !this.hasMore() || this.loading()) return;
    this.loadingMore.set(true);
    try {
      const data = await this.loadFeedPage(this.currentOffset);
      this.prayers.update(list => [...list, ...data]);
      this.currentOffset += data.length;
      if (data.length < PAGE_SIZE) this.hasMore.set(false);
    } catch {
      // silent — user can scroll again to retry
    } finally {
      this.loadingMore.set(false);
      setTimeout(() => this.checkAndLoadMore(), 0);
    }
  }

  async setMainTab(tab: MainTab) {
    this.mainTab.set(tab);
    if (tab !== 'mine') this.subTab.set('new');
    await this.loadFeed();
  }

  async onPray(prayer: IPrayerFeedItem, event: Event) {
    event.preventDefault();
    event.stopPropagation();
    const user = this.user();
    if (!user) return;

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
    } catch {
      this.prayers.update(list =>
        list.map(p => p.id === prayer.id
          ? { ...p, has_prayed: prayer.has_prayed, pray_count: prayer.pray_count }
          : p
        )
      );
    }
  }

  private checkInviteCard() {
    const today = new Date().toLocaleDateString('en-CA');
    const seen = localStorage.getItem('invite_shown_date');
    this.showInviteCard.set(seen !== today);
  }

  onDismissInvite() {
    const today = new Date().toLocaleDateString('en-CA');
    localStorage.setItem('invite_shown_date', today);
    this.showInviteCard.set(false);
  }

  onInvite() {
    const msg = '¡Te invito a Intercede, la app donde oramos juntos en comunidad! 🙏 https://www.intercede.pe';
    if (navigator.share) {
      navigator.share({ text: msg, url: 'https://www.intercede.pe' });
    } else {
      navigator.clipboard.writeText(msg);
    }
  }

  goToDetail(id: string) {
    this.router.navigate(['/prayers', id]);
  }

  emptyMessage(): string {
    const tab = this.mainTab();
    const sub = this.subTab();
    if (tab === 'mine') return 'Aún no has publicado ningún pedido.';
    if (tab === 'group') {
      return sub === 'new'
        ? 'No hay nuevos pedidos en tu grupo para orar.'
        : 'Aún no has orado por ningún pedido de tu grupo.';
    }
    if (tab === 'church') {
      return sub === 'new'
        ? 'No hay nuevos pedidos en tu iglesia para orar.'
        : 'Aún no has orado por ningún pedido de tu iglesia.';
    }
    return sub === 'new'
      ? 'No hay pedidos de otras iglesias para orar.'
      : 'Aún no has orado por pedidos de otras iglesias.';
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
}
