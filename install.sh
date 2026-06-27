#!/bin/bash

# ==============================================================================
# Josephite Math Club - Automated Linux Installer
# Supported OS: Linux Mint, Ubuntu, Debian, Pop!_OS, Zorin OS, Fedora, Arch Linux
# ==============================================================================

# ANSI color codes for rich, crafted feedback
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
NC='\033[0m' # No Color

# Text styles
BOLD='\033[1m'
ITALIC='\033[3m'

# Clear screen and show a gorgeous visual banner
clear
echo -e "${CYAN}${BOLD}"
echo "================================================================================"
echo "    _                       _     _ _              __  __       _   _      "
echo "   | | ___  ___  ___ _ __  | |__ (_) |_ ___       |  \/  | __ _| |_| |__    "
echo " _ | |/ _ \/ __|/ _ \ '_ \ | '_ \| | __/ _ \ _____| |\/| |/ _\` | __| '_ \   "
echo "| || | (_) \__ \  __/ |_) || | | | | ||  __/______| |  | | (_| | |_| | | |  "
echo " \__/ \___/|___/\___| .__/ |_| |_|_|\__\___|      |_|  |_|\__,_|\__|_| |_|  "
echo "                    |_|                                                     "
echo "================================================================================"
echo "                   AUTOMATED PRODUCTION LINUX INSTALLER v1.0                    "
echo "================================================================================"
echo -e "${NC}"

# Function to display step progress
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 1. Distro Detection
log_info "Detecting system architecture and Linux distribution..."

if [ -f /etc/os-release ]; then
    . /etc/os-release
    DISTRO=$ID
    DISTRO_NAME=$NAME
    log_success "Detected distribution: ${BOLD}${DISTRO_NAME}${NC}"
else
    DISTRO="unknown"
    DISTRO_NAME="Unknown Linux"
    log_warning "Could not detect precise distribution. Defaulting to general Linux compatibility."
fi

# Ensure git is available
if ! command -v git &> /dev/null; then
    log_warning "Git is not installed."
    if [[ "$DISTRO" == "ubuntu" || "$DISTRO" == "debian" || "$DISTRO" == "linuxmint" || "$DISTRO" == "pop" ]]; then
        log_info "Installing git via apt-get..."
        sudo apt-get update && sudo apt-get install -y git
    elif [[ "$DISTRO" == "fedora" ]]; then
        log_info "Installing git via dnf..."
        sudo dnf install -y git
    elif [[ "$DISTRO" == "arch" ]]; then
        log_info "Installing git via pacman..."
        sudo pacman -S --noconfirm git
    else
        log_error "Please install 'git' using your package manager and run the installer again."
        exit 1
    fi
fi

# 2. Check & Install Node.js (V20 LTS recommended)
log_info "Verifying Node.js environment..."

NODE_REQUIRED=20
NODE_INSTALLED=false
if command -v node &> /dev/null; then
    NODE_VERSION=$(node -v | cut -d'v' -f2)
    NODE_MAJOR=$(echo "$NODE_VERSION" | cut -d'.' -f1)
    if [ "$NODE_MAJOR" -ge "$NODE_REQUIRED" ]; then
        log_success "Node.js v$NODE_VERSION is already installed (Minimum v$NODE_REQUIRED required)."
        NODE_INSTALLED=true
    else
        log_warning "Node.js v$NODE_VERSION is installed, but v$NODE_REQUIRED+ is recommended."
    fi
fi

if [ "$NODE_INSTALLED" = false ]; then
    echo -e "\n${YELLOW}${BOLD}Node.js v20+ LTS is required to build and host the application.${NC}"
    read -p "Would you like this installer to download and install Node.js v20 LTS? [Y/n] " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ || -z $REPLY ]]; then
        log_info "Installing Node.js v20 LTS..."
        if [[ "$DISTRO" == "ubuntu" || "$DISTRO" == "debian" || "$DISTRO" == "linuxmint" || "$DISTRO" == "pop" ]]; then
            log_info "Adding NodeSource PPA repository..."
            sudo apt-get update
            sudo apt-get install -y curl ca-certificates gnupg
            sudo mkdir -p /etc/apt/keyrings
            curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | sudo gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg
            echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_20.x nodistro main" | sudo tee /etc/apt/sources.list.d/nodesource.list
            sudo apt-get update
            sudo apt-get install nodejs -y
        elif [[ "$DISTRO" == "fedora" ]]; then
            sudo dnf install -y nodejs
        elif [[ "$DISTRO" == "arch" ]]; then
            sudo pacman -S --noconfirm nodejs npm
        else
            log_error "Unsupported package manager for automatic Node.js setup. Please install Node.js manually."
            exit 1
        fi
        
        # Verify installation success
        if command -v node &> /dev/null; then
            log_success "Node.js successfully installed: $(node -v)"
        else
            log_error "Node.js installation failed. Please install Node.js manually and run this script again."
            exit 1
        fi
    else
        log_warning "Proceeding without installing/upgrading Node.js. Build failures may occur."
    fi
