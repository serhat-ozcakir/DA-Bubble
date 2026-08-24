import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-intro',
  imports: [],
  templateUrl: './intro.html',
  styleUrl: './intro.scss',
})
export class Intro implements OnInit {
  constructor(private router: Router) {}

  ngOnInit(): void {
    const isMobile = window.matchMedia('(max-width:1024px)').matches;
    const introDuration = isMobile ? 1500 : 3000;

    setTimeout(() => {
      this.router.navigate(['login']);
    }, introDuration);
  }
}
