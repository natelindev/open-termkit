.PHONY: build test frontend backend dev dev-backend dev-frontend

build: frontend backend

frontend:
	cd web && npm install && npm run build

backend:
	go build -o bin/open-termkit ./cmd/open-termkit

test:
	go test ./...

dev:
	@$(MAKE) dev-backend & \
	backend_pid=$$!; \
	$(MAKE) dev-frontend & \
	frontend_pid=$$!; \
	trap 'kill $$backend_pid $$frontend_pid 2>/dev/null || true' INT TERM EXIT; \
	wait $$backend_pid $$frontend_pid

dev-backend:
	go run ./cmd/open-termkit serve --port 8765

dev-frontend:
	cd web && npm install && npm run dev

