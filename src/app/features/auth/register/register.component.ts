import { Component, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ChurchService } from '../../../core/services/church.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss',
})
export class RegisterComponent {
  form: FormGroup;
  loading = signal(false);
  googleLoading = signal(false);
  error = signal('');
  success = signal(false);

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private churchService: ChurchService,
    private route: ActivatedRoute,
    private router: Router,
  ) {
    this.form = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  async onSubmit() {
    if (this.form.invalid) return;
    this.loading.set(true);
    this.error.set('');
    try {
      const data = await this.auth.register(
        this.form.value.name,
        this.form.value.email,
        this.form.value.password
      );
      const inviteToken = this.route.snapshot.queryParams['invite'];
      if (inviteToken && data.session) {
        const invite = await this.churchService.getAdminInvite(inviteToken);
        if (invite && data.user) {
          await this.churchService.acceptAdminInvite(inviteToken, data.user.id, invite.church_id);
          this.router.navigate(['/churches', invite.church_id, 'admin']);
          return;
        }
      }
      this.success.set(true);
    } catch (err: any) {
      this.error.set(this.mapError(err.message));
    } finally {
      this.loading.set(false);
    }
  }

  async onGoogleLogin() {
    this.googleLoading.set(true);
    this.error.set('');
    try {
      await this.auth.signInWithGoogle();
    } catch {
      this.error.set('No se pudo conectar con Google. Inténtalo de nuevo.');
      this.googleLoading.set(false);
    }
  }

  private mapError(msg: string): string {
    if (msg.includes('already registered')) return 'Este correo ya tiene una cuenta';
    if (msg.includes('Password should be')) return 'La contraseña debe tener al menos 6 caracteres';
    return 'Ocurrió un error. Inténtalo de nuevo.';
  }
}
