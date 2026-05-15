import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { LeftNavComponent } from '../left-nav/left-nav.component';
import { RightPanelComponent } from '../right-panel/right-panel.component';
import { BottomNavComponent } from '../bottom-nav/bottom-nav.component';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterOutlet, LeftNavComponent, RightPanelComponent, BottomNavComponent],
  templateUrl: './shell.component.html',
  styleUrl: './shell.component.scss',
})
export class ShellComponent {}
