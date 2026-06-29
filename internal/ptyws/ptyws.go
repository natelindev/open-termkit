package ptyws

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"os"
	"os/exec"
	"strconv"
	"strings"
	"sync"

	"github.com/creack/pty"
	"github.com/gorilla/websocket"
	"github.com/open-termkit/open-termkit/internal/models"
	"github.com/open-termkit/open-termkit/internal/store"
)

type Handler struct {
	Store    *store.Store
	Upgrader websocket.Upgrader
}

type ClientEvent struct {
	Type string `json:"type"`
	Data string `json:"data,omitempty"`
	Cols int    `json:"cols,omitempty"`
	Rows int    `json:"rows,omitempty"`
}

type ServerEvent struct {
	Type  string `json:"type"`
	Data  string `json:"data,omitempty"`
	Code  int    `json:"code,omitempty"`
	Error string `json:"error,omitempty"`
}

func NewHandler(s *store.Store) Handler {
	return Handler{
		Store: s,
		Upgrader: websocket.Upgrader{
			CheckOrigin: func(r *http.Request) bool {
				return true
			},
		},
	}
}

func (h Handler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	conn, err := h.Upgrader.Upgrade(w, r, nil)
	if err != nil {
		return
	}
	defer conn.Close()

	profile, err := h.profile(r.Context(), r)
	if err != nil {
		_ = conn.WriteJSON(ServerEvent{Type: "error", Error: err.Error()})
		return
	}

	cols := queryInt(r, "cols", 80)
	rows := queryInt(r, "rows", 24)
	if err := h.run(r.Context(), conn, profile, cols, rows); err != nil {
		_ = conn.WriteJSON(ServerEvent{Type: "error", Error: err.Error()})
	}
}

func (h Handler) profile(ctx context.Context, r *http.Request) (models.TerminalProfile, error) {
	id := r.URL.Query().Get("profile_id")
	if id == "" {
		return h.Store.DefaultTerminalProfile(ctx)
	}
	return h.Store.GetTerminalProfile(ctx, id)
}

func (h Handler) run(ctx context.Context, conn *websocket.Conn, profile models.TerminalProfile, cols int, rows int) error {
	if profile.ShellCommand == "" {
		return errors.New("profile has no shell command")
	}
	cmd := exec.CommandContext(ctx, profile.ShellCommand, profile.Args...)
	if profile.Cwd != "" {
		cmd.Dir = profile.Cwd
	}
	cmd.Env = terminalEnv(os.Environ(), profile.Env)

	ptmx, err := pty.StartWithSize(cmd, &pty.Winsize{Cols: uint16(cols), Rows: uint16(rows)})
	if err != nil {
		return err
	}
	defer ptmx.Close()

	var writeMu sync.Mutex
	write := func(event ServerEvent) error {
		writeMu.Lock()
		defer writeMu.Unlock()
		return conn.WriteJSON(event)
	}

	done := make(chan error, 1)
	go func() {
		buf := make([]byte, 8192)
		for {
			n, err := ptmx.Read(buf)
			if n > 0 {
				_ = write(ServerEvent{Type: "output", Data: string(buf[:n])})
			}
			if err != nil {
				break
			}
		}
		waitErr := cmd.Wait()
		code := 0
		if waitErr != nil {
			if exitErr, ok := waitErr.(*exec.ExitError); ok {
				code = exitErr.ExitCode()
			} else {
				code = 1
			}
		}
		_ = write(ServerEvent{Type: "exit", Code: code})
		done <- waitErr
	}()

	for {
		select {
		case <-done:
			return nil
		default:
		}
		var event ClientEvent
		if err := conn.ReadJSON(&event); err != nil {
			_ = cmd.Process.Kill()
			<-done
			return nil
		}
		switch event.Type {
		case "input":
			_, _ = ptmx.Write([]byte(event.Data))
		case "ping":
			_ = write(ServerEvent{Type: "pong", Data: event.Data})
		case "resize":
			if event.Cols > 0 && event.Rows > 0 {
				_ = pty.Setsize(ptmx, &pty.Winsize{Cols: uint16(event.Cols), Rows: uint16(event.Rows)})
			}
		}
	}
}

func queryInt(r *http.Request, key string, fallback int) int {
	raw := r.URL.Query().Get(key)
	if raw == "" {
		return fallback
	}
	n, err := strconv.Atoi(raw)
	if err != nil || n <= 0 {
		return fallback
	}
	return n
}

func terminalEnv(base []string, overrides map[string]string) []string {
	values := make(map[string]string, len(base)+len(overrides)+2)
	order := make([]string, 0, len(base)+len(overrides)+2)
	set := func(key, value string) {
		if _, ok := values[key]; !ok {
			order = append(order, key)
		}
		values[key] = value
	}
	for _, item := range base {
		key, value, ok := strings.Cut(item, "=")
		if ok && key != "" {
			set(key, value)
		}
	}
	if values["TERM"] == "" || values["TERM"] == "dumb" {
		set("TERM", "xterm-256color")
	}
	if values["COLORTERM"] == "" {
		set("COLORTERM", "truecolor")
	}
	for key, value := range overrides {
		if key != "" {
			set(key, value)
		}
	}
	env := make([]string, 0, len(order))
	for _, key := range order {
		env = append(env, key+"="+values[key])
	}
	return env
}

func DecodeClientEvent(raw []byte) (ClientEvent, error) {
	var event ClientEvent
	err := json.Unmarshal(raw, &event)
	return event, err
}