fi

# 3. Environment Setup & Configuration Wizard
log_info "Setting up application environment configuration..."

# Read values from current .env if it exists, otherwise fall back to .env.example
ENV_FILE="./.env"
ENV_TEMPLATE="./.env.example"

if [ -f "$ENV_FILE" ]; then
    log_info "Found existing .env file. Preserving current values as defaults..."
    source "$ENV_FILE" 2>/dev/null
elif [ -f "$ENV_TEMPLATE" ]; then
    log_info "No .env found. Generating environment configuration wizard using template..."
else
    log_error "No .env.example template found. Please make sure you are running the script in the project root."
    exit 1
fi

# Define defaults
DEFAULT_SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL:-"https://your-project-id.supabase.co"}
DEFAULT_SUPABASE_ANON_KEY=${NEXT_PUBLIC_SUPABASE_ANON_KEY:-"your-anon-key-here"}
DEFAULT_ADMIN_EMAILS=${NEXT_PUBLIC_ADMIN_EMAILS:-"samintausif38@gmail.com"}
DEFAULT_APP_URL=${NEXT_PUBLIC_APP_URL:-"localhost:3000"}
DEFAULT_SERVICE_ROLE_KEY=${SUPABASE_SERVICE_ROLE_KEY:-"your-service-role-key-here"}
DEFAULT_PORT=${PORT:-"3000"}

DEFAULT_BREVO_API_KEY=${BREVO_API_KEY:-""}
DEFAULT_SMTP_HOST=${SMTP_HOST:-"smtp-relay.example.com"}
DEFAULT_SMTP_PORT=${SMTP_PORT:-"587"}
DEFAULT_SMTP_SECURE=${SMTP_SECURE:-"false"}
DEFAULT_SMTP_USER=${SMTP_USER:-""}
DEFAULT_SMTP_PASS=${SMTP_PASS:-""}
DEFAULT_SMTP_FROM_NAME=${SMTP_FROM_NAME:-"Josephite Math Club"}
DEFAULT_SMTP_FROM_EMAIL=${SMTP_FROM_EMAIL:-"mathclub@sjs.edu.bd"}

echo -e "\n${CYAN}${BOLD}=== CONFIGURATION WIZARD ===${NC}"
echo -e "${ITALIC}Leave blank and press Enter to accept the default [in brackets]${NC}\n"

read -p "Supabase API URL [$DEFAULT_SUPABASE_URL]: " USER_SUPABASE_URL
USER_SUPABASE_URL=${USER_SUPABASE_URL:-$DEFAULT_SUPABASE_URL}

read -p "Supabase Anon Key [$DEFAULT_SUPABASE_ANON_KEY]: " USER_SUPABASE_ANON_KEY
USER_SUPABASE_ANON_KEY=${USER_SUPABASE_ANON_KEY:-$DEFAULT_SUPABASE_ANON_KEY}

read -p "Supabase Service Role Key [$DEFAULT_SERVICE_ROLE_KEY]: " USER_SERVICE_ROLE_KEY
USER_SERVICE_ROLE_KEY=${USER_SERVICE_ROLE_KEY:-$DEFAULT_SERVICE_ROLE_KEY}

read -p "Super Admin Email Address(es) [$DEFAULT_ADMIN_EMAILS]: " USER_ADMIN_EMAILS
USER_ADMIN_EMAILS=${USER_ADMIN_EMAILS:-$DEFAULT_ADMIN_EMAILS}

read -p "Application Base URL [$DEFAULT_APP_URL]: " USER_APP_URL
USER_APP_URL=${USER_APP_URL:-$DEFAULT_APP_URL}

read -p "Hosting Port [$DEFAULT_PORT]: " USER_PORT
USER_PORT=${USER_PORT:-$DEFAULT_PORT}

echo -e "\n${CYAN}${BOLD}Email Configuration Option:${NC}"
echo "1) Brevo API Key (Recommended)"
echo "2) SMTP Server Fallback"
read -p "Choose option [1/2, Default 1]: " EMAIL_CHOICE
EMAIL_CHOICE=${EMAIL_CHOICE:-"1"}

