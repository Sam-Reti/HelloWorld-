import { Component, inject } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Observable, combineLatest, map } from 'rxjs';

import { CircleService } from '../../services/circle.service';
import { Circle } from '../circle.models';

@Component({
  selector: 'app-circles-list',
  standalone: true,
  imports: [AsyncPipe, RouterLink, FormsModule],
  templateUrl: './circles-list.html',
  styleUrl: './circles-list.css',
})
export class CirclesListComponent {
  private circleService = inject(CircleService);

  searchTerm = '';

  myCircles$: Observable<Circle[]> = this.circleService.getMyCircles$();
  invitedCircles$: Observable<Circle[]> = this.circleService.getMyInvitedCircles$();
  publicCircles$: Observable<Circle[]> = this.circleService.getPublicCircles$();

  filteredPublic$: Observable<Circle[]> = combineLatest([
    this.publicCircles$,
    this.myCircles$,
    this.invitedCircles$,
  ]).pipe(
    map(([pub, mine, invited]) => {
      const excludeIds = new Set([...mine, ...invited].map((c) => c.id));
      return pub.filter((c) => !excludeIds.has(c.id));
    }),
  );

  getInitials(name: string): string {
    if (!name) return 'C';
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }

  filterCircles(circles: Circle[]): Circle[] {
    if (!this.searchTerm.trim()) return circles;
    const term = this.searchTerm.toLowerCase();
    return circles.filter(
      (c) =>
        c.name.toLowerCase().includes(term) || c.description.toLowerCase().includes(term),
    );
  }
}
