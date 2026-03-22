import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  BookOpen,
  Clock,
  Eye,
  EyeOff,
  FileText,
  Images,
  Loader2,
  MessageCircle,
  Pin,
  PinOff,
  Plus,
  Search,
  Shield,
  Tag,
  Trash2,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import { UserRole } from "../backend.d";
import type {
  Category,
  Comment,
  MediaFile,
  Post,
  UserWithPrincipal,
} from "../backend.d";
import type { Comment as CommentType } from "../backend.d";
import AuthorName from "../components/AuthorName";
import { useActor } from "../hooks/useActor";
import {
  useAddUserToCategoryAllowedList,
  useAssignModerator,
  useBlockUser,
  useCreateCategory,
  useDeleteCategory,
  useDeleteComment,
  useDeletePost,
  useDeleteUser,
  useGetCategoryAllowedUsers,
  useGetCategorySchedule,
  useGetHiddenCategoryIds,
  useIsModerator as useIsCallerModerator,
  useListCategories,
  useListCleanupLogs,
  useListModerators,
  useListPosts,
  useListUsersWithPrincipal,
  usePinPost,
  useRemoveUserFromCategoryAllowedList,
  useRevokeModerator,
  useSetCategorySchedule,
  useSetRole,
  useToggleCategoryHidden,
  useUnblockUser,
} from "../hooks/useQueries";
import { useLang } from "../locales/LanguageContext";
import { translations } from "../locales/translations";

interface AdminPanelProps {
  onBack: () => void;
}