if [ "$EMAIL_CHOICE" = "1" ]; then
    read -p "Brevo API Key [$DEFAULT_BREVO_API_KEY]: " USER_BREVO_KEY
    USER_BREVO_KEY=${USER_BREVO_KEY:-$DEFAULT_BREVO_API_KEY}
    USER_SMTP_HOST=$DEFAULT_SMTP_HOST
    USER_SMTP_PORT=$DEFAULT_SMTP_PORT
    USER_SMTP_SECURE=$DEFAULT_SMTP_SECURE
    USER_SMTP_USER=$DEFAULT_SMTP_USER
    USER_SMTP_PASS=$DEFAULT_SMTP_PASS
else
    USER_BREVO_KEY=""
    read -p "SMTP Server Hostname [$DEFAULT_SMTP_HOST]: " USER_SMTP_HOST
    USER_SMTP_HOST=${USER_SMTP_HOST:-$DEFAULT_SMTP_HOST}
    
    read -p "SMTP Port [$DEFAULT_SMTP_PORT]: " USER_SMTP_PORT
    USER_SMTP_PORT=${USER_SMTP_PORT:-$DEFAULT_SMTP_PORT}
    
    read -p "Use Secure Connection (true/false) [$DEFAULT_SMTP_SECURE]: " USER_SMTP_SECURE
    USER_SMTP_SECURE=${USER_SMTP_SECURE:-$DEFAULT_SMTP_SECURE}
    
    read -p "SMTP Username [$DEFAULT_SMTP_USER]: " USER_SMTP_USER
    USER_SMTP_USER=${USER_SMTP_USER:-$DEFAULT_SMTP_USER}
    
    read -p "SMTP Password [$DEFAULT_SMTP_PASS]: " USER_SMTP_PASS
    USER_SMTP_PASS=${USER_SMTP_PASS:-$DEFAULT_SMTP_PASS}
fi

read -p "Email Sender Name [$DEFAULT_SMTP_FROM_NAME]: " USER_SMTP_NAME
USER_SMTP_NAME=${USER_SMTP_NAME:-$DEFAULT_SMTP_FROM_NAME}

read -p "Email Sender Address [$DEFAULT_SMTP_FROM_EMAIL]: " USER_SMTP_FROM_EMAIL
USER_SMTP_FROM_EMAIL=${USER_SMTP_FROM_EMAIL:-$DEFAULT_SMTP_FROM_EMAIL}

# Write config directly to .env
cat << EOF > "$ENV_FILE"
# Josephite Math Club Production Environment Configuration
NEXT_PUBLIC_SUPABASE_URL=$USER_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=$USER_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=$USER_SERVICE_ROLE_KEY
NEXT_PUBLIC_ADMIN_EMAILS=$USER_ADMIN_EMAILS
NEXT_PUBLIC_APP_URL=$USER_APP_URL
PORT=$USER_PORT

# Email Config
BREVO_API_KEY=$USER_BREVO_KEY
SMTP_HOST=$USER_SMTP_HOST
SMTP_PORT=$USER_SMTP_PORT
SMTP_SECURE=$USER_SMTP_SECURE
SMTP_USER=$USER_SMTP_USER
SMTP_PASS=$USER_SMTP_PASS
SMTP_FROM_NAME="$USER_SMTP_NAME"
SMTP_FROM_EMAIL="$USER_SMTP_FROM_EMAIL"
EOF

log_success "Environment configuration saved to ${BOLD}$ENV_FILE${NC}."

# 4. Install Dependencies & Compile Application
log_info "Installing npm packages (this might take a minute)..."
npm install

if [ $? -ne 0 ]; then
    log_error "npm install failed. Please inspect the output and correct issues before building."
    exit 1
fi
log_success "Dependencies successfully installed."

log_info "Building the optimized production distribution of the Next.js application..."
npm run build

if [ $? -ne 0 ]; then
    log_error "npm run build failed. Please verify environment variables or code compiler output."
    exit 1
fi
log_success "Production bundle successfully compiled!"

# 5. Service Configuration (Systemd Service)
echo -e "\n${CYAN}${BOLD}=== BACKGROUND SERVICE PROVISIONING ===${NC}"
echo "We can install a Systemd background service to keep your application online"
echo "indefinitely, starting automatically when your Linux system boots."
read -p "Would you like to install a systemd service file? [Y/n] " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ || -z $REPLY ]]; then
    SERVICE_NAME="josephite-math-club"
    SERVICE_FILE="/etc/systemd/system/${SERVICE_NAME}.service"
    APP_DIR=$(pwd)
    USER_RUNNING=$(whoami)

    log_info "Generating systemd service file template..."

    # Write systemd config template locally first
    TEMP_SERVICE="./${SERVICE_NAME}.service"
    cat << EOF > "$TEMP_SERVICE"
