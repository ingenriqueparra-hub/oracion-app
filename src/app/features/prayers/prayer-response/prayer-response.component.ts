import { Component, Input, Output, EventEmitter, inject, signal, OnDestroy } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { SupabaseService } from '../../../core/services/supabase.service';
import { ResponseService } from '../../../core/services/response.service';
import { IResponse, IResponseWithProfile } from '../../../models/response.model';

type RecordingState = 'idle' | 'recording' | 'preview';
type ActiveTab = 'text' | 'audio';

@Component({
  selector: 'app-prayer-response',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './prayer-response.component.html',
  styleUrl: './prayer-response.component.scss',
})
export class PrayerResponseComponent implements OnDestroy {
  @Input({ required: true }) prayerId!: string;
  @Output() responseAdded = new EventEmitter<IResponseWithProfile>();

  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private supabase = inject(SupabaseService);
  private responseService = inject(ResponseService);

  activeTab = signal<ActiveTab>('text');
  sending = signal(false);
  error = signal('');

  textForm = this.fb.group({
    text: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(500)]],
  });
  get textCtrl() { return this.textForm.controls.text; }

  recordingState = signal<RecordingState>('idle');
  recordingSeconds = signal(0);
  audioBlob = signal<Blob | null>(null);
  audioPreviewUrl = signal<string | null>(null);

  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: BlobPart[] = [];
  private timerInterval: ReturnType<typeof setInterval> | null = null;
  private stream: MediaStream | null = null;

  async startRecording() {
    this.error.set('');
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.audioChunks = [];
      this.mediaRecorder = new MediaRecorder(this.stream);

      this.mediaRecorder.ondataavailable = e => {
        if (e.data.size > 0) this.audioChunks.push(e.data);
      };

      this.mediaRecorder.onstop = () => {
        const blob = new Blob(this.audioChunks, { type: this.mediaRecorder!.mimeType || 'audio/webm' });
        this.audioBlob.set(blob);
        this.audioPreviewUrl.set(URL.createObjectURL(blob));
        this.recordingState.set('preview');
      };

      this.mediaRecorder.start();
      this.recordingState.set('recording');
      this.recordingSeconds.set(0);

      this.timerInterval = setInterval(() => {
        this.recordingSeconds.update(s => {
          if (s >= 30) { this.stopRecording(); return s; }
          return s + 1;
        });
      }, 1000);
    } catch {
      this.error.set('No se pudo acceder al micrófono. Verifica los permisos del navegador.');
    }
  }

  stopRecording() {
    if (this.timerInterval) { clearInterval(this.timerInterval); this.timerInterval = null; }
    this.mediaRecorder?.stop();
    this.stream?.getTracks().forEach(t => t.stop());
  }

  discardAudio() {
    const url = this.audioPreviewUrl();
    if (url) URL.revokeObjectURL(url);
    this.audioBlob.set(null);
    this.audioPreviewUrl.set(null);
    this.recordingState.set('idle');
    this.recordingSeconds.set(0);
  }

  async sendText() {
    this.textForm.markAllAsTouched();
    if (this.textForm.invalid) return;
    await this.send(userId =>
      this.responseService.createText(this.prayerId, userId, this.textForm.value.text!)
    );
    this.textForm.reset();
  }

  async sendAudio() {
    const blob = this.audioBlob();
    if (!blob) return;
    await this.send(userId => this.responseService.createAudio(this.prayerId, userId, blob));
    this.discardAudio();
  }

  private async send(action: (userId: string) => Promise<IResponse>) {
    const user = this.auth.user();
    let userId = user?.id;
    if (!userId) {
      const { data: { session } } = await this.supabase.client.auth.getSession();
      userId = session?.user?.id;
    }
    if (!userId) { this.error.set('Tu sesión expiró. Recarga la página.'); return; }

    this.sending.set(true);
    this.error.set('');
    try {
      const response = await action(userId);
      const withProfile: IResponseWithProfile = {
        ...response,
        profiles: { name: user?.name ?? 'Tú', avatar_url: user?.avatar_url ?? null, level: user?.level ?? '' },
      };
      this.responseAdded.emit(withProfile);
    } catch (err: any) {
      console.error('[PrayerResponse]', err);
      this.error.set('No se pudo enviar la respuesta. Inténtalo de nuevo.');
    } finally {
      this.sending.set(false);
    }
  }

  formatTime(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  ngOnDestroy() {
    this.stopRecording();
    const url = this.audioPreviewUrl();
    if (url) URL.revokeObjectURL(url);
  }
}
