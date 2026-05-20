import { Component, inject, signal, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ChurchService } from '../../../core/services/church.service';

@Component({
  selector: 'app-invite-accept',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './invite-accept.component.html',
  styleUrl: './invite-accept.component.scss',
})
export class InviteAcceptComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private auth = inject(AuthService);
  private churchService = inject(ChurchService);

  user = this.auth.user;

  loading = signal(true);
  error = signal('');
  churchName = signal('');
  accepting = signal(false);
  accepted = signal(false);

  token = '';
  churchId = '';

  async ngOnInit() {
    this.token = this.route.snapshot.paramMap.get('token') ?? '';
    if (!this.token) {
      this.error.set('Link inválido.');
      this.loading.set(false);
      return;
    }

    const invite = await this.churchService.getAdminInvite(this.token);
    if (!invite) {
      this.error.set('Este link no es válido o ya expiró.');
      this.loading.set(false);
      return;
    }

    this.churchId = invite.church_id;
    this.churchName.set(invite.church_name);
    this.loading.set(false);
  }

  isBlockedAdmin(): boolean {
    const user = this.user();
    return !!user && user.role === 'church_admin' && user.church_id !== this.churchId;
  }

  isAlreadyAdmin(): boolean {
    const user = this.user();
    return !!user && user.role === 'church_admin' && user.church_id === this.churchId;
  }

  async onAccept() {
    const user = this.user();
    if (!user) return;
    this.accepting.set(true);
    this.error.set('');
    try {
      await this.churchService.acceptAdminInvite(this.token, user.id, this.churchId);
      await this.auth.refreshProfile();
      this.accepted.set(true);
      setTimeout(() => this.router.navigate(['/churches', this.churchId, 'admin']), 1500);
    } catch {
      this.error.set('No se pudo procesar la invitación. Inténtalo de nuevo.');
    } finally {
      this.accepting.set(false);
    }
  }
}
