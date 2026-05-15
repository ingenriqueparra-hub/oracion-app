import { Component, inject, signal, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { GamificationService } from '../../../core/services/gamification.service';
import { IPublicProfile, IBadge } from '../../../models/badge.model';
import { BadgeListComponent } from '../../gamification/badge-list/badge-list.component';

@Component({
  selector: 'app-public-profile',
  standalone: true,
  imports: [RouterLink, BadgeListComponent],
  templateUrl: './public-profile.component.html',
  styleUrl: './public-profile.component.scss',
})
export class PublicProfileComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private gamificationService = inject(GamificationService);

  profile = signal<IPublicProfile | null>(null);
  allBadges = signal<IBadge[]>([]);
  earnedIds = signal<Set<string>>(new Set());
  loading = signal(true);
  error = signal('');

  get userId(): string { return this.route.snapshot.paramMap.get('id')!; }

  async ngOnInit() {
    try {
      const [profile, { all, earnedIds }] = await Promise.all([
        this.gamificationService.getPublicProfile(this.userId),
        this.gamificationService.getUserBadges(this.userId),
      ]);
      this.profile.set(profile);
      this.allBadges.set(all);
      this.earnedIds.set(earnedIds);
    } catch (err: any) {
      console.error('[PublicProfile]', err);
      this.error.set('No se pudo cargar el perfil.');
    } finally {
      this.loading.set(false);
    }
  }

  initials(name: string): string {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  }
}
