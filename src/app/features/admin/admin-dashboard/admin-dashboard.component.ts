import { Component, inject, signal, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SupabaseService } from '../../../core/services/supabase.service';
import { IChurch } from '../../../models/church.model';

type AdminTab = 'churches' | 'users';

interface IAdminChurch extends IChurch {
  adminName: string;
  adminEmail: string;
}

interface IAdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
  suspended: boolean;
  church_id: string | null;
  churchName: string;
  created_at: string;
}

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.scss',
})
export class AdminDashboardComponent implements OnInit {
  private supabase = inject(SupabaseService);

  activeTab = signal<AdminTab>('churches');
  churches = signal<IAdminChurch[]>([]);
  users = signal<IAdminUser[]>([]);
  loadingChurches = signal(true);
  loadingUsers = signal(false);
  error = signal('');

  async ngOnInit() {
    await this.loadChurches();
  }

  async setTab(tab: AdminTab) {
    this.activeTab.set(tab);
    if (tab === 'churches' && this.churches().length === 0) await this.loadChurches();
    if (tab === 'users' && this.users().length === 0) await this.loadUsers();
  }

  async loadChurches() {
    this.loadingChurches.set(true);
    this.error.set('');
    try {
      const { data: churches, error } = await this.supabase.client
        .from('churches')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;

      const adminIds = [...new Set((churches ?? []).map((c: any) => c.admin_id))];
      const { data: profiles } = await this.supabase.client
        .from('profiles')
        .select('id, name, email')
        .in('id', adminIds);

      const profileMap = new Map((profiles ?? []).map((p: any) => [p.id, p]));

      this.churches.set((churches ?? []).map((c: any) => ({
        ...c,
        adminName: profileMap.get(c.admin_id)?.name ?? '—',
        adminEmail: profileMap.get(c.admin_id)?.email ?? '—',
      })));
    } catch (err: any) {
      console.error('[AdminDashboard]', err);
      this.error.set('No se pudieron cargar las iglesias.');
    } finally {
      this.loadingChurches.set(false);
    }
  }

  async loadUsers() {
    this.loadingUsers.set(true);
    this.error.set('');
    try {
      const { data: profiles, error } = await this.supabase.client
        .from('profiles')
        .select('id, name, email, role, suspended, church_id, created_at')
        .order('created_at', { ascending: false });
      if (error) throw error;

      const churchIds = [...new Set((profiles ?? []).filter((p: any) => p.church_id).map((p: any) => p.church_id))];
      let churchMap = new Map<string, string>();
      if (churchIds.length) {
        const { data: churches } = await this.supabase.client
          .from('churches').select('id, name').in('id', churchIds);
        churchMap = new Map((churches ?? []).map((c: any) => [c.id, c.name]));
      }

      this.users.set((profiles ?? []).map((p: any) => ({
        ...p,
        churchName: p.church_id ? (churchMap.get(p.church_id) ?? '—') : '—',
      })));
    } catch (err: any) {
      console.error('[AdminDashboard]', err);
      this.error.set('No se pudieron cargar los usuarios.');
    } finally {
      this.loadingUsers.set(false);
    }
  }

  async updateChurchStatus(id: string, status: IChurch['status']) {
    const { error } = await this.supabase.client
      .from('churches').update({ status }).eq('id', id);
    if (error) { console.error(error); return; }
    this.churches.update(list =>
      list.map(c => c.id === id ? { ...c, status } : c)
    );
  }

  async toggleUserSuspended(user: IAdminUser) {
    const suspended = !user.suspended;
    const { error } = await this.supabase.client
      .from('profiles').update({ suspended }).eq('id', user.id);
    if (error) { console.error(error); return; }
    this.users.update(list =>
      list.map(u => u.id === user.id ? { ...u, suspended } : u)
    );
  }

  statusLabel(status: IChurch['status']): string {
    return { pending: 'Pendiente', approved: 'Aprobada', rejected: 'Rechazada', suspended: 'Suspendida' }[status];
  }

  roleLabel(role: string): string {
    return { member: 'Miembro', church_admin: 'Admin iglesia', super_admin: 'Super admin' }[role] ?? role;
  }

  countByStatus(status: IChurch['status']): number {
    return this.churches().filter(c => c.status === status).length;
  }
}
