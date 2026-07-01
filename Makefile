.PHONY: build test frontend backend dev dev-backend dev-frontend docker-build docker-run docker-smoke

IMAGE ?= open-termkit:local

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

docker-build:
	@set -eu; \
	test -f web/dist/index.html || { echo "web/dist is missing; run make frontend first"; exit 1; }; \
	for asset in $$(grep -Eo '/assets/[^"]+' web/dist/index.html || true); do \
		test -f "web/dist$$asset" || { echo "Missing web/dist$$asset; run make frontend first"; exit 1; }; \
	done
	docker build -t $(IMAGE) .

docker-run:
	docker run --rm -it -p 8765:8765 \
		-v open-termkit-data:/home/open-termkit/.open-termkit \
		-v open-termkit-ssh:/home/open-termkit/.ssh \
		$(IMAGE)

docker-smoke:
	@set -eu; \
	cid=$$(docker run -d --rm -p 127.0.0.1::8765 $(IMAGE)); \
	trap 'docker stop $$cid >/dev/null' EXIT; \
	port=$$(docker port $$cid 8765/tcp | sed 's/.*://'); \
	for _ in $$(seq 1 30); do \
		if curl -fsS http://127.0.0.1:$$port/api/health >/dev/null; then break; fi; \
		sleep 1; \
	done; \
	curl -fsS http://127.0.0.1:$$port/api/health >/dev/null; \
	curl -fsS http://127.0.0.1:$$port/ >/dev/null; \
	echo "Docker smoke test passed on http://127.0.0.1:$$port"

