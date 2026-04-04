export type CircleVisibility = 'public' | 'private';
export type CircleMemberRole = 'admin' | 'member';
export type CircleMemberStatus = 'active' | 'pending' | 'invited';
export type CircleSessionStatus = 'active' | 'ended';

export interface Circle {
  id?: string;
  name: string;
  description: string;
  visibility: CircleVisibility;
  bannerUrl: string | null;
  creatorId: string;
  creatorName: string;
  creatorAvatarColor: string | null;
  memberCount: number;
  createdAt: any;
}

export interface CircleMember {
  uid: string;
  displayName: string;
  avatarColor: string | null;
  role: CircleMemberRole;
  status: CircleMemberStatus;
  joinedAt: any;
}

export interface CircleSession {
  id?: string;
  circleId: string;
  circleName: string;
  roomName: string;
  startedBy: string;
  startedByName: string;
  status: CircleSessionStatus;
  participantCount: number;
  startedAt: any;
}

export interface CircleInvite {
  circleId: string;
  circleName: string;
  invitedBy: string;
  invitedByName: string;
  invitedUid: string;
}

export interface CirclePost {
  id?: string;
  text: string;
  authorId: string;
  authorName: string | null;
  authorDisplayName: string | null;
  authorAvatarColor: string | null;
  createdAt: any;
  likeCount: number;
  commentCount: number;
  imageUrl?: string | null;
  mentionedUids?: string[];
}

export interface CircleComment {
  id?: string;
  text: string;
  authorId: string;
  authorName: string | null;
  authorAvatarColor: string | null;
  createdAt: any;
  mentionedUids?: string[];
}
