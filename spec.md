# HKLOblogg

## Current State
Bloggen har kategorier, inlägg, kommentarer, likes, media-uppladdning, category hiding/whitelisting och användarsystem med Internet Identity. Backend är i Motoko.

## Requested Changes (Diff)

### Add
- `userFollows` map: lagrar vilka användare en principal följer
- `postFollows` map: lagrar vilka användare som följer ett visst inlägg
- `followUser(user)` / `unfollowUser(user)` – följa/avfölja en användare
- `followPost(postId)` / `unfollowPost(postId)` – följa/avfölja ett inlägg
- `getFollowedUsers()` – returnerar lista med principals jag följer
- `getFollowedUsersPosts()` – returnerar inlägg från användare jag följer
- `getFollowedPosts()` – returnerar lista med post-IDs jag följer
- `isFollowingUser(user)` – returnerar bool
- `isFollowingPost(postId)` – returnerar bool
- `getPostFollowerCount(postId)` – antal som följer ett inlägg
- Rensa upp följ-relationer när en användare raderas (deleteUserContent)

### Modify
- `deleteUserContent` – ta bort user från userFollows och postFollows vid radering

### Remove
- Inget

## Implementation Plan
1. Lägg till `userFollows` och `postFollows` maps i state
2. Implementera followUser/unfollowUser med validering
3. Implementera followPost/unfollowPost med validering
4. Implementera query-metoder: getFollowedUsers, getFollowedUsersPosts, getFollowedPosts, isFollowingUser, isFollowingPost, getPostFollowerCount
5. Uppdatera deleteUserContent för att städa upp följ-data
