import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth-guard';
import { Impressum } from './features/legal/impressum/impressum';
import { Datenschutz } from './features/legal/datenschutz/datenschutz';
import { AuthCallback } from './features/auth/auth-callback/auth-callback';

export const routes: Routes = [
    {
        path:'auth/callback',
        component: AuthCallback
    },
    {
        path:'impressum',
        component: Impressum
    },
    {
        path:'datenschutz',
        component: Datenschutz
    },

    {
        path:'',
        loadChildren:()=> import('./features/auth/auth.routes').then(m=>m.Auth_Routes)
    },
    {
        path:'workspace',
        loadChildren:()=> import('./features/workspace/workspace.routes').then(m=>m.Workspace_Routes),
        canActivate: [authGuard]
    }
];
