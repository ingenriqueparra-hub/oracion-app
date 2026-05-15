import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { PrayerService } from '../../../core/services/prayer.service';

@Component({
  selector: 'app-prayer-create',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './prayer-create.component.html',
  styleUrl: './prayer-create.component.scss',
})
export class PrayerCreateComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private prayerService = inject(PrayerService);
  private router = inject(Router);

  loading = signal(false);
  error = signal('');

  form = this.fb.group({
    text: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(1000)]],
  });

  get textCtrl() { return this.form.controls.text; }
  get charCount(): number { return this.textCtrl.value?.length ?? 0; }

  async onSubmit() {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;

    const user = this.auth.user();
    if (!user) { this.error.set('Tu sesión expiró. Vuelve a iniciar sesión.'); return; }

    this.loading.set(true);
    this.error.set('');
    try {
      await this.prayerService.create(user.id, this.textCtrl.value!, user.church_id, user.group_id);
      this.router.navigate(['/prayers']);
    } catch (err: any) {
      console.error('[PrayerCreate]', err);
      this.error.set('No se pudo publicar el pedido. Inténtalo de nuevo.');
    } finally {
      this.loading.set(false);
    }
  }
}
