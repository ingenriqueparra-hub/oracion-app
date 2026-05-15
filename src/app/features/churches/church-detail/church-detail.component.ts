import { Component, inject, signal, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ChurchService } from '../../../core/services/church.service';
import { IChurch, IGroup, IChurchMember } from '../../../models/church.model';
import { PageHeaderComponent } from '../../../shared/layout/page-header/page-header.component';

@Component({
  selector: 'app-church-detail',
  standalone: true,
  imports: [RouterLink, PageHeaderComponent],
  templateUrl: './church-detail.component.html',
  styleUrl: './church-detail.component.scss',
})
export class ChurchDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private auth = inject(AuthService);
  private churchService = inject(ChurchService);

  church = signal<IChurch | null>(null);
  groups = signal<IGroup[]>([]);
  membership = signal<IChurchMember | null>(null);
  loading = signal(true);
  joining = signal(false);
  leaving = signal(false);
  error = signal('');
  joinError = signal('');

  user = this.auth.user;

  get churchId(): string {
    return this.route.snapshot.paramMap.get('id')!;
  }

  get isAdmin(): boolean {
    const user = this.user();
    return user?.role === 'super_admin' ||
      (user?.role === 'church_admin' && user?.church_id === this.churchId);
  }

  get isApprovedMember(): boolean {
    return this.membership()?.status === 'approved';
  }

  get isPendingMember(): boolean {
    return this.membership()?.status === 'pending';
  }

  async ngOnInit() {
    try {
      const [church, groups] = await Promise.all([
        this.churchService.getChurchById(this.churchId),
        this.churchService.getGroups(this.churchId),
      ]);
      this.church.set(church);
      this.groups.set(groups);

      const user = this.user();
      if (user) {
        const membership = await this.churchService.getMembershipStatus(user.id, this.churchId);
        this.membership.set(membership);
      }
    } catch {
      this.error.set('No se pudo cargar la iglesia.');
    } finally {
      this.loading.set(false);
    }
  }

  async onLeave() {
    const user = this.user();
    const membership = this.membership();
    if (!user || !membership) return;
    if (!confirm('¿Seguro que quieres salir de esta iglesia?')) return;
    this.leaving.set(true);
    try {
      await this.churchService.leaveChurch(membership.id, user.id);
      await this.auth.refreshProfile();
      this.membership.set(null);
    } catch {
      this.error.set('No se pudo salir de la iglesia. Inténtalo de nuevo.');
    } finally {
      this.leaving.set(false);
    }
  }

  async onJoin() {
    const user = this.user();
    if (!user) return;
    this.joining.set(true);
    this.joinError.set('');
    try {
      const existing = this.membership();
      if (existing?.status === 'rejected') {
        await this.churchService.reRequestJoin(existing.id);
      } else {
        await this.churchService.requestJoin(user.id, this.churchId);
      }
      this.membership.update(m => ({ ...(m ?? {}), status: 'pending' } as any));
    } catch {
      this.joinError.set('No se pudo enviar la solicitud. Inténtalo de nuevo.');
    } finally {
      this.joining.set(false);
    }
  }
}
