# Tutorial 2: SSH Keys & Remote Host Management

Open Termkit provides an SSH profile manager that bridges graphical web controls with standard OpenSSH host configurations and key management.

---

## 1. Generating an Ed25519 Key Pair

Open Termkit can generate modern, secure Ed25519 key pairs directly within the interface:

1. Open the **SSH** view from the top navigation.
2. Under Authentication, click **"Generate Key"**.
3. Specify a key name (e.g., `id_ed25519_staging`) and an identifier comment.
4. Click **"Generate Key"**.
5. Open Termkit creates the key pair inside `~/.ssh/open-termkit/` with strict `0600` permissions.
6. Click **"Copy"** next to the displayed public key, and append it to your remote server's `~/.ssh/authorized_keys`.

---

## 2. Adding Remote Host Profiles

Configure host connection parameters in the form:
- **Host Alias / Name**: Name used for the profile and OpenSSH `Host` block (e.g., `prod-api`).
- **Host / IP**: Remote domain or IP address (e.g., `api.example.com`).
- **Port**: SSH port (default: 22).
- **User**: Remote username (e.g., `ubuntu` or `root`).
- **Identity File**: Path to private key, or import one directly using the file picker.
- **Proxy Jump**: Optional bastion/jump host alias.

Click **"Create Profile"** (or **"Save Profile"** when editing an existing host).

---

## 3. Testing Network Reachability

Before connecting, click **"Test"** on any host card:
- Open Termkit initiates a TCP dial to verify network reachability.
- If reachable, the card displays a green latency badge (e.g., `14ms`).
- If unreachable or timed out, a red badge details the error.

---

## 4. 1-Click Terminal Connection

Click **"Connect"** on any configured SSH host card:
- Open Termkit provisions a dedicated terminal profile running `ssh`.
- It immediately opens a new tab in the Terminal workspace connected to your remote host.

---

## 5. Writing Managed SSH Config

Click **"Write Config"** in the top toolbar to write your profiles to:
`~/.ssh/open-termkit/config`

To include this file automatically in your global SSH configuration, check the **"Include in ~/.ssh/config"** box before writing. Open Termkit safely prepends or appends:
```ssh-config
# open-termkit managed SSH profiles
Include ~/.ssh/open-termkit/config
```
