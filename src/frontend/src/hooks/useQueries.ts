import type { Principal } from "@icp-sdk/core/principal";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  Category,
  Comment,
  backendInterface as FullBackend,
  Post,
  SearchResult,
  UserProfile,
  UserRole,
  UserWithPrincipal,
} from "../backend.d";
import { useActor } from "./useActor";

// Cast helper: the auto-generated backend.ts may lag behind backend.d.ts
// during phase transitions. This cast lets us call Phase-3 methods safely.
function fullActor(actor: unknown): FullBackend {
  return actor as FullBackend;
}

export function useMyProfile() {
  const { actor, isFetching } = useActor();
  return useQuery<UserProfile | null>({
    queryKey: ["myProfile"],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getMyProfile();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useIsAdmin() {
  const { actor, isFetching } = useActor();
  return useQuery<boolean>({
    queryKey: ["isAdmin"],
    queryFn: async () => {
      if (!actor) return false;
      return actor.isCallerAdmin();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useIsModerator() {
  const { actor, isFetching } = useActor();
  return useQuery<boolean>({
    queryKey: ["isModerator"],
    queryFn: async () => {
      if (!actor) return false;
      return fullActor(actor).isCallerModerator();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useListModerators() {
  const { actor, isFetching } = useActor();
  return useQuery<Array<Principal>>({
    queryKey: ["moderators"],
    queryFn: async () => {
      if (!actor) return [];
      return fullActor(actor).listModerators();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAssignModerator() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (principal: Principal) => {
      if (!actor) throw new Error("Inte inloggad");
      return fullActor(actor).assignModerator(principal);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["moderators"] });
    },
  });
}

export function useRevokeModerator() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (principal: Principal) => {
      if (!actor) throw new Error("Inte inloggad");
      return fullActor(actor).revokeModerator(principal);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["moderators"] });
    },
  });
}

export function useListUsers() {
  const { actor, isFetching } = useActor();
  return useQuery<UserProfile[]>({
    queryKey: ["users"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listUsers();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useListUsersWithPrincipal() {
  const { actor, isFetching } = useActor();
  return useQuery<UserWithPrincipal[]>({
    queryKey: ["users"],
    queryFn: async () => {
      if (!actor) return [];
      return fullActor(actor).listUsersWithPrincipal();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useDeleteUser() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (principal: Principal) => {
      if (!actor) throw new Error("Inte inloggad");
      return fullActor(actor).deleteUser(principal);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
  });
}

export function useDeleteMyAccount() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("Inte inloggad");
      return fullActor(actor).deleteMyAccount();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myProfile"] });
    },
  });
}

export function useListCategories() {
  const { actor, isFetching } = useActor();
  return useQuery<Category[]>({
    queryKey: ["categories"],
    queryFn: async () => {
      if (!actor) return [];
      return fullActor(actor).listCategories();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetHiddenCategoryIds() {
  const { actor, isFetching } = useActor();
  return useQuery<string[]>({
    queryKey: ["hiddenCategoryIds"],
    queryFn: async () => {
      if (!actor) return [];
      return fullActor(actor).getHiddenCategoryIds();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useToggleCategoryHidden() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, hidden }: { id: string; hidden: boolean }) => {
      if (!actor) throw new Error("Inte inloggad");
      return fullActor(actor).toggleCategoryHidden(id, hidden);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      queryClient.invalidateQueries({ queryKey: ["hiddenCategoryIds"] });
    },
  });
}

export function useListPosts(categoryId: string | null) {
  const { actor, isFetching } = useActor();
  return useQuery<Post[]>({
    queryKey: ["posts", categoryId],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listPosts(categoryId);
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetPost(postId: string | null) {
  const { actor, isFetching } = useActor();
  return useQuery<Post | null>({
    queryKey: ["post", postId],
    queryFn: async () => {
      if (!actor || !postId) return null;
      return actor.getPost(postId);
    },
    enabled: !!actor && !isFetching && !!postId,
  });
}

export function useMyLikedPosts() {
  const { actor, isFetching } = useActor();
  return useQuery<string[]>({
    queryKey: ["myLikedPosts"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getMyLikedPosts();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetUser(principal: Principal | null) {
  const { actor, isFetching } = useActor();
  const principalStr = principal ? principal.toString() : null;
  return useQuery<UserProfile | null>({
    queryKey: ["user", principalStr],
    queryFn: async () => {
      if (!actor || !principal) return null;
      return actor.getUser(principal);
    },
    enabled: !!actor && !isFetching && !!principal,
    staleTime: 1000 * 60 * 5,
  });
}

export function useListComments(postId: string | null) {
  const { actor, isFetching } = useActor();
  return useQuery<Comment[]>({
    queryKey: ["comments", postId],
    queryFn: async () => {
      if (!actor || !postId) return [];
      return fullActor(actor).listComments(postId);
    },
    enabled: !!actor && !isFetching && !!postId,
  });
}

export function useMyLikedComments() {
  const { actor, isFetching } = useActor();
  return useQuery<string[]>({
    queryKey: ["myLikedComments"],
    queryFn: async () => {
      if (!actor) return [];
      return fullActor(actor).getMyLikedComments();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useSearch(query: string) {
  const { actor, isFetching } = useActor();
  return useQuery<SearchResult>({
    queryKey: ["search", query],
    queryFn: async () => {
      if (!actor || !query.trim()) return { posts: [], comments: [] };
      return fullActor(actor).search(query);
    },
    enabled: !!actor && !isFetching && !!query.trim(),
  });
}

export function useRegister() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (alias: string) => {
      if (!actor) throw new Error("Inte inloggad");
      return actor.register(alias);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myProfile"] });
    },
  });
}

export function useCreateCategory() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (name: string) => {
      if (!actor) throw new Error("Inte inloggad");
      return actor.createCategory(name);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
  });
}

export function useDeleteCategory() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      if (!actor) throw new Error("Inte inloggad");
      return actor.deleteCategory(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      queryClient.invalidateQueries({ queryKey: ["hiddenCategoryIds"] });
    },
  });
}

export function useCreatePost() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      title,
      body,
      categoryId,
    }: {
      title: string;
      body: string;
      categoryId: string;
    }) => {
      if (!actor) throw new Error("Inte inloggad");
      return actor.createPost(title, body, categoryId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
  });
}

export function useEditPost() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      postId,
      title,
      body,
      categoryId,
    }: {
      postId: string;
      title: string;
      body: string;
      categoryId: string;
    }) => {
      if (!actor) throw new Error("Inte inloggad");
      return actor.editPost(postId, title, body, categoryId);
    },
    onSuccess: (_data, { postId }) => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      queryClient.invalidateQueries({ queryKey: ["post", postId] });
    },
  });
}

export function useDeletePost() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (postId: string) => {
      if (!actor) throw new Error("Inte inloggad");
      return actor.deletePost(postId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
  });
}

export function usePinPost() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      postId,
      pinned,
    }: {
      postId: string;
      pinned: boolean;
    }) => {
      if (!actor) throw new Error("Inte inloggad");
      return actor.pinPost(postId, pinned);
    },
    onSuccess: (_data, { postId }) => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      queryClient.invalidateQueries({ queryKey: ["post", postId] });
    },
  });
}

