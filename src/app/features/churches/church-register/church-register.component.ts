import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ChurchService } from '../../../core/services/church.service';
import { PageHeaderComponent } from '../../../shared/layout/page-header/page-header.component';

@Component({
  selector: 'app-church-register',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, PageHeaderComponent],
  templateUrl: './church-register.component.html',
  styleUrl: './church-register.component.scss',
})
export class ChurchRegisterComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private churchService = inject(ChurchService);

  loading = signal(false);
  error = signal('');
  success = signal(false);

  form = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(3)]],
    description: ['', [Validators.required, Validators.minLength(10)]],
    photo_url: [''],
  });

  get nameCtrl() { return this.form.controls.name; }
  get descCtrl() { return this.form.controls.description; }

  async onSubmit() {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;

    const user = this.auth.user();
    if (!user) {
      this.error.set('Tu sesión expiró. Vuelve a iniciar sesión.');
      return;
    }

    this.loading.set(true);
    this.error.set('');
    try {
      await this.churchService.registerChurch(
        {
          name: this.form.value.name!,
          description: this.form.value.description!,
          photo_url: this.form.value.photo_url || null,
        },
        user.id
      );
      this.success.set(true);
    } catch (err: any) {
      console.error('[ChurchRegister] registerChurch error:', err);
      this.error.set(err?.message ?? 'No se pudo registrar la iglesia. Inténtalo de nuevo.');
    } finally {
      this.loading.set(false);
    }
  }
}
