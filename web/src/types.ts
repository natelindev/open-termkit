export type TerminalProfile = {
  id: string;
  name: string;
  shellCommand: string;
  args: string[];
  env: Record<string, string>;
  cwd: string;
  theme: string;
  fontFamily: string;
  fontSize: number;
  keybindings: Record<string, string>;
  wtermSettings: Record<string, unknown>;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
};

export type SSHProfile = {
  id: string;
  name: string;
  host: string;
  user: string;
  port: number;
  identityFile: string;
  proxyJump: string;
  notes: string;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
};

export type InstallCommand = {
  label: string;
  args: string[];
};

export type Tool = {
  name: string;
  displayName: string;
  category: string;
  binary: string;
  installed: boolean;
  version: string;
  installCommands: InstallCommand[];
  profileCommand: string[];
  lastCheckedAt: string;
};

export type SettingsResponse = {
  paths: Record<string, string>;
  settings: Record<string, unknown>;
};

