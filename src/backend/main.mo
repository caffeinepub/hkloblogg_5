import Map "mo:core/Map";
import Text "mo:core/Text";
import Time "mo:core/Time";
import List "mo:core/List";
import Runtime "mo:core/Runtime";
import Principal "mo:core/Principal";
import AccessControl "authorization/access-control";
import MixinAuthorization "authorization/MixinAuthorization";
import Iter "mo:core/Iter";
import Storage "blob-storage/Storage";
import MixinStorage "blob-storage/Mixin";
import Nat64 "mo:core/Nat64";
import Int "mo:core/Int";



actor {
  include MixinStorage();

  type UserRole = AccessControl.UserRole;
  type UserProfile = {
    alias : Text;
    role : UserRole;
    blocked : Bool;
    registeredAt : Time.Time;
  };

  type UserWithPrincipal = {
    principal : Principal;
    profile : UserProfile;
  };

  type Category = {
    id : Text;
    name : Text;
    createdBy : Principal;
    createdAt : Time.Time;
  };

  type Post = {
    id : Text;
    title : Text;
    body : Text;
    categoryId : Text;
    authorPrincipal : Principal;
    createdAt : Time.Time;
    updatedAt : Time.Time;
    pinned : Bool;
    likeCount : Nat;
  };

  type Comment = {
    id : Text;
    postId : Text;
    parentId : ?Text;
    body : Text;
    authorPrincipal : Principal;
    createdAt : Time.Time;
    likeCount : Nat;
  };

  type SearchResult = {
    posts : [Post];
    comments : [Comment];
  };

  type MediaFile = {
    id : Nat;
    ownerId : Principal;
    postId : ?Nat;
    commentId : ?Nat;
    fileType : Text;
    fileName : Text;
    fileSize : Nat;
    blobKey : Text;
    uploadedAt : Int;
  };

  type NotificationEvent = {
    #NewComment;
    #NewReply;
    #NewMedia;
  };

  type Notification = {
    id : Nat;
    recipientPrincipal : Principal;
    postId : Text;
    triggerPrincipal : Principal;
    event : NotificationEvent;
    createdAt : Time.Time;
    read : Bool;
  };

  // ====== SCHEDULED CLEANUP TYPES ======

  type CategorySchedule = {
    enabled : Bool;
    weekday : Nat;    // 0=Monday, 1=Tuesday, ..., 6=Sunday
    hour : Nat;       // 0-23 UTC
    lastRunAt : ?Time.Time;
  };

  type CleanupLog = {
    id : Nat;
    categoryId : Text;
    categoryName : Text;
    ranAt : Time.Time;
    postsDeleted : Nat;
    commentsDeleted : Nat;
    mediaDeleted : Nat;
  };

  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  let userProfiles = Map.empty<Principal, UserProfile>();
  let categories = Map.empty<Text, Category>();
  let categoryHidden = Map.empty<Text, Bool>();
  let categoryAllowedUsers = Map.empty<Text, List.List<Principal>>();
  var posts = Map.empty<Text, Post>();
  var postLikes = Map.empty<Text, List.List<Principal>>();
  var comments = Map.empty<Text, Comment>();
  var commentLikes = Map.empty<Text, List.List<Principal>>();
  var isFirstUserRegistered : Bool = false;
  var mediaFiles = Map.empty<Nat, MediaFile>();
  var nextMediaId = 1;

  // Moderator set: principals with moderator privileges
  var moderatorSet = Map.empty<Principal, Bool>();

  var userFollows = Map.empty<Principal, List.List<Principal>>();
  var postFollows = Map.empty<Text, List.List<Principal>>();

  var notifications = Map.empty<Nat, Notification>();
  var nextNotifId = 1;

  // Scheduled cleanup state
  var categorySchedules = Map.empty<Text, CategorySchedule>();
  var cleanupLogs = Map.empty<Nat, CleanupLog>();
  var nextLogId = 1;

  // Content hash history: postId -> list of (hash, timestamp)
  var postHashHistory = Map.empty<Text, List.List<(Text, Int)>>();

  func requireActiveUser(caller : Principal) : UserProfile {
    switch (userProfiles.get(caller)) {
      case (null) { Runtime.trap("Unauthorized: Must be registered") };
      case (?profile) {
        if (profile.blocked) { Runtime.trap("Unauthorized: Blocked users cannot perform this action") };
        profile;
      };
    };
  };

  // Returns true if caller is superadmin or moderator
  func isModeratorOrAdmin(caller : Principal) : Bool {
    if (AccessControl.isAdmin(accessControlState, caller)) { return true };
    switch (moderatorSet.get(caller)) {
      case (?true) { true };
      case (_) { false };
    };
  };

  func notifyPostFollowers(postId : Text, triggerPrincipal : Principal, event : NotificationEvent) {
    switch (postFollows.get(postId)) {
      case (null) {};
      case (?followers) {
        for (recipient in followers.toArray().vals()) {
          if (recipient != triggerPrincipal) {
            let notif : Notification = {
              id = nextNotifId;
              recipientPrincipal = recipient;
              postId;
              triggerPrincipal;
              event;
              createdAt = Time.now();
              read = false;
            };
            notifications.add(nextNotifId, notif);
            nextNotifId += 1;
          };
        };
      };
    };
  };

  func deleteUserContent(user : Principal) {
    let userPostIds = List.empty<Text>();
    for ((postId, post) in posts.entries()) {
      if (post.authorPrincipal == user) { userPostIds.add(postId) };
    };
    for (postId in userPostIds.toArray().vals()) {
      posts.remove(postId);
      postLikes.remove(postId);
      postFollows.remove(postId);
      let postCommentIds = List.empty<Text>();
      for ((cid, c) in comments.entries()) {
        if (c.postId == postId) { postCommentIds.add(cid) };
      };
      for (cid in postCommentIds.toArray().vals()) {
        comments.remove(cid);
        commentLikes.remove(cid);
      };
    };
    let userCommentIds = List.empty<Text>();
    for ((cid, c) in comments.entries()) {
      if (c.authorPrincipal == user) { userCommentIds.add(cid) };
    };
    for (cid in userCommentIds.toArray().vals()) {
      comments.remove(cid);
      commentLikes.remove(cid);
      let childCommentIds = List.empty<Text>();
      for ((childId, child) in comments.entries()) {
        switch (child.parentId) {
          case (?pid) { if (pid == cid) { childCommentIds.add(childId) } };
          case (null) {};
        };
      };
      for (childId in childCommentIds.toArray().vals()) {
        comments.remove(childId);
        commentLikes.remove(childId);
      };
    };
    for ((postId, likes) in postLikes.entries()) {
      let filtered = likes.filter(func(p) { p != user });
      postLikes.add(postId, filtered);
    };
    for ((commentId, likes) in commentLikes.entries()) {
      let filtered = likes.filter(func(p) { p != user });
      commentLikes.add(commentId, filtered);
    };
    for ((catId, allowedList) in categoryAllowedUsers.entries()) {
      let filtered = allowedList.filter(func(p) { p != user });
      categoryAllowedUsers.add(catId, filtered);
    };
    moderatorSet.remove(user);
    userFollows.remove(user);
    for ((follower, followedList) in userFollows.entries()) {
      let filtered = followedList.filter(func(p) { p != user });
      userFollows.add(follower, filtered);
    };
    for ((pid, followerList) in postFollows.entries()) {
      let filtered = followerList.filter(func(p) { p != user });
      postFollows.add(pid, filtered);
    };
    let toDeleteNotifs = List.empty<Nat>();
    for ((nid, notif) in notifications.entries()) {
      if (notif.recipientPrincipal == user or notif.triggerPrincipal == user) {
        toDeleteNotifs.add(nid);
      };
    };
    for (nid in toDeleteNotifs.toArray().vals()) {
      notifications.remove(nid);
    };
  };

  // Delete all posts, comments, and media for a given category
  func deleteCategoryContent(categoryId : Text) : (Nat, Nat, Nat) {
    var postsDeleted = 0;
    var commentsDeleted = 0;
    var mediaDeleted = 0;

    // Collect post IDs for this category
    let categoryPostIds = List.empty<Text>();
    for ((postId, post) in posts.entries()) {
      if (post.categoryId == categoryId) { categoryPostIds.add(postId) };
    };

    for (postId in categoryPostIds.toArray().vals()) {
      // Delete all comments for this post
      let postCommentIds = List.empty<Text>();
      for ((cid, c) in comments.entries()) {
        if (c.postId == postId) { postCommentIds.add(cid) };
      };
      for (cid in postCommentIds.toArray().vals()) {
        comments.remove(cid);
        commentLikes.remove(cid);
        commentsDeleted += 1;
      };

      // Delete media for this post
      let postMediaIds = List.empty<Nat>();
      for ((mid, m) in mediaFiles.entries()) {
        switch (m.postId) {
          case (?pid) { if (pid.toText() == postId) { postMediaIds.add(mid) } };
          case (null) {};
        };
      };
      for (mid in postMediaIds.toArray().vals()) {
        mediaFiles.remove(mid);
        mediaDeleted += 1;
      };

      // Delete notifications for this post
      let toDeleteNotifs = List.empty<Nat>();
      for ((nid, notif) in notifications.entries()) {
        if (notif.postId == postId) { toDeleteNotifs.add(nid) };
      };
      for (nid in toDeleteNotifs.toArray().vals()) {
        notifications.remove(nid);
      };

      posts.remove(postId);
      postLikes.remove(postId);
      postFollows.remove(postId);
      postsDeleted += 1;
    };

    (postsDeleted, commentsDeleted, mediaDeleted);
  };

  // Check and run scheduled cleanups -- called by system timer
  func runScheduledCleanup() : async () {
    let nowNs : Int = Time.now();
    let nowSec : Int = nowNs / 1_000_000_000;
    let daysSinceEpoch : Int = nowSec / 86400;
    // Jan 1 1970 was a Thursday = weekday 3 in Mon=0 system
    let currentWeekday : Nat = Int.abs((daysSinceEpoch + 3) % 7);
    let currentHour : Nat = Int.abs((nowSec / 3600) % 24);
    let twelveHoursNs : Int = 12 * 3600 * 1_000_000_000;

    for ((categoryId, schedule) in categorySchedules.entries()) {
      if (not schedule.enabled) { () } else {
        let weekdayMatch = schedule.weekday == currentWeekday;
        let hourMatch = schedule.hour == currentHour;
        let notRunRecently = switch (schedule.lastRunAt) {
          case (null) { true };
          case (?lastRun) { (nowNs - lastRun) > twelveHoursNs };
        };
        if (weekdayMatch and hourMatch and notRunRecently) {
          let categoryName = switch (categories.get(categoryId)) {
            case (?cat) { cat.name };
            case (null) { categoryId };
          };
          let (postsDeleted, commentsDeleted, mediaDeleted) = deleteCategoryContent(categoryId);
          let logEntry : CleanupLog = {
            id = nextLogId;
            categoryId;
            categoryName;
            ranAt = nowNs;
            postsDeleted;
            commentsDeleted;
            mediaDeleted;
          };
          cleanupLogs.add(nextLogId, logEntry);
          nextLogId += 1;
          categorySchedules.add(categoryId, { schedule with lastRunAt = ?nowNs });
        };
      };
    };
  };

  // System timer: fires every hour (3_600_000_000_000 ns)
  system func timer(setGlobalTimer : Nat64 -> ()) : async () {
    let oneHourNs : Int = 3_600_000_000_000;
    let nextNs : Int = Time.now() + oneHourNs;
    setGlobalTimer(Nat64.fromNat(Int.abs(nextNs)));
    await runScheduledCleanup();
  };

  public query ({ caller }) func getMyProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only registered users can view profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUser(user : Principal) : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only registered users can view profiles");
    };
    userProfiles.get(user);
  };

  public query ({ caller }) func listUsers() : async [UserProfile] {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only superadmin can list users");
    };
    userProfiles.values().toArray();
  };

  public query ({ caller }) func listUsersWithPrincipal() : async [UserWithPrincipal] {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only superadmin can list users with principals");
    };
    let result = List.empty<UserWithPrincipal>();
    for ((principal, profile) in userProfiles.entries()) {
      result.add({ principal; profile });
    };
    result.toArray();
  };

  public query ({ caller }) func listCategories() : async [Category] {
    switch (userProfiles.get(caller)) {
      case (null) { Runtime.trap("Unauthorized: Only authenticated users can list categories") };
      case (?profile) {
        if (profile.blocked) { Runtime.trap("Unauthorized: Blocked users cannot list categories") };
      };
    };
    let isAdmin = AccessControl.isAdmin(accessControlState, caller);
    if (isAdmin) {
      categories.values().toArray();
    } else {
      categories.values().filter(func(c) {
        let isHidden = switch (categoryHidden.get(c.id)) {
          case (?true) { true };
          case (_) { false };
        };
        if (not isHidden) { return true };
        switch (categoryAllowedUsers.get(c.id)) {
          case (null) { false };
          case (?allowedList) { allowedList.any(func(p) { p == caller }) };
        };
      }).toArray();
    };
  };

  public shared ({ caller }) func register(alias : Text) : async () {
    if (userProfiles.containsKey(caller)) { Runtime.trap("User already registered") };
    for ((_, profile) in userProfiles.entries()) {
      if (profile.alias == alias) { Runtime.trap("Alias already taken") };
    };
    let role : UserRole = if (not isFirstUserRegistered) { #admin } else { #user };
    let profile : UserProfile = {
      alias; role; blocked = false; registeredAt = Time.now();
    };
    userProfiles.add(caller, profile);
    if (not isFirstUserRegistered) { isFirstUserRegistered := true };
  };

  public shared ({ caller }) func blockUser(user : Principal) : async () {
    if (not isModeratorOrAdmin(caller)) {
      Runtime.trap("Unauthorized: Only superadmin or moderator can block users");
    };
    switch (userProfiles.get(user)) {
      case (null) { Runtime.trap("User not found") };
      case (?profile) {
        // Moderators cannot block admins or other moderators
        if (not AccessControl.isAdmin(accessControlState, caller)) {
          if (profile.role == #admin) {
            Runtime.trap("Unauthorized: Moderators cannot block admins");
          };
          switch (moderatorSet.get(user)) {
            case (?true) { Runtime.trap("Unauthorized: Moderators cannot block other moderators") };
            case (_) {};
          };
        };
        userProfiles.add(user, { profile with blocked = true });
      };
    };
  };

  public shared ({ caller }) func unblockUser(user : Principal) : async () {
    if (not isModeratorOrAdmin(caller)) {
      Runtime.trap("Unauthorized: Only superadmin or moderator can unblock users");
    };
    switch (userProfiles.get(user)) {
      case (null) { Runtime.trap("User not found") };
      case (?profile) {
        userProfiles.add(user, { profile with blocked = false });
      };
    };
  };

  public shared ({ caller }) func setRole(user : Principal, role : UserRole) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only superadmin can set roles");
    };
    switch (userProfiles.get(user)) {
      case (null) { Runtime.trap("User not found") };
      case (?profile) {
        userProfiles.add(user, { profile with role });
        AccessControl.assignRole(accessControlState, caller, user, role);
      };
    };
  };

  // Assign moderator privileges to a user (superadmin only)
  public shared ({ caller }) func assignModerator(user : Principal) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only superadmin can assign moderators");
    };
    if (not userProfiles.containsKey(user)) { Runtime.trap("User not found") };
    moderatorSet.add(user, true);
  };

  // Revoke moderator privileges
  public shared ({ caller }) func revokeModerator(user : Principal) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only superadmin can revoke moderators");
    };
    if (not userProfiles.containsKey(user)) { Runtime.trap("User not found") };
    moderatorSet.remove(user);
  };

  // Check if the caller has moderator privileges (or is admin)
  public query ({ caller }) func isCallerModerator() : async Bool {
    isModeratorOrAdmin(caller);
  };

  // Check if a specific user is a moderator
  public query ({ caller }) func isUserModerator(user : Principal) : async Bool {
    let _ = requireActiveUser(caller);
    switch (moderatorSet.get(user)) {
      case (?true) { true };
      case (_) { false };
    };
  };

  // List all moderator principals (superadmin only)
  public query ({ caller }) func listModerators() : async [Principal] {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only superadmin can list moderators");
    };
    moderatorSet.keys().toArray();
  };

  public shared ({ caller }) func deleteUser(user : Principal) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only superadmin can delete users");
    };
    if (not userProfiles.containsKey(user)) { Runtime.trap("User not found") };
    deleteUserContent(user);
    userProfiles.remove(user);
    AccessControl.assignRole(accessControlState, caller, user, #guest);
  };

  public shared ({ caller }) func deleteMyAccount() : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only registered users can delete their account");
    };
    if (not userProfiles.containsKey(caller)) { Runtime.trap("User not found") };
    deleteUserContent(caller);
    userProfiles.remove(caller);
    AccessControl.assignRole(accessControlState, caller, caller, #guest);
  };

  public shared ({ caller }) func createCategory(name : Text) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only superadmin can create categories");
    };
    let id = Time.now().toText();
    let category : Category = { id; name; createdBy = caller; createdAt = Time.now() };
    categories.add(id, category);
  };

  public shared ({ caller }) func deleteCategory(id : Text) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only superadmin can delete categories");
    };
    if (not categories.containsKey(id)) { Runtime.trap("Category not found") };
    categories.remove(id);
    categoryHidden.remove(id);
    categoryAllowedUsers.remove(id);
    categorySchedules.remove(id);
  };

  public shared ({ caller }) func toggleCategoryHidden(id : Text, hidden : Bool) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only superadmin can toggle category visibility");
    };
    if (not categories.containsKey(id)) { Runtime.trap("Category not found") };
    if (hidden) { categoryHidden.add(id, true) } else { categoryHidden.remove(id) };
  };

  public query ({ caller }) func getHiddenCategoryIds() : async [Text] {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only superadmin can view hidden categories");
    };
    categoryHidden.keys().toArray();
  };

  public shared ({ caller }) func addUserToCategoryAllowedList(categoryId : Text, user : Principal) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only superadmin can manage category access");
    };
    if (not categories.containsKey(categoryId)) { Runtime.trap("Category not found") };
    let existingList = switch (categoryAllowedUsers.get(categoryId)) {
      case (null) { List.empty<Principal>() };
      case (?list) { list };
    };
    let alreadyAdded = existingList.any(func(p) { p == user });
    if (not alreadyAdded) {
      existingList.add(user);
      categoryAllowedUsers.add(categoryId, existingList);
    };
  };

  public shared ({ caller }) func removeUserFromCategoryAllowedList(categoryId : Text, user : Principal) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only superadmin can manage category access");
    };
    if (not categories.containsKey(categoryId)) { Runtime.trap("Category not found") };
    switch (categoryAllowedUsers.get(categoryId)) {
      case (null) {};
      case (?list) {
        let filtered = list.filter(func(p) { p != user });
        categoryAllowedUsers.add(categoryId, filtered);
      };
    };
  };

  public query ({ caller }) func getCategoryAllowedUsers(categoryId : Text) : async [Principal] {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only superadmin can view category access lists");
    };
    if (not categories.containsKey(categoryId)) { Runtime.trap("Category not found") };
    switch (categoryAllowedUsers.get(categoryId)) {
      case (null) { [] };
      case (?list) { list.toArray() };
    };
  };

  // ====== SCHEDULED CLEANUP API ======

  public shared ({ caller }) func setCategorySchedule(
    categoryId : Text,
    enabled : Bool,
    weekday : Nat,
    hour : Nat
  ) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only superadmin can set category schedules");
    };
    if (not categories.containsKey(categoryId)) { Runtime.trap("Category not found") };
    if (weekday > 6) { Runtime.trap("Weekday must be 0-6") };
    if (hour > 23) { Runtime.trap("Hour must be 0-23") };
    let existing = categorySchedules.get(categoryId);
    let lastRunAt = switch (existing) {
      case (?s) { s.lastRunAt };
      case (null) { null };
    };
    categorySchedules.add(categoryId, { enabled; weekday; hour; lastRunAt });
  };

  public query ({ caller }) func getCategorySchedule(categoryId : Text) : async ?CategorySchedule {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only superadmin can view category schedules");
    };
    categorySchedules.get(categoryId);
  };

  public query ({ caller }) func listCleanupLogs(categoryId : ?Text) : async [CleanupLog] {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only superadmin can view cleanup logs");
    };
    switch (categoryId) {
      case (null) { cleanupLogs.values().toArray() };
      case (?catId) {
        cleanupLogs.values().toArray().filter(func(log) { log.categoryId == catId })
      };
    };
  };

  // ====== END SCHEDULED CLEANUP API ======

  public shared ({ caller }) func createPost(title : Text, body : Text, categoryId : Text) : async Text {
    let _ = requireActiveUser(caller);
    if (not categories.containsKey(categoryId)) { Runtime.trap("Category not found") };
    let postId = Time.now().toText();
    let post : Post = {
      id = postId; title; body; categoryId;
      authorPrincipal = caller;
      createdAt = Time.now(); updatedAt = Time.now();
      pinned = false; likeCount = 0;
    };
    posts.add(postId, post);
    postId
  };

  public shared ({ caller }) func editPost(postId : Text, title : Text, body : Text, categoryId : Text) : async () {
    let _ = requireActiveUser(caller);
    if (not categories.containsKey(categoryId)) { Runtime.trap("Category not found") };
    switch (posts.get(postId)) {
      case (null) { Runtime.trap("Post not found") };
      case (?existingPost) {
        if (existingPost.authorPrincipal != caller and not isModeratorOrAdmin(caller)) {
          Runtime.trap("Unauthorized: Only author, moderator, or superadmin can edit");
        };
        posts.add(postId, { existingPost with title; body; categoryId; updatedAt = Time.now() });
      };
    };
  };

  public shared ({ caller }) func recordPostHash(postId : Text, hash : Text) : async () {
    switch (posts.get(postId)) {
      case (null) { Runtime.trap("Post not found") };
      case (?post) {
        if (post.authorPrincipal != caller and not isModeratorOrAdmin(caller)) {
          Runtime.trap("Unauthorized");
        };
        let existing = switch (postHashHistory.get(postId)) {
          case (null) { List.empty<(Text, Int)>() };
          case (?l) { l };
        };
        existing.add((hash, Time.now()));
        postHashHistory.add(postId, existing);
      };
    };
  };

  public query func getPostHashHistory(postId : Text) : async [(Text, Int)] {
    switch (postHashHistory.get(postId)) {
      case (null) { [] };
      case (?list) { list.toArray() };
    };
  };

  public shared ({ caller }) func deletePost(postId : Text) : async () {
    switch (posts.get(postId)) {
      case (null) { Runtime.trap("Post not found") };
      case (?post) {
        if (post.authorPrincipal != caller and not isModeratorOrAdmin(caller)) {
          Runtime.trap("Unauthorized: Only author, moderator, or superadmin can delete");
        };
        posts.remove(postId);
        postLikes.remove(postId);
        postFollows.remove(postId);
        let toDelete = List.empty<Text>();
        for ((cid, c) in comments.entries()) {
          if (c.postId == postId) { toDelete.add(cid) };
        };
        for (cid in toDelete.toArray().vals()) {
          comments.remove(cid);
          commentLikes.remove(cid);
        };
        let toDeleteNotifs = List.empty<Nat>();
        for ((nid, notif) in notifications.entries()) {
          if (notif.postId == postId) { toDeleteNotifs.add(nid) };
        };
        for (nid in toDeleteNotifs.toArray().vals()) {
          notifications.remove(nid);
        };
      };
    };
  };

  public shared ({ caller }) func pinPost(postId : Text, pinned : Bool) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only superadmin can pin posts");
    };
    switch (posts.get(postId)) {
      case (null) { Runtime.trap("Post not found") };
      case (?existingPost) { posts.add(postId, { existingPost with pinned }) };
    };
  };

  public shared ({ caller }) func likePost(postId : Text) : async () {
    let _ = requireActiveUser(caller);
    if (not posts.containsKey(postId)) { Runtime.trap("Post not found") };
    let existingLikes = switch (postLikes.get(postId)) {
      case (null) { List.empty<Principal>() };
      case (?likes) { likes };
    };
    let alreadyLiked = existingLikes.any(func(p) { p == caller });
    if (alreadyLiked) {
      let filtered = existingLikes.filter(func(p) { p != caller });
      postLikes.add(postId, filtered);
    } else {
      existingLikes.add(caller);
      postLikes.add(postId, existingLikes);
    };
    let likeCount = switch (postLikes.get(postId)) {
      case (null) { 0 };
      case (?likes) { likes.size() };
    };
    switch (posts.get(postId)) {
      case (null) { Runtime.trap("Post not found") };
      case (?post) { posts.add(postId, { post with likeCount }) };
    };
  };

  public query ({ caller }) func getPost(postId : Text) : async ?Post {
    let _ = requireActiveUser(caller);
    posts.get(postId);
  };

  public query ({ caller }) func listPosts(categoryId : ?Text) : async [Post] {
    let _ = requireActiveUser(caller);
    let allPosts = posts.values().toArray();
    switch (categoryId) {
      case (null) { allPosts };
      case (?catId) { allPosts.filter(func(p) { p.categoryId == catId }) };
    };
  };

  public query ({ caller }) func listPostsByAuthor(alias : Text) : async [Post] {
    let _ = requireActiveUser(caller);
    let authorPrincipalOpt = userProfiles.entries().find(func((_, profile)) { profile.alias == alias });
    let authorPrincipal = switch (authorPrincipalOpt) {
      case (null) { Runtime.trap("Author not found") };
      case (?(principal, _)) { principal };
    };
    posts.values().toArray().filter(func(post) { post.authorPrincipal == authorPrincipal });
  };

  public query ({ caller }) func getMyLikedPosts() : async [Text] {
    let _ = requireActiveUser(caller);
    let likedPosts = List.empty<Text>();
    for ((postId, likes) in postLikes.entries()) {
      if (likes.any(func(p) { p == caller })) { likedPosts.add(postId) };
    };
    likedPosts.toArray();
  };

  public shared ({ caller }) func createComment(postId : Text, body : Text, parentId : ?Text) : async () {
    let _ = requireActiveUser(caller);
    if (not posts.containsKey(postId)) { Runtime.trap("Post not found") };
    switch (parentId) {
      case (?pid) {
        if (not comments.containsKey(pid)) { Runtime.trap("Parent comment not found") };
      };
      case (null) {};
    };
    let commentId = Time.now().toText() # "-" # caller.toText();
    let comment : Comment = {
      id = commentId; postId; parentId; body;
      authorPrincipal = caller;
      createdAt = Time.now(); likeCount = 0;
    };
    comments.add(commentId, comment);
    let event : NotificationEvent = switch (parentId) {
      case (?_) { #NewReply };
      case (null) { #NewComment };
    };
    notifyPostFollowers(postId, caller, event);
  };

  public shared ({ caller }) func editComment(commentId : Text, body : Text) : async () {
    let _ = requireActiveUser(caller);
    switch (comments.get(commentId)) {
      case (null) { Runtime.trap("Comment not found") };
      case (?c) {
        if (c.authorPrincipal != caller and not isModeratorOrAdmin(caller)) {
          Runtime.trap("Unauthorized: Only author, moderator, or superadmin can edit comment");
        };
        comments.add(commentId, { c with body });
      };
    };
  };

  public shared ({ caller }) func deleteComment(commentId : Text) : async () {
    switch (comments.get(commentId)) {
      case (null) { Runtime.trap("Comment not found") };
      case (?c) {
        if (c.authorPrincipal != caller and not isModeratorOrAdmin(caller)) {
          Runtime.trap("Unauthorized: Only author, moderator, or superadmin can delete comment");
        };
        comments.remove(commentId);
        commentLikes.remove(commentId);
        let toDelete = List.empty<Text>();
        for ((cid, child) in comments.entries()) {
          switch (child.parentId) {
            case (?pid) { if (pid == commentId) { toDelete.add(cid) } };
            case (null) {};
          };
        };
        for (cid in toDelete.toArray().vals()) {
          comments.remove(cid);
          commentLikes.remove(cid);
        };
      };
    };
  };

  public shared ({ caller }) func likeComment(commentId : Text) : async () {
    let _ = requireActiveUser(caller);
    if (not comments.containsKey(commentId)) { Runtime.trap("Comment not found") };
    let existingLikes = switch (commentLikes.get(commentId)) {
      case (null) { List.empty<Principal>() };
      case (?likes) { likes };
    };
    let alreadyLiked = existingLikes.any(func(p) { p == caller });
    if (alreadyLiked) {
      let filtered = existingLikes.filter(func(p) { p != caller });
      commentLikes.add(commentId, filtered);
    } else {
      existingLikes.add(caller);
      commentLikes.add(commentId, existingLikes);
    };
    let likeCount = switch (commentLikes.get(commentId)) {
      case (null) { 0 };
      case (?likes) { likes.size() };
    };
    switch (comments.get(commentId)) {
      case (null) { Runtime.trap("Comment not found") };
      case (?c) { comments.add(commentId, { c with likeCount }) };
    };
  };

  public query ({ caller }) func listComments(postId : Text) : async [Comment] {
    let _ = requireActiveUser(caller);
    comments.values().toArray().filter(func(c) { c.postId == postId });
  };

  public query ({ caller }) func getMyLikedComments() : async [Text] {
    let _ = requireActiveUser(caller);
    let liked = List.empty<Text>();
    for ((commentId, likes) in commentLikes.entries()) {
      if (likes.any(func(p) { p == caller })) { liked.add(commentId) };
    };
    liked.toArray();
  };

  public query ({ caller }) func search(searchQuery : Text) : async SearchResult {
    let _ = requireActiveUser(caller);
    let lq = searchQuery.toLower();
    let matchedPosts = posts.values().toArray().filter(func(p) {
      p.title.toLower().contains(#text lq) or p.body.toLower().contains(#text lq)
    });
    let matchedComments = comments.values().toArray().filter(func(c) {
      if (c.body.toLower().contains(#text lq)) { return true };
      switch (userProfiles.get(c.authorPrincipal)) {
        case (?profile) { profile.alias.toLower().contains(#text lq) };
        case (null) { false };
      };
    });
    { posts = matchedPosts; comments = matchedComments };
  };

  // ====== MEDIA FILE FUNCTIONS ======

  public shared ({ caller }) func uploadMedia(postId : ?Nat, commentId : ?Nat, fileType : Text, fileName : Text, fileSize : Nat, blobKey : Text) : async Nat {
    let _ = requireActiveUser(caller);
    let maxSize = if (fileType == "image") { 15_728_640 } else if (fileType == "video") {
      104_857_600;
    } else { Runtime.trap("Invalid file type") };
    if (fileSize > maxSize) { Runtime.trap("File size exceeds limit") };
    let mediaId = nextMediaId;
    nextMediaId += 1;
    let media : MediaFile = {
      id = mediaId; ownerId = caller; postId; commentId;
      fileType; fileName; fileSize; blobKey; uploadedAt = Time.now();
    };
    mediaFiles.add(mediaId, media);
    switch (postId) {
      case (?pid) { notifyPostFollowers(pid.toText(), caller, #NewMedia) };
      case (null) {};
    };
    mediaId;
  };

  public query ({ caller }) func getMediaForPost(postId : Nat) : async [MediaFile] {
    let _ = requireActiveUser(caller);
    mediaFiles.values().toArray().filter(func(m) { switch (m.postId) { case (?id) { id == postId }; case (null) { false } } });
  };

  public query ({ caller }) func getMediaForComment(commentId : Nat) : async [MediaFile] {
    let _ = requireActiveUser(caller);
    mediaFiles.values().toArray().filter(func(m) { switch (m.commentId) { case (?id) { id == commentId }; case (null) { false } } });
  };

  public shared ({ caller }) func deleteMedia(mediaId : Nat) : async () {
    switch (mediaFiles.get(mediaId)) {
      case (null) { Runtime.trap("Media file not found") };
      case (?media) {
        if (media.ownerId != caller and not isModeratorOrAdmin(caller)) {
          Runtime.trap("Unauthorized: Only owner, moderator, or admin can delete media");
        };
        mediaFiles.remove(mediaId);
      };
    };
  };

  public query ({ caller }) func getAllMedia() : async [MediaFile] {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admin can access all media");
    };
    mediaFiles.values().toArray();
  };

  // ====== FOLLOW FUNCTIONS ======

  public shared ({ caller }) func followUser(userToFollow : Principal) : async () {
    let _ = requireActiveUser(caller);
    if (caller == userToFollow) { Runtime.trap("Cannot follow yourself") };
    if (not userProfiles.containsKey(userToFollow)) { Runtime.trap("User not found") };
    let existingFollows = switch (userFollows.get(caller)) {
      case (null) { List.empty<Principal>() };
      case (?list) { list };
    };
    let alreadyFollowing = existingFollows.any(func(p) { p == userToFollow });
    if (not alreadyFollowing) {
      existingFollows.add(userToFollow);
      userFollows.add(caller, existingFollows);
    };
  };

  public shared ({ caller }) func unfollowUser(userToUnfollow : Principal) : async () {
    let _ = requireActiveUser(caller);
    switch (userFollows.get(caller)) {
      case (null) {};
      case (?list) {
        let filtered = list.filter(func(p) { p != userToUnfollow });
        userFollows.add(caller, filtered);
      };
    };
  };

  public shared ({ caller }) func followPost(postId : Text) : async () {
    let _ = requireActiveUser(caller);
    if (not posts.containsKey(postId)) { Runtime.trap("Post not found") };
    let existingFollowers = switch (postFollows.get(postId)) {
      case (null) { List.empty<Principal>() };
      case (?list) { list };
    };
    let alreadyFollowing = existingFollowers.any(func(p) { p == caller });
    if (not alreadyFollowing) {
      existingFollowers.add(caller);
      postFollows.add(postId, existingFollowers);
    };
  };

  public shared ({ caller }) func unfollowPost(postId : Text) : async () {
    let _ = requireActiveUser(caller);
    switch (postFollows.get(postId)) {
      case (null) {};
      case (?list) {
        let filtered = list.filter(func(p) { p != caller });
        postFollows.add(postId, filtered);
      };
    };
  };

  public query ({ caller }) func getFollowedUsers() : async [Principal] {
    let _ = requireActiveUser(caller);
    switch (userFollows.get(caller)) {
      case (null) { [] };
      case (?list) { list.toArray() };
    };
  };

  public query ({ caller }) func getFollowedUsersPosts() : async [Post] {
    let _ = requireActiveUser(caller);
    let followed = switch (userFollows.get(caller)) {
      case (null) { return [] };
      case (?list) { list };
    };
    posts.values().toArray().filter(func(post) {
      followed.any(func(p) { p == post.authorPrincipal })
    });
  };

  public query ({ caller }) func getFollowedPosts() : async [Text] {
    let _ = requireActiveUser(caller);
    let result = List.empty<Text>();
    for ((postId, followers) in postFollows.entries()) {
      if (followers.any(func(p) { p == caller })) { result.add(postId) };
    };
    result.toArray();
  };

  public query ({ caller }) func isFollowingUser(userToCheck : Principal) : async Bool {
    let _ = requireActiveUser(caller);
    switch (userFollows.get(caller)) {
      case (null) { false };
      case (?list) { list.any(func(p) { p == userToCheck }) };
    };
  };

  public query ({ caller }) func isFollowingPost(postId : Text) : async Bool {
    let _ = requireActiveUser(caller);
    switch (postFollows.get(postId)) {
      case (null) { false };
      case (?list) { list.any(func(p) { p == caller }) };
    };
  };

  public query ({ caller }) func getPostFollowerCount(postId : Text) : async Nat {
    let _ = requireActiveUser(caller);
    switch (postFollows.get(postId)) {
      case (null) { 0 };
      case (?list) { list.size() };
    };
  };

  // ====== NOTIFICATION FUNCTIONS ======

  public query ({ caller }) func getMyNotifications() : async [Notification] {
    let _ = requireActiveUser(caller);
    notifications.values().toArray().filter(func(n) { n.recipientPrincipal == caller });
  };

  public query ({ caller }) func getUnreadNotificationCount() : async Nat {
    let _ = requireActiveUser(caller);
    var count = 0;
    for ((_, notif) in notifications.entries()) {
      if (notif.recipientPrincipal == caller and not notif.read) { count += 1 };
    };
    count;
  };

  public shared ({ caller }) func markNotificationRead(notifId : Nat) : async () {
    let _ = requireActiveUser(caller);
    switch (notifications.get(notifId)) {
      case (null) { Runtime.trap("Notification not found") };
      case (?notif) {
        if (notif.recipientPrincipal != caller) { Runtime.trap("Unauthorized: Not your notification") };
        notifications.add(notifId, { notif with read = true });
      };
    };
  };

  public shared ({ caller }) func markAllNotificationsRead() : async () {
    let _ = requireActiveUser(caller);
    for ((nid, notif) in notifications.entries()) {
      if (notif.recipientPrincipal == caller and not notif.read) {
        notifications.add(nid, { notif with read = true });
      };
    };
  };

  public shared ({ caller }) func deleteNotification(notifId : Nat) : async () {
    let _ = requireActiveUser(caller);
    switch (notifications.get(notifId)) {
      case (null) { Runtime.trap("Notification not found") };
      case (?notif) {
        if (notif.recipientPrincipal != caller) { Runtime.trap("Unauthorized: Not your notification") };
        notifications.remove(notifId);
      };
    };
  };
};
