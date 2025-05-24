export const DISCORD_CLIENT_ID = import.meta.env.VITE_DISCORD_CLIENT_ID || "";

export function getDiscordAuthUrl(): string {
  return `/api/auth/discord`;
}

export function getDiscordAvatarUrl(userId: string, avatar: string | null, size: number = 32): string {
  if (!avatar) {
    const defaultAvatarNum = parseInt(userId) % 5;
    return `https://cdn.discordapp.com/embed/avatars/${defaultAvatarNum}.png`;
  }
  
  return `https://cdn.discordapp.com/avatars/${userId}/${avatar}.${avatar.startsWith('a_') ? 'gif' : 'png'}?size=${size}`;
}

export function formatDiscordUser(username: string, discriminator: string): string {
  if (discriminator === "0000" || discriminator === "0") {
    return `@${username}`;
  }
  return `${username}#${discriminator}`;
}
