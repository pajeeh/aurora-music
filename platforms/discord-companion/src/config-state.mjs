export function discordTokenFields(config) {
  const value=config&&typeof config==='object'?config:{};
  return {
    protectedAccessToken:typeof value.protectedDiscordAccessToken==='string'?value.protectedDiscordAccessToken:undefined,
    protectedRefreshToken:typeof value.protectedDiscordRefreshToken==='string'?value.protectedDiscordRefreshToken:undefined
  };
}

export function mergePairingConfig(config,protectedToken,pairedAt) {
  const value=config&&typeof config==='object'?config:{};
  return {...value,protectedToken,pairedAt};
}
