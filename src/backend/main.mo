import Map "mo:core/Map";
import Text "mo:core/Text";
import Time "mo:core/Time";
import List "mo:core/List";
import Runtime "mo:core/Runtime";
import Principal "mo:core/Principal";
import AccessControl "authorization/access-control";
import MixinAuthorization "authorization/MixinAuthorization";
import Iter "mo:core/Iter";



actor {
  // State
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  type UserRole = AccessControl.UserRole;
  type UserProfile = {
    alias : Text;
    role : UserRole;
    blocked : Bool;
    registeredAt : Time.Time;
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

  let userProfiles = Map.empty<Principal, UserProfile>();
  let categories = Map.empty<Text, Category>();
  var posts = Map.empty<Text, Post>();
  var postLikes = Map.empty<Text, List.List<Principal>>();
  var comments = Map.empty<Text, Comment>();
  var commentLikes = Map.empty<Text, List.List<Principal>>();
  var isFirstUserRegistered : Bool = false;

  // Helper: check caller is authenticated and not blocked
  func requireActiveUser(caller : Principal) : UserProfile {
    switch (userProfiles.get(caller)) {
      case (null) { Runtime.trap("Unauthorized: Must be registered") };
      case (?profile) {
        if (profile.blocked) { Runtime.trap("Unauthorized: Blocked users cannot perform this action") };
        profile;
      };
    };
  };

  // User Queries
  public query ({ caller }) func getMyProfile() : async ?UserProfile {
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUser(user : Principal) : async ?UserProfile {
    userProfiles.get(user);
  };

  public query ({ caller }) func listUsers() : async [UserProfile] {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only superadmin can list users");
    };
    userProfiles.values().toArray();
  };

  // Category Queries
  public query ({ caller }) func listCategories() : async [Category] {
    switch (userProfiles.get(caller)) {
      case (null) {
        Runtime.trap("Unauthorized: Only authenticated users can list categories");
      };
      case (?profile) {
        if (profile.blocked) {
          Runtime.trap("Unauthorized: Blocked users cannot list categories");
        };
      };
    };
    categories.values().toArray();
  };

  // User Updates
  public shared ({ caller }) func register(alias : Text) : async () {
    if (userProfiles.containsKey(caller)) {
      Runtime.trap("User already registered");
    };

    for ((_, profile) in userProfiles.entries()) {
      if (profile.alias == alias) {
        Runtime.trap("Alias already taken");
      };
    };

    let role : UserRole = if (not isFirstUserRegistered) { #admin } else { #user };

    let profile : UserProfile = {
      alias;
      role;
      blocked = false;
      registeredAt = Time.now();
    };

    userProfiles.add(caller, profile);
    AccessControl.assignRole(accessControlState, caller, caller, role);

    if (not isFirstUserRegistered) {
      isFirstUserRegistered := true;
    };
  };

  public shared ({ caller }) func blockUser(user : Principal) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only superadmin can block users");
    };

    switch (userProfiles.get(user)) {
      case (null) { Runtime.trap("User not found") };
      case (?profile) {
        userProfiles.add(user, { profile with blocked = true });
      };
    };
  };

  public shared ({ caller }) func unblockUser(user : Principal) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only superadmin can unblock users");
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

  // Category Updates
  public shared ({ caller }) func createCategory(name : Text) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only superadmin can create categories");
    };

    let id = Time.now().toText();
    let category : Category = {
      id;
      name;
      createdBy = caller;
      createdAt = Time.now();
    };

    categories.add(id, category);
  };

  public shared ({ caller }) func deleteCategory(id : Text) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only superadmin can delete categories");
    };

    if (not categories.containsKey(id)) {
      Runtime.trap("Category not found");
    };

    categories.remove(id);
  };

  // Post Methods
  public shared ({ caller }) func createPost(title : Text, body : Text, categoryId : Text) : async () {
    let _ = requireActiveUser(caller);

    if (not categories.containsKey(categoryId)) {
      Runtime.trap("Category not found");
    };

    let postId = Time.now().toText();
    let post : Post = {
      id = postId;
      title;
      body;
      categoryId;
      authorPrincipal = caller;
      createdAt = Time.now();
      updatedAt = Time.now();
      pinned = false;
      likeCount = 0;
    };

    posts.add(postId, post);
  };

  public shared ({ caller }) func editPost(postId : Text, title : Text, body : Text, categoryId : Text) : async () {
    let _ = requireActiveUser(caller);

    if (not categories.containsKey(categoryId)) {
      Runtime.trap("Category not found");
    };

    switch (posts.get(postId)) {
      case (null) { Runtime.trap("Post not found") };
      case (?existingPost) {
        if (existingPost.authorPrincipal != caller and not AccessControl.isAdmin(accessControlState, caller)) {
          Runtime.trap("Unauthorized: Only author or superadmin can edit");
        };
        posts.add(postId, { existingPost with title; body; categoryId; updatedAt = Time.now() });
      };
    };
  };

  public shared ({ caller }) func deletePost(postId : Text) : async () {
    switch (posts.get(postId)) {
      case (null) { Runtime.trap("Post not found") };
      case (?post) {
        if (post.authorPrincipal != caller and not AccessControl.isAdmin(accessControlState, caller)) {
          Runtime.trap("Unauthorized: Only author or superadmin can delete");
        };
        posts.remove(postId);
        postLikes.remove(postId);
        // Clean up comments for this post
        let toDelete = List.empty<Text>();
        for ((cid, c) in comments.entries()) {
          if (c.postId == postId) { toDelete.add(cid) };
        };
        for (cid in toDelete.toArray().vals()) {
          comments.remove(cid);
          commentLikes.remove(cid);
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
      case (?existingPost) {
        posts.add(postId, { existingPost with pinned });
      };
    };
  };

  public shared ({ caller }) func likePost(postId : Text) : async () {
    let _ = requireActiveUser(caller);

    if (not posts.containsKey(postId)) {
      Runtime.trap("Post not found");
    };

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
      case (?post) {
        posts.add(postId, { post with likeCount });
      };
    };
  };

  // Post Queries
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
      if (likes.any(func(p) { p == caller })) {
        likedPosts.add(postId);
      };
    };
    likedPosts.toArray();
  };

  // ========== COMMENT METHODS ==========

  public shared ({ caller }) func createComment(postId : Text, body : Text, parentId : ?Text) : async () {
    let _ = requireActiveUser(caller);

    if (not posts.containsKey(postId)) {
      Runtime.trap("Post not found");
    };

    switch (parentId) {
      case (?pid) {
        if (not comments.containsKey(pid)) {
          Runtime.trap("Parent comment not found");
        };
      };
      case (null) {};
    };

    let commentId = Time.now().toText() # "-" # caller.toText();
    let comment : Comment = {
      id = commentId;
      postId;
      parentId;
      body;
      authorPrincipal = caller;
      createdAt = Time.now();
      likeCount = 0;
    };

    comments.add(commentId, comment);
  };

  public shared ({ caller }) func editComment(commentId : Text, body : Text) : async () {
    let _ = requireActiveUser(caller);

    switch (comments.get(commentId)) {
      case (null) { Runtime.trap("Comment not found") };
      case (?c) {
        if (c.authorPrincipal != caller) {
          Runtime.trap("Unauthorized: Only author can edit comment");
        };
        comments.add(commentId, { c with body });
      };
    };
  };

  public shared ({ caller }) func deleteComment(commentId : Text) : async () {
    switch (comments.get(commentId)) {
      case (null) { Runtime.trap("Comment not found") };
      case (?c) {
        if (c.authorPrincipal != caller and not AccessControl.isAdmin(accessControlState, caller)) {
          Runtime.trap("Unauthorized: Only author or superadmin can delete comment");
        };
        comments.remove(commentId);
        commentLikes.remove(commentId);
        // Remove child comments
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

    if (not comments.containsKey(commentId)) {
      Runtime.trap("Comment not found");
    };

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
      case (?c) {
        comments.add(commentId, { c with likeCount });
      };
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
      if (likes.any(func(p) { p == caller })) {
        liked.add(commentId);
      };
    };
    liked.toArray();
  };

  // Search
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
};
