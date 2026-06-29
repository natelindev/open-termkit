package server

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"io/fs"
	"mime/multipart"
	"net"
	"net/http"
	"path"
	"strings"
	"time"

	"github.com/open-termkit/open-termkit/internal/app"
	"github.com/open-termkit/open-termkit/internal/models"
	"github.com/open-termkit/open-termkit/internal/ptyws"
	"github.com/open-termkit/open-termkit/internal/setup"
	"github.com/open-termkit/open-termkit/internal/sshconfig"
	"github.com/open-termkit/open-termkit/internal/store"
	"github.com/open-termkit/open-termkit/internal/syncbundle"
	"github.com/open-termkit/open-termkit/internal/tools"
	"github.com/open-termkit/open-termkit/web"
)

type Server struct {
	store  *store.Store
	paths  app.Paths
	static fs.FS
	mux    *http.ServeMux
}

func New(s *store.Store, paths app.Paths) (*Server, error) {
	static, err := fs.Sub(web.Files, "dist")
	if err != nil {
		return nil, err
	}
	srv := &Server{
		store:  s,
		paths:  paths,
		static: static,
		mux:    http.NewServeMux(),
	}
	srv.routes()
	return srv, nil
}

func (s *Server) Handler() http.Handler {
	return s.mux
}

func (s *Server) ListenAndServe(ctx context.Context, host string, port int) (string, error) {
	addr := fmt.Sprintf("%s:%d", host, port)
	ln, err := net.Listen("tcp", addr)
	if err != nil {
		return "", err
	}
	httpServer := &http.Server{Handler: s.Handler()}
	go func() {
		<-ctx.Done()
		shutdownCtx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()
		_ = httpServer.Shutdown(shutdownCtx)
	}()
	go func() {
		_ = httpServer.Serve(ln)
	}()
	return "http://" + ln.Addr().String(), nil
}

func (s *Server) routes() {
	s.mux.HandleFunc("/api/health", s.health)
	s.mux.HandleFunc("/api/settings", s.settings)
	s.mux.HandleFunc("/api/profiles", s.profiles)
	s.mux.HandleFunc("/api/profiles/", s.profileByID)
	s.mux.HandleFunc("/api/ssh/import-key", s.importSSHKey)
	s.mux.HandleFunc("/api/ssh/write-config", s.writeSSHConfig)
	s.mux.HandleFunc("/api/ssh", s.sshProfiles)
	s.mux.HandleFunc("/api/ssh/", s.sshProfileByID)
	s.mux.HandleFunc("/api/tools/detect", s.detectTools)
	s.mux.HandleFunc("/api/tools/", s.toolAction)
	s.mux.HandleFunc("/api/tools", s.listTools)
	s.mux.HandleFunc("/api/setup/state", s.setupState)
	s.mux.HandleFunc("/api/setup/run", s.runSetup)
	s.mux.HandleFunc("/api/sync/export", s.exportSync)
	s.mux.HandleFunc("/api/sync/import", s.importSync)
	s.mux.Handle("/api/terminals/ws", ptyws.NewHandler(s.store))
	s.mux.HandleFunc("/", s.staticFile)
}

func (s *Server) health(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		methodNotAllowed(w)
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{
		"ok":      true,
		"app":     app.Name,
		"dbPath":  s.paths.DBPath,
		"version": 1,
	})
}

func (s *Server) settings(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		methodNotAllowed(w)
		return
	}
	values, err := s.store.ListSettings(r.Context())
	if err != nil {
		writeError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{
		"paths":    s.paths,
		"settings": values,
	})
}

func (s *Server) profiles(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodGet:
		profiles, err := s.store.ListTerminalProfiles(r.Context())
		if err != nil {
			writeError(w, err)
			return
		}
		writeJSON(w, http.StatusOK, profiles)
	case http.MethodPost:
		var p models.TerminalProfile
		if err := decodeJSON(r, &p); err != nil {
			writeErrorStatus(w, http.StatusBadRequest, err)
			return
		}
		p = models.NormalizeTerminalProfile(p)
		if err := s.store.CreateTerminalProfile(r.Context(), p); err != nil {
			writeError(w, err)
			return
		}
		writeJSON(w, http.StatusCreated, p)
	default:
		methodNotAllowed(w)
	}
}

