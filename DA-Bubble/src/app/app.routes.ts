import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth-guard';
import { Impressum } from './features/legal/impressum/impressum';
import { Datenschutz } from './features/legal/datenschutz/datenschutz';
import { AuthCallback } from './features/auth/auth-callback/auth-callback';

export const routes: Routes = [
    {
        path: 'auth/callback',
        component: AuthCallback
    },
    {
        path: 'impressum',
        loadComponent: () =>
            import('./features/legal/impressum/impressum').then(m => m.Impressum)
    },
    {
        path: 'datenschutz',
        loadComponent:()=>
            import('./features/legal/datenschutz/datenschutz').then(m=>m.Datenschutz)
    },

    {
        path: '',
        loadChildren: () => import('./features/auth/auth.routes').then(m => m.Auth_Routes)
    },
    {
        path: 'workspace',
        loadChildren: () => import('./features/workspace/workspace.routes').then(m => m.Workspace_Routes),
        canActivate: [authGuard]
    }
];
