# Security

Do not post credentials, private player data, signing tokens or server configuration in public issues. Contact the maintainer through GitHub’s private vulnerability reporting feature once enabled, or through the team’s existing staff channel.

Repository safeguards: no deployment configuration with secrets, no real player databases, no private signing keys, no workflow publication to production. Fork and pull-request CI receives no SignPath release token. Production signing is manual and limited to main, with GitHub-hosted runners and server-side origin verification by SignPath.

The source export checker is a best-effort check for known paths and common secret formats. It is not proof that every possible secret is absent; review the staged tree before making a repository public.

Do not weaken Windows security or ask players to import an untrusted root certificate to work around SmartScreen.

