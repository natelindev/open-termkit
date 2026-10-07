# Tutorial 5: Production Deployment & Remote Access

This guide covers deploying Open Termkit in production on a remote Linux server using native systemd or Docker, configuring HTTPS reverse proxying with Nginx or Caddy, and adding access control.

---

## 1. Native Systemd Deployment

Open Termkit provides a tracked systemd unit template and automated deployment helper:

```bash
# Deploy to remote host as dedicated non-root user 'open-termkit'
scripts/deploy-systemd.sh user@your-server.com
```

The script builds a cross-compiled Linux AMD64 binary, uploads it to `/usr/local/bin/open-termkit`, provisions user data under `/var/lib/open-termkit`, and activates the service:

```bash
sudo systemctl enable --now open-termkit
sudo systemctl status open-termkit
```

---

## 2. Docker Container Deployment

To run Open Termkit in Docker with persistent named volumes for SQLite and managed SSH keys:

```bash
docker run -d \
  --name open-termkit \
  --restart unless-stopped \
  -p 127.0.0.1:8765:8765 \
  -v open-termkit-data:/home/open-termkit/.open-termkit \
  -v open-termkit-ssh:/home/open-termkit/.ssh \
  open-termkit:local
```

---

## 3. Reverse Proxy Configuration

Open Termkit listens on `127.0.0.1:8765`. For production, place it behind an HTTPS reverse proxy with WebSocket upgrade support.

### Nginx Configuration

```nginx
server {
    listen 443 ssl http2;
    server_name term.example.com;

    ssl_certificate /etc/letsencrypt/live/term.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/term.example.com/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:8765;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # WebSocket timeouts
        proxy_read_timeout 86400s;
        proxy_send_timeout 86400s;
    }
}
```

### Caddy Configuration

```caddy
term.example.com {
    reverse_proxy 127.0.0.1:8765
}
```

---

## 4. Authentication & Access Control

Because Open Termkit provides shell execution on the host machine, always restrict access:
- **Tailscale**: Bind Open Termkit or your reverse proxy exclusively to your Tailscale IP/tailnet.
- **Cloudflare Access / Zero Trust**: Protect the subdomain with SSO/OIDC.
- **Authelia / Pomerium**: Put an authenticating reverse proxy in front.
