import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { guestGuard } from './core/guards/guest.guard';
import { churchAdminGuard } from './core/guards/church-admin.guard';
import { superAdminGuard } from './core/guards/super-admin.guard';

export const routes: Routes = [
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./features/auth/login/login.component').then(m => m.LoginComponent),
  },
  {
    path: 'register',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./features/auth/register/register.component').then(m => m.RegisterComponent),
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./shared/layout/shell/shell.component').then(m => m.ShellComponent),
    children: [
      { path: '', redirectTo: 'prayers', pathMatch: 'full' },
      {
        path: 'prayers',
        loadComponent: () =>
          import('./features/prayers/prayer-feed/prayer-feed.component').then(m => m.PrayerFeedComponent),
      },
      {
        path: 'prayers/new',
        loadComponent: () =>
          import('./features/prayers/prayer-create/prayer-create.component').then(m => m.PrayerCreateComponent),
      },
      {
        path: 'prayers/:id',
        loadComponent: () =>
          import('./features/prayers/prayer-detail/prayer-detail.component').then(m => m.PrayerDetailComponent),
      },
      {
        path: 'prayers/:id/testify',
        loadComponent: () =>
          import('./features/prayers/prayer-testify/prayer-testify.component').then(m => m.PrayerTestifyComponent),
      },
      {
        path: 'churches',
        loadComponent: () =>
          import('./features/churches/church-list/church-list.component').then(m => m.ChurchListComponent),
      },
      {
        path: 'churches/register',
        loadComponent: () =>
          import('./features/churches/church-register/church-register.component').then(m => m.ChurchRegisterComponent),
      },
      {
        path: 'churches/:id',
        loadComponent: () =>
          import('./features/churches/church-detail/church-detail.component').then(m => m.ChurchDetailComponent),
      },
      {
        path: 'churches/:id/admin',
        canActivate: [churchAdminGuard],
        loadComponent: () =>
          import('./features/churches/church-admin/church-admin.component').then(m => m.ChurchAdminComponent),
      },
      {
        path: 'testimonies',
        loadComponent: () =>
          import('./features/testimonies/testimony-feed/testimony-feed.component').then(m => m.TestimonyFeedComponent),
      },
      {
        path: 'profile',
        loadComponent: () =>
          import('./features/profile/profile.component').then(m => m.ProfileComponent),
      },
      {
        path: 'profile/:id',
        loadComponent: () =>
          import('./features/profile/public-profile/public-profile.component').then(m => m.PublicProfileComponent),
      },
      {
        path: 'ranking',
        loadComponent: () =>
          import('./features/gamification/church-ranking/church-ranking.component').then(m => m.ChurchRankingComponent),
      },
      {
        path: 'my-prayers',
        loadComponent: () =>
          import('./features/prayers/my-prayers/my-prayers.component').then(m => m.MyPrayersComponent),
      },
      {
        path: 'notifications',
        loadComponent: () =>
          import('./features/notifications/notification-list/notification-list.component').then(m => m.NotificationListComponent),
      },
      {
        path: 'admin',
        canActivate: [superAdminGuard],
        loadComponent: () =>
          import('./features/admin/admin-dashboard/admin-dashboard.component').then(m => m.AdminDashboardComponent),
      },
    ],
  },
];
