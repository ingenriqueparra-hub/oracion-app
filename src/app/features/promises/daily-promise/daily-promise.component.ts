import { Component, inject, signal, OnInit } from '@angular/core';
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

  promise = signal<IDailyPromise | null>(null);
  copied = signal(false);

  async ngOnInit() {
    try {
      const data = await this.promiseService.getToday();
      this.promise.set(data);
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
