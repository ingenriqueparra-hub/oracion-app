import { Component, inject, signal, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ChurchService } from '../../../core/services/church.service';
import { IChurch } from '../../../models/church.model';

@Component({
  selector: 'app-church-list',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './church-list.component.html',
  styleUrl: './church-list.component.scss',
})
export class ChurchListComponent implements OnInit {
  private churchService = inject(ChurchService);
  private auth = inject(AuthService);
  private router = inject(Router);

  churches = signal<IChurch[]>([]);
  loading = signal(true);
  error = signal('');

  user = this.auth.user;

  async ngOnInit() {
    try {
      const data = await this.churchService.getApprovedChurches();
      this.churches.set(data);
    } catch {
      this.error.set('No se pudieron cargar las iglesias.');
    } finally {
      this.loading.set(false);
    }
  }

  goToRegister() {
    this.router.navigate(['/churches/register']);
  }
}