func (s *Server) profileByID(w http.ResponseWriter, r *http.Request) {
	id := strings.TrimPrefix(r.URL.Path, "/api/profiles/")
	if id == "" {
		writeErrorStatus(w, http.StatusNotFound, errors.New("profile id is required"))
		return
	}
	switch r.Method {
	case http.MethodGet:
		p, err := s.store.GetTerminalProfile(r.Context(), id)
		writeJSONOrError(w, p, err)
	case http.MethodPut:
		var p models.TerminalProfile
		if err := decodeJSON(r, &p); err != nil {
			writeErrorStatus(w, http.StatusBadRequest, err)
			return
		}
		p.ID = id
		if err := s.store.UpdateTerminalProfile(r.Context(), p); err != nil {
			writeError(w, err)
			return
		}
		updated, err := s.store.GetTerminalProfile(r.Context(), id)
		writeJSONOrError(w, updated, err)
	case http.MethodDelete:
		err := s.store.DeleteTerminalProfile(r.Context(), id)
		if err != nil {
			writeError(w, err)
			return
		}
		writeJSON(w, http.StatusOK, map[string]bool{"deleted": true})
	default:
		methodNotAllowed(w)
	}
}

func (s *Server) sshProfiles(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodGet:
		profiles, err := s.store.ListSSHProfiles(r.Context())
		if err != nil {
			writeError(w, err)
			return
		}
		writeJSON(w, http.StatusOK, profiles)
	case http.MethodPost:
		var p models.SSHProfile
		if err := decodeJSON(r, &p); err != nil {
			writeErrorStatus(w, http.StatusBadRequest, err)
			return
		}
		p.Enabled = true
		p = models.NormalizeSSHProfile(p)
		if err := s.store.CreateSSHProfile(r.Context(), p); err != nil {
			writeError(w, err)
			return
		}
		writeJSON(w, http.StatusCreated, p)
	default:
		methodNotAllowed(w)
	}
}

func (s *Server) sshProfileByID(w http.ResponseWriter, r *http.Request) {
	id := strings.TrimPrefix(r.URL.Path, "/api/ssh/")
	if id == "" {
		writeErrorStatus(w, http.StatusNotFound, errors.New("ssh profile id is required"))
		return
	}
	switch r.Method {
	case http.MethodGet:
		p, err := s.store.GetSSHProfile(r.Context(), id)
		writeJSONOrError(w, p, err)
	case http.MethodPut:
		var p models.SSHProfile
		if err := decodeJSON(r, &p); err != nil {
			writeErrorStatus(w, http.StatusBadRequest, err)
			return
		}
		p.ID = id
		if err := s.store.UpdateSSHProfile(r.Context(), p); err != nil {
			writeError(w, err)
			return
		}
		updated, err := s.store.GetSSHProfile(r.Context(), id)
		writeJSONOrError(w, updated, err)
	case http.MethodDelete:
		err := s.store.DeleteSSHProfile(r.Context(), id)
		if err != nil {
			writeError(w, err)
			return
		}
		writeJSON(w, http.StatusOK, map[string]bool{"deleted": true})
	default:
		methodNotAllowed(w)
	}
}

func (s *Server) importSSHKey(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		methodNotAllowed(w)
		return
	}
	var target string
	var err error
	if strings.HasPrefix(r.Header.Get("Content-Type"), "multipart/form-data") {
		target, err = s.importMultipartKey(r)
	} else {
		var body struct {
			SourcePath string `json:"sourcePath"`
			Name       string `json:"name"`
		}
		if decodeErr := decodeJSON(r, &body); decodeErr != nil {
			writeErrorStatus(w, http.StatusBadRequest, decodeErr)
			return
		}
		target, err = sshconfig.ImportKeyFromPath(s.paths, body.SourcePath, body.Name)
	}
	if err != nil {
		writeError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, map[string]string{"path": target})
}

func (s *Server) importMultipartKey(r *http.Request) (string, error) {
	if err := r.ParseMultipartForm(8 << 20); err != nil {
		return "", err
	}
	file, header, err := r.FormFile("key")
	if err != nil {
		return "", err
	}
	defer file.Close()
	name := r.FormValue("name")
	if name == "" && header != nil {
		name = header.Filename
	}
	return sshconfig.ImportKey(s.paths, multipartReader(file), name)
}

func (s *Server) writeSSHConfig(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		methodNotAllowed(w)
		return
	}
	var body struct {
		EnsureInclude bool `json:"ensureInclude"`
	}
	_ = decodeJSON(r, &body)
	profiles, err := s.store.ListSSHProfiles(r.Context())
	if err != nil {
		writeError(w, err)
		return
	}
	if err := sshconfig.WriteManagedConfig(s.paths, profiles); err != nil {
		writeError(w, err)
		return
	}
	included := false
	if body.EnsureInclude {
		included, err = sshconfig.EnsureInclude(s.paths)
		if err != nil {
			writeError(w, err)
			return
		}
	}
	writeJSON(w, http.StatusOK, map[string]any{
		"path":     s.paths.SSHManagedConfig,
		"included": included,
	})
}

