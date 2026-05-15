import { Component, inject, signal, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TestimonyService } from '../../../core/services/testimony.service';
import { ITestimonyWithPrayer } from '../../../models/testimony.model';

@Component({
  selector: 'app-testimony-feed',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './testimony-feed.component.html',
  styleUrl: './testimony-feed.component.scss',
})
export class TestimonyFeedComponent implements OnInit {
  private testimonyService = inject(TestimonyService);

  testimonies = signal<ITestimonyWithPrayer[]>([]);
  loading = signal(true);
  error = signal('');

  async ngOnInit() {
    try {
      const data = await this.testimonyService.getAll();
      this.testimonies.set(data);
    } catch (err: any) {
      console.error('[TestimonyFeed]', err);
      this.error.set('No se pudieron cargar los testimonios.');
    } finally {
      this.loading.set(false);
    }
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

  initials(name: string): string {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  }
}
