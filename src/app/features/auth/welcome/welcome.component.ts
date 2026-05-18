import { Component, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-welcome',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './welcome.component.html',
  styleUrl: './welcome.component.scss',
})
export class WelcomeComponent {
  step = signal<'root' | 'login' | 'register'>('root');
  googleLoading = signal(false);
  error = signal('');

  constructor(private auth: AuthService, private router: Router) {}

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
}
