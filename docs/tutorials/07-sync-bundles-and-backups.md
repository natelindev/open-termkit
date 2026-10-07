# Tutorial 7: Backup, Export & Team Sync Bundles

Open Termkit provides a zero-leak sync bundle mechanism to backup and migrate configurations between machines.

---

## 1. Zero-Leak Security Guarantee

When you export a sync bundle:
- All terminal profiles, arguments, environment variables, and SSH host configurations are exported.
- **Private key contents are NEVER exported or embedded in sync bundles.** Only the key path identifier is stored.
- Sync bundles can safely be stored in version control or shared across teams without leaking SSH private keys.

---

## 2. Exporting a Sync Bundle

### Via Web UI
1. Navigate to **Settings**.
2. Click **"Export Sync Bundle"**.
3. A JSON file named `open-termkit-sync.json` is downloaded immediately.

### Via Command Line
```bash
# Export to standard output or a file
open-termkit sync export --file backup-termkit.json
```

---

## 3. Importing a Sync Bundle

### Via Web UI
1. Navigate to **Settings**.
2. Under Backup & Migration, click **"Import Sync Bundle"** and select your JSON file.
3. An in-app bundle inspector modal displays the count of terminal profiles and SSH hosts contained in the bundle.
4. Click **"Confirm & Import"** to merge them into your local database.

### Via Command Line
```bash
open-termkit sync import --file backup-termkit.json
```

---

## 4. Full SQLite Database Backup

For a complete backup including local tool states:
```bash
cp ~/.open-termkit/open-termkit.db ~/.open-termkit/open-termkit-backup.db
```
