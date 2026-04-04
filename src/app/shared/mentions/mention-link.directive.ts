import { Directive, HostListener, inject } from '@angular/core';
import { Router } from '@angular/router';

@Directive({ selector: '[appMentionLink]', standalone: true })
export class MentionLinkDirective {
  private router = inject(Router);

  @HostListener('click', ['$event'])
  onClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    const anchor = target.closest('a.mention') as HTMLAnchorElement | null;
    if (!anchor) return;

    event.preventDefault();
    const href = anchor.getAttribute('href');
    if (href) this.router.navigateByUrl(href);
  }
}
