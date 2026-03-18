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

interface AdminPanelProps {
  onBack: () => void;
}

function formatFileSize(bytes: bigint): string {
  const n = Number(bytes);
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

function MediaRow({ media, index }: { media: MediaFile; index: number }) {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!actor) return;
    setDeleting(true);
    try {
      await actor.deleteMedia(media.id);
      queryClient.invalidateQueries({ queryKey: ["allMedia"] });
      toast.success("Mediafilen raderades.");
    } catch {
      toast.error("Kunde inte radera mediafilen.");
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
          {media.fileType === "image" ? "Bild" : "Video"}
        </Badge>
      </TableCell>
      <TableCell className="text-muted-foreground text-sm">
        {formatFileSize(media.fileSize)}
      </TableCell>
      <TableCell className="text-muted-foreground text-sm">
        {media.postId != null
          ? "Inlägg"
          : media.commentId != null
            ? "Kommentar"
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
              <AlertDialogTitle>Radera mediafil</AlertDialogTitle>
              <AlertDialogDescription>
                Är du säker på att du vill radera &ldquo;{media.fileName}
                &rdquo;? Detta kan inte ångras.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel data-ocid="admin.media.cancel_button">
                Avbryt
              </AlertDialogCancel>
              <AlertDialogAction
                data-ocid="admin.media.confirm_button"
                onClick={handleDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Radera
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
}: {
  category: Category;
  isHidden: boolean;
  index: number;
  users: UserWithPrincipal[];
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
  // Initialize schedule form from fetched data
  if (scheduleData !== undefined && scheduleData !== null && !schedInit) {
    setSchedEnabled(scheduleData.enabled);
    setSchedWeekday(scheduleData.weekday.toString());
    setSchedHour(scheduleData.hour.toString());
    setSchedInit(true);
  }
  if (!showSchedule && schedInit) {
    // reset when closed
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
      toast.success(
        `${user.profile.alias} har fått åtkomst till "${category.name}".`,
      );
    } catch {
      toast.error("Kunde inte lägga till användaren.");
    }
  };

  const handleRemoveFromWhitelist = async (user: UserWithPrincipal) => {
    try {
      await removeFromWhitelist.mutateAsync({
        categoryId: category.id,
        user: user.principal,
      });
      toast.success(
        `${user.profile.alias} har tagits bort från "${category.name}".`,
      );
    } catch {
      toast.error("Kunde inte ta bort användaren.");
    }
  };

  const handleDelete = async () => {
    try {
      await deleteCategory.mutateAsync(category.id);
      toast.success(`Kategori "${category.name}" raderad.`);
    } catch {
      toast.error("Kunde inte radera kategorin.");
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
          ? `Kategori "${category.name}" är nu synlig.`
          : `Kategori "${category.name}" är nu dold.`,
      );
    } catch {
      toast.error("Kunde inte ändra synlighet.");
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
      toast.success(`Schema för "${category.name}" sparat.`);
    } catch {
      toast.error("Kunde inte spara schema.");
    }
  };

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
                Dold
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
              title={isHidden ? "Visa kategori" : "Dölj kategori"}
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
                title="Hantera åtkomst"
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
              title="Automatisk rensning"
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
                  <AlertDialogTitle>Radera kategori</AlertDialogTitle>
                  <AlertDialogDescription>
                    Är du säker på att du vill radera kategorin &ldquo;
                    {category.name}&rdquo;? Detta kan inte ångras.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel data-ocid="admin.categories.cancel_button">
                    Avbryt
                  </AlertDialogCancel>
                  <AlertDialogAction
                    data-ocid="admin.categories.confirm_button"
                    onClick={handleDelete}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Radera
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
                Automatisk rensning för &ldquo;{category.name}&rdquo;
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
                  Aktivera automatisk rensning
                </Label>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">
                    Veckodag
                  </Label>
                  <Select value={schedWeekday} onValueChange={setSchedWeekday}>
                    <SelectTrigger
                      className="h-8 text-sm"
                      data-ocid={`admin.categories.weekday.select.${index}`}
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">Måndag</SelectItem>
                      <SelectItem value="1">Tisdag</SelectItem>
                      <SelectItem value="2">Onsdag</SelectItem>
                      <SelectItem value="3">Torsdag</SelectItem>
                      <SelectItem value="4">Fredag</SelectItem>
                      <SelectItem value="5">Lördag</SelectItem>
                      <SelectItem value="6">Söndag</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">
                    Klockslag (UTC)
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
                  Senast körde:{" "}
                  {new Date(
                    Number(scheduleData.lastRunAt) / 1_000_000,
                  ).toLocaleString("sv-SE")}
                </p>
              )}
              <p className="text-xs text-destructive/80">
                OBS: Alla inlägg, kommentarer och mediafiler i kategorin raderas
                permanent.
              </p>
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
                Spara schema
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
                Åtkomst till &ldquo;{category.name}&rdquo;
              </p>
              {allowedUsers.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  Inga användare har åtkomst till denna dolda kategori.
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
                        title="Ta bort åtkomst"
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
                    placeholder="Sök alias för att lägga till…"
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
                  Ingen användare matchar sökningen.
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
}: {
  user: UserWithPrincipal;
  index: number;
  moderatorPrincipals: string[];
  isSuperAdmin: boolean;
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
        toast.success(`${user.profile.alias} avblockerades.`);
      } else {
        await blockUser.mutateAsync(user.principal);
        toast.success(`${user.profile.alias} blockerades.`);
      }
    } catch {
      toast.error("Kunde inte ändra blockeringsstatus.");
    }
  };

  const handleRoleToggle = async () => {
    try {
      const newRole = isAdmin ? UserRole.user : UserRole.admin;
      await setRole.mutateAsync({ principal: user.principal, role: newRole });
      toast.success(
        isAdmin
          ? `${user.profile.alias} är inte längre admin.`
          : `${user.profile.alias} är nu admin.`,
      );
    } catch {
      toast.error("Kunde inte ändra roll.");
    }
  };

  const handleDelete = async () => {
    try {
      await deleteUser.mutateAsync(user.principal);
      toast.success(`Användaren ${user.profile.alias} raderades.`);
    } catch {
      toast.error("Kunde inte radera användaren.");
    }
  };

  const handleModeratorToggle = async () => {
    try {
      if (isModerator) {
        await revokeModerator.mutateAsync(user.principal);
        toast.success(`${user.profile.alias} är inte längre moderator.`);
      } else {
        await assignModerator.mutateAsync(user.principal);
        toast.success(`${user.profile.alias} är nu moderator.`);
      }
    } catch {
      toast.error("Kunde inte ändra moderatorstatus.");
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
            {isAdmin ? "Admin" : "Användare"}
          </Badge>
          {isModerator && (
            <Badge className="text-xs bg-amber-100 text-amber-800 border border-amber-200 hover:bg-amber-100">
              Moderator
            </Badge>
          )}
        </div>
      </TableCell>
      <TableCell>
        {user.profile.blocked ? (
          <Badge variant="destructive" className="text-xs">
            Blockerad
          </Badge>
        ) : (
          <Badge variant="outline" className="text-xs text-muted-foreground">
            Aktiv
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
            {user.profile.blocked ? "Avblockera" : "Blockera"}
          </Button>
          {isSuperAdmin && !isAdmin && (
            <Button
              data-ocid={`admin.users.toggle.${index}`}
              variant="ghost"
              size="sm"
              onClick={handleModeratorToggle}
              disabled={isActing}
              title={isModerator ? "Ta bort moderator" : "Gör moderator"}
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
            {isAdmin ? "Ta bort admin" : "Gör admin"}
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
                <AlertDialogTitle>Radera användare</AlertDialogTitle>
                <AlertDialogDescription>
                  Är du säker på att du vill radera {user.profile.alias}? Alla
                  deras inlägg och kommentarer raderas permanent. Detta kan inte
                  ångras.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel data-ocid="admin.users.cancel_button">
                  Avbryt
                </AlertDialogCancel>
                <AlertDialogAction
                  data-ocid="admin.users.confirm_button"
                  onClick={handleDelete}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Radera
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
}: { post: Post; index: number; catName: string }) {
  const deletePost = useDeletePost();
  const pinPost = usePinPost();

  const handleDelete = async () => {
    try {
      await deletePost.mutateAsync(post.id);
      toast.success("Inlägget raderades.");
    } catch {
      toast.error("Kunde inte radera inlägget.");
    }
  };

  const handlePin = async () => {
    try {
      await pinPost.mutateAsync({ postId: post.id, pinned: !post.pinned });
      toast.success(post.pinned ? "Inlägg lossades." : "Inlägg fastnålades.");
    } catch {
      toast.error("Kunde inte ändra fastnålning.");
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
                <AlertDialogTitle>Radera inlägg</AlertDialogTitle>
                <AlertDialogDescription>
                  Är du säker på att du vill radera &ldquo;{post.title}&rdquo;?
                  Detta kan inte ångras.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel data-ocid="admin.posts.cancel_button">
                  Avbryt
                </AlertDialogCancel>
                <AlertDialogAction
                  data-ocid="admin.posts.confirm_button"
                  onClick={handleDelete}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Radera
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

  // Search state per tab
  const [catSearch, setCatSearch] = useState("");
  const [userSearch, setUserSearch] = useState("");
  const [postSearch, setPostSearch] = useState("");
  const [mediaSearch, setMediaSearch] = useState("");

  const hiddenIdsSet = new Set(hiddenCategoryIds ?? []);
  const moderatorPrincipals = (moderatorList ?? []).map((p) => p.toString());
  // isSuperAdmin: the admin panel is only accessible to admins; we check if caller is NOT a moderator but IS admin
  // We'll determine superAdmin by checking myProfile role via actor directly -- use isCallerAdmin state
  // For simplicity: anyone who can access AdminPanel is admin; isSuperAdmin means they can also manage moderators
  // The backend assignModerator is restricted to superadmin, so we show the button for all admins
  // but let backend enforce the actual restriction. We show it when caller is admin (isCallerAdmin).
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

  // Filtered lists
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
      setCatError("Ange ett kategorinamn.");
      return;
    }
    setCatError("");
    try {
      await createCategory.mutateAsync(name);
      setNewCatName("");
      toast.success(`Kategori "${name}" skapad.`);
    } catch {
      toast.error("Kunde inte skapa kategorin.");
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
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
            Tillbaka
          </Button>
          <Separator orientation="vertical" className="h-5" />
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-primary" strokeWidth={1.5} />
            <span className="font-display text-xl text-foreground">
              HKLOblogg
            </span>
          </div>
          <Badge className="ml-auto gap-1">
            <Shield className="h-3 w-3" /> Adminpanel
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
            Adminpanel
          </h1>

          <Tabs defaultValue="categories" className="space-y-6">
            <TabsList className="bg-muted">
              <TabsTrigger
                data-ocid="admin.media.tab"
                value="media"
                className="gap-1.5"
              >
                <Images className="w-3.5 h-3.5" />
                Media
              </TabsTrigger>
              <TabsTrigger
                data-ocid="admin.categories.tab"
                value="categories"
                className="gap-1.5"
              >
                <Tag className="w-3.5 h-3.5" />
                Kategorier
              </TabsTrigger>
              <TabsTrigger
                data-ocid="admin.users.tab"
                value="users"
                className="gap-1.5"
              >
                <Users className="w-3.5 h-3.5" />
                Användare
              </TabsTrigger>
              <TabsTrigger
                data-ocid="admin.posts.tab"
                value="posts"
                className="gap-1.5"
              >
                <FileText className="w-3.5 h-3.5" />
                Inlägg
              </TabsTrigger>
              <TabsTrigger
                data-ocid="admin.comments.tab"
                value="comments"
                className="gap-1.5"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                Kommentarer
              </TabsTrigger>
            </TabsList>

            {/* ---- KATEGORIER ---- */}
            <TabsContent value="categories" className="space-y-6">
              <div className="bg-card border border-border rounded-xl p-6 shadow-card">
                <h2 className="font-semibold text-foreground mb-4">
                  Ny kategori
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
                      placeholder="Kategorinamn"
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
                    Lägg till
                  </Button>
                </form>
              </div>

              <div className="bg-card border border-border rounded-xl overflow-hidden shadow-card">
                <div className="px-6 py-4 border-b border-border space-y-3">
                  <h2 className="font-semibold text-foreground">
                    Kategorier
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
                      placeholder="Sök kategorier…"
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
                    {catSearch
                      ? "Inga kategorier matchar sökningen."
                      : "Inga kategorier ännu. Skapa den första ovan."}
                  </div>
                ) : (
                  <Table data-ocid="admin.categories.table">
                    <TableHeader>
                      <TableRow>
                        <TableHead>Namn</TableHead>
                        <TableHead>Skapad</TableHead>
                        <TableHead className="text-right">Åtgärder</TableHead>
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
                    Rensningslogg
                  </h2>
                </div>
                {!cleanupLogs || cleanupLogs.length === 0 ? (
                  <div
                    data-ocid="admin.cleanup_log.empty_state"
                    className="py-8 text-center text-muted-foreground text-sm"
                  >
                    Ingen automatisk rensning har körts ännu.
                  </div>
                ) : (
                  <Table data-ocid="admin.cleanup_log.table">
                    <TableHeader>
                      <TableRow>
                        <TableHead>Kategori</TableHead>
                        <TableHead>Datum &amp; tid</TableHead>
                        <TableHead className="text-right">Inlägg</TableHead>
                        <TableHead className="text-right">
                          Kommentarer
                        </TableHead>
                        <TableHead className="text-right">Mediafiler</TableHead>
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
                    Registrerade användare
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
                      placeholder="Sök användare…"
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
                    {userSearch
                      ? "Inga användare matchar sökningen."
                      : "Inga registrerade användare ännu."}
                  </div>
                ) : (
                  <Table data-ocid="admin.users.table">
                    <TableHeader>
                      <TableRow>
                        <TableHead>Alias</TableHead>
                        <TableHead>Roll</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Åtgärder</TableHead>
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
                    Alla inlägg
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
                      placeholder="Sök titel, innehåll, alias, datum…"
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
                    {postSearch
                      ? "Inga inlägg matchar sökningen."
                      : "Inga inlägg ännu."}
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table data-ocid="admin.posts.table">
                      <TableHeader>
                        <TableRow>
                          <TableHead>Titel</TableHead>
                          <TableHead>Författare</TableHead>
                          <TableHead>Kategori</TableHead>
                          <TableHead>Datum</TableHead>
                          <TableHead className="text-right">Åtgärder</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredPosts.map((post, i) => (
                          <AdminPostRow
                            key={post.id}
                            post={post}
                            index={i + 1}
                            catName={catMap.get(post.categoryId) ?? "Okänd"}
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
                    Alla kommentarer
                    {allComments && (
                      <span className="ml-2 text-muted-foreground font-normal text-sm">
                        ({allComments.length})
                      </span>
                    )}
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Kommentarer hanteras per inlägg. Gå till ett inlägg för att
                    se och radera kommentarer direkt.
                  </p>
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                    <Input
                      data-ocid="admin.comments.search_input"
                      disabled
                      placeholder="Kommentarer hanteras per inlägg"
                      className="pl-8 h-8 text-sm opacity-50 cursor-not-allowed"
                    />
                  </div>
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
                    Kommentarer visas per inlägg. Besök ett inlägg för att
                    hantera dess kommentarer.
                  </div>
                )}
              </div>
            </TabsContent>
            {/* ---- MEDIA ---- */}
            <TabsContent value="media" className="space-y-4">
              <div className="bg-card border border-border rounded-xl overflow-hidden shadow-card">
                <div className="px-6 py-4 border-b border-border space-y-3">
                  <h2 className="font-semibold text-foreground">
                    Alla mediafiler
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
                      placeholder="Sök filnamn, typ, datum…"
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
                    {mediaSearch
                      ? "Inga mediafiler matchar sökningen."
                      : "Inga mediafiler uppladdade ännu."}
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table data-ocid="admin.media.table">
                      <TableHeader>
                        <TableRow>
                          <TableHead>Filnamn</TableHead>
                          <TableHead>Typ</TableHead>
                          <TableHead>Storlek</TableHead>
                          <TableHead>Inlägg/Kommentar</TableHead>
                          <TableHead>Uppladdad</TableHead>
                          <TableHead className="text-right">Åtgärder</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredMedia.map((media, i) => (
                          <MediaRow
                            key={media.id.toString()}
                            media={media}
                            index={i + 1}
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

      <footer className="py-5 text-center text-xs text-muted-foreground border-t border-border">
        © {new Date().getFullYear()}.{" "}
        <a
          href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-foreground transition-colors"
        >
          Byggd med ❤ via caffeine.ai
        </a>
      </footer>
    </div>
  );
}