function formatFileSize(bytes: bigint): string {
  const n = Number(bytes);
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

function MediaRow({
  media,
  index,
  t,
}: { media: MediaFile; index: number; t: Record<string, string> }) {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!actor) return;
    setDeleting(true);
    try {
      await actor.deleteMedia(media.id);
      queryClient.invalidateQueries({ queryKey: ["allMedia"] });
      toast.success(t.deleted);
    } catch {
      toast.error(t.errorOccurred);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <TableRow data-ocid={`admin.media.item.${index}`}>
      <TableCell className="font-medium max-w-[160px] truncate">
        {media.fileName}
      </TableCell>
      <TableCell>
        <Badge variant="outline" className="text-xs">
          {media.fileType === "image" ? t.imageType : t.videoType}
        </Badge>
      </TableCell>
      <TableCell className="text-muted-foreground text-sm">
        {formatFileSize(media.fileSize)}
      </TableCell>
      <TableCell className="text-muted-foreground text-sm">
        {media.postId != null
          ? t.post
          : media.commentId != null
            ? t.comment
            : "-"}
      </TableCell>
      <TableCell className="text-muted-foreground text-sm">
        {new Date(Number(media.uploadedAt) / 1_000_000).toLocaleDateString(
          "sv-SE",
        )}
      </TableCell>
      <TableCell className="text-right">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              data-ocid={`admin.media.delete_button.${index}`}
              variant="ghost"
              size="sm"
              disabled={deleting}
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              {deleting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent data-ocid="admin.media.dialog">
            <AlertDialogHeader>
              <AlertDialogTitle>{t.mediaDeleteTitle}</AlertDialogTitle>
              <AlertDialogDescription>
                {t.deletePostConfirm} &ldquo;{media.fileName}&rdquo;
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel data-ocid="admin.media.cancel_button">
                {t.cancel}
              </AlertDialogCancel>
              <AlertDialogAction
                data-ocid="admin.media.confirm_button"
                onClick={handleDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {t.confirmDelete}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </TableCell>
    </TableRow>
  );
}

function CategoryRow({
  category,
  isHidden,
  index,
  users,
  t,
}: {
  category: Category;
  isHidden: boolean;
  index: number;
  users: UserWithPrincipal[];
  t: Record<string, string>;
}) {
  const deleteCategory = useDeleteCategory();
  const toggleHidden = useToggleCategoryHidden();
  const [showWhitelist, setShowWhitelist] = useState(false);
  const [showSchedule, setShowSchedule] = useState(false);
  const { data: scheduleData } = useGetCategorySchedule(
    showSchedule ? category.id : null,
  );
  const setScheduleMutation = useSetCategorySchedule();
  const [schedEnabled, setSchedEnabled] = useState(false);
  const [schedWeekday, setSchedWeekday] = useState("1");
  const [schedHour, setSchedHour] = useState("23");
  const [schedInit, setSchedInit] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const { data: allowedPrincipals } = useGetCategoryAllowedUsers(
    isHidden ? category.id : null,
  );

  if (scheduleData !== undefined && scheduleData !== null && !schedInit) {
    setSchedEnabled(scheduleData.enabled);
    setSchedWeekday(scheduleData.weekday.toString());
    setSchedHour(scheduleData.hour.toString());
    setSchedInit(true);
  }

  const addToWhitelist = useAddUserToCategoryAllowedList();
  const removeFromWhitelist = useRemoveUserFromCategoryAllowedList();

  const allowedUsers = (allowedPrincipals ?? [])
    .map((p) => users.find((u) => u.principal.toString() === p.toString()))
    .filter(Boolean) as UserWithPrincipal[];

  const allowedPrincipalStrs = new Set(
    (allowedPrincipals ?? []).map((p) => p.toString()),
  );
  const availableToAdd = users.filter(
    (u) => !allowedPrincipalStrs.has(u.principal.toString()),
  );
  const filteredAvailable = availableToAdd.filter((u) =>
    u.profile.alias.toLowerCase().includes(userSearchQuery.toLowerCase()),
  );

  const handleAddToWhitelist = async (user: UserWithPrincipal) => {
    try {
      await addToWhitelist.mutateAsync({
        categoryId: category.id,
        user: user.principal,
      });
      setUserSearchQuery("");
      toast.success(`${user.profile.alias}: ${t.addToWhitelist}`);
    } catch {
      toast.error(t.errorOccurred);
    }
  };

  const handleRemoveFromWhitelist = async (user: UserWithPrincipal) => {
    try {
      await removeFromWhitelist.mutateAsync({
        categoryId: category.id,
        user: user.principal,
      });
      toast.success(`${user.profile.alias}: ${t.removeFromWhitelist}`);
    } catch {
      toast.error(t.errorOccurred);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteCategory.mutateAsync(category.id);
      toast.success(`"${category.name}" ${t.deleted}`);
    } catch {
      toast.error(t.errorOccurred);
    }
  };

  const handleToggleHidden = async () => {
    try {
      await toggleHidden.mutateAsync({
        id: category.id,
        hidden: !isHidden,
      });
      toast.success(
        isHidden
          ? `"${category.name}" ${t.showCategory}`
          : `"${category.name}" ${t.hideCategory}`,
      );
    } catch {
      toast.error(t.errorOccurred);
    }
  };

  const handleSaveSchedule = async () => {
    try {
      await setScheduleMutation.mutateAsync({
        categoryId: category.id,
        enabled: schedEnabled,
        weekday: Number.parseInt(schedWeekday),
        hour: Number.parseInt(schedHour),
      });
      toast.success(t.scheduleSaved);
    } catch {
      toast.error(t.errorOccurred);
    }
  };

  const weekdayLabels = [
    t.monday,
    t.tuesday,
    t.wednesday,
    t.thursday,
    t.friday,
    t.saturday,
    t.sunday,
  ];

  return (
    <>
      <TableRow
        data-ocid={`admin.categories.item.${index}`}
        className={isHidden ? "opacity-60" : ""}
      >
        <TableCell className="font-medium">
          <div className="flex items-center gap-2">
            {category.name}
            {isHidden && (
              <Badge variant="secondary" className="text-xs gap-1">
                <EyeOff className="h-2.5 w-2.5" />
                {t.hidden}
              </Badge>
            )}
          </div>
        </TableCell>
        <TableCell className="text-muted-foreground text-sm">
          {new Date(Number(category.createdAt) / 1_000_000).toLocaleDateString(
            "sv-SE",
          )}
        </TableCell>
        <TableCell className="text-right">
          <div className="flex items-center justify-end gap-1">
            <Button
              data-ocid={`admin.categories.toggle.${index}`}
              variant="ghost"
              size="sm"
              onClick={handleToggleHidden}
              disabled={toggleHidden.isPending}
              title={isHidden ? t.showCategory : t.hideCategory}
              className="text-muted-foreground hover:text-foreground"
            >
              {toggleHidden.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : isHidden ? (
                <Eye className="h-4 w-4" />
              ) : (
                <EyeOff className="h-4 w-4" />
              )}
            </Button>
            {isHidden && (
              <Button
                data-ocid={`admin.categories.whitelist.${index}`}
                variant={showWhitelist ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setShowWhitelist((v) => !v)}
                title={t.whitelist}
                className="text-muted-foreground hover:text-foreground"
              >
                <UserPlus className="h-4 w-4" />
              </Button>
            )}
            <Button
              data-ocid={`admin.categories.schedule.${index}`}
              variant={showSchedule ? "secondary" : "ghost"}
              size="sm"
              onClick={() => {
                setShowSchedule((v) => !v);
                setSchedInit(false);
              }}
              title={t.cleanupSchedule}
              className="text-muted-foreground hover:text-foreground"
            >
              <Clock className="h-4 w-4" />
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  data-ocid={`admin.categories.delete_button.${index}`}
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  disabled={deleteCategory.isPending}
                >
                  {deleteCategory.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent data-ocid="admin.categories.dialog">
                <AlertDialogHeader>
                  <AlertDialogTitle>{t.deletePostTitle}</AlertDialogTitle>
                  <AlertDialogDescription>
                    {t.deletePostConfirm} &ldquo;{category.name}&rdquo;
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel data-ocid="admin.categories.cancel_button">
                    {t.cancel}
                  </AlertDialogCancel>
                  <AlertDialogAction
                    data-ocid="admin.categories.confirm_button"
                    onClick={handleDelete}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {t.confirmDelete}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </TableCell>
      </TableRow>
      {showSchedule && (
        <TableRow data-ocid={`admin.categories.schedule_panel.${index}`}>
          <TableCell colSpan={3} className="py-4 px-6 bg-muted/30">
            <div className="space-y-4 max-w-sm">
              <p className="text-xs font-medium text-foreground">
                {t.cleanupFor} &ldquo;{category.name}&rdquo;
              </p>
              <div className="flex items-center gap-3">
                <Switch
                  id={`sched-enabled-${category.id}`}
                  checked={schedEnabled}
                  onCheckedChange={setSchedEnabled}
                />
                <Label
                  htmlFor={`sched-enabled-${category.id}`}
                  className="text-sm"
                >
                  {t.enableCleanup}
                </Label>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">
                    {t.weekday}
                  </Label>
                  <Select value={schedWeekday} onValueChange={setSchedWeekday}>
                    <SelectTrigger
                      className="h-8 text-sm"
                      data-ocid={`admin.categories.weekday.select.${index}`}
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {weekdayLabels.map((label, i) => (
                        <SelectItem key={i.toString()} value={i.toString()}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">
                    {t.time}
                  </Label>
                  <Select value={schedHour} onValueChange={setSchedHour}>
                    <SelectTrigger
                      className="h-8 text-sm"
                      data-ocid={`admin.categories.hour.select.${index}`}
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 24 }, (_, i) => (
                        <SelectItem key={i.toString()} value={i.toString()}>
                          {i.toString().padStart(2, "0")}:00
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {scheduleData?.lastRunAt != null && (
                <p className="text-xs text-muted-foreground">
                  {t.lastRun}{" "}
                  {new Date(
                    Number(scheduleData.lastRunAt) / 1_000_000,
                  ).toLocaleString("sv-SE")}
                </p>
              )}
              <p className="text-xs text-destructive/80">{t.cleanupWarning}</p>
              <Button
                data-ocid={`admin.categories.schedule.save_button.${index}`}
                size="sm"
                className="h-8 gap-1.5"
                onClick={handleSaveSchedule}
                disabled={setScheduleMutation.isPending}
              >
                {setScheduleMutation.isPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Clock className="h-3.5 w-3.5" />
                )}
                {t.saveSchedule}
              </Button>
            </div>
          </TableCell>
        </TableRow>
      )}
      {showWhitelist && isHidden && (
        <TableRow data-ocid={`admin.categories.whitelist_panel.${index}`}>
          <TableCell colSpan={3} className="py-3 px-6 bg-muted/30">
            <div className="space-y-3">
              <p className="text-xs font-medium text-foreground">
                {t.whitelist}: &ldquo;{category.name}&rdquo;
              </p>
              {allowedUsers.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  {t.noWhitelistUsers}
                </p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {allowedUsers.map((u) => (
                    <div
                      key={u.principal.toString()}
                      className="flex items-center gap-1 bg-background border border-border rounded-md px-2 py-0.5 text-xs"
                    >
                      <span>{u.profile.alias}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveFromWhitelist(u)}
                        disabled={removeFromWhitelist.isPending}
                        className="text-muted-foreground hover:text-destructive transition-colors ml-0.5"
                        title={t.removeFromWhitelist}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex gap-2">
                <div className="relative flex-1 max-w-xs">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
                  <Input
                    value={userSearchQuery}
                    onChange={(e) => setUserSearchQuery(e.target.value)}
                    placeholder={t.searchAlias}
                    className="pl-7 h-7 text-xs"
                  />
                </div>
              </div>
              {userSearchQuery && filteredAvailable.length > 0 && (
                <div className="bg-background border border-border rounded-md shadow-sm max-h-32 overflow-y-auto">
                  {filteredAvailable.slice(0, 8).map((u) => (
                    <button
                      type="button"
                      key={u.principal.toString()}
                      onClick={() => handleAddToWhitelist(u)}
                      disabled={addToWhitelist.isPending}
                      className="w-full text-left px-3 py-1.5 text-xs hover:bg-muted transition-colors flex items-center gap-2"
                    >
                      <UserPlus className="h-3 w-3 text-muted-foreground" />
                      {u.profile.alias}
                    </button>
                  ))}
                </div>
              )}
              {userSearchQuery && filteredAvailable.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  {t.noMatchingUsers}
                </p>
              )}
            </div>
          </TableCell>
        </TableRow>
      )}
    </>
  );
}

function UserRow({
  user,
  index,
  moderatorPrincipals,
  isSuperAdmin,
  t,
}: {
  user: UserWithPrincipal;
  index: number;
  moderatorPrincipals: string[];
  isSuperAdmin: boolean;
  t: Record<string, string>;
}) {
  const isAdmin = user.profile.role === UserRole.admin;
  const isModerator = moderatorPrincipals.includes(user.principal.toString());
  const blockUser = useBlockUser();
  const unblockUser = useUnblockUser();
  const setRole = useSetRole();
  const deleteUser = useDeleteUser();
  const assignModerator = useAssignModerator();
  const revokeModerator = useRevokeModerator();

  const handleBlock = async () => {
    try {
      if (user.profile.blocked) {
        await unblockUser.mutateAsync(user.principal);
        toast.success(`${user.profile.alias}: ${t.unblockUser}`);
      } else {
        await blockUser.mutateAsync(user.principal);
        toast.success(`${user.profile.alias}: ${t.blockUser}`);
      }
    } catch {
      toast.error(t.errorOccurred);
    }
  };

  const handleRoleToggle = async () => {
    try {
      const newRole = isAdmin ? UserRole.user : UserRole.admin;
      await setRole.mutateAsync({ principal: user.principal, role: newRole });
      toast.success(
        isAdmin
          ? `${user.profile.alias}: ${t.removeAdmin}`
          : `${user.profile.alias}: ${t.makeAdmin}`,
      );
    } catch {
      toast.error(t.errorOccurred);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteUser.mutateAsync(user.principal);
      toast.success(`${user.profile.alias}: ${t.deleted}`);
    } catch {
      toast.error(t.errorOccurred);
    }
  };

  const handleModeratorToggle = async () => {
    try {
      if (isModerator) {
        await revokeModerator.mutateAsync(user.principal);
        toast.success(`${user.profile.alias}: ${t.revokeModerator}`);
      } else {
        await assignModerator.mutateAsync(user.principal);
        toast.success(`${user.profile.alias}: ${t.assignModerator}`);
      }
    } catch {
      toast.error(t.errorOccurred);
    }
  };

  const isActing =
    blockUser.isPending ||
    unblockUser.isPending ||
    setRole.isPending ||
    deleteUser.isPending ||
    assignModerator.isPending ||
    revokeModerator.isPending;

  return (
    <TableRow
      data-ocid={`admin.users.item.${index}`}
      className={user.profile.blocked ? "opacity-60" : ""}
    >
      <TableCell className="font-medium">{user.profile.alias}</TableCell>
      <TableCell>
        <div className="flex items-center gap-1 flex-wrap">
          <Badge
            variant={isAdmin ? "default" : "secondary"}
            className="text-xs"
          >
            {isAdmin ? t.admin : t.user}
          </Badge>
          {isModerator && (
            <Badge className="text-xs bg-amber-100 text-amber-800 border border-amber-200 hover:bg-amber-100">
              {t.moderator}
            </Badge>
          )}
        </div>
      </TableCell>
      <TableCell>
        {user.profile.blocked ? (
          <Badge variant="destructive" className="text-xs">
            {t.blocked}
          </Badge>
        ) : (
          <Badge variant="outline" className="text-xs text-muted-foreground">
            {t.active}
          </Badge>
        )}
      </TableCell>
      <TableCell className="text-right">
        <div className="flex items-center justify-end gap-1">
          <Button
            data-ocid={`admin.users.toggle.${index}`}
            variant="ghost"
            size="sm"
            onClick={handleBlock}
            disabled={isActing}
            className="text-muted-foreground hover:text-foreground text-xs"
          >
            {user.profile.blocked ? t.unblockUser : t.blockUser}
          </Button>
          {isSuperAdmin && !isAdmin && (
            <Button
              data-ocid={`admin.users.toggle.${index}`}
              variant="ghost"
              size="sm"
              onClick={handleModeratorToggle}
              disabled={isActing}
              title={isModerator ? t.revokeModerator : t.assignModerator}
              className={
                isModerator
                  ? "text-amber-600 hover:text-amber-700 text-xs"
                  : "text-muted-foreground hover:text-foreground text-xs"
              }
            >
              <Shield className="h-3.5 w-3.5" />
            </Button>
          )}
          <Button
            data-ocid={`admin.users.edit_button.${index}`}
            variant="ghost"
            size="sm"
            onClick={handleRoleToggle}
            disabled={isActing}
            className="text-muted-foreground hover:text-foreground text-xs"
          >
            {isAdmin ? t.removeAdmin : t.makeAdmin}
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                data-ocid={`admin.users.delete_button.${index}`}
                variant="ghost"
                size="sm"
                disabled={isActing}
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                {deleteUser.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent data-ocid="admin.users.dialog">
              <AlertDialogHeader>
                <AlertDialogTitle>{t.deleteUser}</AlertDialogTitle>
                <AlertDialogDescription>
                  {t.deleteUserConfirm.replace("{alias}", user.profile.alias)}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel data-ocid="admin.users.cancel_button">
                  {t.cancel}
                </AlertDialogCancel>
                <AlertDialogAction
                  data-ocid="admin.users.confirm_button"
                  onClick={handleDelete}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {t.confirmDelete}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </TableCell>
    </TableRow>
  );
}

function AdminPostRow({
  post,
  index,
  catName,
  t,
}: { post: Post; index: number; catName: string; t: Record<string, string> }) {
  const deletePost = useDeletePost();
  const pinPost = usePinPost();

  const handleDelete = async () => {
    try {
      await deletePost.mutateAsync(post.id);
      toast.success(t.deleted);
    } catch {
      toast.error(t.errorOccurred);
    }
  };

  const handlePin = async () => {
    try {
      await pinPost.mutateAsync({ postId: post.id, pinned: !post.pinned });
      toast.success(post.pinned ? t.unpinPost : t.pinPost);
    } catch {
      toast.error(t.errorOccurred);
    }
  };

  return (
    <TableRow data-ocid={`admin.posts.item.${index}`}>
      <TableCell className="font-medium max-w-48 truncate">
        <div className="flex items-center gap-1.5">
          {post.pinned && <Pin className="w-3 h-3 text-primary shrink-0" />}
          <span className="truncate">{post.title}</span>
        </div>
      </TableCell>
      <TableCell className="text-muted-foreground text-sm">
        <AuthorName principal={post.authorPrincipal} />
      </TableCell>
      <TableCell className="text-muted-foreground text-sm">{catName}</TableCell>
      <TableCell className="text-muted-foreground text-sm">
        {new Date(Number(post.createdAt) / 1_000_000).toLocaleDateString(
          "sv-SE",
        )}
      </TableCell>
      <TableCell className="text-right">
        <div className="flex items-center justify-end gap-1">
          <Button
            data-ocid={`admin.posts.toggle.${index}`}
            variant="ghost"
            size="sm"
            onClick={handlePin}
            disabled={pinPost.isPending}
            className="text-muted-foreground hover:text-foreground"
          >
            {post.pinned ? (
              <PinOff className="w-4 h-4" />
            ) : (
              <Pin className="w-4 h-4" />
            )}
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                data-ocid={`admin.posts.delete_button.${index}`}
                variant="ghost"
                size="sm"
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                disabled={deletePost.isPending}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent data-ocid="admin.posts.dialog">
              <AlertDialogHeader>
                <AlertDialogTitle>{t.deletePostTitle}</AlertDialogTitle>
                <AlertDialogDescription>
                  {t.deletePostConfirm} &ldquo;{post.title}&rdquo;
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel data-ocid="admin.posts.cancel_button">
                  {t.cancel}
                </AlertDialogCancel>
                <AlertDialogAction
                  data-ocid="admin.posts.confirm_button"
                  onClick={handleDelete}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {t.confirmDelete}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </TableCell>
    </TableRow>
  );
}

function useAllComments() {
  const { actor, isFetching } = useActor();
  return useQuery<CommentType[]>({
    queryKey: ["admin", "allComments"],
    queryFn: async () => {
      if (!actor) return [];
      return [];
    },
    enabled: !!actor && !isFetching,
  });
}

export default function AdminPanel({ onBack }: AdminPanelProps) {
  const { lang } = useLang();
  const t = translations[lang];
  const { data: categories, isLoading: loadingCats } = useListCategories();
  const { data: cleanupLogs } = useListCleanupLogs(null);
  const { data: hiddenCategoryIds } = useGetHiddenCategoryIds();
  const { data: users, isLoading: loadingUsers } = useListUsersWithPrincipal();
  const { data: posts, isLoading: loadingPosts } = useListPosts(null);
  const { data: allComments, isLoading: loadingComments } = useAllComments();
  const { data: moderatorList } = useListModerators();
  const { data: isCallerAdmin } = useIsCallerModerator();
  const createCategory = useCreateCategory();
  const { actor } = useActor();
  const [newCatName, setNewCatName] = useState("");
  const [catError, setCatError] = useState("");

  const [catSearch, setCatSearch] = useState("");
  const [userSearch, setUserSearch] = useState("");
  const [postSearch, setPostSearch] = useState("");
  const [mediaSearch, setMediaSearch] = useState("");

  const hiddenIdsSet = new Set(hiddenCategoryIds ?? []);
  const moderatorPrincipals = (moderatorList ?? []).map((p) => p.toString());
  const isSuperAdmin = isCallerAdmin !== false;

  const { data: allMedia, isLoading: loadingMedia } = useQuery<MediaFile[]>({
    queryKey: ["allMedia"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllMedia();
    },
    enabled: !!actor,
  });

  const filteredMedia = (allMedia ?? []).filter((m) => {
    const q = mediaSearch.toLowerCase();
    if (!q) return true;
    const date = new Date(Number(m.uploadedAt) / 1_000_000).toLocaleDateString(
      "sv-SE",
    );
    return (
      m.fileName.toLowerCase().includes(q) ||
      m.fileType.toLowerCase().includes(q) ||
      date.includes(q)
    );
  });

  const catMap = new Map((categories ?? []).map((c) => [c.id, c.name]));

  const filteredCategories = (categories ?? []).filter((c) =>
    c.name.toLowerCase().includes(catSearch.toLowerCase()),
  );

  const filteredUsers = (users ?? []).filter((u) =>
    u.profile.alias.toLowerCase().includes(userSearch.toLowerCase()),
  );

  const filteredPosts = (posts ?? []).filter((p) => {
    const q = postSearch.toLowerCase();
    if (!q) return true;
    const date = new Date(Number(p.createdAt) / 1_000_000).toLocaleDateString(
      "sv-SE",
    );
    return (
      p.title.toLowerCase().includes(q) ||
      p.body.toLowerCase().includes(q) ||
      p.authorPrincipal.toString().toLowerCase().includes(q) ||
      date.includes(q)
    );
  });

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = newCatName.trim();
    if (!name) {
      setCatError(t.categoryNameRequired);
      return;
    }
    setCatError("");
    try {
      await createCategory.mutateAsync(name);
      setNewCatName("");
      toast.success(`"${name}" ${t.saved}`);
    } catch {
      toast.error(t.errorOccurred);
    }
  };

  return (
    <div className="min-h-screen leaf-bg-page flex flex-col">
      <div className="h-1 bg-primary w-full" />

      <header className="border-b border-border bg-card">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-4">
          <Button
            data-ocid="admin.back.button"
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="text-muted-foreground -ml-2"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            {t.back}
          </Button>
          <Separator orientation="vertical" className="h-5" />
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-primary" strokeWidth={1.5} />
            <span className="font-display text-xl text-foreground">
              {t.blogTitle}
            </span>
          </div>
          <Badge className="ml-auto gap-1">
            <Shield className="h-3 w-3" /> {t.adminPanelTitle}
          </Badge>
        </div>
      </header>

      <main className="flex-1 max-w-4xl mx-auto w-full px-6 py-10">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <h1 className="font-display text-3xl text-foreground mb-6">
            {t.adminPanelTitle}
          </h1>

          <Tabs defaultValue="categories" className="space-y-6">
            <TabsList className="bg-muted">
              <TabsTrigger
                data-ocid="admin.media.tab"
                value="media"
                className="gap-1.5"
              >
                <Images className="w-3.5 h-3.5" />
                {t.mediaTab}
              </TabsTrigger>
              <TabsTrigger
                data-ocid="admin.categories.tab"
                value="categories"
                className="gap-1.5"
              >
                <Tag className="w-3.5 h-3.5" />
                {t.categoriesTab}
              </TabsTrigger>
              <TabsTrigger
                data-ocid="admin.users.tab"
                value="users"
                className="gap-1.5"
              >
                <Users className="w-3.5 h-3.5" />
                {t.usersTab}
              </TabsTrigger>
              <TabsTrigger
                data-ocid="admin.posts.tab"
                value="posts"
                className="gap-1.5"
              >
                <FileText className="w-3.5 h-3.5" />
                {t.postsTab}
              </TabsTrigger>
              <TabsTrigger
                data-ocid="admin.comments.tab"
                value="comments"
                className="gap-1.5"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                {t.commentsTab}
              </TabsTrigger>
            </TabsList>

            {/* ---- KATEGORIER ---- */}
            <TabsContent value="categories" className="space-y-6">
              <div className="bg-card border border-border rounded-xl p-6 shadow-card">
                <h2 className="font-semibold text-foreground mb-4">
                  {t.createCategory}
                </h2>
                <form
                  onSubmit={handleCreateCategory}
                  className="flex gap-2 flex-wrap"
                >
                  <div className="flex-1 min-w-48">
                    <Input
                      data-ocid="admin.categories.input"
                      value={newCatName}
                      onChange={(e) => setNewCatName(e.target.value)}
                      placeholder={t.categoryNamePlaceholder}
                      maxLength={50}
                      className="h-9"
                    />
                    {catError && (
                      <p
                        data-ocid="admin.categories.error_state"
                        className="text-xs text-destructive mt-1"
                      >
                        {catError}
                      </p>
                    )}
                  </div>
                  <Button
                    data-ocid="admin.categories.submit_button"
                    type="submit"
                    size="sm"
                    className="h-9 gap-1.5"
                    disabled={createCategory.isPending}
                  >
                    {createCategory.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Plus className="h-4 w-4" />
                    )}
                    {t.addCategory}
                  </Button>
                </form>
              </div>

              <div className="bg-card border border-border rounded-xl overflow-hidden shadow-card">
                <div className="px-6 py-4 border-b border-border space-y-3">
                  <h2 className="font-semibold text-foreground">
                    {t.categoriesTab}
                    {categories && (
                      <span className="ml-2 text-muted-foreground font-normal text-sm">
                        ({filteredCategories.length})
                      </span>
                    )}
                  </h2>
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                    <Input
                      data-ocid="admin.categories.search_input"
                      value={catSearch}
                      onChange={(e) => setCatSearch(e.target.value)}
                      placeholder={t.searchCategories}
                      className="pl-8 h-8 text-sm"
                    />
                  </div>
                </div>
                {loadingCats ? (
                  <div
                    data-ocid="admin.categories.loading_state"
                    className="py-12 flex justify-center"
                  >
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : filteredCategories.length === 0 ? (
                  <div
                    data-ocid="admin.categories.empty_state"
                    className="py-12 text-center text-muted-foreground text-sm"
                  >
                    {catSearch ? t.noResults : t.noLogs}
                  </div>
                ) : (
                  <Table data-ocid="admin.categories.table">
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t.name}</TableHead>
                        <TableHead>{t.catCreated}</TableHead>
                        <TableHead className="text-right">
                          {t.actions}
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredCategories.map((cat, i) => (
                        <CategoryRow
                          key={cat.id}
                          category={cat}
                          isHidden={hiddenIdsSet.has(cat.id)}
                          index={i + 1}
                          users={users ?? []}
                          t={t}
                        />
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>

              {/* ---- RENSNINGSLOGG ---- */}
              <div
                className="bg-card border border-border rounded-xl overflow-hidden shadow-card"
                data-ocid="admin.cleanup_log.panel"
              >
                <div className="px-6 py-4 border-b border-border">
                  <h2 className="font-semibold text-foreground flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    {t.cleanupLogs}
                  </h2>
                </div>
                {!cleanupLogs || cleanupLogs.length === 0 ? (
                  <div
                    data-ocid="admin.cleanup_log.empty_state"
                    className="py-8 text-center text-muted-foreground text-sm"
                  >
                    {t.noLogs}
                  </div>
                ) : (
                  <Table data-ocid="admin.cleanup_log.table">
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t.category}</TableHead>
                        <TableHead>{t.date}</TableHead>
                        <TableHead className="text-right">
                          {t.postsTab}
                        </TableHead>
                        <TableHead className="text-right">
                          {t.commentsTab}
                        </TableHead>
                        <TableHead className="text-right">
                          {t.mediaTab}
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {[...cleanupLogs]
                        .sort((a, b) => Number(b.ranAt - a.ranAt))
                        .slice(0, 20)
                        .map((log, i) => (
                          <TableRow
                            key={log.id.toString()}
                            data-ocid={`admin.cleanup_log.item.${i + 1}`}
                          >
                            <TableCell className="font-medium text-sm">
                              {log.categoryName}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {new Date(
                                Number(log.ranAt) / 1_000_000,
                              ).toLocaleString("sv-SE")}
                            </TableCell>
                            <TableCell className="text-right text-sm">
                              {log.postsDeleted.toString()}
                            </TableCell>
                            <TableCell className="text-right text-sm">
                              {log.commentsDeleted.toString()}
                            </TableCell>
                            <TableCell className="text-right text-sm">
                              {log.mediaDeleted.toString()}
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                )}
              </div>
            </TabsContent>

            {/* ---- ANVÄNDARE ---- */}
            <TabsContent value="users" className="space-y-4">
              <div className="bg-card border border-border rounded-xl overflow-hidden shadow-card">
                <div className="px-6 py-4 border-b border-border space-y-3">
                  <h2 className="font-semibold text-foreground">
                    {t.registeredUsers}
                    {users && (
                      <span className="ml-2 text-muted-foreground font-normal text-sm">
                        ({filteredUsers.length})
                      </span>
                    )}
                  </h2>
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                    <Input
                      data-ocid="admin.users.search_input"
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                      placeholder={t.searchUsers}
                      className="pl-8 h-8 text-sm"
                    />
                  </div>
                </div>
                {loadingUsers ? (
                  <div
                    data-ocid="admin.users.loading_state"
                    className="py-12 flex justify-center"
                  >
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : filteredUsers.length === 0 ? (
                  <div
                    data-ocid="admin.users.empty_state"
                    className="py-12 text-center text-muted-foreground text-sm"
                  >
                    {userSearch ? t.noResults : t.noResults}
                  </div>
                ) : (
                  <Table data-ocid="admin.users.table">
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t.alias}</TableHead>
                        <TableHead>{t.role}</TableHead>
                        <TableHead>{t.status}</TableHead>
                        <TableHead className="text-right">
                          {t.actions}
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredUsers.map((user, i) => (
                        <UserRow
                          key={user.profile.alias}
                          user={user}
                          index={i + 1}
                          moderatorPrincipals={moderatorPrincipals}
                          isSuperAdmin={isSuperAdmin}
                          t={t}
                        />
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>
            </TabsContent>

            {/* ---- INLÄGG ---- */}
            <TabsContent value="posts" className="space-y-4">
              <div className="bg-card border border-border rounded-xl overflow-hidden shadow-card">
                <div className="px-6 py-4 border-b border-border space-y-3">
                  <h2 className="font-semibold text-foreground">
                    {t.allPosts2}
                    {posts && (
                      <span className="ml-2 text-muted-foreground font-normal text-sm">
                        ({filteredPosts.length})
                      </span>
                    )}
                  </h2>
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                    <Input
                      data-ocid="admin.posts.search_input"
                      value={postSearch}
                      onChange={(e) => setPostSearch(e.target.value)}
                      placeholder={t.searchPosts}
                      className="pl-8 h-8 text-sm"
                    />
                  </div>
                </div>
                {loadingPosts ? (
                  <div
                    data-ocid="admin.posts.loading_state"
                    className="py-12 flex justify-center"
                  >
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : filteredPosts.length === 0 ? (
                  <div
                    data-ocid="admin.posts.empty_state"
                    className="py-12 text-center text-muted-foreground text-sm"
                  >
                    {postSearch ? t.noResults : t.noResults}
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table data-ocid="admin.posts.table">
                      <TableHeader>
                        <TableRow>
                          <TableHead>{t.titleLabel}</TableHead>
                          <TableHead>{t.author}</TableHead>
                          <TableHead>{t.category}</TableHead>
                          <TableHead>{t.date}</TableHead>
                          <TableHead className="text-right">
                            {t.actions}
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredPosts.map((post, i) => (
                          <AdminPostRow
                            key={post.id}
                            post={post}
                            index={i + 1}
                            catName={
                              catMap.get(post.categoryId) ?? t.unknownCategory
                            }
                            t={t}
                          />
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* ---- KOMMENTARER ---- */}
            <TabsContent value="comments" className="space-y-4">
              <div className="bg-card border border-border rounded-xl overflow-hidden shadow-card">
                <div className="px-6 py-4 border-b border-border space-y-3">
                  <h2 className="font-semibold text-foreground">
                    {t.allComments}
                    {allComments && (
                      <span className="ml-2 text-muted-foreground font-normal text-sm">
                        ({allComments.length})
                      </span>
                    )}
                  </h2>
                </div>
                {loadingComments ? (
                  <div
                    data-ocid="admin.comments.loading_state"
                    className="py-12 flex justify-center"
                  >
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <div
                    data-ocid="admin.comments.empty_state"
                    className="py-12 text-center text-muted-foreground text-sm"
                  >
                    {t.noResults}
                  </div>
                )}
              </div>
            </TabsContent>

            {/* ---- MEDIA ---- */}
            <TabsContent value="media" className="space-y-4">
              <div className="bg-card border border-border rounded-xl overflow-hidden shadow-card">
                <div className="px-6 py-4 border-b border-border space-y-3">
                  <h2 className="font-semibold text-foreground">
                    {t.allMediaFiles}
                    {allMedia && (
                      <span className="ml-2 text-muted-foreground font-normal text-sm">
                        ({allMedia.length})
                      </span>
                    )}
                  </h2>
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                    <Input
                      data-ocid="admin.media.search_input"
                      value={mediaSearch}
                      onChange={(e) => setMediaSearch(e.target.value)}
                      placeholder={t.searchMedia}
                      className="pl-8 h-8 text-sm"
                    />
                  </div>
                </div>
                {loadingMedia ? (
                  <div
                    data-ocid="admin.media.loading_state"
                    className="py-12 flex justify-center"
                  >
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : filteredMedia.length === 0 ? (
                  <div
                    data-ocid="admin.media.empty_state"
                    className="py-12 text-center text-muted-foreground text-sm"
                  >
                    {mediaSearch ? t.noResults : t.noResults}
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table data-ocid="admin.media.table">
                      <TableHeader>
                        <TableRow>
                          <TableHead>{t.mediaFile}</TableHead>
                          <TableHead>{t.mediaType}</TableHead>
                          <TableHead>{t.mediaSize}</TableHead>
                          <TableHead>{t.postOrComment}</TableHead>
                          <TableHead>{t.mediaUploaded}</TableHead>
                          <TableHead className="text-right">
                            {t.actions}
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredMedia.map((media, i) => (
                          <MediaRow
                            key={media.id.toString()}
                            media={media}
                            index={i + 1}
                            t={t}
                          />
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </motion.div>
      </main>

      <footer className="py-6 text-center text-xs text-muted-foreground border-t border-border leaf-bg-footer">
        © {new Date().getFullYear()}.{" "}
        <a
          href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-foreground transition-colors"
        >
          {t.footerBuilt}
        </a>
      </footer>
    </div>
  );
}
