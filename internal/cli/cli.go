package cli

import (
	"bufio"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"os"
	"os/signal"
	"strings"
	"syscall"

	"github.com/open-termkit/open-termkit/internal/app"
	"github.com/open-termkit/open-termkit/internal/models"
	"github.com/open-termkit/open-termkit/internal/server"
	"github.com/open-termkit/open-termkit/internal/setup"
	"github.com/open-termkit/open-termkit/internal/sshconfig"
	"github.com/open-termkit/open-termkit/internal/store"
	"github.com/open-termkit/open-termkit/internal/syncbundle"
	"github.com/open-termkit/open-termkit/internal/tools"
	"github.com/spf13/cobra"
)

type options struct {
	dbPath string
}

func Execute() error {
	opts := &options{}
	root := &cobra.Command{
		Use:   "open-termkit",
		Short: "Local shell environment powered by wterm",
	}
	root.PersistentFlags().StringVar(&opts.dbPath, "db", "", "SQLite database path")
	root.AddCommand(
		serveCmd(opts),
		setupCmd(opts),
		profileCmd(opts),
		sshCmd(opts),
		syncCmd(opts),
		toolsCmd(opts),
		doctorCmd(opts),
	)
	return root.Execute()
}

func serveCmd(opts *options) *cobra.Command {
	var host string
	var port int
	cmd := &cobra.Command{
		Use:   "serve",
		Short: "Start the local web UI and API",
		RunE: func(cmd *cobra.Command, args []string) error {
			ctx, stop := signal.NotifyContext(cmd.Context(), os.Interrupt, syscall.SIGTERM)
			defer stop()
			paths, s, err := openStore(ctx, opts)
			if err != nil {
				return err
			}
			defer s.Close()
			srv, err := server.New(s, paths)
			if err != nil {
				return err
			}
			url, err := srv.ListenAndServe(ctx, host, port)
			if err != nil {
				return err
			}
			fmt.Fprintf(cmd.OutOrStdout(), "open-termkit listening at %s\n", url)
			<-ctx.Done()
			return nil
		},
	}
	cmd.Flags().StringVar(&host, "host", "127.0.0.1", "host to bind")
	cmd.Flags().IntVar(&port, "port", 8765, "port to bind; use 0 for an automatically assigned port")
	return cmd
}

func setupCmd(opts *options) *cobra.Command {
	return &cobra.Command{
		Use:   "setup",
		Short: "Create default profiles and detect tools",
		RunE: func(cmd *cobra.Command, args []string) error {
			ctx := cmd.Context()
			_, s, err := openStore(ctx, opts)
			if err != nil {
				return err
			}
			defer s.Close()
			result, err := setup.Run(ctx, s)
			if err != nil {
				return err
			}
			return printJSON(cmd, result)
		},
	}
}

func profileCmd(opts *options) *cobra.Command {
	cmd := &cobra.Command{Use: "profile", Short: "Manage terminal profiles"}
	cmd.AddCommand(profileListCmd(opts), profileGetCmd(opts), profileCreateCmd(opts), profileUpdateCmd(opts), profileDeleteCmd(opts))
	return cmd
}

func profileListCmd(opts *options) *cobra.Command {
	return &cobra.Command{
		Use:   "list",
		Short: "List terminal profiles",
		RunE: func(cmd *cobra.Command, args []string) error {
			_, s, err := openStore(cmd.Context(), opts)
			if err != nil {
				return err
			}
			defer s.Close()
			profiles, err := s.ListTerminalProfiles(cmd.Context())
			if err != nil {
				return err
			}
			return printJSON(cmd, profiles)
		},
	}
}

func profileGetCmd(opts *options) *cobra.Command {
	return &cobra.Command{
		Use:   "get <id>",
		Short: "Get a terminal profile",
		Args:  cobra.ExactArgs(1),
		RunE: func(cmd *cobra.Command, args []string) error {
			_, s, err := openStore(cmd.Context(), opts)
			if err != nil {
				return err
			}
			defer s.Close()
			profile, err := s.GetTerminalProfile(cmd.Context(), args[0])
			if err != nil {
				return err
			}
			return printJSON(cmd, profile)
		},
	}
}

