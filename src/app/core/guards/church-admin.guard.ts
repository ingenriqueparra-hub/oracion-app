import { inject } from '@angular/core';
import { CanActivateFn, Router, ActivatedRouteSnapshot } from '@angular/router';
import { SupabaseService } from '../services/supabase.service';

export const churchAdminGuard: CanActivateFn = async (route: ActivatedRouteSnapshot) => {
  const supabase = inject(SupabaseService);
  const router = inject(Router);

  const { data: { session } } = await supabase.client.auth.getSession();
  if (!session) return router.createUrlTree(['/login']);

  const churchId = route.paramMap.get('id');
  const { data: profile } = await supabase.client
    .from('profiles')
    .select('role, church_id')
    .eq('id', session.user.id)
    .single();

  const isAdmin = profile?.role === 'super_admin' ||
    (profile?.role === 'church_admin' && profile?.church_id === churchId);

  if (isAdmin) return true;
  return router.createUrlTree(['/churches', churchId]);
};
