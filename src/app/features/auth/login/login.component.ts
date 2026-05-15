import { Component, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  form: FormGroup;
  loading = signal(false);
  googleLoading = signal(false);
  error = signal('');

  constructor(private fb: FormBuilder, private auth: AuthService, private router: Router) {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  async onSubmit() {
    if (this.form.invalid) return;
    this.loading.set(true);
    this.error.set('');
    try {
      await this.auth.login(this.form.value.email, this.form.value.password);
      this.router.navigate(['/prayers']);
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
    if (msg.includes('Invalid login credentials')) return 'Correo o contraseña incorrectos';
    if (msg.includes('Email not confirmed')) return 'Confirma tu correo antes de ingresar';
    return 'Ocurrió un error. Inténtalo de nuevo.';
  }
}
