import {
  Component, Input, Output, EventEmitter,
  inject, signal,
  AfterViewInit, OnDestroy,
  ElementRef, ViewChild,
} from '@angular/core';
import { AuthService } from '../../../core/services/auth.service';
import { SupabaseService } from '../../../core/services/supabase.service';
import { ResponseService } from '../../../core/services/response.service';
import { IResponse, IResponseWithProfile } from '../../../models/response.model';

type ComposeState = 'text' | 'recording' | 'preview';

@Component({
  selector: 'app-prayer-response',
  standalone: true,
  imports: [],
  templateUrl: './prayer-response.component.html',
  styleUrl: './prayer-response.component.scss',
})
export class PrayerResponseComponent implements AfterViewInit, OnDestroy {
  @Input({ required: true }) prayerId!: string;
  @Input() initMode: 'text' | 'audio' = 'text';
  @Input() userAvatar: string | null = null;
  @Input() userName = '';
  @Output() responseAdded = new EventEmitter<IResponseWithProfile>();

  @ViewChild('textareaRef') textareaRef?: ElementRef<HTMLTextAreaElement>;

  private auth = inject(AuthService);
  private supabase = inject(SupabaseService);
  private responseService = inject(ResponseService);

  textValue = signal('');
  composeState = signal<ComposeState>('text');
  recordingSeconds = signal(0);
  audioBlob = signal<Blob | null>(null);
  audioPreviewUrl = signal<string | null>(null);
  sending = signal(false);
  error = signal('');

  get hasText(): boolean { return this.textValue().trim().length >= 5; }
  get userInitials(): string {
    return (this.userName || 'Tú').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  }

  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: BlobPart[] = [];
  private timerInterval: ReturnType<typeof setInterval> | null = null;
  private stream: MediaStream | null = null;
  private pendingSend = false;

  ngAfterViewInit() {
    setTimeout(() => {
      if (this.initMode === 'audio') {
        this.startRecording();
      } else {
        this.textareaRef?.nativeElement.focus();
      }
    }, 150);
  }

  onTextInput(event: Event) {
    this.textValue.set((event.target as HTMLTextAreaElement).value);
  }

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
        if (this.pendingSend) {
          this.pendingSend = false;
          this.sendAudio();
        } else {
          this.audioPreviewUrl.set(URL.createObjectURL(blob));
          this.composeState.set('preview');
        }
      };

      this.mediaRecorder.start();
      this.composeState.set('recording');
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

  stopAndSend() {
    if (this.sending()) return;
    this.pendingSend = true;
    this.stopRecording();
  }

  discardAudio() {
    const url = this.audioPreviewUrl();
    if (url) URL.revokeObjectURL(url);
    this.audioBlob.set(null);
    this.audioPreviewUrl.set(null);
    this.composeState.set('text');
    this.recordingSeconds.set(0);
    setTimeout(() => this.textareaRef?.nativeElement.focus(), 50);
  }

  async sendText() {
    if (!this.hasText) return;
    await this.send(userId =>
      this.responseService.createText(this.prayerId, userId, this.textValue())
    );
    this.textValue.set('');
    if (this.textareaRef) this.textareaRef.nativeElement.value = '';
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
