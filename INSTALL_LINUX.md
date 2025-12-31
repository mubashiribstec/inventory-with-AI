# Linux Fresh Install Guide - SmartStock Pro Enterprise

This guide is for users starting with a fresh Linux installation (Ubuntu 22.04+ or Debian 11+ recommended). Follow these steps to get your ERP system up and running.

---

## 🛠 1. Prepare the System
Update your package list to ensure you get the latest security versions.
```bash
sudo apt update && sudo apt upgrade -y
```

## 📦 2. Install Prerequisites

### A. Install Docker (Recommended for Database)
```bash
sudo apt install ca-certificates curl git -y
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc

echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt update

sudo apt install docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin -y
sudo usermod -aG docker $USER
```

### B. Install Node.js
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
```

---

## 🚀 3. Deploy the Application

### 1. Configure your API Key
Create a `.env` file in the root directory:
```bash
API_KEY=YOUR_GEMINI_API_KEY_HERE
DB_HOST=db
DB_USER=inventory_user
DB_PASSWORD=inventory_password
DB_NAME=smartstock
```

### 2. Launch using Docker Compose
```bash
docker compose up -d --build
```

---

## 🔍 4. Diagnostic Flow (If Software is Not Loading)

If you see a white screen or the preview is not loading, run the diagnostic tool:

```bash
chmod +x diagnose.sh
./diagnose.sh
```

### Common Fixes
1. **Container Crash**: `docker compose restart app`
2. **Settings Conflict**: If you changed the theme or software name and it broke, you can reset the settings table manually:
   ```bash
   docker exec -it smartstock-db mariadb -u root -proot_password smartstock -e "UPDATE settings SET software_name='SmartStock Pro', primary_color='indigo' WHERE id='GLOBAL';"
   ```
3. **Logs**: View real-time errors with `docker compose logs -f app`.

---
*Generated for SmartStock Pro Enterprise Linux Deployment.*