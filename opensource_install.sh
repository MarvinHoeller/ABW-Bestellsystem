#!/usr/bin/env bash
# Define colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
WHITE='\033[0;37m'
RESET='\033[0m'

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
    printf "%b${GREEN}Installing Docker-Components${RESET}\\n"
    
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
    printf "%b${RED}This script must be run as root${RESET}\\n"
    exit 1
fi

# check if git is installed, if not install it
if ! command_exists git; then
    printf "%b${RED}Git is not installed${RESET}\\n"
    printf "%b${GREEN}Installing Git${RESET}\\n"
    sudo apt-get update
    sudo apt-get install -y git
fi

if ! package_exists apt-transport-https; then
    printf "%b${RED}apt-transport-https is not installed${RESET}\\n"
    printf "%b${GREEN}Installing apt-transport-https${RESET}\\n"
    sudo apt-get update
    sudo apt-get install -y apt-transport-https
fi

# check if docker is installed, if not install it
if ! command_exists docker; then
    printf "%b${RED}Docker is not installed${RESET}\\n"
    
    install_dockerparts
fi

# check if docker-compose is installed, if not install it
if ! command_exists docker-compose; then
    printf "%b${RED}Docker-Compose is not installed${RESET}\\n"
    install_dockerparts
fi

updaterepos() {
    printf "%b${GREEN}Updating Git Repositories${RESET}\\n"
    
    git -C $INSTALL_REPO/${GIT_NAME} pull
}

getRepos() {
    printf "%b${GREEN}Installing Git Repositories${RESET}\\n"
    
    git -C $INSTALL_REPO clone $ABWBS_GITURL
}

configureCompose() {
    
    # remove old .env files
    
    if [ -f "$INSTALL_REPO/${GIT_NAME}/.env" ]; then
        rm $INSTALL_REPO/${GIT_NAME}/.env
    fi
    
    # ask what main-url should be used (standard: http://localhost:6969)
    printf "%b${GREEN}What should be the main-url? (standard http://localhost:6969)${RESET}\\n"
    read -p "Main-URL: " mainurl
    mainurl="${mainurl:-http://localhost:6969}"

    # ask if the app is deployed in a subfolder. If yes, ask for the subfolder
    printf "%b${GREEN}Is the app deployed in a subfolder? (default: '/')${RESET}\\n"
    read -p "Subfolder: " subfolder
    subfolder="${subfolder:-/}"

    mainurl="${mainurl}${subfolder}"
    echo "FRONTEND_URL=$mainurl" >> $INSTALL_REPO/${GIT_NAME}/.env
    echo "SUBFOLDER=$subfolder" >> $INSTALL_REPO/${GIT_NAME}/.env
    
    # ask what mongodb-user should be used (standard: abwbs)
    printf "%b${GREEN}What should be the mongodb-user? (standard: abwbs) ${RESET}\\n"
    read -p "MongoDB User: " mongouser
    mongouser="${mongouser:-abwbs}"
    echo "MONGO_USER=$mongouser" >> $INSTALL_REPO/${GIT_NAME}/.env
    
    
    # ask what mongodb-password should be used
    printf "%b${GREEN}What should be the mongodb-password?${RESET}\\n"
    read -s -p "Password: " password
    printf "\\n"
    read -s -p "Repeat Password: " password2
    
    # repeat until passwords match and not empty
    while [ "$password" != "$password2" ] || [ -z "$password" ]; do
        
        if [ -z "$password" ]; then
            printf "%b${RED}\\nPassword cannot be empty${RESET}\\n"
        else
            printf "%b${RED}\\nPasswords do not match${RESET}\\n"
        fi
        
        read -s -p "Password: " password
        printf "\\n"
        read -s -p "Repeat Password: " password2
    done
    
    printf "\\n"
    echo "MONGO_PASSWORD=$password" >> $INSTALL_REPO/${GIT_NAME}/.env
    
    # ask what mongodb-database should be used (standard: abwdb)
    printf "%b${GREEN}What should be the mongodb-database? (standard: abwdb)${RESET}\\n"
    read -p "MongoDB Database: " mongodb
    mongodb="${mongodb:-abwdb}"
    echo "MONGO_DB=$mongodb" >> $INSTALL_REPO/${GIT_NAME}/.env
    
    # ask what API-URL should be used (standard: http://localhost:42069)
    printf "%b${GREEN}What should be the API-URL? (standard http://localhost:42069)${RESET}\\n"
    read -p "API-URL: " apiurl
    apiurl="${apiurl:-http://localhost:42069}"
    echo "API_URL=$apiurl" >> $INSTALL_REPO/${GIT_NAME}/.env
    
    # ask what the first user should be called (standard: admin)
    printf "%b${GREEN}What should be the first user called? (standard: admin)${RESET}\\n"
    read -p "First User: " firstuser
    firstuser="${firstuser:-admin}"
    echo "FIRST_USER=$firstuser" >> $INSTALL_REPO/${GIT_NAME}/.env
    
    # clear password variable
    password=""
    password2=""
    
    # ask what the password for the first user should be
    printf "%b${GREEN}What should be the password for the first user?${RESET}\\n"
    read -s -p "Password: " password
    printf "\\n"
    read -s -p "Repeat Password: " password2
    
    # repeat until passwords match and not empty
    while [ "$password" != "$password2" ] || [ -z "$password" ]; do
        
        if [ -z "$password" ]; then
            printf "%b${RED}\\nPassword cannot be empty${RESET}\\n"
        else
            printf "%b${RED}\\nPasswords do not match${RESET}\\n"
        fi
        
        read -s -p "Password: " password
        printf "\\n"
        read -s -p "Repeat Password: " password2
    done
    
    printf "\\n"
    echo "FIRST_USER_PASSWORD=$password" >> $INSTALL_REPO/${GIT_NAME}/.env
    
    # copy docker-compose.example.yml to docker-compose.yml
    if [ -f "$INSTALL_REPO/${GIT_NAME}/docker-compose.yml" ]; then
        rm $INSTALL_REPO/${GIT_NAME}/docker-compose.yml
    fi
    
    cp $INSTALL_REPO/${GIT_NAME}/docker-compose.example.yml $INSTALL_REPO/${GIT_NAME}/docker-compose.yml
}

