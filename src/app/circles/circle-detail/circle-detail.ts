import { Component, inject, signal, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AsyncPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable, switchMap, combineLatest, map, of } from 'rxjs';

import { CircleService } from '../../services/circle.service';
import { CircleSessionService } from '../../services/circle-session.service';
import { Circle, CircleMember, CircleSession } from '../circle.models';
import { InviteModalComponent } from '../invite-modal/invite-modal';
import { CircleFeedComponent } from '../circle-feed/circle-feed';
import { CircleChatComponent } from '../circle-chat/circle-chat';

@Component({
  selector: 'app-circle-detail',
  standalone: true,
  imports: [AsyncPipe, FormsModule, InviteModalComponent, CircleFeedComponent, CircleChatComponent],
  templateUrl: './circle-detail.html',
  styleUrl: './circle-detail.css',
})
export class CircleDetailComponent {
  private route = inject(ActivatedRoute);
  private circleService = inject(CircleService);
  private sessionService = inject(CircleSessionService);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);

  showInviteModal = signal(false);
  activeTab = signal<'feed' | 'members' | 'chat'>('feed');

  editing = signal(false);
  editName = '';
  editDescription = '';
  editBannerPreview = signal<string | null>(null);
  editBannerFile = signal<File | null>(null);

  private circleId$ = this.route.paramMap.pipe(map((p) => p.get('circleId')!));

  circle$: Observable<Circle | undefined> = this.circleId$.pipe(
    switchMap((id) => this.circleService.getCircle$(id)),
  );

  members$: Observable<CircleMember[]> = this.circleId$.pipe(
    switchMap((id) => this.circleService.getMembers$(id)),
  );

  activeMembers$: Observable<CircleMember[]> = this.members$.pipe(
    map((m) => m.filter((x) => x.status === 'active')),
  );

  pendingMembers$: Observable<CircleMember[]> = this.members$.pipe(
    map((m) => m.filter((x) => x.status === 'pending')),
  );

  myMembership$: Observable<CircleMember | null> = this.circleId$.pipe(
    switchMap((id) => this.circleService.getMyMembership$(id)),
  );

  activeSessions$: Observable<CircleSession[]> = this.circleId$.pipe(
    switchMap((id) => this.sessionService.getActiveSessionsForCircle$(id)),
  );

  isAdmin$: Observable<boolean> = this.myMembership$.pipe(
    map((m) => m?.role === 'admin' && m?.status === 'active'),
  );

  isMember$: Observable<boolean> = this.myMembership$.pipe(
    map((m) => m?.status === 'active'),
  );

  constructor() {
    this.isMember$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((isMember) => {
      if (!isMember) this.activeTab.set('members');
    });
  }

  getInitials(name: string): string {
    if (!name) return 'C';
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }

  async joinCircle(circleId: string): Promise<void> {
    await this.circleService.joinCircle(circleId);
  }

  async acceptInvite(circleId: string): Promise<void> {
    await this.circleService.acceptInvite(circleId);
  }

  async leaveCircle(circleId: string): Promise<void> {
    await this.circleService.leaveCircle(circleId);
  }

  async approveMember(circleId: string, uid: string): Promise<void> {
    await this.circleService.approveMember(circleId, uid);
  }

  async rejectMember(circleId: string, uid: string): Promise<void> {
    await this.circleService.rejectMember(circleId, uid);
  }

  async startSession(circle: Circle): Promise<void> {
    await this.sessionService.startSession(circle.id!, circle.name);
  }

  async joinSession(session: CircleSession): Promise<void> {
    await this.sessionService.joinSession(session);
  }

  startEditCircle(circle: Circle): void {
    this.editName = circle.name;
    this.editDescription = circle.description ?? '';
    this.editBannerPreview.set(circle.bannerUrl);
    this.editBannerFile.set(null);
    this.editing.set(true);
  }

  cancelEditCircle(): void {
    this.editing.set(false);
    this.editName = '';
    this.editDescription = '';
    this.editBannerPreview.set(null);
    this.editBannerFile.set(null);
  }

  async saveEditCircle(circleId: string): Promise<void> {
    if (!this.editName.trim()) return;
    await this.circleService.updateCircle(circleId, this.editName, this.editDescription, this.editBannerFile());
    this.editing.set(false);
  }

  async deleteCircle(circleId: string): Promise<void> {
    if (!confirm('Are you sure you want to delete this circle? This cannot be undone.')) return;
    await this.circleService.deleteCircle(circleId);
    this.router.navigate(['/circles']);
  }

  async enableChat(circleId: string): Promise<void> {
    await this.circleService.enableChat(circleId);
  }

  onBannerSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    this.editBannerFile.set(file);
    const reader = new FileReader();
    reader.onload = () => this.editBannerPreview.set(reader.result as string);
    reader.readAsDataURL(file);
  }
}
