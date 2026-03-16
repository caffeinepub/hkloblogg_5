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
export type Time = bigint;
export interface UserProfile {
    alias: string;
    blocked: boolean;
    role: UserRole;
    registeredAt: Time;
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
export interface Comment {
    id: string;
    postId: string;
    parentId: string | null;
    body: string;
    authorPrincipal: Principal;
    createdAt: Time;
    likeCount: bigint;
}
export interface SearchResult {
    posts: Array<Post>;
    comments: Array<Comment>;
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    blockUser(user: Principal): Promise<void>;
    createCategory(name: string): Promise<void>;
    createComment(postId: string, body: string, parentId: string | null): Promise<void>;
    createPost(title: string, body: string, categoryId: string): Promise<void>;
    deleteCategory(id: string): Promise<void>;
    deleteComment(commentId: string): Promise<void>;
    deletePost(postId: string): Promise<void>;
    editComment(commentId: string, body: string): Promise<void>;
    editPost(postId: string, title: string, body: string, categoryId: string): Promise<void>;
    getCallerUserRole(): Promise<UserRole>;
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
    pinPost(postId: string, pinned: boolean): Promise<void>;
    register(alias: string): Promise<void>;
    search(searchQuery: string): Promise<SearchResult>;
    setRole(user: Principal, role: UserRole): Promise<void>;
    unblockUser(user: Principal): Promise<void>;
}
