import { Component, Input, Output, EventEmitter } from '@angular/core';
import { RouterLink } from '@angular/router';

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
  @Input() backLabel = '← ';
  @Input() actionLabel?: string;
  @Input() actionLink?: string | string[];
  @Output() actionClick = new EventEmitter<void>();
}
