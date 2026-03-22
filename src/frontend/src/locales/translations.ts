export type Language = "en" | "sv" | "fr" | "de" | "es";

export const LANGUAGES: { code: Language; label: string; flag: string }[] = [
  { code: "en", label: "EN", flag: "🇬🇧" },
  { code: "sv", label: "SV", flag: "🇸🇪" },
  { code: "fr", label: "FR", flag: "🇫🇷" },
  { code: "de", label: "DE", flag: "🇩🇪" },
  { code: "es", label: "ES", flag: "🇪🇸" },
];

export const translations: Record<Language, Record<string, string>> = {
  en: {
    // Login page
    tagline:
      "A platform for freedom of opinion, freedom of expression, and respectful dialogue",
    tagline2: "– with a focus on privacy and GDPR",
    welcome: "Welcome",
    loginDesc: "Log in with Internet Identity to read and participate.",
    loginButton: "Log in with Internet Identity",
    loggingIn: "Logging in…",
    newUser: "New user?",
    createIdentity: "Create an Internet Identity here",
    transparencyTitle: "Transparency",
    transparencyText:
      "The blog runs on Internet Computer Protocol (ICP), a decentralised blockchain. This means the platform's code and data are deployed on ICP and can be verified — no single party controls or can manipulate the infrastructure.",
    gdprTitle: "Clarification – Right to be Forgotten",
    gdprText:
      "You have the right to be forgotten — you can delete your account yourself, and all your posts and comments will be removed from the HKLO-blog's visible interface. Please note, however, that since content is stored on ",
    gdprIcp: "Internet Computer Protocol (ICP)",
    gdprText2:
      ", a type of blockchain, it is technically impossible to fully delete information that has once been written to the blockchain. It means that content may remain in the blockchain's history, but it will no longer be accessible or visible to other users on HKLO-bloggen.",
    footerBuilt: "Built with ❤ via caffeine.ai",
    // Header
    blogTitle: "HKLOblogg",
    searchPlaceholder: "Search posts…",
    profileLabel: "Profile",
    adminPanel: "Admin panel",
    logout: "Log out",
    notifications: "Notifications",
    markAllRead: "Mark all as read",
    noNotifications: "No notifications yet",
    newComment: "New comment",
    newReply: "New reply",
    newMedia: "New media",
    newEvent: "New event",
    justNow: "Just now",
    minutesAgo: "min ago",
    hoursAgo: "h ago",
    daysAgo: "day ago",
    postLabel: "Post:",
    // SubNav
    home: "Home",
    myFeed: "My feed",
    newPost: "New post",
    categories: "Categories",
    // Category sheet
    allPosts: "All posts",
    closeCategories: "Close category panel",
    // MittFlodePage
    myFeedTitle: "My feed",
    back: "Back",
    followedUsers: "Followed users",
    followedPosts: "Followed posts",
    noPostsFromFollowed: "No posts from followed users yet.",
    startFollowingUsers: "Start following users to see their posts here.",
    noFollowedPosts: "You are not following any posts yet.",
    clickToFollowPost: "Click 'Follow post' on a post to follow it.",
    unknownCategory: "Unknown category",
    pinned: "Pinned",
    // FeedPage
    noPostsYet: "No posts yet. Be the first to write!",
    welcomeBanner:
      "Welcome! Enter your display name in your profile to write posts and comments.",
    goToProfile: "Go to profile",
    loadingLonger: "Loading is taking longer than expected.",
    reloadPage: "Reload page",
    logoutAndRetry: "Log out and try again",
  },
  sv: {
    // Login page
    tagline:
      "En plattform för åsiktsfrihet, yttrandefrihet och respektfull dialog",
    tagline2: "– med fokus på integritet och GDPR",
    welcome: "Välkommen",
    loginDesc: "Logga in med Internet Identity för att läsa och delta.",
    loginButton: "Logga in med Internet Identity",
    loggingIn: "Loggar in…",
    newUser: "Ny användare?",
    createIdentity: "Skapa ett Internet Identity här",
    transparencyTitle: "Transparens",
    transparencyText:
      "Bloggen drivs på Internet Computer Protocol (ICP), en decentraliserad blockkedja. Det innebär att plattformens kod och data är driftsatt på ICP och kan verifieras -- ingen enskild part kontrollerar eller kan manipulera infrastrukturen.",
    gdprTitle: "Förtydligande – Rätten att bli glömd",
    gdprText:
      "Du har rätt att bli glömd – Du kan själv radera ditt konto, och alla dina inlägg och kommentarer kommer att tas bort från HKLO-bloggens synliga gränssnitt. Observera dock att eftersom innehållet lagras på ",
    gdprIcp: "Internet Computer Protocol (ICP)",
    gdprText2:
      ", en typ av blockkedja, är det tekniskt omöjligt att helt radera information som en gång har skrivits in i blockkedjan. Det innebär att innehållet kan finnas kvar i blockkedjans historik, men det kommer inte längre att vara tillgängligt eller synligt för andra användare på HKLO-bloggen.",
    footerBuilt: "Byggd med ❤ via caffeine.ai",
    // Header
    blogTitle: "HKLOblogg",
    searchPlaceholder: "Sök inlägg…",
    profileLabel: "Profil",
    adminPanel: "Adminpanel",
    logout: "Logga ut",
    notifications: "Notiser",
    markAllRead: "Markera alla som lästa",
    noNotifications: "Inga notiser ännu",
    newComment: "Ny kommentar",
    newReply: "Nytt svar",
    newMedia: "Ny media",
    newEvent: "Ny händelse",
    justNow: "Just nu",
    minutesAgo: "min sedan",
    hoursAgo: "tim sedan",
    daysAgo: "dag sedan",
    postLabel: "Inlägg:",
    // SubNav
    home: "Hem",
    myFeed: "Mitt flöde",
    newPost: "Nytt inlägg",
    categories: "Kategorier",
    // Category sheet
    allPosts: "Alla inlägg",
    closeCategories: "Stäng kategoripanel",
    // MittFlodePage
    myFeedTitle: "Mitt flöde",
    back: "Tillbaka",
    followedUsers: "Följda användare",
    followedPosts: "Följda inlägg",
    noPostsFromFollowed: "Inga inlägg från följda användare ännu.",
    startFollowingUsers: "Börja följa användare för att se deras inlägg här.",
    noFollowedPosts: "Du följer inga inlägg ännu.",
    clickToFollowPost:
      'Klicka på "Följ inlägg" på ett inlägg för att följa det.',
    unknownCategory: "Okänd kategori",
    pinned: "Fastnålad",
    // FeedPage
    noPostsYet: "Inga inlägg ännu. Var den första att skriva!",
    welcomeBanner:
      "Välkommen! Ange ditt visningsnamn i din profil för att kunna skriva inlägg och kommentarer.",
    goToProfile: "Gå till profilen",
    loadingLonger: "Inläsningen tar längre tid än väntat.",
    reloadPage: "Ladda om sidan",
    logoutAndRetry: "Logga ut och försök igen",
  },
  fr: {
    // Login page
    tagline:
      "Une plateforme pour la liberté d'opinion, la liberté d'expression et le dialogue respectueux",
    tagline2: "– axée sur la vie privée et le RGPD",
    welcome: "Bienvenue",
    loginDesc: "Connectez-vous avec Internet Identity pour lire et participer.",
    loginButton: "Se connecter avec Internet Identity",
    loggingIn: "Connexion…",
    newUser: "Nouvel utilisateur ?",
    createIdentity: "Créer une Internet Identity ici",
    transparencyTitle: "Transparence",
    transparencyText:
      "Le blog fonctionne sur Internet Computer Protocol (ICP), une blockchain décentralisée. Cela signifie que le code et les données de la plateforme sont déployés sur ICP et peuvent être vérifiés — aucune partie unique ne contrôle ou ne peut manipuler l'infrastructure.",
    gdprTitle: "Clarification – Droit à l'oubli",
    gdprText:
      "Vous avez le droit à l'oubli — vous pouvez supprimer votre compte vous-même, et tous vos articles et commentaires seront supprimés de l'interface visible d'HKLO-blog. Veuillez noter cependant que, puisque le contenu est stocké sur ",
    gdprIcp: "Internet Computer Protocol (ICP)",
    gdprText2:
      ", un type de blockchain, il est techniquement impossible de supprimer complètement les informations qui ont été écrites dans la blockchain. Cela signifie que le contenu peut rester dans l'historique de la blockchain, mais il ne sera plus accessible ni visible par d'autres utilisateurs sur HKLO-bloggen.",
    footerBuilt: "Construit avec ❤ via caffeine.ai",
    // Header
    blogTitle: "HKLOblogg",
    searchPlaceholder: "Rechercher des articles…",
    profileLabel: "Profil",
    adminPanel: "Panneau d'administration",
    logout: "Se déconnecter",
    notifications: "Notifications",
    markAllRead: "Tout marquer comme lu",
    noNotifications: "Aucune notification pour l'instant",
    newComment: "Nouveau commentaire",
    newReply: "Nouvelle réponse",
    newMedia: "Nouveau média",
    newEvent: "Nouvel événement",
    justNow: "À l'instant",
    minutesAgo: "min",
    hoursAgo: "h",
    daysAgo: "j",
    postLabel: "Article :",
    // SubNav
    home: "Accueil",
    myFeed: "Mon fil",
    newPost: "Nouvel article",
    categories: "Catégories",
    // Category sheet
    allPosts: "Tous les articles",
    closeCategories: "Fermer le panneau des catégories",
    // MittFlodePage
    myFeedTitle: "Mon fil",
    back: "Retour",
    followedUsers: "Utilisateurs suivis",
    followedPosts: "Articles suivis",
    noPostsFromFollowed:
      "Aucun article des utilisateurs suivis pour l'instant.",
    startFollowingUsers:
      "Commencez à suivre des utilisateurs pour voir leurs articles ici.",
    noFollowedPosts: "Vous ne suivez aucun article pour l'instant.",
    clickToFollowPost:
      "Cliquez sur 'Suivre l'article' sur un article pour le suivre.",
    unknownCategory: "Catégorie inconnue",
    pinned: "Épinglé",
    // FeedPage
    noPostsYet: "Aucun article pour l'instant. Soyez le premier à écrire !",
    welcomeBanner:
      "Bienvenue ! Entrez votre nom d'affichage dans votre profil pour écrire des articles et des commentaires.",
    goToProfile: "Aller au profil",
    loadingLonger: "Le chargement prend plus de temps que prévu.",
    reloadPage: "Recharger la page",
    logoutAndRetry: "Se déconnecter et réessayer",
  },
  de: {
    // Login page
    tagline:
      "Eine Plattform für Meinungsfreiheit, Redefreiheit und respektvolle Dialoge",
    tagline2: "– mit Fokus auf Datenschutz und DSGVO",
    welcome: "Willkommen",
    loginDesc:
      "Melden Sie sich mit Internet Identity an, um zu lesen und teilzunehmen.",
    loginButton: "Mit Internet Identity anmelden",
    loggingIn: "Anmelden…",
    newUser: "Neuer Benutzer?",
    createIdentity: "Hier eine Internet Identity erstellen",
    transparencyTitle: "Transparenz",
    transparencyText:
      "Der Blog läuft auf dem Internet Computer Protocol (ICP), einer dezentralisierten Blockchain. Das bedeutet, dass der Code und die Daten der Plattform auf ICP eingesetzt und verifiziert werden können — keine einzelne Partei kontrolliert oder kann die Infrastruktur manipulieren.",
    gdprTitle: "Klarstellung – Recht auf Vergessenwerden",
    gdprText:
      "Sie haben das Recht auf Vergessenwerden — Sie können Ihr Konto selbst löschen, und alle Ihre Beiträge und Kommentare werden aus der sichtbaren Oberfläche des HKLO-Blogs entfernt. Bitte beachten Sie jedoch, dass, da Inhalte auf ",
    gdprIcp: "Internet Computer Protocol (ICP)",
    gdprText2:
      " gespeichert werden, einem Typ von Blockchain, es technisch unmöglich ist, Informationen, die einmal in die Blockchain geschrieben wurden, vollständig zu löschen. Das bedeutet, dass Inhalte in der Geschichte der Blockchain verbleiben können, aber sie werden für andere Benutzer auf HKLO-bloggen nicht mehr zugänglich oder sichtbar sein.",
    footerBuilt: "Erstellt mit ❤ via caffeine.ai",
    // Header
    blogTitle: "HKLOblogg",
    searchPlaceholder: "Beiträge suchen…",
    profileLabel: "Profil",
    adminPanel: "Admin-Panel",
    logout: "Abmelden",
    notifications: "Benachrichtigungen",
    markAllRead: "Alle als gelesen markieren",
    noNotifications: "Noch keine Benachrichtigungen",
    newComment: "Neuer Kommentar",
    newReply: "Neue Antwort",
    newMedia: "Neue Medien",
    newEvent: "Neues Ereignis",
    justNow: "Gerade eben",
    minutesAgo: "Min.",
    hoursAgo: "Std.",
    daysAgo: "Tag",
    postLabel: "Beitrag:",
    // SubNav
    home: "Startseite",
    myFeed: "Mein Feed",
    newPost: "Neuer Beitrag",
    categories: "Kategorien",
    // Category sheet
    allPosts: "Alle Beiträge",
    closeCategories: "Kategoriepanel schließen",
    // MittFlodePage
    myFeedTitle: "Mein Feed",
    back: "Zurück",
    followedUsers: "Folgende Benutzer",
    followedPosts: "Gefolgte Beiträge",
    noPostsFromFollowed: "Noch keine Beiträge von gefolgten Benutzern.",
    startFollowingUsers:
      "Folgen Sie Benutzern, um ihre Beiträge hier zu sehen.",
    noFollowedPosts: "Sie folgen noch keinen Beiträgen.",
    clickToFollowPost:
      "Klicken Sie auf 'Beitrag folgen', um einem Beitrag zu folgen.",
    unknownCategory: "Unbekannte Kategorie",
    pinned: "Angeheftet",
    // FeedPage
    noPostsYet: "Noch keine Beiträge. Seien Sie der Erste!",
    welcomeBanner:
      "Willkommen! Geben Sie Ihren Anzeigenamen in Ihrem Profil ein, um Beiträge und Kommentare schreiben zu können.",
    goToProfile: "Zum Profil",
    loadingLonger: "Das Laden dauert länger als erwartet.",
    reloadPage: "Seite neu laden",
    logoutAndRetry: "Abmelden und erneut versuchen",
  },
  es: {
    // Login page
    tagline:
      "Una plataforma para la libertad de opinión, la libertad de expresión y el diálogo respetuoso",
    tagline2: "– con enfoque en la privacidad y el RGPD",
    welcome: "Bienvenido",
    loginDesc: "Inicia sesión con Internet Identity para leer y participar.",
    loginButton: "Iniciar sesión con Internet Identity",
    loggingIn: "Iniciando sesión…",
    newUser: "¿Usuario nuevo?",
    createIdentity: "Crear una Internet Identity aquí",
    transparencyTitle: "Transparencia",
    transparencyText:
      "El blog funciona en Internet Computer Protocol (ICP), una blockchain descentralizada. Esto significa que el código y los datos de la plataforma están implementados en ICP y pueden verificarse — ninguna parte individual controla o puede manipular la infraestructura.",
    gdprTitle: "Aclaración – Derecho al olvido",
    gdprText:
      "Tiene derecho al olvido — puede eliminar su cuenta usted mismo, y todas sus publicaciones y comentarios serán eliminados de la interfaz visible del blog HKLO. Sin embargo, tenga en cuenta que, dado que el contenido se almacena en ",
    gdprIcp: "Internet Computer Protocol (ICP)",
    gdprText2:
      ", un tipo de blockchain, es técnicamente imposible eliminar completamente la información que una vez se ha escrito en la blockchain. Esto significa que el contenido puede permanecer en el historial de la blockchain, pero ya no será accesible ni visible para otros usuarios en HKLO-bloggen.",
    footerBuilt: "Construido con ❤ via caffeine.ai",
    // Header
    blogTitle: "HKLOblogg",
    searchPlaceholder: "Buscar artículos…",
    profileLabel: "Perfil",
    adminPanel: "Panel de administración",
    logout: "Cerrar sesión",
    notifications: "Notificaciones",
    markAllRead: "Marcar todo como leído",
    noNotifications: "Aún no hay notificaciones",
    newComment: "Nuevo comentario",
    newReply: "Nueva respuesta",
    newMedia: "Nuevo medio",
    newEvent: "Nuevo evento",
    justNow: "Ahora mismo",
    minutesAgo: "min",
    hoursAgo: "h",
    daysAgo: "día",
    postLabel: "Artículo:",
    // SubNav
    home: "Inicio",
    myFeed: "Mi feed",
    newPost: "Nuevo artículo",
    categories: "Categorías",
    // Category sheet
    allPosts: "Todos los artículos",
    closeCategories: "Cerrar panel de categorías",
    // MittFlodePage
    myFeedTitle: "Mi feed",
    back: "Volver",
    followedUsers: "Usuarios seguidos",
    followedPosts: "Artículos seguidos",
    noPostsFromFollowed: "Aún no hay artículos de usuarios seguidos.",
    startFollowingUsers:
      "Empieza a seguir usuarios para ver sus artículos aquí.",
    noFollowedPosts: "Aún no sigues ningún artículo.",
    clickToFollowPost:
      "Haz clic en 'Seguir artículo' en un artículo para seguirlo.",
    unknownCategory: "Categoría desconocida",
    pinned: "Fijado",
    // FeedPage
    noPostsYet: "Aún no hay artículos. ¡Sé el primero en escribir!",
    welcomeBanner:
      "¡Bienvenido! Introduce tu nombre para mostrar en tu perfil para poder escribir artículos y comentarios.",
    goToProfile: "Ir al perfil",
    loadingLonger: "La carga está tardando más de lo esperado.",
    reloadPage: "Recargar página",
    logoutAndRetry: "Cerrar sesión e intentar de nuevo",
  },
};
