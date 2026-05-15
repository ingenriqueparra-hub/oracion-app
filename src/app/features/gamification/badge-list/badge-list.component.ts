import { Component, Input, computed, signal } from '@angular/core';
import { IBadge } from '../../../models/badge.model';

@Component({
  selector: 'app-badge-list',
  standalone: true,
  imports: [],
  templateUrl: './badge-list.component.html',
  styleUrl: './badge-list.component.scss',
})
export class BadgeListComponent {
  @Input() allBadges: IBadge[] = [];
  @Input() earnedIds: Set<string> = new Set();
  @Input() showLocked = true;

  get displayBadges(): IBadge[] {
    return this.showLocked
      ? this.allBadges
      : this.allBadges.filter(b => this.earnedIds.has(b.id));
  }

  isEarned(badge: IBadge): boolean {
    return this.earnedIds.has(badge.id);
  }
}
