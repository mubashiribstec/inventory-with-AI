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
Docker allows you to run the MariaDB database without manually configuring SQL servers.
```bash
# Add Docker's official GPG key:
sudo apt install ca-certificates cursor git -y
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc

# Add the repository to Apt sources:
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt update

# Install Docker and Docker Compose
sudo apt install docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin -y

# Allow your user to run Docker without sudo (Logout/Login after this)
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
nano .env
```
Paste the following (Replace `YOUR_KEY` with your Gemini API Key):
```env
API_KEY=YOUR_GEMINI_API_KEY_HERE
DB_HOST=db
DB_USER=inventory_user
DB_PASSWORD=inventory_password
DB_NAME=smartstock
```

### 2. Launch using Docker Compose
The easiest way to start both the App and the Database:
```bash
docker compose up -d --build
```

### 3. Verify the installation
Check if containers are running:
```bash
docker ps
```
You should see `smartstock-app` and `smartstock-db`. 

Open your browser and navigate to:
`http://localhost:3000`

---

## 🔧 4. Common Linux Troubleshooting

### "Permission Denied" with Docker
If you see a permission error when running docker commands, you need to apply the group changes:
```bash
newgrp docker
```

### Port 3000 or 3306 is Busy
If the application fails to start because a port is taken:
```bash
sudo lsof -i :3000
# Kill the process if needed
# sudo kill -9 <PID>
```

### Logs
To see what the application is doing in real-time:
```bash
docker compose logs -f app
```

---
*Generated for SmartStock Pro Enterprise Linux Deployment.*
