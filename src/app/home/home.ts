import { Component } from '@angular/core';

import { RouterLink, RouterOutlet } from '@angular/router';
import { BackgroundImage } from '../background-image/background-image';
import { ExternalNav } from '../external-nav/external-nav';

@Component({
  selector: 'app-home',
  imports: [RouterLink, RouterOutlet, BackgroundImage, ExternalNav],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class HomeComponent {}
