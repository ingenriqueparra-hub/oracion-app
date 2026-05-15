import { Component, inject, signal, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { SupabaseService } from '../../../core/services/supabase.service';
import { PrayerService } from '../../../core/services/prayer.service';
import { TestimonyService } from '../../../core/services/testimony.service';
import { IPrayerFeedItem } from '../../../models/prayer.model';
import { PageHeaderComponent } from '../../../shared/layout/page-header/page-header.component';

@Component({
  selector: 'app-prayer-testify',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, PageHeaderComponent],
  templateUrl: './prayer-testify.component.html',
  styleUrl: './prayer-testify.component.scss',
})
export class PrayerTestifyComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private supabase = inject(SupabaseService);
  private prayerService = inject(PrayerService);
  private testimonyService = inject(TestimonyService);

  prayer = signal<IPrayerFeedItem | null>(null);
  loading = signal(true);
  submitting = signal(false);
  error = signal('');

  form = this.fb.group({
    text: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(2000)]],
  });

  get textCtrl() { return this.form.controls.text; }
  get charCount() { return this.textCtrl.value?.length ?? 0; }
  get prayerId() { return this.route.snapshot.paramMap.get('id')!; }

  async ngOnInit() {
    const user = this.auth.user();
    let userId = user?.id;
    if (!userId) {
      const { data: { session } } = await this.supabase.client.auth.getSession();
      userId = session?.user?.id;
    }
    if (!userId) { this.router.navigate(['/login']); return; }

    try {
      const prayer = await this.prayerService.getById(this.prayerId, userId);

      // Only the owner can testify, and only if still active
      if (prayer.user_id !== userId || prayer.status !== 'active') {
        this.router.navigate(['/prayers', this.prayerId]);
        return;
      }
      this.prayer.set(prayer);
    } catch (err: any) {
      console.error('[PrayerTestify]', err);
      this.error.set('No se pudo cargar el pedido.');
    } finally {
      this.loading.set(false);
    }
  }

  async onSubmit() {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;

    const user = this.auth.user();
    let userId = user?.id;
    if (!userId) {
      const { data: { session } } = await this.supabase.client.auth.getSession();
      userId = session?.user?.id;
    }
    if (!userId) { this.error.set('Tu sesión expiró.'); return; }

    this.submitting.set(true);
    this.error.set('');
    try {
      await this.testimonyService.create(this.prayerId, userId, this.textCtrl.value!);
      this.router.navigate(['/testimonies']);
    } catch (err: any) {
      console.error('[PrayerTestify]', err);
      this.error.set('No se pudo guardar el testimonio. Inténtalo de nuevo.');
    } finally {
      this.submitting.set(false);
    }
  }
}
