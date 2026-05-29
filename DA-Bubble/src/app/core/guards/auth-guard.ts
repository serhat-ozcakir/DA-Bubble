import { CanActivateFn, Router } from '@angular/router';
import { Supabase } from '../supabase/supabase.service';
import { inject } from '@angular/core';

export const authGuard: CanActivateFn = async () => {
  const supabase = inject(Supabase);
  const router = inject(Router);

  const {data} = await supabase.supabase.auth.getSession();

  if (!data.session) {
    router.navigate(['/login']);
    return false;
  }

  return true;
};