func profileCreateCmd(opts *options) *cobra.Command {
	var name, shell, cwd, theme string
	var profileArgs []string
	var isDefault bool
	cmd := &cobra.Command{
		Use:   "create",
		Short: "Create a terminal profile",
		RunE: func(cmd *cobra.Command, args []string) error {
			_, s, err := openStore(cmd.Context(), opts)
			if err != nil {
				return err
			}
			defer s.Close()
			p := models.DefaultTerminalProfile()
			p.ID = models.NewID("profile")
			if name != "" {
				p.Name = name
			}
			if shell != "" {
				p.ShellCommand = shell
			}
			if cwd != "" {
				p.Cwd = cwd
			}
			if theme != "" {
				p.Theme = theme
			}
			p.Args = profileArgs
			p.IsDefault = isDefault
			if err := s.CreateTerminalProfile(cmd.Context(), p); err != nil {
				return err
			}
			return printJSON(cmd, p)
		},
	}
	cmd.Flags().StringVar(&name, "name", "", "profile name")
	cmd.Flags().StringVar(&shell, "shell", "", "shell command")
	cmd.Flags().StringArrayVar(&profileArgs, "arg", nil, "shell argument; repeatable")
	cmd.Flags().StringVar(&cwd, "cwd", "", "working directory")
	cmd.Flags().StringVar(&theme, "theme", "", "wterm theme")
	cmd.Flags().BoolVar(&isDefault, "default", false, "set as default profile")
	return cmd
}

func profileUpdateCmd(opts *options) *cobra.Command {
	var name, shell, cwd, theme string
	var profileArgs []string
	var isDefault bool
	cmd := &cobra.Command{
		Use:   "update <id>",
		Short: "Update a terminal profile",
		Args:  cobra.ExactArgs(1),
		RunE: func(cmd *cobra.Command, args []string) error {
			_, s, err := openStore(cmd.Context(), opts)
			if err != nil {
				return err
			}
			defer s.Close()
			p, err := s.GetTerminalProfile(cmd.Context(), args[0])
			if err != nil {
				return err
			}
			if cmd.Flags().Changed("name") {
				p.Name = name
			}
			if cmd.Flags().Changed("shell") {
				p.ShellCommand = shell
			}
			if cmd.Flags().Changed("arg") {
				p.Args = profileArgs
			}
			if cmd.Flags().Changed("cwd") {
				p.Cwd = cwd
			}
			if cmd.Flags().Changed("theme") {
				p.Theme = theme
			}
			if cmd.Flags().Changed("default") {
				p.IsDefault = isDefault
			}
			if err := s.UpdateTerminalProfile(cmd.Context(), p); err != nil {
				return err
			}
			updated, err := s.GetTerminalProfile(cmd.Context(), args[0])
			if err != nil {
				return err
			}
			return printJSON(cmd, updated)
		},
	}
	cmd.Flags().StringVar(&name, "name", "", "profile name")
	cmd.Flags().StringVar(&shell, "shell", "", "shell command")
	cmd.Flags().StringArrayVar(&profileArgs, "arg", nil, "shell argument; repeatable")
	cmd.Flags().StringVar(&cwd, "cwd", "", "working directory")
	cmd.Flags().StringVar(&theme, "theme", "", "wterm theme")
	cmd.Flags().BoolVar(&isDefault, "default", false, "set as default profile")
	return cmd
}

func profileDeleteCmd(opts *options) *cobra.Command {
	return &cobra.Command{
		Use:   "delete <id>",
		Short: "Delete a terminal profile",
		Args:  cobra.ExactArgs(1),
		RunE: func(cmd *cobra.Command, args []string) error {
			_, s, err := openStore(cmd.Context(), opts)
			if err != nil {
				return err
			}
			defer s.Close()
			if err := s.DeleteTerminalProfile(cmd.Context(), args[0]); err != nil {
				return err
			}
			fmt.Fprintln(cmd.OutOrStdout(), "deleted")
			return nil
		},
	}
}

func sshCmd(opts *options) *cobra.Command {
	cmd := &cobra.Command{Use: "ssh", Short: "Manage SSH profiles and keys"}
	cmd.AddCommand(sshListCmd(opts), sshCreateCmd(opts), sshUpdateCmd(opts), sshDeleteCmd(opts), sshImportKeyCmd(opts), sshWriteConfigCmd(opts))
	return cmd
}

