
# F2P

Leaderboard running event web apps.


## Acknowledgements

 - [Laravel 11 Documentation](https://laravel.com/docs/11.x)
 - [Learn React JS](https://react.dev/learn)
 - [Template Component Documentation](https://ui.shadcn.com/)
 - [Tailwind CSS Documentation](https://tailwindcss.com/)


## Important Notes

We’re using Laravel for the backend and ReactJS for the frontend! 🚀
• We’ve wrapped it all up with Shadcn for templates and Tailwind CSS for styling! 🌟
• Tailwind makes styling a breeze—no separate CSS files needed! 🙌
This combination is sure to make development smooth and fun! Let’s rock this project! 💪

# Installation Guide

This guide provides step-by-step instructions to install **PHP 8.2** and **Node.js 20** using **NVM** (Node Version Manager) for both **Linux** and **Windows** users.

---

## **1. Install PHP 8.2**

### **For Linux Users**

#### **Step 1.1: Update the System**
Run the following command to update the package manager and system packages:
```bash
sudo apt update && sudo apt upgrade -y
```

#### **Step 1.2: Add PHP Repository**
Add the PHP PPA (Personal Package Archive) to your system:
```bash
sudo add-apt-repository ppa:ondrej/php
sudo apt update
```

#### **Step 1.3: Install PHP 8.2**
Install PHP 8.2 along with common extensions:
```bash
sudo apt install php8.2 php8.2-cli php8.2-fpm php8.2-mysql php8.2-xml php8.2-curl php8.2-mbstring php8.2-zip php8.2-intl -y
```

#### **Step 1.4: Verify Installation**
Check the installed PHP version:
```bash
php -v
```

### **For Windows Users**

#### **Step 1.1: Download PHP**
Visit the official PHP download page: https://windows.php.net/download/
Download the Thread Safe zip file for PHP 8.2.

#### **Step 1.2: Extract PHP**
Extract the downloaded ZIP file to a directory, e.g., C:\php.

#### **Step 1.3: Configure PHP**
Add the PHP directory to your system's PATH environment variable:

Open Control Panel → System → Advanced system settings → Environment Variables.
In the System variables section, find and edit the Path variable.
Add the full path to your PHP folder, e.g., C:\php.
Rename php.ini-development to php.ini in the extracted folder.

#### **Step 1.4: Verify Installation**
Open a command prompt and run:
```bash
php -v
```


## **2. Install Node.js 20 Using NVM**
### **For Linux Users**
#### **Step 2.1: Install NVM**
Download and install the latest version of NVM ([you can read for more detail from here](https://github.com/nvm-sh/nvm?tab=readme-ov-file#installing-and-updating)):

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.5/install.sh | bash
```

#### **Step 2.2: Activate NVM
Reload your shell to activate NVM:
```bash
export NVM_DIR="$([ -z "${XDG_CONFIG_HOME-}" ] && printf %s "${HOME}/.nvm" || printf %s "${XDG_CONFIG_HOME}/nvm")"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
```
Alternatively, close and reopen your terminal.

#### **Step 2.3: Install Node.js 20**
Install Node.js 20 using NVM:

```bash
nvm install 20
```
#### **Step 2.4: Use Node.js 20**

Set Node.js 20 as the default version:
```bash
nvm use 20
nvm alias default 20
```
#### **Step 2.5: Verify Installation**
Check the installed Node.js and npm versions:
```bash
node -v
npm -v
```

### **For Windows Users**
#### **Step 2.1: Install NVM for Windows**
Download NVM for Windows from the official repository: https://github.com/coreybutler/nvm-windows/releases.
Install NVM using the downloaded installer.
#### **Step 2.2: Configure NVM**
During installation:

Select a directory for NVM (e.g., C:\nvm).
Select a directory for global Node.js installations (e.g., C:\Program Files\nodejs).
#### **Step 2.3: Install Node.js 20**
Open a command prompt and run:

bash
Copy
Edit
nvm install 20
nvm use 20
#### **Step 2.4: Verify Installation**
Check the installed Node.js and npm versions:

```bash
node -v
npm -v
```

## *Summary*
- PHP 8.2 and Node.js 20 are installed successfully on your system.
- Linux users installed Node.js 20 using NVM for Linux.
- Windows users installed Node.js 20 using NVM for Windows.

For additional support, refer to:

- [PHP Documentation](https://www.php.net/manual/en/install.php)
- [NVM for Linux](https://github.com/nvm-sh/nvm)
- [NVM for Windows](https://github.com/coreybutler/nvm-windows)
## Run Locally

### Install dependencies

*Install Node Dependencies*
```bash
  npm install
```

*Install PHP Dependencies*
```bash
  composer install
```

### Create environment

- rename file .env.example into .env
- generate APP_KEY:
```bash
php artisan key:generate
```
- adjust the database section:
```
DB_CONNECTION=sqlite
# DB_HOST=127.0.0.1
# DB_PORT=3306
# DB_DATABASE=laravel
# DB_USERNAME=root
# DB_PASSWORD=
```
into:
```
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=database_name
DB_USERNAME=mysql_username
DB_PASSWORD=mysql_password
```


### Migrate database
Open terminal / bash then type command:
```bash
php artisan migrate
```

### Generate your first admin account
Open terminal / bash then type command:
```bash
php artisan db:seed --class=AdminSeeder
```

### Start Run Locally
Open terminal / bash then type command:
```bash
php artisan serve
```

Open another terminal / bash then type command:
```bash
npm run dev
```
