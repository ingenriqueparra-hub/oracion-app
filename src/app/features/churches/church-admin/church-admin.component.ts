import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ChurchService } from '../../../core/services/church.service';
import { IChurch, IGroup, IChurchMember } from '../../../models/church.model';
import { PageHeaderComponent } from '../../../shared/layout/page-header/page-header.component';

interface IChurchStats {
  totalMembers: number;
  prayersThisWeek: number;
  totalPrayers: number;
  answeredPrayers: number;
}

@Component({
  selector: 'app-church-admin',
  standalone: true,
  imports: [RouterLink, ReactiveFormsModule, DecimalPipe, PageHeaderComponent],
  templateUrl: './church-admin.component.html',
  styleUrl: './church-admin.component.scss',
})
export class ChurchAdminComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private churchService = inject(ChurchService);
  private fb = inject(FormBuilder);

  church = signal<IChurch | null>(null);
  pendingMembers = signal<IChurchMember[]>([]);
  approvedMembers = signal<IChurchMember[]>([]);
  groups = signal<IGroup[]>([]);
  stats = signal<IChurchStats | null>(null);
  loading = signal(true);
  error = signal('');
  groupError = signal('');
  churchSaving = signal(false);
  churchSaved = signal(false);
  activeTab = signal<'members' | 'groups' | 'stats' | 'church'>('members');
  pendingGroupIds = signal<Record<string, string>>({});
  selectedGroupId = signal<string | null>(null);
  selectedGroupMembers = computed(() => {
    const gid = this.selectedGroupId();
    if (!gid) return [];
    return this.approvedMembers().filter(m => m.group_id === gid);
  });

  groupForm = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
  });

  churchForm = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    description: [''],
  });

  get churchId(): string {
    return this.route.snapshot.paramMap.get('id')!;
  }

  async ngOnInit() {
    try {
      const [church, pending, approved, groups, stats] = await Promise.all([
        this.churchService.getChurchById(this.churchId),
        this.churchService.getPendingMembers(this.churchId),
        this.churchService.getApprovedMembers(this.churchId),
        this.churchService.getGroups(this.churchId),
        this.churchService.getChurchStats(this.churchId),
      ]);
      this.church.set(church);
      this.pendingMembers.set(pending);
      this.approvedMembers.set(approved);
      this.groups.set(groups);
      this.stats.set(stats);
      this.churchForm.setValue({
        name: church.name,
        description: church.description ?? '',
      });
    } catch {
      this.error.set('No se pudo cargar la información.');
    } finally {
      this.loading.set(false);
    }
  }

  async onApprove(member: IChurchMember) {
    try {
      await this.churchService.approveMember(member.id, member.user_id, this.churchId);
      this.pendingMembers.update(list => list.filter(m => m.id !== member.id));
      this.approvedMembers.update(list => [...list, { ...member, status: 'approved' }]);
      this.stats.update(s => s ? { ...s, totalMembers: s.totalMembers + 1 } : s);
    } catch {
      this.error.set('No se pudo aprobar al miembro.');
    }
  }

  async onReject(member: IChurchMember) {
    try {
      await this.churchService.rejectMember(member.id);
      this.pendingMembers.update(list => list.filter(m => m.id !== member.id));
    } catch {
      this.error.set('No se pudo rechazar al miembro.');
    }
  }

  async onRemoveMember(member: IChurchMember) {
    if (!confirm(`¿Expulsar a ${member.profiles?.name ?? 'este miembro'}?`)) return;
    try {
      await this.churchService.removeMember(member.id, member.user_id);
      this.approvedMembers.update(list => list.filter(m => m.id !== member.id));
      this.stats.update(s => s ? { ...s, totalMembers: s.totalMembers - 1 } : s);
    } catch {
      this.error.set('No se pudo expulsar al miembro.');
    }
  }

  async onCreateGroup() {
    if (this.groupForm.invalid) return;
    this.groupError.set('');
    try {
      const group = await this.churchService.createGroup(
        this.groupForm.value.name!,
        this.churchId
      );
      this.groups.update(list => [...list, group]);
      this.groupForm.reset();
    } catch {
      this.groupError.set('No se pudo crear el grupo.');
    }
  }

  async onDeleteGroup(group: IGroup) {
    try {
      await this.churchService.deleteGroup(group.id);
      this.groups.update(list => list.filter(g => g.id !== group.id));
    } catch {
      this.error.set('No se pudo eliminar el grupo.');
    }
  }

  onGroupChange(memberId: string, groupId: string) {
    this.pendingGroupIds.update(map => ({ ...map, [memberId]: groupId }));
  }

  hasPendingGroup(member: IChurchMember): boolean {
    const pending = this.pendingGroupIds()[member.id];
    return pending !== undefined && pending !== (member.group_id ?? '');
  }

  async onAssignGroup(member: IChurchMember) {
    const groupId = this.pendingGroupIds()[member.id] ?? '';
    try {
      await this.churchService.assignGroup(member.id, groupId, member.user_id);
      this.approvedMembers.update(list =>
        list.map(m => m.id === member.id ? { ...m, group_id: groupId || null } : m)
      );
      this.pendingGroupIds.update(map => {
        const next = { ...map };
        delete next[member.id];
        return next;
      });
    } catch {
      this.error.set('No se pudo asignar el grupo.');
    }
  }

  async onSaveChurch() {
    if (this.churchForm.invalid) return;
    this.churchSaving.set(true);
    this.churchSaved.set(false);
    try {
      const { name, description } = this.churchForm.value;
      await this.churchService.updateChurch(this.churchId, {
        name: name!,
        description: description ?? '',
      });
      this.church.update(c => c ? { ...c, name: name!, description: description ?? '' } : c);
      this.churchSaved.set(true);
      setTimeout(() => this.churchSaved.set(false), 3000);
    } catch {
      this.error.set('No se pudo guardar los cambios.');
    } finally {
      this.churchSaving.set(false);
    }
  }

  setTab(tab: 'members' | 'groups' | 'stats' | 'church') {
    this.activeTab.set(tab);
  }

  getGroupName(groupId: string): string {
    return this.groups().find(g => g.id === groupId)?.name ?? '';
  }
}
