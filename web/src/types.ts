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

export type DoctorResponse = {
  os: string;
  arch: string;
  goVersion: string;
  numCPU: number;
  numGoroutine: number;
  uptimeSeconds: number;
  memory: {
    allocMB: number;
    totalAllocMB: number;
    sysMB: number;
    numGC: number;
  };
  paths: Record<string, string>;
  database: {
    exists: boolean;
    sizeBytes: number;
  };
  terminalProfilesCount: number;
  sshProfilesCount: number;
  tools: Tool[];
  shells: Record<string, boolean>;
  sshStatus: {
    userConfigExists: boolean;
    managedConfigExists: boolean;
    managedKeysCount: number;
  };
};

export type SSHTestResult = {
  reachable: boolean;
  host: string;
  port: number;
  latencyMs?: number;
  error?: string;
};

export type SSHGenerateKeyResult = {
  path: string;
  publicKey: string;
};

export type TerminalTab = {
  id: string;
  title: string;
  profileId: string;
  fontSize: number;
  followOutput: boolean;
  createdAt: number;
};
