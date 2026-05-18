import { Component, inject, signal, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ChurchService } from '../../../core/services/church.service';
import { IChurch, IGroup, IChurchMember, IGroupRequest } from '../../../models/church.model';
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
  groupRequest = signal<IGroupRequest | null>(null);
  stats = signal<{ members: number; answered: number }>({ members: 0, answered: 0 });
  loading = signal(true);
  joining = signal(false);
  leaving = signal(false);
  error = signal('');
  joinError = signal('');

  // Group picker state
  showGroupPicker = signal(false);
  selectedGroupForRequest = signal('');
  requestingGroup = signal(false);
  cancellingGroupRequest = signal(false);
  groupRequestError = signal('');

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

  getGroupName(groupId: string): string {
    return this.groups().find(g => g.id === groupId)?.name ?? '';
  }

  closeGroupPicker() {
    this.showGroupPicker.set(false);
    this.selectedGroupForRequest.set('');
    this.groupRequestError.set('');
  }

  async ngOnInit() {
    try {
      const [church, groups, churchStats] = await Promise.all([
        this.churchService.getChurchById(this.churchId),
        this.churchService.getGroups(this.churchId),
        this.churchService.getChurchStats(this.churchId),
      ]);
      this.church.set(church);
      this.groups.set(groups);
      this.stats.set({ members: churchStats.totalMembers, answered: churchStats.answeredPrayers });

      const user = this.user();
      if (user) {
        const membership = await this.churchService.getMembershipStatus(user.id, this.churchId);
        this.membership.set(membership);

        if (membership?.status === 'approved') {
          const groupRequest = await this.churchService.getMyGroupRequest(user.id, this.churchId);
          this.groupRequest.set(groupRequest);
        }
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

  async onRequestGroup() {
    const groupId = this.selectedGroupForRequest();
    if (!groupId || groupId === this.membership()?.group_id) return;
    const user = this.user();
    if (!user) return;
    this.requestingGroup.set(true);
    this.groupRequestError.set('');
    try {
      await this.churchService.requestGroup(user.id, this.churchId, groupId);
      const groupName = this.getGroupName(groupId);
      this.groupRequest.set({
        id: 'pending',
        user_id: user.id,
        church_id: this.churchId,
        requested_group_id: groupId,
        notification_id: null,
        created_at: new Date().toISOString(),
        groups: { name: groupName },
      });
      this.closeGroupPicker();
    } catch {
      this.groupRequestError.set('No se pudo enviar la solicitud. Inténtalo de nuevo.');
    } finally {
      this.requestingGroup.set(false);
    }
  }

  async onCancelGroupRequest() {
    const req = this.groupRequest();
    if (!req || req.id === 'pending') return;
    this.cancellingGroupRequest.set(true);
    try {
      await this.churchService.cancelGroupRequest(req.id);
      this.groupRequest.set(null);
    } catch {
      this.groupRequestError.set('No se pudo cancelar la solicitud.');
    } finally {
      this.cancellingGroupRequest.set(false);
    }
  }
}
