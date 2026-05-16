import { Component, Input, Output, EventEmitter } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { Location } from '@angular/common';

@Component({
  selector: 'app-page-header',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './page-header.component.html',
  styleUrl: './page-header.component.scss',
})
export class PageHeaderComponent {
  @Input() title?: string;
  @Input() backLink?: string | string[];
  @Input() showBack = false;
  @Input() backLabel = '←';
  @Input() actionLabel?: string;
  @Input() actionLink?: string | string[];
  @Output() actionClick = new EventEmitter<void>();

  constructor(private router: Router, private location: Location) {}

  goBack(): void {
    if (this.backLink) {
      this.router.navigate(Array.isArray(this.backLink) ? this.backLink : [this.backLink]);
    } else {
      this.location.back();
    }
  }
}
