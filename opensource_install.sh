#!/usr/bin/env bash
COL_GREEN='\033[0;32m'
COL_RED='\033[0;31m'
COL_RESET='\033[0m'

GIT_NAME="ABW-Bestellsystem"
ABWBS_GITURL="https://github.com/ABW-Bestellsystem/${GIT_NAME}.git"

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

configureCompose() {
    
    # remove old .env file
    
    if [ -f "$INSTALL_REPO/${GIT_NAME}/.local.backend.env" ]; then
        rm $INSTALL_REPO/${GIT_NAME}/.local.backend.env
    fi
    
    # ask what main-url should be used (standard: http://localhost:3000)
    printf "%b${COL_GREEN}What should be the main-url? (standart http://localhost:3000)${COL_RESET}\\n"
    read -p "Main-URL: " mainurl
    mainurl="${mainurl:-http://localhost:3000}"
    echo "FRONTEND_URL=$mainurl" >> $INSTALL_REPO/${GIT_NAME}/.local.backend.env
    
    # ask what mongodb-user should be used (standard: abwbs)
    printf "%b${COL_GREEN}What should be the mongodb-user? (standard: abwbs) ${COL_RESET}\\n"
    read -p "MongoDB User: " mongouser
    mongouser="${mongouser:-abwbs}"
    echo "MONGO_USER=$mongouser" >> $INSTALL_REPO/${GIT_NAME}/.local.backend.env
    
    
    # ask what mongodb-password should be used
    printf "%b${COL_GREEN}What should be the mongodb-password?${COL_RESET}\\n"
    read -s -p "Password: " password
    printf "\\n"
    read -s -p "Repeat Password: " password2
    
    # repeat until passwords match and not empty
    while [ "$password" != "$password2" ] || [ -z "$password" ]; do

        if [ -z "$password" ]; then
            printf "%b${COL_RED}Password cannot be empty${COL_RESET}\\n"
        else
            printf "%b${COL_RED}Passwords do not match${COL_RESET}\\n"
        fi

        read -s -p "Password: " password
        printf "\\n"
        read -s -p "Repeat Password: " password2
    done
    
    printf "\\n"
    echo "MONGO_PASSWORD=$password" >> $INSTALL_REPO/${GIT_NAME}/.local.backend.env

    # ask what mongodb-database should be used (standard: abwdb)
    printf "%b${COL_GREEN}What should be the mongodb-database? (standard: abwdb)${COL_RESET}\\n"
    read -p "MongoDB Database: " mongodb
    mongodb="${mongodb:-abwdb}"
    echo "MONGO_DB=$mongodb" >> $INSTALL_REPO/${GIT_NAME}/.local.backend.env

    # ask what API-URL should be used (standard: http://localhost:42069)
    printf "%b${COL_GREEN}What should be the API-URL? (standard http://localhost:42069)${COL_RESET}\\n"
    read -p "API-URL: " apiurl
    apiurl="${apiurl:-http://localhost:42069}"
    echo "API_URL=$apiurl" >> $INSTALL_REPO/${GIT_NAME}/.local.frontend.env

    # rename docker-compose.example.yml to docker-compose.yml
    if [ -f "$INSTALL_REPO/${GIT_NAME}/docker-compose.yml" ]; then
        rm $INSTALL_REPO/${GIT_NAME}/docker-compose.yml
    fi

    mv $INSTALL_REPO/${GIT_NAME}/docker-compose.example.yml $INSTALL_REPO/${GIT_NAME}/docker-compose.yml
}

postInstall() {
    # ask if docker-compose should be started
    printf "%b${COL_GREEN}Do you want to start the docker-compose?${COL_RESET}\\n"
    
    select yn in "Yes" "No"; do
        case $yn in
            Yes ) docker-compose -f $INSTALL_REPO/${GIT_NAME}/docker-compose.yml up -d;
                printf "%b${COL_GREEN}Docker-Compose started${COL_RESET}\\n"
            break;;
            No )
                printf "%b${COL_GREEN}You can start the docker-compose with the following command:${COL_RESET}\\n"
                printf "%b${COL_GREEN}docker-compose -f ${INSTALL_REPO}/${GIT_NAME}/docker-compose.yml up -d${COL_RESET}\\n"
            break;;
        esac
    done
}

checkInstallStatus() {
    # check if installation directory exists, if not create it
    if [ ! -d "$INSTALL_REPO" ]; then
        printf "%b${COL_GREEN}Creating installation directory${COL_RESET}\\n"
        mkdir -p $INSTALL_REPO
        installrepos
        elif [ ! "$(ls -A $INSTALL_REPO)" ]; then
        printf "%b${COL_GREEN}Installation directory is empty${COL_RESET}\\n"
        installrepos
        printf "%b${COL_GREEN}Installation finished${COL_RESET}\\n "
        printf "%b${COL_GREEN}You can find the installations files in ${INSTALL_REPO}/${GIT_NAME}${COL_RESET}\\n"
        
        configureCompose
        
    else
        printf "%b${COL_GREEN}Installation directory already exists ${COL_RESET}\\n"
        updaterepos
        printf "%b${COL_GREEN}You can find the installations files in ${INSTALL_REPO}/${GIT_NAME}${COL_RESET}\\n"
    fi
}

main() {
    # display menu
    
    while [ "$choice" != "7" ]; do
        
        printf "%b${COL_GREEN}What do you want to do?${COL_RESET}\\n"
        printf "%b${COL_GREEN}1) Install${COL_RESET}\\n"
        printf "%b${COL_GREEN}2) Update${COL_RESET}\\n"
        printf "%b${COL_GREEN}3) Reconfigure${COL_RESET}\\n"
        printf "%b${COL_GREEN}4) Start Docker-Compose${COL_RESET}\\n"
        printf "%b${COL_GREEN}5) Stop Docker-Compose${COL_RESET}\\n"
        printf "%b${COL_GREEN}6) Restart Docker-Compose${COL_RESET}\\n"
        printf "%b${COL_GREEN}7) Exit${COL_RESET}\\n"
        
        read -p "Enter choice [ 1 - 7 ] " choice
        clear
        case $choice in
            1) checkInstallStatus
                postInstall
            ;;
            2) updaterepos
            ;;
            3) configureCompose
            ;;
            4) docker-compose -f $INSTALL_REPO/${GIT_NAME}/docker-compose.yml up -d
            ;;
            5) docker-compose -f $INSTALL_REPO/${GIT_NAME}/docker-compose.yml down
            ;;
            6) docker-compose -f $INSTALL_REPO/${GIT_NAME}/docker-compose.yml restart
            ;;
            7) exit 0
            ;;
            *) printf "%b${COL_RED}Error...${COL_RESET}\\n" && sleep 2
            ;;
        esac
    done
}

# run main function
main