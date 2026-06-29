package app

import (
	"os"
	"path/filepath"
)

const Name = "open-termkit"

type Paths struct {
	HomeDir          string `json:"homeDir"`
	DataDir          string `json:"dataDir"`
	DBPath           string `json:"dbPath"`
	SSHDir           string `json:"sshDir"`
	SSHManagedDir    string `json:"sshManagedDir"`
	SSHManagedConfig string `json:"sshManagedConfig"`
	SSHUserConfig    string `json:"sshUserConfig"`
}

func ResolvePaths() (Paths, error) {
	home, err := os.UserHomeDir()
	if err != nil {
		return Paths{}, err
	}
	dataDir := filepath.Join(home, "."+Name)
	sshDir := filepath.Join(home, ".ssh")
	managedSSH := filepath.Join(sshDir, Name)
	return Paths{
		HomeDir:          home,
		DataDir:          dataDir,
		DBPath:           filepath.Join(dataDir, Name+".db"),
		SSHDir:           sshDir,
		SSHManagedDir:    managedSSH,
		SSHManagedConfig: filepath.Join(managedSSH, "config"),
		SSHUserConfig:    filepath.Join(sshDir, "config"),
	}, nil
}

func EnsureBaseDirs(paths Paths) error {
	if err := os.MkdirAll(paths.DataDir, 0o700); err != nil {
		return err
	}
	if err := os.MkdirAll(paths.SSHManagedDir, 0o700); err != nil {
		return err
	}
	return nil
}
