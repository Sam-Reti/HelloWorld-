import { Component } from '@angular/core';

import { RouterLink } from '@angular/router';
import { BackgroundImage } from '../background-image/background-image';
import { ExternalNav } from '../external-nav/external-nav';

@Component({
  selector: 'app-home',
  imports: [RouterLink, BackgroundImage, ExternalNav],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class HomeComponent {}
