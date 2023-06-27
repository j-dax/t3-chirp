import type { User } from "@clerk/backend/dist/types";
export const mapUserForClient = (user: User) => {
  return {
    id: user.id,
    username: user.username,
    profileImageUrl: user.profileImageUrl,
    externalUsername: user.externalAccounts
      .find((externalAccount) => externalAccount.provider === "oauth_github")?.username || null,
  }
}