postInstall() {
    # ask if docker-compose should be started
    printf "%b${GREEN}Do you want to start the docker-compose?${RESET}\\n"
    
    select yn in "Yes" "No"; do
        case $yn in
            Yes )
                clear
                docker-compose -f $INSTALL_REPO/${GIT_NAME}/docker-compose.yml up -d;
                printf "%b${GREEN}Docker-Compose started${RESET}\\n"
            break;;
            No )
                clear
                printf "%b${GREEN}You can start the docker-compose with the following command:${RESET}\\n"
                printf "%b${GREEN}docker-compose -f ${INSTALL_REPO}/${GIT_NAME}/docker-compose.yml up -d${RESET}\\n"
            break;;
        esac
    done
}

checkInstallStatus() {
    # check if installation directory exists, if not create it
    if [ ! -d "$INSTALL_REPO" ]; then
        printf "%b${GREEN}Creating installation directory${RESET}\\n"
        mkdir -p $INSTALL_REPO
        getRepos
        elif [ ! "$(ls -A $INSTALL_REPO)" ]; then
        printf "%b${GREEN}Installation directory is empty${RESET}\\n"
        getRepos
        printf "%b${GREEN}Finished getting repositories${RESET}\\n"
        printf "%b${GREEN}You can find the installations files in ${INSTALL_REPO}/${GIT_NAME}${RESET}\\n"
        
        configureCompose
        
    else
        printf "%b${GREEN}Installation directory already exists ${RESET}\\n"
        updaterepos
        printf "%b${GREEN}You can find the installations files in ${INSTALL_REPO}/${GIT_NAME}${RESET}\\n"
    fi
}

main() {
    # display menu
    clear
    while [ "$choice" != "8" ]; do
        
        printf "%b${GREEN}What do you want to do?${RESET}\\n"
        printf "%b${GREEN}1)${WHITE} Install${RESET}\\n"
        printf "%b${GREEN}2)${WHITE} Update${RESET}\\n"
        printf "%b${GREEN}3)${WHITE} Reconfigure${RESET}\\n"
        printf "%b${GREEN}4)${WHITE} Start Docker-Compose${RESET}\\n"
        printf "%b${GREEN}5)${WHITE} Stop Docker-Compose${RESET}\\n"
        printf "%b${GREEN}6)${WHITE} Restart Docker-Compose${RESET}\\n"
        printf "%b${GREEN}7)${WHITE} Recompile Docker-Compose${RESET}\\n"
        printf "%b${GREEN}8)${WHITE} Exit${RESET}\\n"
        
        # read choise with color
        read -p "$(printf "%b${CYAN}Enter choice ${PURPLE}[ 1 - 7 ]${RESET} ")" choice
        
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
            7) docker-compose -f $INSTALL_REPO/${GIT_NAME}/docker-compose.yml up -d --build
            ;;
            8) exit 0
            ;;
            *) printf "%b${RED}Error...${RESET}\\n" && sleep 2
            ;;
        esac
    done
}

# run main function
main