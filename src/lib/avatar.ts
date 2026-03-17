export function resolveAvatar(opts: {
  discordAvatar?: string | null | undefined;
  avatar?: string | null | undefined;
  github?: string | null | undefined;
}): string | null {
  return opts.discordAvatar ?? opts.avatar ?? (opts.github ? `https://github.com/${opts.github}.png?size=80` : null);
}

export function getInitials(name: string): string {
  return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
}
