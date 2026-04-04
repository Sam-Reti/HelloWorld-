import { Component, inject, input, output } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { AsyncPipe } from '@angular/common';
import { Observable, combineLatest, switchMap, map } from 'rxjs';

import { FollowService, PublicUser } from '../../services/follow.service';
import { CircleService } from '../../services/circle.service';
import { CircleMember } from '../circle.models';

@Component({
  selector: 'app-invite-modal',
  standalone: true,
  imports: [AsyncPipe],
  templateUrl: './invite-modal.html',
  styleUrl: './invite-modal.css',
})
export class InviteModalComponent {
  private followService = inject(FollowService);
  private circleService = inject(CircleService);

  circleId = input.required<string>();
  close = output<void>();

  private circleId$ = toObservable(this.circleId);

  private members$: Observable<CircleMember[]> = this.circleId$.pipe(
    switchMap((id) => this.circleService.getMembers$(id)),
  );

  /** Users the current user follows, minus those already in the circle. */
  invitableUsers$: Observable<PublicUser[]> = combineLatest([
    combineLatest([
      this.followService.getFollowingIds$(),
      this.followService.getAllUsers$(),
    ]).pipe(map(([ids, users]) => users.filter((u) => ids.includes(u.uid)))),
    this.members$,
  ]).pipe(
    map(([following, members]) => {
      const memberUids = new Set(members.map((m) => m.uid));
      return following.filter((u) => !memberUids.has(u.uid));
    }),
  );

  invitedSet = new Set<string>();

  getInitials(name: string): string {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }

  async invite(user: PublicUser): Promise<void> {
    this.invitedSet.add(user.uid);
    await this.circleService.inviteMember(this.circleId(), user.uid);
  }

  onBackdropClick(): void {
    this.close.emit();
  }
}
