import { Component, inject, signal, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { SupabaseService } from '../../../core/services/supabase.service';
import { GamificationService } from '../../../core/services/gamification.service';
import { IRankingEntry } from '../../../models/badge.model';
import { PageHeaderComponent } from '../../../shared/layout/page-header/page-header.component';

@Component({
  selector: 'app-church-ranking',
  standalone: true,
  imports: [RouterLink, PageHeaderComponent],
  templateUrl: './church-ranking.component.html',
  styleUrl: './church-ranking.component.scss',
})
export class ChurchRankingComponent implements OnInit {
  private auth = inject(AuthService);
  private supabase = inject(SupabaseService);
  private gamificationService = inject(GamificationService);

  ranking = signal<IRankingEntry[]>([]);
  loading = signal(true);
  error = signal('');
  hasChurch = signal(false);

  async ngOnInit() {
    const user = this.auth.user();
    let churchId = user?.church_id;
    if (!churchId) {
      const { data: { session } } = await this.supabase.client.auth.getSession();
      if (session?.user) {
        const { data: profile } = await this.supabase.client
          .from('profiles').select('church_id').eq('id', session.user.id).single();
        churchId = profile?.church_id;
      }
    }

    if (!churchId) {
      this.loading.set(false);
      return;
    }

    this.hasChurch.set(true);
    try {
      const data = await this.gamificationService.getChurchRanking(churchId);
      this.ranking.set(data);
    } catch (err: any) {
      console.error('[ChurchRanking]', err);
      this.error.set('No se pudo cargar el ranking.');
    } finally {
      this.loading.set(false);
    }
  }

  initials(name: string): string {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  }

  medal(index: number): string {
    return ['🥇', '🥈', '🥉'][index] ?? `${index + 1}.`;
  }
}
