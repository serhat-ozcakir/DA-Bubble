import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth-guard';

export const routes: Routes = [
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