func sshListCmd(opts *options) *cobra.Command {
	return &cobra.Command{
		Use:   "list",
		Short: "List SSH profiles",
		RunE: func(cmd *cobra.Command, args []string) error {
			_, s, err := openStore(cmd.Context(), opts)
			if err != nil {
				return err
			}
			defer s.Close()
			profiles, err := s.ListSSHProfiles(cmd.Context())
			if err != nil {
				return err
			}
			return printJSON(cmd, profiles)
		},
	}
}

func sshCreateCmd(opts *options) *cobra.Command {
	var p models.SSHProfile
	cmd := &cobra.Command{
		Use:   "create",
		Short: "Create an SSH profile",
		RunE: func(cmd *cobra.Command, args []string) error {
			if p.Host == "" {
				return errors.New("--host is required")
			}
			_, s, err := openStore(cmd.Context(), opts)
			if err != nil {
				return err
			}
			defer s.Close()
			p.ID = models.NewID("ssh")
			p.Enabled = true
			p = models.NormalizeSSHProfile(p)
			if err := s.CreateSSHProfile(cmd.Context(), p); err != nil {
				return err
			}
			return printJSON(cmd, p)
		},
	}
	sshFlags(cmd, &p)
	return cmd
}

func sshUpdateCmd(opts *options) *cobra.Command {
	var p models.SSHProfile
	cmd := &cobra.Command{
		Use:   "update <id>",
		Short: "Update an SSH profile",
		Args:  cobra.ExactArgs(1),
		RunE: func(cmd *cobra.Command, args []string) error {
			_, s, err := openStore(cmd.Context(), opts)
			if err != nil {
				return err
			}
			defer s.Close()
			existing, err := s.GetSSHProfile(cmd.Context(), args[0])
			if err != nil {
				return err
			}
			applySSHFlagChanges(cmd, &existing, p)
			if err := s.UpdateSSHProfile(cmd.Context(), existing); err != nil {
				return err
			}
			updated, err := s.GetSSHProfile(cmd.Context(), args[0])
			if err != nil {
				return err
			}
			return printJSON(cmd, updated)
		},
	}
	sshFlags(cmd, &p)
	return cmd
}

func sshDeleteCmd(opts *options) *cobra.Command {
	return &cobra.Command{
		Use:   "delete <id>",
		Short: "Delete an SSH profile",
		Args:  cobra.ExactArgs(1),
		RunE: func(cmd *cobra.Command, args []string) error {
			_, s, err := openStore(cmd.Context(), opts)
			if err != nil {
				return err
			}
			defer s.Close()
			if err := s.DeleteSSHProfile(cmd.Context(), args[0]); err != nil {
				return err
			}
			fmt.Fprintln(cmd.OutOrStdout(), "deleted")
			return nil
		},
	}
}

func sshImportKeyCmd(opts *options) *cobra.Command {
	var name, profileID string
	cmd := &cobra.Command{
		Use:   "import-key <path>",
		Short: "Import a private key into ~/.ssh/open-termkit",
		Args:  cobra.ExactArgs(1),
		RunE: func(cmd *cobra.Command, args []string) error {
			ctx := cmd.Context()
			paths, s, err := openStore(ctx, opts)
			if err != nil {
				return err
			}
			defer s.Close()
			target, err := sshconfig.ImportKeyFromPath(paths, args[0], name)
			if err != nil {
				return err
			}
			if profileID != "" {
				p, err := s.GetSSHProfile(ctx, profileID)
				if err != nil {
					return err
				}
				p.IdentityFile = target
				if err := s.UpdateSSHProfile(ctx, p); err != nil {
					return err
				}
			}
			return printJSON(cmd, map[string]string{"path": target})
		},
	}
	cmd.Flags().StringVar(&name, "name", "", "target key file name")
	cmd.Flags().StringVar(&profileID, "profile-id", "", "SSH profile id to update")
	return cmd
}

