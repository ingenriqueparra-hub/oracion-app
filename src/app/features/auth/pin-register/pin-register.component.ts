import {
  Component, inject, signal,
  ViewChild, ElementRef, AfterViewInit,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-pin-register',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './pin-register.component.html',
  styleUrl: './pin-register.component.scss',
})
export class PinRegisterComponent {
  private auth = inject(AuthService);
  private router = inject(Router);

  step = signal<1 | 2>(1);
  name = signal('');
  nameError = signal('');
  pinDigits = signal(['', '', '', '']);
  confirmDigits = signal(['', '', '', '']);
  pinError = signal('');
  loading = signal(false);
  error = signal('');

  // Step 2 PIN inputs
  @ViewChild('p0') p0!: ElementRef<HTMLInputElement>;
  @ViewChild('p1') p1!: ElementRef<HTMLInputElement>;
  @ViewChild('p2') p2!: ElementRef<HTMLInputElement>;
  @ViewChild('p3') p3!: ElementRef<HTMLInputElement>;
  @ViewChild('c0') c0!: ElementRef<HTMLInputElement>;
  @ViewChild('c1') c1!: ElementRef<HTMLInputElement>;
  @ViewChild('c2') c2!: ElementRef<HTMLInputElement>;
  @ViewChild('c3') c3!: ElementRef<HTMLInputElement>;

  private pinRefs(): HTMLInputElement[] {
    return [this.p0, this.p1, this.p2, this.p3].map(r => r?.nativeElement);
  }

  private confirmRefs(): HTMLInputElement[] {
    return [this.c0, this.c1, this.c2, this.c3].map(r => r?.nativeElement);
  }

  onNameInput(event: Event) {
    this.name.set((event.target as HTMLInputElement).value);
    this.nameError.set('');
  }

  goToStep2() {
    const n = this.name().trim();
    if (n.length < 2) { this.nameError.set('Escribe al menos 2 caracteres'); return; }
    if (n.length > 40) { this.nameError.set('Máximo 40 caracteres'); return; }
    this.step.set(2);
    setTimeout(() => this.pinRefs()[0]?.focus(), 100);
  }

  onDigit(group: 'pin' | 'confirm', index: number, event: Event) {
    const input = event.target as HTMLInputElement;
    const val = input.value.replace(/\D/g, '').slice(-1);
    input.value = val;

    if (group === 'pin') {
      const digits = [...this.pinDigits()];
      digits[index] = val;
      this.pinDigits.set(digits);
    } else {
      const digits = [...this.confirmDigits()];
      digits[index] = val;
      this.confirmDigits.set(digits);
    }
    this.pinError.set('');

    if (val) {
      if (group === 'pin') {
        if (index < 3) this.pinRefs()[index + 1]?.focus();
        else this.confirmRefs()[0]?.focus();
      } else {
        if (index < 3) this.confirmRefs()[index + 1]?.focus();
      }
    }
  }

  onBack(group: 'pin' | 'confirm', index: number, event: KeyboardEvent) {
    if (event.key !== 'Backspace') return;
    const input = event.target as HTMLInputElement;
    if (!input.value && index > 0) {
      const refs = group === 'pin' ? this.pinRefs() : this.confirmRefs();
      refs[index - 1]?.focus();
    }
  }

  get pin(): string { return this.pinDigits().join(''); }
  get confirmPin(): string { return this.confirmDigits().join(''); }

  async onSubmit() {
    const pin = this.pin;
    const confirm = this.confirmPin;

    if (pin.length < 4) { this.pinError.set('Completa los 4 dígitos del PIN'); return; }
    if (confirm.length < 4) { this.pinError.set('Confirma tu PIN'); return; }
    if (pin !== confirm) { this.pinError.set('Los PINs no coinciden'); return; }

    this.loading.set(true);
    this.error.set('');
    try {
      await this.auth.registerWithPin(this.name().trim(), pin);
      this.router.navigate(['/prayers']);
    } catch (err: any) {
      console.error('[PinRegister]', err);
      this.error.set('No se pudo crear la cuenta. Inténtalo de nuevo.');
    } finally {
      this.loading.set(false);
    }
  }
}