func (s *Server) listTools(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		methodNotAllowed(w)
		return
	}
	detected, err := tools.DetectAndStore(r.Context(), s.store)
	if err != nil {
		writeError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, detected)
}

func (s *Server) detectTools(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		methodNotAllowed(w)
		return
	}
	detected, err := tools.DetectAndStore(r.Context(), s.store)
	if err != nil {
		writeError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, detected)
}

func (s *Server) toolAction(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		methodNotAllowed(w)
		return
	}
	parts := strings.Split(strings.TrimPrefix(r.URL.Path, "/api/tools/"), "/")
	if len(parts) != 2 || parts[1] != "install" {
		writeErrorStatus(w, http.StatusNotFound, errors.New("unknown tool action"))
		return
	}
	tool, ok := tools.Find(tools.Catalog(), parts[0])
	if !ok {
		writeErrorStatus(w, http.StatusNotFound, errors.New("tool not found"))
		return
	}
	var body struct {
		CommandIndex int `json:"commandIndex"`
	}
	_ = decodeJSON(r, &body)
	ctx, cancel := context.WithTimeout(r.Context(), 20*time.Minute)
	defer cancel()
	output, err := tools.Install(ctx, tool, body.CommandIndex)
	if err != nil {
		writeErrorStatus(w, http.StatusInternalServerError, fmt.Errorf("%w\n%s", err, output))
		return
	}
	detected := tools.Detect(r.Context(), []models.Tool{tool})
	if len(detected) == 1 {
		_ = s.store.UpsertTool(r.Context(), detected[0])
		tool = detected[0]
	}
	writeJSON(w, http.StatusOK, map[string]any{"output": output, "tool": tool})
}

func (s *Server) setupState(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		methodNotAllowed(w)
		return
	}
	state, err := s.store.ListSetupState(r.Context())
	if err != nil {
		writeError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, state)
}

func (s *Server) runSetup(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		methodNotAllowed(w)
		return
	}
	result, err := setup.Run(r.Context(), s.store)
	if err != nil {
		writeError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (s *Server) exportSync(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		methodNotAllowed(w)
		return
	}
	raw, err := syncbundle.Encode(r.Context(), s.store)
	if err != nil {
		writeError(w, err)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Content-Disposition", `attachment; filename="open-termkit-sync.json"`)
	w.WriteHeader(http.StatusOK)
	_, _ = w.Write(raw)
}

func (s *Server) importSync(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		methodNotAllowed(w)
		return
	}
	raw, err := io.ReadAll(io.LimitReader(r.Body, 16<<20))
	if err != nil {
		writeError(w, err)
		return
	}
	bundle, err := syncbundle.Import(r.Context(), s.store, raw)
	if err != nil {
		writeError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, bundle)
}

func (s *Server) staticFile(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet && r.Method != http.MethodHead {
		methodNotAllowed(w)
		return
	}
	name := strings.TrimPrefix(path.Clean(r.URL.Path), "/")
	if name == "." || name == "" {
		name = "index.html"
	}
	if _, err := fs.Stat(s.static, name); err != nil {
		name = "index.html"
	}
	http.ServeFileFS(w, r, s.static, name)
}

func decodeJSON(r *http.Request, v any) error {
	defer r.Body.Close()
	return json.NewDecoder(r.Body).Decode(v)
}

func writeJSONOrError(w http.ResponseWriter, v any, err error) {
	if err != nil {
		writeError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, v)
}

func writeJSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(v)
}

func writeError(w http.ResponseWriter, err error) {
	if errors.Is(err, sql.ErrNoRows) {
		writeErrorStatus(w, http.StatusNotFound, err)
		return
	}
	writeErrorStatus(w, http.StatusInternalServerError, err)
}

func writeErrorStatus(w http.ResponseWriter, status int, err error) {
	writeJSON(w, status, map[string]string{"error": err.Error()})
}

func methodNotAllowed(w http.ResponseWriter) {
	writeErrorStatus(w, http.StatusMethodNotAllowed, errors.New("method not allowed"))
}

func multipartReader(file multipart.File) io.Reader {
	return file
}