func sshWriteConfigCmd(opts *options) *cobra.Command {
	var include bool
	cmd := &cobra.Command{
		Use:   "write-config",
		Short: "Write open-termkit managed SSH config snippet",
		RunE: func(cmd *cobra.Command, args []string) error {
			ctx := cmd.Context()
			paths, s, err := openStore(ctx, opts)
			if err != nil {
				return err
			}
			defer s.Close()
			profiles, err := s.ListSSHProfiles(ctx)
			if err != nil {
				return err
			}
			if err := sshconfig.WriteManagedConfig(paths, profiles); err != nil {
				return err
			}
			included := false
			if include {
				included, err = sshconfig.EnsureInclude(paths)
				if err != nil {
					return err
				}
			}
			return printJSON(cmd, map[string]any{"path": paths.SSHManagedConfig, "included": included})
		},
	}
	cmd.Flags().BoolVar(&include, "include", false, "add Include line to ~/.ssh/config")
	return cmd
}

func syncCmd(opts *options) *cobra.Command {
	cmd := &cobra.Command{Use: "sync", Short: "Import and export local sync bundles"}
	cmd.AddCommand(syncExportCmd(opts), syncImportCmd(opts))
	return cmd
}

func syncExportCmd(opts *options) *cobra.Command {
	var file string
	cmd := &cobra.Command{
		Use:   "export",
		Short: "Export profiles and metadata",
		RunE: func(cmd *cobra.Command, args []string) error {
			_, s, err := openStore(cmd.Context(), opts)
			if err != nil {
				return err
			}
			defer s.Close()
			raw, err := syncbundle.Encode(cmd.Context(), s)
			if err != nil {
				return err
			}
			if file == "" || file == "-" {
				fmt.Fprintln(cmd.OutOrStdout(), string(raw))
				return nil
			}
			return os.WriteFile(file, raw, 0o600)
		},
	}
	cmd.Flags().StringVar(&file, "file", "-", "output file; '-' writes stdout")
	return cmd
}

func syncImportCmd(opts *options) *cobra.Command {
	var file string
	cmd := &cobra.Command{
		Use:   "import",
		Short: "Import profiles and metadata",
		RunE: func(cmd *cobra.Command, args []string) error {
			if file == "" || file == "-" {
				return errors.New("--file is required for import")
			}
			raw, err := os.ReadFile(file)
			if err != nil {
				return err
			}
			_, s, err := openStore(cmd.Context(), opts)
			if err != nil {
				return err
			}
			defer s.Close()
			bundle, err := syncbundle.Import(cmd.Context(), s, raw)
			if err != nil {
				return err
			}
			return printJSON(cmd, bundle)
		},
	}
	cmd.Flags().StringVar(&file, "file", "", "input bundle file")
	return cmd
}

func toolsCmd(opts *options) *cobra.Command {
	cmd := &cobra.Command{Use: "tools", Short: "Detect and install setup tools"}
	cmd.AddCommand(toolsListCmd(opts), toolsDetectCmd(opts), toolsInstallCmd(opts))
	return cmd
}

func toolsListCmd(opts *options) *cobra.Command {
	return &cobra.Command{
		Use:   "list",
		Short: "List tool catalog with detection status",
		RunE: func(cmd *cobra.Command, args []string) error {
			_, s, err := openStore(cmd.Context(), opts)
			if err != nil {
				return err
			}
			defer s.Close()
			detected, err := tools.DetectAndStore(cmd.Context(), s)
			if err != nil {
				return err
			}
			return printJSON(cmd, detected)
		},
	}
}

func toolsDetectCmd(opts *options) *cobra.Command {
	return &cobra.Command{
		Use:   "detect",
		Short: "Refresh tool detection",
		RunE: func(cmd *cobra.Command, args []string) error {
			_, s, err := openStore(cmd.Context(), opts)
			if err != nil {
				return err
			}
			defer s.Close()
			detected, err := tools.DetectAndStore(cmd.Context(), s)
			if err != nil {
				return err
			}
			return printJSON(cmd, detected)
		},
	}
}

func toolsInstallCmd(opts *options) *cobra.Command {
	var commandIndex int
	var yes bool
	cmd := &cobra.Command{
		Use:   "install <name>",
		Short: "Install a catalog tool after confirmation",
		Args:  cobra.ExactArgs(1),
		RunE: func(cmd *cobra.Command, args []string) error {
			tool, ok := tools.Find(tools.Catalog(), args[0])
			if !ok {
				return errors.New("tool not found")
			}
			if commandIndex < 0 || commandIndex >= len(tool.InstallCommands) {
				return errors.New("install command index is out of range")
			}
			install := tool.InstallCommands[commandIndex]
			fmt.Fprintf(cmd.OutOrStdout(), "Command: %s\n", strings.Join(install.Args, " "))
			if !yes && !confirm(cmd, "Run this install command?") {
				return errors.New("install cancelled")
			}
			output, err := tools.Install(cmd.Context(), tool, commandIndex)
			if output != "" {
				fmt.Fprint(cmd.OutOrStdout(), output)
			}
			return err
		},
	}
	cmd.Flags().IntVar(&commandIndex, "command-index", 0, "install command index")
	cmd.Flags().BoolVarP(&yes, "yes", "y", false, "skip confirmation prompt")
	return cmd
}

