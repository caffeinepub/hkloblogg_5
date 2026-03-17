import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface Category {
    id: string;
    name: string;
    createdAt: Time;
    createdBy: Principal;
}
export interface SearchResult {
    comments: Array<Comment>;
    posts: Array<Post>;
}
export interface MediaFile {
    id: bigint;
    commentId?: bigint;
    ownerId: Principal;
    blobKey: string;
    fileName: string;
    fileSize: bigint;
    fileType: string;
    uploadedAt: bigint;
    postId?: bigint;
}
export type Time = bigint;
export interface Comment {
    id: string;
    likeCount: bigint;
    body: string;
    createdAt: Time;
    parentId?: string;
    authorPrincipal: Principal;
    postId: string;
}
export interface UserWithPrincipal {
    principal: Principal;
    profile: UserProfile;
}
export interface Post {
    id: string;
    categoryId: string;
    title: string;
    likeCount: bigint;
    body: string;
    createdAt: Time;
    updatedAt: Time;
    pinned: boolean;
    authorPrincipal: Principal;
}
export interface UserProfile {
    alias: string;
    blocked: boolean;
    role: UserRole;
    registeredAt: Time;
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export type NotificationEvent = "NewComment" | "NewReply" | "NewMedia";
export interface Notification {
    id: bigint;
    recipientPrincipal: Principal;
    postId: string;
    triggerPrincipal: Principal;
    event: NotificationEvent;
    createdAt: Time;
    read: boolean;
}
export interface backendInterface {
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    blockUser(user: Principal): Promise<void>;
    createCategory(name: string): Promise<void>;
    createComment(postId: string, body: string, parentId: string | null): Promise<void>;
    createPost(title: string, body: string, categoryId: string): Promise<void>;
    deleteCategory(id: string): Promise<void>;
    toggleCategoryHidden(id: string, hidden: boolean): Promise<void>;
    getHiddenCategoryIds(): Promise<Array<string>>;
    addUserToCategoryAllowedList(categoryId: string, user: Principal): Promise<void>;
    removeUserFromCategoryAllowedList(categoryId: string, user: Principal): Promise<void>;
    getCategoryAllowedUsers(categoryId: string): Promise<Array<Principal>>;
    deleteComment(commentId: string): Promise<void>;
    deleteMedia(mediaId: bigint): Promise<void>;
    deleteMyAccount(): Promise<void>;
    deletePost(postId: string): Promise<void>;
    deleteUser(user: Principal): Promise<void>;
    editComment(commentId: string, body: string): Promise<void>;
    editPost(postId: string, title: string, body: string, categoryId: string): Promise<void>;
    getAllMedia(): Promise<Array<MediaFile>>;
    getCallerUserRole(): Promise<UserRole>;
    getMediaForComment(commentId: bigint): Promise<Array<MediaFile>>;
    getMediaForPost(postId: bigint): Promise<Array<MediaFile>>;
    getMyLikedComments(): Promise<Array<string>>;
    getMyLikedPosts(): Promise<Array<string>>;
    getMyProfile(): Promise<UserProfile | null>;
    getPost(postId: string): Promise<Post | null>;
    getUser(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    likeComment(commentId: string): Promise<void>;
    likePost(postId: string): Promise<void>;
    listCategories(): Promise<Array<Category>>;
    listComments(postId: string): Promise<Array<Comment>>;
    listPosts(categoryId: string | null): Promise<Array<Post>>;
    listPostsByAuthor(alias: string): Promise<Array<Post>>;
    listUsers(): Promise<Array<UserProfile>>;
    listUsersWithPrincipal(): Promise<Array<UserWithPrincipal>>;
    pinPost(postId: string, pinned: boolean): Promise<void>;
    register(alias: string): Promise<void>;
    search(searchQuery: string): Promise<SearchResult>;
    setRole(user: Principal, role: UserRole): Promise<void>;
    unblockUser(user: Principal): Promise<void>;
    uploadMedia(postId: bigint | null, commentId: bigint | null, fileType: string, fileName: string, fileSize: bigint, blobKey: string): Promise<bigint>;
    followUser(userToFollow: Principal): Promise<void>;
    unfollowUser(userToUnfollow: Principal): Promise<void>;
    followPost(postId: string): Promise<void>;
    unfollowPost(postId: string): Promise<void>;
    getFollowedUsers(): Promise<Array<Principal>>;
    getFollowedUsersPosts(): Promise<Array<Post>>;
    getFollowedPosts(): Promise<Array<string>>;
    isFollowingUser(userToCheck: Principal): Promise<boolean>;
    isFollowingPost(postId: string): Promise<boolean>;
    getPostFollowerCount(postId: string): Promise<bigint>;
    getMyNotifications(): Promise<Array<Notification>>;
    getUnreadNotificationCount(): Promise<bigint>;
    markNotificationRead(notifId: bigint): Promise<void>;
    markAllNotificationsRead(): Promise<void>;
    deleteNotification(notifId: bigint): Promise<void>;
}
