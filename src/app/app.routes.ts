import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { guestGuard } from './core/guards/guest.guard';
import { churchAdminGuard } from './core/guards/church-admin.guard';
import { superAdminGuard } from './core/guards/super-admin.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/prayers', pathMatch: 'full' },
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
    path: 'profile',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/profile/profile.component').then(m => m.ProfileComponent),
  },
  {
    path: 'prayers',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/prayers/prayer-feed/prayer-feed.component').then(m => m.PrayerFeedComponent),
  },
  {
    path: 'prayers/new',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/prayers/prayer-create/prayer-create.component').then(m => m.PrayerCreateComponent),
  },
  {
    path: 'prayers/:id',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/prayers/prayer-detail/prayer-detail.component').then(m => m.PrayerDetailComponent),
  },
  {
    path: 'admin',
    canActivate: [superAdminGuard],
    loadComponent: () =>
      import('./features/admin/admin-dashboard/admin-dashboard.component').then(m => m.AdminDashboardComponent),
  },
  {
    path: 'profile/:id',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/profile/public-profile/public-profile.component').then(m => m.PublicProfileComponent),
  },
  {
    path: 'ranking',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/gamification/church-ranking/church-ranking.component').then(m => m.ChurchRankingComponent),
  },
  {
    path: 'notifications',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/notifications/notification-list/notification-list.component').then(m => m.NotificationListComponent),
  },
  {
    path: 'prayers/:id/testify',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/prayers/prayer-testify/prayer-testify.component').then(m => m.PrayerTestifyComponent),
  },
  {
    path: 'testimonies',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/testimonies/testimony-feed/testimony-feed.component').then(m => m.TestimonyFeedComponent),
  },
  {
    path: 'churches',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/churches/church-list/church-list.component').then(m => m.ChurchListComponent),
  },
  {
    path: 'churches/register',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/churches/church-register/church-register.component').then(m => m.ChurchRegisterComponent),
  },
  {
    path: 'churches/:id',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/churches/church-detail/church-detail.component').then(m => m.ChurchDetailComponent),
  },
  {
    path: 'churches/:id/admin',
    canActivate: [authGuard, churchAdminGuard],
    loadComponent: () =>
      import('./features/churches/church-admin/church-admin.component').then(m => m.ChurchAdminComponent),
  },
];