func doctorCmd(opts *options) *cobra.Command {
	return &cobra.Command{
		Use:   "doctor",
		Short: "Show local open-termkit diagnostics",
		RunE: func(cmd *cobra.Command, args []string) error {
			ctx := cmd.Context()
			paths, s, err := openStore(ctx, opts)
			if err != nil {
				return err
			}
			defer s.Close()
			profiles, err := s.ListTerminalProfiles(ctx)
			if err != nil {
				return err
			}
			sshProfiles, err := s.ListSSHProfiles(ctx)
			if err != nil {
				return err
			}
			detected := tools.Detect(ctx, tools.Catalog())
			return printJSON(cmd, map[string]any{
				"paths":            paths,
				"terminalProfiles": len(profiles),
				"sshProfiles":      len(sshProfiles),
				"tools":            detected,
			})
		},
	}
}

func sshFlags(cmd *cobra.Command, p *models.SSHProfile) {
	cmd.Flags().StringVar(&p.Name, "name", "", "profile name and SSH Host alias")
	cmd.Flags().StringVar(&p.Host, "host", "", "SSH HostName")
	cmd.Flags().StringVar(&p.User, "user", "", "SSH user")
	cmd.Flags().IntVar(&p.Port, "port", 22, "SSH port")
	cmd.Flags().StringVar(&p.IdentityFile, "identity", "", "identity file path")
	cmd.Flags().StringVar(&p.ProxyJump, "proxy-jump", "", "ProxyJump target")
	cmd.Flags().StringVar(&p.Notes, "notes", "", "notes")
	cmd.Flags().BoolVar(&p.Enabled, "enabled", true, "include in generated config")
}

func applySSHFlagChanges(cmd *cobra.Command, dst *models.SSHProfile, src models.SSHProfile) {
	if cmd.Flags().Changed("name") {
		dst.Name = src.Name
	}
	if cmd.Flags().Changed("host") {
		dst.Host = src.Host
	}
	if cmd.Flags().Changed("user") {
		dst.User = src.User
	}
	if cmd.Flags().Changed("port") {
		dst.Port = src.Port
	}
	if cmd.Flags().Changed("identity") {
		dst.IdentityFile = src.IdentityFile
	}
	if cmd.Flags().Changed("proxy-jump") {
		dst.ProxyJump = src.ProxyJump
	}
	if cmd.Flags().Changed("notes") {
		dst.Notes = src.Notes
	}
	if cmd.Flags().Changed("enabled") {
		dst.Enabled = src.Enabled
	}
}

func openStore(ctx context.Context, opts *options) (app.Paths, *store.Store, error) {
	paths, err := app.ResolvePaths()
	if err != nil {
		return app.Paths{}, nil, err
	}
	if opts.dbPath != "" {
		paths.DBPath = opts.dbPath
	}
	if err := app.EnsureBaseDirs(paths); err != nil {
		return app.Paths{}, nil, err
	}
	s, err := store.Open(ctx, paths.DBPath)
	if err != nil {
		return app.Paths{}, nil, err
	}
	return paths, s, nil
}

func printJSON(cmd *cobra.Command, v any) error {
	raw, err := json.MarshalIndent(v, "", "  ")
	if err != nil {
		return err
	}
	fmt.Fprintln(cmd.OutOrStdout(), string(raw))
	return nil
}

func confirm(cmd *cobra.Command, prompt string) bool {
	fmt.Fprintf(cmd.OutOrStdout(), "%s [y/N] ", prompt)
	reader := bufio.NewReader(cmd.InOrStdin())
	raw, _ := reader.ReadString('\n')
	raw = strings.TrimSpace(strings.ToLower(raw))
	return raw == "y" || raw == "yes"
}