export function useLikePost() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (postId: string) => {
      if (!actor) throw new Error("Inte inloggad");
      return actor.likePost(postId);
    },
    onSuccess: (_data, postId) => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      queryClient.invalidateQueries({ queryKey: ["post", postId] });
      queryClient.invalidateQueries({ queryKey: ["myLikedPosts"] });
    },
  });
}

export function useCreateComment() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      postId,
      body,
      parentId,
    }: {
      postId: string;
      body: string;
      parentId: string | null;
    }) => {
      if (!actor) throw new Error("Inte inloggad");
      return fullActor(actor).createComment(postId, body, parentId);
    },
    onSuccess: (_data, { postId }) => {
      queryClient.invalidateQueries({ queryKey: ["comments", postId] });
    },
  });
}

export function useEditComment() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      commentId,
      body,
      postId: _postId,
    }: {
      commentId: string;
      body: string;
      postId: string;
    }) => {
      if (!actor) throw new Error("Inte inloggad");
      return fullActor(actor).editComment(commentId, body);
    },
    onSuccess: (_data, { postId }) => {
      queryClient.invalidateQueries({ queryKey: ["comments", postId] });
    },
  });
}

export function useDeleteComment() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      commentId,
      postId: _postId,
    }: {
      commentId: string;
      postId: string;
    }) => {
      if (!actor) throw new Error("Inte inloggad");
      return fullActor(actor).deleteComment(commentId);
    },
    onSuccess: (_data, { postId }) => {
      queryClient.invalidateQueries({ queryKey: ["comments", postId] });
    },
  });
}

