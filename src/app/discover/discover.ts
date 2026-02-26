import { Component, inject } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Auth } from '@angular/fire/auth';
import { FollowService } from '../services/follow.service';

@Component({
  selector: 'app-discover',
  standalone: true,
  imports: [AsyncPipe, RouterLink],
  templateUrl: './discover.html',
  styleUrl: './discover.css',
})
export class Discover {
  private followService = inject(FollowService);
  private auth = inject(Auth);

  users$ = this.followService.getAllUsers$();
  followingIds$ = this.followService.getFollowingIds$();
  currentUid = this.auth.currentUser?.uid ?? null;

  getInitials(value: string | null | undefined): string {
    if (!value) return 'U';
    const parts = value.trim().split(' ');
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }

  async toggle(targetUid: string, isFollowing: boolean): Promise<void> {
    try {
      if (isFollowing) {
        await this.followService.unfollow(targetUid);
      } else {
        await this.followService.follow(targetUid);
      }
    } catch (e) {
      console.error('follow/unfollow failed', e);
    }
  }
}
