import { Component, inject, signal, OnInit, Input } from '@angular/core';
import { PromiseService } from '../../../core/services/promise.service';
import { IDailyPromise } from '../../../models/promise.model';

@Component({
  selector: 'app-daily-promise',
  standalone: true,
  imports: [],
  templateUrl: './daily-promise.component.html',
  styleUrl: './daily-promise.component.scss',
})
export class DailyPromiseComponent implements OnInit {
  private promiseService = inject(PromiseService);

  @Input() alwaysShow = false;

  promise = signal<IDailyPromise | null>(null);
  copied = signal(false);

  private readonly storageKey = 'promise_shown_date';

  async ngOnInit() {
    const today = new Date().toLocaleDateString('en-CA');
    if (!this.alwaysShow && localStorage.getItem(this.storageKey) === today) return;
    try {
      const data = await this.promiseService.getToday();
      if (data) {
        this.promise.set(data);
        if (!this.alwaysShow) localStorage.setItem(this.storageKey, today);
      }
    } catch (err) {
      console.error('[DailyPromise]', err);
    }
  }

  async share() {
    const p = this.promise();
    if (!p) return;
    const text = `"${p.text}" — ${p.reference}\n\nCompartido desde Intercede 🙏`;

    if (navigator.share) {
      await navigator.share({ text }).catch(() => {});
    } else {
      await navigator.clipboard.writeText(text).catch(() => {});
      this.copied.set(true);
      setTimeout(() => this.copied.set(false), 2000);
    }
  }
}