export function useLikeComment() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      commentId,
      postId: _postId,
    }: {
      commentId: string;
      postId: string;
    }) => {
      if (!actor) throw new Error("Inte inloggad");
      return fullActor(actor).likeComment(commentId);
    },
    onSuccess: (_data, { postId }) => {
      queryClient.invalidateQueries({ queryKey: ["comments", postId] });
      queryClient.invalidateQueries({ queryKey: ["myLikedComments"] });
    },
  });
}

export function useBlockUser() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (principal: Principal) => {
      if (!actor) throw new Error("Inte inloggad");
      return actor.blockUser(principal);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
}

export function useUnblockUser() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (principal: Principal) => {
      if (!actor) throw new Error("Inte inloggad");
      return actor.unblockUser(principal);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
}

export function useSetRole() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      principal,
      role,
    }: {
      principal: Principal;
      role: UserRole;
    }) => {
      if (!actor) throw new Error("Inte inloggad");
      return actor.setRole(principal, role);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
}

export function useGetCategoryAllowedUsers(categoryId: string | null) {
  const { actor, isFetching } = useActor();
  return useQuery<Principal[]>({
    queryKey: ["categoryAllowedUsers", categoryId],
    queryFn: async () => {
      if (!actor || !categoryId) return [];
      return fullActor(actor).getCategoryAllowedUsers(categoryId);
    },
    enabled: !!actor && !isFetching && !!categoryId,
  });
}

export function useAddUserToCategoryAllowedList() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      categoryId,
      user,
    }: { categoryId: string; user: Principal }) => {
      if (!actor) throw new Error("Inte inloggad");
      return fullActor(actor).addUserToCategoryAllowedList(categoryId, user);
    },
    onSuccess: (_data, { categoryId }) => {
      queryClient.invalidateQueries({
        queryKey: ["categoryAllowedUsers", categoryId],
      });
    },
  });
}

export function useRemoveUserFromCategoryAllowedList() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      categoryId,
      user,
    }: { categoryId: string; user: Principal }) => {
      if (!actor) throw new Error("Inte inloggad");
      return fullActor(actor).removeUserFromCategoryAllowedList(
        categoryId,
        user,
      );
    },
    onSuccess: (_data, { categoryId }) => {
      queryClient.invalidateQueries({
        queryKey: ["categoryAllowedUsers", categoryId],
      });
    },
  });
}

// ── Follow / Unfollow hooks ──────────────────────────────────────────────────

export function useFollowPost() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (postId: string) => {
      if (!actor) throw new Error("Inte inloggad");
      return fullActor(actor).followPost(postId);
    },
    onSuccess: (_data, postId) => {
      queryClient.invalidateQueries({ queryKey: ["isFollowingPost", postId] });
      queryClient.invalidateQueries({ queryKey: ["followedPosts"] });
      queryClient.invalidateQueries({
        queryKey: ["postFollowerCount", postId],
      });
    },
  });
}

export function useUnfollowPost() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (postId: string) => {
      if (!actor) throw new Error("Inte inloggad");
      return fullActor(actor).unfollowPost(postId);
    },
    onSuccess: (_data, postId) => {
      queryClient.invalidateQueries({ queryKey: ["isFollowingPost", postId] });
      queryClient.invalidateQueries({ queryKey: ["followedPosts"] });
      queryClient.invalidateQueries({
        queryKey: ["postFollowerCount", postId],
      });
    },
  });
}

export function useIsFollowingPost(postId: string | null) {
  const { actor, isFetching } = useActor();
  return useQuery<boolean>({
    queryKey: ["isFollowingPost", postId],
    queryFn: async () => {
      if (!actor || !postId) return false;
      return fullActor(actor).isFollowingPost(postId);
    },
    enabled: !!actor && !isFetching && !!postId,
  });
}

export function useGetPostFollowerCount(postId: string | null) {
  const { actor, isFetching } = useActor();
  return useQuery<bigint>({
    queryKey: ["postFollowerCount", postId],
    queryFn: async () => {
      if (!actor || !postId) return BigInt(0);
      return fullActor(actor).getPostFollowerCount(postId);
    },
    enabled: !!actor && !isFetching && !!postId,
  });
}

