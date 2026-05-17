import { Component, inject, signal, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { SupabaseService } from '../../../core/services/supabase.service';
import { PageHeaderComponent } from '../../../shared/layout/page-header/page-header.component';
import { IUser } from '../../../models/user.model';

@Component({
  selector: 'app-profile-edit',
  standalone: true,
  imports: [ReactiveFormsModule, PageHeaderComponent],
  templateUrl: './profile-edit.component.html',
  styleUrl: './profile-edit.component.scss',
})
export class ProfileEditComponent implements OnInit {
  private auth = inject(AuthService);
  private fb = inject(FormBuilder);
  private supabase = inject(SupabaseService);

  user = this.auth.user;

  // Name form
  loading = signal(false);
  error = signal('');
  saved = signal(false);
  form = this.fb.group({
    name: [this.user()?.name ?? '', [Validators.required, Validators.minLength(2)]],
  });

  // Avatar
  avatarPreview = signal<string | null>(null);
  selectedFile = signal<File | null>(null);

  // Email (PIN accounts)
  emailSaving = signal(false);
  emailSaved = signal(false);
  emailError = signal('');
  emailForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
  });

  get initials(): string {
    const name = this.user()?.name ?? '';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  }

  ngOnInit() {
    const av = this.user()?.avatar_url;
    if (av) this.avatarPreview.set(av);
  }

  onFileSelected(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.selectedFile.set(file);
    this.avatarPreview.set(URL.createObjectURL(file));
  }

  async onSave() {
    if (this.form.invalid) return;
    this.loading.set(true);
    this.error.set('');
    this.saved.set(false);
    try {
      const updates: Partial<Pick<IUser, 'name' | 'avatar_url'>> = {
        name: this.form.value.name!,
      };
      const file = this.selectedFile();
      if (file) {
        updates.avatar_url = await this.uploadAvatarFile(file);
      }
      await this.auth.updateProfile(updates);
      this.selectedFile.set(null);
      this.saved.set(true);
      setTimeout(() => this.saved.set(false), 3000);
    } catch (err: any) {
      console.error('Avatar/profile save error:', err);
      this.error.set(err?.message ?? 'No se pudo guardar. Inténtalo de nuevo.');
    } finally {
      this.loading.set(false);
    }
  }

  private compressImage(file: File): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(url);
        const MAX = 400;
        let { width, height } = img;
        if (width > height) {
          if (width > MAX) { height = Math.round(height * MAX / width); width = MAX; }
        } else {
          if (height > MAX) { width = Math.round(width * MAX / height); height = MAX; }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        canvas.getContext('2d')!.drawImage(img, 0, 0, width, height);
        canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('Canvas toBlob failed')), 'image/webp', 0.8);
      };
      img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('No se pudo cargar la imagen')); };
      img.src = url;
    });
  }

  private async uploadAvatarFile(file: File): Promise<string> {
    const userId = this.user()?.id;
    if (!userId) throw new Error('No user');
    const path = `${userId}/avatar.webp`;

    // Remove previous avatar if it exists
    const prevUrl = this.user()?.avatar_url;
    if (prevUrl) {
      const prevPath = prevUrl.split('/avatars/')[1];
      if (prevPath) await this.supabase.client.storage.from('avatars').remove([decodeURIComponent(prevPath)]);
    }

    const blob = await this.compressImage(file);
    const { error } = await this.supabase.client.storage
      .from('avatars')
      .upload(path, blob, { upsert: true, contentType: 'image/webp' });
    if (error) throw new Error(`Error al subir imagen: ${error.message}`);
    const { data } = this.supabase.client.storage.from('avatars').getPublicUrl(path);
    return data.publicUrl;
  }

  async onAddEmail() {
    this.emailForm.markAllAsTouched();
    if (this.emailForm.invalid) return;
    this.emailSaving.set(true);
    this.emailError.set('');
    this.emailSaved.set(false);
    try {
      await this.auth.addEmailToAccount(this.emailForm.value.email!);
      this.emailSaved.set(true);
    } catch {
      this.emailError.set('No se pudo guardar el email. Inténtalo de nuevo.');
    } finally {
      this.emailSaving.set(false);
    }
  }

  async onLogout() {
    await this.auth.logout();
  }
}
