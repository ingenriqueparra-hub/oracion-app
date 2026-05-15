import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { SupabaseService } from '../services/supabase.service';

export const guestGuard: CanActivateFn = async () => {
  const supabase = inject(SupabaseService);
  const router = inject(Router);
  const { data: { session } } = await supabase.client.auth.getSession();
  if (!session) return true;
  return router.createUrlTree(['/profile']);
};