[Unit]
Description=Josephite Math Club Production Web Server
After=network.target

[Service]
Type=simple
User=$USER_RUNNING
WorkingDirectory=$APP_DIR
ExecStart=$(command -v npm) run start
Restart=always
RestartSec=5
Environment=NODE_ENV=production
Environment=PORT=$USER_PORT

[Install]
WantedBy=multi-user.target
EOF

    log_info "Copying service configuration to system directory (requires sudo credentials)..."
    sudo mv "$TEMP_SERVICE" "$SERVICE_FILE"
    
    if [ -f "$SERVICE_FILE" ]; then
        log_info "Reloading systemd daemon, enabling and starting the service..."
        sudo systemctl daemon-reload
        sudo systemctl enable "$SERVICE_NAME"
        sudo systemctl start "$SERVICE_NAME"
        
        # Verify service state
        IS_ACTIVE=$(sudo systemctl is-active "$SERVICE_NAME")
        if [ "$IS_ACTIVE" = "active" ]; then
            log_success "Background Systemd Service is successfully configured and running!"
        else
            log_warning "Service registered, but failed to start cleanly. Check logs with 'sudo journalctl -u $SERVICE_NAME'."
        fi
    else
        log_error "Could not write service file. Proceeding with manual launch instructions."
    fi
fi

# 6. Global Command CLI Setup ('jmc')
echo -e "\n${CYAN}${BOLD}=== COMMAND LINE UTILITY PROVISIONING ===${NC}"
echo "We can configure a global 'jmc' terminal command so that typing 'jmc'"
echo "in any Linux terminal window will instantly launch the club portal."
read -p "Would you like to install the 'jmc' command? [Y/n] " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ || -z $REPLY ]]; then
    CLI_PATH="/usr/local/bin/jmc"
    APP_DIR=$(pwd)

    log_info "Creating global terminal command script..."

    # Write temporary wrapper script locally
    TEMP_CLI="./jmc-cli"
    cat << 'EOF' > "$TEMP_CLI"
#!/bin/bash
# Josephite Math Club CLI Utility

# ANSI color codes
GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
BOLD='\033[1m'
NC='\033[0m'

PORT_VAL="3000"

# Detect actual APP_DIR dynamically from script setup
APP_DIR_VAL="REPLACE_WITH_APP_DIR"

# Try to load latest PORT from env if exists
if [ -f "$APP_DIR_VAL/.env" ]; then
    ENV_PORT=$(grep -E "^PORT=" "$APP_DIR_VAL/.env" | cut -d'=' -f2)
    if [ -n "$ENV_PORT" ]; then
        PORT_VAL="$ENV_PORT"
    fi
fi

# Detect service status
SERVICE_STATUS="unknown"
if command -v systemctl &>/dev/null; then
    if systemctl is-active --quiet josephite-math-club 2>/dev/null; then
        SERVICE_STATUS="running"
    elif systemctl is-failed --quiet josephite-math-club 2>/dev/null; then
        SERVICE_STATUS="failed"
    else
        SERVICE_STATUS="inactive"
    fi
fi

echo -e "${CYAN}${BOLD}================================================================================"
echo -e "              JOSEPHITE MATH CLUB - WEB PORTAL COMMAND UTILITY                  "
echo -e "================================================================================"
echo -e "${NC}"

if [ "$SERVICE_STATUS" = "running" ]; then
    echo -e "${GREEN}${BOLD}[ONLINE]${NC} Background daemon is actively running on port ${PORT_VAL}."
elif [ "$SERVICE_STATUS" = "failed" ]; then
    echo -e "${RED}${BOLD}[FAILED]${NC} Background daemon failed to start. Run 'sudo systemctl restart josephite-math-club'."
elif [ "$SERVICE_STATUS" = "inactive" ]; then
    echo -e "${YELLOW}${BOLD}[STOPPED]${NC} Background daemon is registered but not currently running."
    echo -e "          To start daemon:  sudo systemctl start josephite-math-club"
else
    echo -e "${YELLOW}${BOLD}[NOT CONFIGURED]${NC} Systemd background service was not configured."
fi

