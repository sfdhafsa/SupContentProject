const englishMessages = {
  "Token manquant.": "Missing token.",
  "Token révoqué.": "Token revoked.",
  "Utilisateur introuvable.": "User not found.",
  "Compte suspendu.": "Account suspended.",
  "Token invalide ou expiré.": "Invalid or expired token.",
  "Non authentifié.": "Unauthenticated.",
  "Non authentifie.": "Unauthenticated.",
  "Accès refusé.": "Access denied.",
  "Forbidden": "Forbidden",
  "Erreur serveur": "Server error",
  "Profil mis à jour.": "Profile updated.",
  "Preferences de notification mises a jour.": "Notification preferences updated.",
  "Les deux mots de passe sont requis.": "Both passwords are required.",
  "Le nouveau mot de passe doit faire au moins 8 caractères.": "The new password must be at least 8 characters.",
  "Mot de passe actuel incorrect.": "Current password is incorrect.",
  "Mot de passe mis à jour avec succès.": "Password updated successfully.",
  "Aucun fichier fourni.": "No file provided.",
  "Avatar mis à jour.": "Avatar updated.",
  "Compte supprimé avec succès.": "Account deleted successfully.",
  "Toutes les notifications ont été marquées comme lues.": "All notifications have been marked as read.",
  "Notification introuvable.": "Notification not found.",
  "status requis": "Status is required.",
  "Query is required": "Query is required",
  "Invalid movie id": "Invalid movie id",
  "Film non trouvé": "Movie not found",
  "Le paramètre 'q' est requis": "The 'q' parameter is required",
  "Erreur API TMDB": "TMDB API error",
  "Review not found": "Review not found",
  "Comment text is required": "Comment text is required",
  "Parent comment not found": "Parent comment not found",
  "Parent comment does not belong to this review": "Parent comment does not belong to this review",
  "Comment not found": "Comment not found",
  "Unauthorized": "Unauthorized",
  "You already reviewed this movie": "You already reviewed this movie",
  "Report handled.": "Report handled.",
  "Report dismissed.": "Report dismissed.",
  "Reported content deleted.": "Reported content deleted.",
  "User banned.": "User banned.",
  "User unbanned.": "User unbanned.",
  "Review featured.": "Review featured.",
  "Review unfeatured.": "Review unfeatured.",
  "Avatar trop lourd. Taille maximale: 2MB.": "Avatar is too large. Maximum size: 2MB.",
  "Avatar invalide.": "Invalid avatar.",
};

const dictionaries = {
  en: englishMessages,
};

export const translateApiText = (value, locale) => {
  if (typeof value !== "string") return value;
  return dictionaries[locale]?.[value] ?? value;
};

export const translateApiPayload = (payload, locale) => {
  if (!payload || locale !== "en") return payload;

  if (Array.isArray(payload)) {
    return payload.map((item) => translateApiPayload(item, locale));
  }

  if (typeof payload !== "object") {
    return translateApiText(payload, locale);
  }

  return Object.fromEntries(
    Object.entries(payload).map(([key, value]) => {
      if (["message", "error", "msg"].includes(key)) {
        return [key, translateApiText(value, locale)];
      }

      return [key, translateApiPayload(value, locale)];
    })
  );
};
