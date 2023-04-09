#!/usr/bin/env bash
COL_GREEN='\033[0;32m'
COL_RED='\033[0;31m'
COL_RESET='\033[0m'

GIT_NAME="Bestellsystem"

ABWBS_GITURL="https://github.com/ABW-Bestellsystem/${GIT_NAME}.git"

INSTALL_LOG="/var/log/abwbs_install.log"
INSTALL_REPO="/etc/abwbs"

# check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

package_exists() {
    dpkg -s "$1" >/dev/null 2>&1
}

install_dockerparts() {
    printf "%b${COL_GREEN}Installing Docker-Components${COL_RESET}\\n"
    
    #  apt-get install ca-certificates curl gnupg lsb-release -y
    #  curl -fsSL https://download.docker.com/linux/debian/gpg | sudo gpg --batch --yes --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
    
    #  echo \
    #  "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/debian \
    #  $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
    
    #  sudo apt-get update
    #  sudo apt-get install docker-ce docker-ce-cli containerd.io docker-compose-plugin -y
    
    sudo apt-get update
    apt-get install ca-certificates curl gnupg lsb-release
    
    sudo mkdir -m 0755 -p /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/debian/gpg | sudo gpg --dearmor --batch --yes -o /etc/apt/keyrings/docker.gpg
    
    echo "deb [arch="$(dpkg --print-architecture)" signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/debian "$(. /etc/os-release \
    && echo "$VERSION_CODENAME")" stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
    
    sudo apt-get update
    
    sudo apt-get install docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
}

# use "effective user id", to check if user is root
if [[ $EUID -ne 0 ]]; then
    printf "%b${COL_RED}This script must be run as root${COL_RESET}\\n"
    exit 1
fi

# check if git is installed, if not install it
if ! command_exists git; then
    printf "%b${COL_RED}Git is not installed${COL_RESET}\\n"
    printf "%b${COL_GREEN}Installing Git${COL_RESET}\\n"
    sudo apt-get update
    sudo apt-get install -y git
fi

if ! package_exists apt-transport-https; then
    printf "%b${COL_RED}apt-transport-https is not installed${COL_RESET}\\n"
    printf "%b${COL_GREEN}Installing apt-transport-https${COL_RESET}\\n"
    sudo apt-get update
    sudo apt-get install -y apt-transport-https
fi

# check if docker is installed, if not install it
if ! command_exists docker; then
    printf "%b${COL_RED}Docker is not installed${COL_RESET}\\n"
    
    install_dockerparts
fi

# check if docker-compose is installed, if not install it
if ! command_exists docker-compose; then
    printf "%b${COL_RED}Docker-Compose is not installed${COL_RESET}\\n"
    install_dockerparts
fi

updaterepos() {
    printf "%b${COL_GREEN}Updating Git Repositories${COL_RESET}\\n"
    
    git -C $INSTALL_REPO/${GIT_NAME} pull
}

installrepos() {
    printf "%b${COL_GREEN}Installing Git Repositories${COL_RESET}\\n"
    
    git -C $INSTALL_REPO clone $ABWBS_GITURL
}

# check if installation directory exists, if not create it
if [ ! -d "$INSTALL_REPO" ]; then
    printf "%b${COL_GREEN}Creating installation directory${COL_RESET}\\n"
    mkdir -p $INSTALL_REPO
    installrepos
    elif [ ! "$(ls -A $INSTALL_REPO)" ]; then
    printf "%b${COL_GREEN}Installation directory is empty${COL_RESET}\\n"
    installrepos
else
    printf "%b${COL_GREEN}Installation directory already exists ${COL_RESET}\\n"
    updaterepos
fi