# Launch as standalone native window (App Mode)
URL="http://localhost:${PORT_VAL}"
echo -e "\n${CYAN}${BOLD}[LAUNCH]${NC} Initializing dedicated standalone app container window..."

LAUNCHED=false

# Search for any installed Chromium/Chrome-based engine that supports --app mode
for BROWSER_CMD in "google-chrome" "google-chrome-stable" "chromium-browser" "chromium" "brave-browser" "microsoft-edge"; do
    if command -v "$BROWSER_CMD" &>/dev/null; then
        echo -e "${GREEN}${BOLD}[SUCCESS]${NC} Launching via $BROWSER_CMD (App Mode)..."
        "$BROWSER_CMD" --app="${URL}" &>/dev/null &
        LAUNCHED=true
        break
    fi
done

# If no Chromium-based engine is found, check for Firefox to run in a dedicated new window
if [ "$LAUNCHED" = false ]; then
    if command -v firefox &>/dev/null; then
        echo -e "${GREEN}${BOLD}[SUCCESS]${NC} Launching via Firefox (New Window Mode)..."
        firefox -new-window "${URL}" &>/dev/null &
        LAUNCHED=true
    fi
fi

# Fallback to standard web-browser launchers
if [ "$LAUNCHED" = false ]; then
    echo -e "${YELLOW}${BOLD}[WARNING]${NC} Could not locate a native Chrome/Chromium/Firefox engine for dedicated window mode."
    echo -e "${CYAN}${BOLD}[INFO]${NC} Falling back to default system web browser..."
    if command -v xdg-open &>/dev/null; then
        xdg-open "${URL}" &>/dev/null &
    elif command -v sensible-browser &>/dev/null; then
        sensible-browser "${URL}" &>/dev/null &
    elif command -v x-www-browser &>/dev/null; then
        x-www-browser "${URL}" &>/dev/null &
    else
        echo -e "${RED}${BOLD}[ERROR]${NC} Could not find any automated graphical browser launcher."
        echo -e "         Please access the app manually at: ${URL}"
    fi
fi

echo -e "\n${GREEN}${BOLD}[STATUS]${NC} Command executed successfully. Have a stellar day!"
echo -e "${CYAN}${BOLD}================================================================================${NC}"
EOF

    # Substitute REPLACE_WITH_APP_DIR with the actual APP_DIR
    sed -i "s|REPLACE_WITH_APP_DIR|$APP_DIR|g" "$TEMP_CLI"

    log_info "Moving command utility to /usr/local/bin/ (requires sudo credentials)..."
    sudo mv "$TEMP_CLI" "$CLI_PATH"
    sudo chmod +x "$CLI_PATH"

    if [ -x "$CLI_PATH" ]; then
        log_success "Global command '${BOLD}jmc${NC}' has been successfully installed!"
    else
        log_error "Failed to set up global command execution."
    fi
fi

# Final Summary Dashboard
IP_ADDR=$(hostname -I | awk '{print $1}')
echo -e "\n${GREEN}${BOLD}================================================================================"
echo "              INSTALLATION AND HOSTING COMPLETED SUCCESSFULLY!                  "
echo "================================================================================"
echo -e "${NC}"
echo -e "Your Josephite Math Club application has been fully deployed on your local system."
echo -e "You can access the portal via the following URLs:"
echo -e " - Local Machine: ${BOLD}http://localhost:$USER_PORT${NC}"
if [ -n "$IP_ADDR" ]; then
    echo -e " - Local Network: ${BOLD}http://$IP_ADDR:$USER_PORT${NC}"
fi
echo -e " - Configured Domain: ${BOLD}http://$USER_APP_URL${NC}"
echo

echo -e "${CYAN}${BOLD}Service Management Cheat Sheet:${NC}"
echo -e "To manage your background application server, use the following bash commands:\n"
echo -e "  - ${BOLD}Start Service:${NC}     sudo systemctl start josephite-math-club"
echo -e "  - ${BOLD}Stop Service:${NC}      sudo systemctl stop josephite-math-club"
echo -e "  - ${BOLD}Restart Service:${NC}   sudo systemctl restart josephite-math-club"
echo -e "  - ${BOLD}Check Status:${NC}      sudo systemctl status josephite-math-club"
echo -e "  - ${BOLD}View Live Logs:${NC}    sudo journalctl -u josephite-math-club -f"
echo

echo -e "Thank you for using Josephite Math Club Web Services. Have a brilliant day of analytical excellence!"
echo "================================================================================"
chmod +x "$0" # ensure this file retains exec permissions
