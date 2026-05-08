import { Routes } from "@angular/router";
import { Intro } from "./intro/intro";
import { Login } from "./login/login";
import { SignUp } from "./sign-up/sign-up";
import { ForgotPassword } from "./forgot-password/forgot-password";
import { ResetPassword } from "./reset-password/reset-password";
import { ChooseAvatar } from "./choose-avatar/choose-avatar";

export const Auth_Routes: Routes = [
    {
       path:'',
       component:Intro
    },
    {
       path:'login',
       component:Login
    },
    {
       path:'sign-up',
       component:SignUp
    },
    {
       path:'forgot-password',
       component:ForgotPassword
    },
    {
       path:'reset-password',
       component:ResetPassword
    },
    {
       path:'choose-avatar',
       component:ChooseAvatar
    },
]