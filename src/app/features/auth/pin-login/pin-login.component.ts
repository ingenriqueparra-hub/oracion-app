import {
  Component, inject, signal,
  ViewChild, ElementRef,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService, IPinAccount } from '../../../core/services/auth.service';

@Component({
  selector: 'app-pin-login',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './pin-login.component.html',
  styleUrl: './pin-login.component.scss',
})
export class PinLoginComponent {
  private auth = inject(AuthService);
  private router = inject(Router);

  name = signal('');
  nameError = signal('');
  pinDigits = signal(['', '', '', '']);
  pinError = signal('');
  loading = signal(false);
  error = signal('');

  accounts = signal<IPinAccount[]>([]);
  showSelector = signal(false);
  selectedAccount = signal<IPinAccount | null>(null);

  @ViewChild('p0') p0!: ElementRef<HTMLInputElement>;
  @ViewChild('p1') p1!: ElementRef<HTMLInputElement>;
  @ViewChild('p2') p2!: ElementRef<HTMLInputElement>;
  @ViewChild('p3') p3!: ElementRef<HTMLInputElement>;

  private pinRefs(): HTMLInputElement[] {
    return [this.p0, this.p1, this.p2, this.p3].map(r => r?.nativeElement);
  }

  onNameInput(event: Event) {
    this.name.set((event.target as HTMLInputElement).value);
    this.nameError.set('');
  }

  onDigit(index: number, event: Event) {
    const input = event.target as HTMLInputElement;
    const val = input.value.replace(/\D/g, '').slice(-1);
    input.value = val;

    const digits = [...this.pinDigits()];
    digits[index] = val;
    this.pinDigits.set(digits);
    this.pinError.set('');

    if (val && index < 3) this.pinRefs()[index + 1]?.focus();
  }

  onBack(index: number, event: KeyboardEvent) {
    if (event.key !== 'Backspace') return;
    const input = event.target as HTMLInputElement;
    if (!input.value && index > 0) this.pinRefs()[index - 1]?.focus();
  }

  get pin(): string { return this.pinDigits().join(''); }

  async onSubmit() {
    const name = this.name().trim();
    if (name.length < 2) { this.nameError.set('Escribe tu nombre'); return; }
    if (this.pin.length < 4) { this.pinError.set('Completa los 4 dígitos del PIN'); return; }

    this.loading.set(true);
    this.error.set('');
    try {
      const accounts = await this.auth.findPinAccounts(name);

      if (accounts.length === 0) {
        this.error.set('No encontramos una cuenta con ese nombre. ¿Escribiste bien tu nombre?');
        return;
      }

      if (accounts.length === 1) {
        await this.auth.loginWithPinEmail(accounts[0].fake_email, this.pin);
        this.router.navigate(['/prayers']);
        return;
      }

      // Múltiples cuentas con el mismo nombre → mostrar selector
      this.accounts.set(accounts);
      this.showSelector.set(true);
    } catch (err: any) {
      const msg = err?.message ?? '';
      this.error.set(msg === 'PIN incorrecto'
        ? 'PIN incorrecto. Inténtalo de nuevo.'
        : 'No se pudo iniciar sesión. Inténtalo de nuevo.');
    } finally {
      this.loading.set(false);
    }
  }

  async onSelectAccount(account: IPinAccount) {
    this.selectedAccount.set(account);
    this.loading.set(true);
    this.error.set('');
    try {
      await this.auth.loginWithPinEmail(account.fake_email, this.pin);
      this.router.navigate(['/prayers']);
    } catch {
      this.error.set('PIN incorrecto. Inténtalo de nuevo.');
      this.showSelector.set(false);
    } finally {
      this.loading.set(false);
    }
  }

  cancelSelector() {
    this.showSelector.set(false);
    this.accounts.set([]);
    this.selectedAccount.set(null);
  }
}