export function useFollowUser() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (
      principal: import("@icp-sdk/core/principal").Principal,
    ) => {
      if (!actor) throw new Error("Inte inloggad");
      return fullActor(actor).followUser(principal);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["followedUsers"] });
      queryClient.invalidateQueries({ queryKey: ["followedUsersPosts"] });
    },
  });
}

export function useUnfollowUser() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (
      principal: import("@icp-sdk/core/principal").Principal,
    ) => {
      if (!actor) throw new Error("Inte inloggad");
      return fullActor(actor).unfollowUser(principal);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["followedUsers"] });
      queryClient.invalidateQueries({ queryKey: ["followedUsersPosts"] });
    },
  });
}

export function useGetFollowedUsersPosts() {
  const { actor, isFetching } = useActor();
  return useQuery<Post[]>({
    queryKey: ["followedUsersPosts"],
    queryFn: async () => {
      if (!actor) return [];
      return fullActor(actor).getFollowedUsersPosts();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetFollowedPosts() {
  const { actor, isFetching } = useActor();
  return useQuery<string[]>({
    queryKey: ["followedPosts"],
    queryFn: async () => {
      if (!actor) return [];
      return fullActor(actor).getFollowedPosts();
    },
    enabled: !!actor && !isFetching,
  });
}

// ── Notification hooks ───────────────────────────────────────────────────────

export function useGetMyNotifications() {
  const { actor, isFetching } = useActor();
  return useQuery<import("../backend.d").Notification[]>({
    queryKey: ["notifications"],
    queryFn: async () => {
      if (!actor) return [];
      return fullActor(actor).getMyNotifications();
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 30_000,
  });
}

export function useGetUnreadNotificationCount() {
  const { actor, isFetching } = useActor();
  return useQuery<bigint>({
    queryKey: ["unreadCount"],
    queryFn: async () => {
      if (!actor) return BigInt(0);
      return fullActor(actor).getUnreadNotificationCount();
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 30_000,
  });
}

export function useMarkNotificationRead() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("Inte inloggad");
      return fullActor(actor).markNotificationRead(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["unreadCount"] });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("Inte inloggad");
      return fullActor(actor).markAllNotificationsRead();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["unreadCount"] });
    },
  });
}

export function useDeleteNotification() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("Inte inloggad");
      return fullActor(actor).deleteNotification(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["unreadCount"] });
    },
  });
}

export function useGetCategorySchedule(categoryId: string | null) {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["categorySchedule", categoryId],
    queryFn: async () => {
      if (!actor || !categoryId) return null;
      return fullActor(actor).getCategorySchedule(categoryId);
    },
    enabled: !!actor && !isFetching && !!categoryId,
  });
}

export function useSetCategorySchedule() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      categoryId,
      enabled,
      weekday,
      hour,
    }: {
      categoryId: string;
      enabled: boolean;
      weekday: number;
      hour: number;
    }) => {
      if (!actor) throw new Error("Inte inloggad");
      return fullActor(actor).setCategorySchedule(
        categoryId,
        enabled,
        BigInt(weekday),
        BigInt(hour),
      );
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["categorySchedule", variables.categoryId],
      });
    },
  });
}

export function useListCleanupLogs(categoryId: string | null) {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["cleanupLogs", categoryId],
    queryFn: async () => {
      if (!actor) return [];
      return fullActor(actor).listCleanupLogs(categoryId);
    },
    enabled: !!actor && !isFetching,
  });
}

export function useRecordPostHash() {
  const { actor } = useActor();
  return useMutation({
    mutationFn: async ({ postId, hash }: { postId: string; hash: string }) => {
      if (!actor) throw new Error("Inte inloggad");
      return fullActor(actor).recordPostHash(postId, hash);
    },
  });
}

export function useGetPostHashHistory(postId: string | null) {
  const { actor, isFetching } = useActor();
  return useQuery<Array<[string, bigint]>>({
    queryKey: ["postHashHistory", postId],
    queryFn: async () => {
      if (!actor || !postId) return [];
      return fullActor(actor).getPostHashHistory(postId);
    },
    enabled: !!actor && !isFetching && !!postId,
  });
}
