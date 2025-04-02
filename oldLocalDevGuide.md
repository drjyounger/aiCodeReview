## Start of Local Setup Instructions ##

# TempStars Development Setup Guide (M1 Pro Web-Only Edition)

## Table of Contents
* System Requirements
* API Setup
  * A. Repository & Environment
  * B. AWS Configuration (Optional)
  * C. Database Setup
  * D. Environment Variables
  * E. Launch API & Verify
* API Troubleshooting
* Web App Setup
  * A. Clone the App Repository
  * B. Install Dependencies (Web Only)
  * C. Launch the Web App
* Web App Troubleshooting
* Important Notes & FAQ

## System Requirements

### macOS (M1 Pro or M2):
* You may need Rosetta 2 for certain command-line installers.
* Install it with:
```


sudo softwareupdate --install-rosetta

 

 


```
* Node.js: Version 23 or higher (use nvm if needed).
* Git: With SSH keys configured for GitHub.
* AWS CLI (optional if you don't need to interact with AWS services locally).
* MySQL 8.0: Via Homebrew or direct download.
* Xcode: Only required for iOS builds—not needed if you're only doing web.

## API Setup

### A. Repository & Environment

#### Clone the Repo 
```


git clone git@github.com:drjyounger/tempstars-api.git cd tempstars-api

python

 


```
This ensures you're working on your personal development branch.

#### Install Yarn (if you don't have it)
```


npm install --global yarn

 

 


```
#### Install Dependencies
```


yarn install

r

 


```
Tip: If you see any warnings about missing TypeScript definitions (e.g., express-unless), install them:
```


yarn add -D @types/express-unless

 

 


```
### B. AWS Configuration (Optional)

If you do need AWS for certain features (like S3 file uploads, etc.):

#### Install AWS CLI
```



# **For Apple Silicon, install Rosetta 2 first, then:**

curl "[https://awscli.amazonaws.com/AWSCLIV2.pkg](https://awscli.amazonaws.com/AWSCLIV2.pkg)" -o "AWSCLIV2.pkg" sudo installer -pkg AWSCLIV2.pkg -target / rm AWSCLIV2.pkg

 

 


```
#### Configure AWS Profile
```


aws configure --profile env-setup


# **Enter your AWS Access/Secret Keys**


# **Leave region & output format blank if not needed**

 

 


```
Important: If you're not using AWS at all, you can skip this section entirely.

### C. Database Setup

#### 1. Install & Start MySQL 8
```


brew install mysql@8.0 brew services start mysql@8.0

 

 


```
If you run into MySQL permission issues, see the Troubleshooting section below.

#### 2. Secure MySQL & Set a Strong Password
```


mysql_secure_installation


# **Choose MEDIUM or STRONG password policy**


# **Follow prompts to set root password**

 

 


```
#### 3. Create a Database & User
```


mysql -u root -p


# **Enter your root password from the step above**

CREATE DATABASE tempstars;


# **Make sure your password meets the MySQL policy (e.g., 8+ chars, mixed-case, digits)**

CREATE USER 'tempstars'@'localhost' IDENTIFIED BY 'TempStars2024!'; GRANT ALL PRIVILEGES ON tempstars.* TO 'tempstars'@'localhost'; FLUSH PRIVILEGES; EXIT;

   

 


```
Note: If you prefer to just use root for everything locally, that's fine—just update your .env accordingly.

### D. Environment Variables

#### Create/Update .env File
```


cp .env.example .env

 

 


```
Then edit .env to match your local database settings:
```


DATABASE_HOST=localhost DATABASE_USER=tempstars DATABASE_PASSWORD=TempStars2024! DATABASE_NAME=tempstars DATABASE_PORT=3306 API_PORT=11000 API_HOST=0.0.0.0

   

 


```
#### (Optional) Yarn Setup Script
If there's a command like:
```


yarn setupEnvironment local

   

 


```
This may populate or update your .env. Verify the database credentials afterwards.

#### (Optional) Database Import
If you have a DB dump:
```


mysql -u tempstars -p tempstars &lt; path/to/dumpfile.sql

 

 


```
### E. Launch API & Verify

#### Start the API
```


yarn start

   

 


```
#### Check the Logs
If it compiles successfully, you'll see something like:
```


Listening on 0.0.0.0:11000 Sent refresh signal

 

 


```
#### Health Check
```


curl[ http://localhost:11000/healthy](http://localhost:11000/healthy)


# **Should return a 200 status code (empty response)**

 

 


```
#### Swagger Docs
* Open http://localhost:11000/api-docs in your browser to see available endpoints.
* All route files are mounted under /v3/, so typical endpoints look like http://localhost:11000/v3/user/..., http://localhost:11000/v3/job/..., etc.

## API Troubleshooting

### MySQL Authentication Errors
```


ALTER USER 'tempstars'@'localhost' IDENTIFIED WITH mysql_native_password BY 'TempStars2024!'; FLUSH PRIVILEGES;

 

 


```
### Rosetta 2 Required
```


sudo softwareupdate --install-rosetta

 

 


```
### TypeScript Definition Errors
```


yarn add -D @types/whatever_missing yarn start

 

 


```
### Port Conflicts
```


lsof -i :11000


# **Kill or change port in .env (API_PORT=)**

 

 


```
## Web App Setup

### A. Clone the App Repository
```


cd .. git clone git@github.com:drjyounger/tempstars-app.git cd tempstars-app

java

 


```
### B. Install Dependencies (Web Only)
Since we do NOT need mobile builds:
Skip Xcode, Cordova, Android SDK steps.

Install Yarn (if not already):
```


npm install -g yarn

   

 


```
Install Project Dependencies:
```


yarn install cd micro-react-project yarn install cd ..

 

 


```
### Environment Setup
If your web app has an equivalent .env or setup script:
```


yarn setupEnvironment local

 

 


```
Then double-check your database or API endpoints in the .env files.

### C. Launch the Web App

#### Start:
```


yarn start

csharp

 


```
#### Open in Browser:
Typically, it runs on http://localhost:5000 by default (or whatever the console says).

#### Verify It Connects to API:
If the web app needs data from the API, ensure the API is still running on http://localhost:11000.

## Web App Troubleshooting

### Port 5000 Already in Use
```


lsof -i :5000 kill -9 &lt;pid>


# **Or change the port in Gruntfile or relevant config.**

   

 


```
### Missing www Folder
If a Cordova or grunt build complains about www/, create it:
```


mkdir www

 

 


```
However, if you're strictly web, you might not need Cordova at all.

## Important Notes & FAQ

### MySQL Strict Password Policy:
* For a strong password, use 8+ characters, mixed case, numbers, maybe a symbol.

### Rosetta 2:
* If AWS CLI or any .pkg installer complains, install Rosetta 2.

### AWS Not Required for Local:
* If you don't need any S3 or AWS features, you can skip the AWS CLI steps.

### No Mobile Builds:
* iOS/Android steps are irrelevant for your local web dev. Feel free to ignore them.

### Keep Credentials Secure:
* Don't commit .env to version control. Use .gitignore.

## That's It!
By following the above steps, you should have both the TempStars API and TempStars Web App running on your M1 Pro in local dev mode—no mobile builds necessary. If you get stuck, check the Troubleshooting sections or reach out for credentials/assistance.

## End of Local Development Setup Instructions ##

The TempStars codebase is separated into a front end repo 'tempstars-app' and a backend repo 'tempstars-api'.

This is a detailed summary of TempStar front-end codebase:

## Start Front End Codebase Description ##

Front End Setup Guide

New Developer Onboarding & Codebase Guide  
Welcome to the team! This guide is designed to walk you through the TempStars codebase step-by-step so you can set up your environment, understand the architecture, and start contributing productively.  
This project is a hybrid mobile app (with Cordova/Framework7) as well as a micro React application. Below is everything you need: from the folder structures, to how to build and run the project, to key areas of the code.  
---  
1. Overview & Purpose  
TempStars is a platform that connects dental offices (Dentists) and dental professionals (Hygienists) for temping and permanent positions. The code you'll see manages functionalities such as posting and viewing job listings, handling user onboarding, and providing an internal messaging and rating system.  
Broadly, the code:  
Has a Cordova/Framework7 front-end for the mobile app portion (under the "src/pages" directory).  
Uses a micro React project (in the "micro-react-project/" directory) for certain newer features or other web-based components.  
Is packaged with Grunt and Yarn as the main build tools.  
Supports Node and Yarn within a Docker build environment for production.  
---  
2. Tech Stack & Main Libraries  
Cordova: A platform to run web-based code in a native mobile container.  
Framework7: A front-end framework used for the Cordova app's UI and routing.  
jQuery / DOM Manipulation / Underscore (lodash): You'll see some usage of $, event binding, etc.  
React: The "micro-react-project" uses React (bootstrapped with Create React App) for a more modern UI approach on top of or alongside the Cordova environment.  
Node.js & Yarn: For local development, installing dependencies, etc.  
Grunt: Used for legacy tasks like packaging, bundling, or environment setup.  
Docker: Used for containerizing the entire environment.  
---  
3. Repository Structure  
You'll see two main "faces" of the project:  
A hybrid mobile app built with Cordova/Framework7. It lives primarily in the "src/" directory (especially "src/pages/…").  
A micro React application living at "micro-react-project/".  

Below is a rough breakdown:
```
tempstars-app/
├── .dockerignore
├── .gitignore
├── .env                       <-- (ignored by .gitignore, but present in the local environment)
├── README.md
├── build.json
├── config.tpl.xml
├── create-version.sh
├── Gruntfile.js
├── jsconfig.json
├── package.json
├── setupEnvironment.js
├── devops/
│   ├── Dockerfile
│   ├── Jenkinsfile
│   └── launch.sh
├── build/
│   ├── AndroidManifest.xml.orig
│   ├── Build_proccess.sh
│   ├── Prepare.sh
│   ├── android-build.sh
│   ├── android-release.keystore
│   └── password.txt
├── hooks/
│   ├── README.md
│   └── stripExtraWritePerm.js
├── micro-react-project/
│   ├── .gitignore
│   ├── README.md
│   ├── package.json
│   ├── yarn.lock
│   └── build/
│       ├── asset-manifest.json
│       └── index.html
└── src/
    ├── config/
    │   └── (generated config.js and config.json go here)
    ├── app/
    ├── img/
    ├── lib/
    ├── pages/
    └── (other source directories and files)

Ignored or temporary directories/files (via .gitignore / .dockerignore):
  • node_modules/
  • platforms/
  • plugins/
  • www/
  • *.lock
  • .idea/
  • .vscode/

```
Key Directories & Files  
src/pages/dentist/:  
Contains multiple file modules like "hirejob-step-description.js," "hirejob-step-details.js," etc. These handle the forms and steps for dentists posting permanent or contract positions.  
Also includes other Dentist-related UI flows: job posting, listing job candidates, etc.  

src/pages/hygienist/:  
Contains modules for the Hygienist side of the app, such as "home.js," "findjob-details.js," etc.  

src/pages/landing/:  
Pages for landing screens, including tips, help pages, or "tips-getting-offer."  

micro-react-project/:  
A separate React application (Create React App) for certain features, with its own package.json, "src/pages/," etc.  

hooks/:  
Cordova hooks that run at various times in the app's lifecycle (e.g., before build, after plugin installation, etc.).  

devops/Dockerfile:  
Docker build instructions. Builds a base Node environment, installs Yarn, moves forward with the micro-react-project as well.  

package.json & Gruntfile.js:  
project-level scripts, tasks, and environment.  

build/ folder:  
Contains shell scripts or environment-specific build logic.  

Below is a step-by-step, highly detailed guide that picks up right after you've successfully set up your local development environment. This guide will outline the typical workflow, how to run and debug both the Cordova/Framework7 (mobile) app and the micro React project, and best practices for making changes.  
------------------------------------------------------------------------------  
OVERALL PROJECT ORGANIZATION  
• You already have your environment set up, so you should have:  
– The main project repository cloned and dependencies installed.  
– The micro React project set up (inside micro-react-project/).  

• The codebase is split into two main pieces:  
1) A Cordova/Framework7 application (located in src/, plus Grunt tasks and Cordova config).  
2) A React application (located in micro-react-project/).  

• You'll often see references to pages or screens in the src/pages directory (for the Cordova app) and standard React components/pages in micro-react-project/src/.  
------------------------------------------------------------------------------  
RUNNING THE CORDOVA/FRAMEWORK7 APP LOCALLY  
To verify that everything is working, you can run the Cordova app in a few ways:  

2.1 Running in the Browser (Quick Testing)  
Go to your project's root directory in a terminal.  
Check that Cordova's "browser" platform is added. You can add it if necessary:  
```


cordova platform add browser

csharp

 


```
Run the Cordova app as follows:  
```


cordova run browser

 

 


```
This command bundles the app and opens it in your web browser (usually localhost:8000).  
Alternatively, if the project uses Grunt, you might do:  
```


yarn start

 


```
or  
```


grunt serve

 

 


```
depending on how your package.json and Gruntfile tasks are set up.  
This environment will let you see some of the UI and logic without needing a device or emulator.  

2.2 Running on an Actual Device or Emulator  
To run on iOS:  
• cordova platform add ios  
• cordova build ios  
• cordova run ios –device  
(If you skip --device, it will try to launch the iOS Simulator.)  

To run on Android:  
• cordova platform add android  
• cordova build android  
• cordova run android --device  

Note: For iOS, you typically need Xcode installed and an Apple Developer account for device testing. For Android, you need Android Studio or the command-line Android SDK + USB debugging enabled on your phone.  
------------------------------------------------------------------------------  
RUNNING THE MICRO REACT PROJECT  
The micro React project is in micro-react-project/ and is a standard Create React App with TypeScript.  

Open a new terminal and navigate to micro-react-project/.  
Run:  
```


yarn start 


```
This should launch a local development server at http://localhost:3000.  
The page will automatically reload when you make changes to the React code.  

You can view or modify the React-based pages in micro-react-project/src/pages. For instance, you'll see:  
• Onboarding_DO/Onboarding_DO.tsx – The react-based onboarding flow for Dental Offices (Dentists).  
• Onboarding_Talent/Onboarding_Talent.tsx – The react-based onboarding flow for Hygienists/Assistants.  
------------------------------------------------------------------------------  
CODE STRUCTURE & HOW TO MAKE CHANGES  

4.1 Cordova/Framework7 Side (src/)  
• Within src/pages, you'll see subfolders like dentist/, hygienist/, landing/, etc. Each subfolder contains page-specific JavaScript (business logic) and matching HTML files.  
• For example:  
– src/pages/dentist/hirejob-step-description.js: The logic for the "Listing Title & Description" step when a dentist posts a job.  
– src/pages/dentist/hirejob-step-description.html: The corresponding markup for that step.  
• Typically, each JavaScript file uses Framework7's page lifecycle hooks: onPageBeforeInit, onPageInit, and onPageBeforeRemove to attach or clean up event listeners and manipulate the DOM.  
• If you're changing text, layout, or basic logic in a specific page:  
1) Locate the .html file in src/pages/dentist/ (or hygienist/, landing/, etc.).  
2) Locate the corresponding .js for event handling or data.  
3) You may see lines like app.onPageInit('dentist-hirejob-step-description', function(page) { … }), which is where you'd place any code that needs to run once that page is initialized.  
• After changing Cordova or Framework7 code, re-run your build or reload the browser to see your changes.  

4.2 React Side (micro-react-project/)  
• Inside micro-react-project/src, you'll see:  
– pages/ (e.g., landing/Onboarding_DO, landing/Onboarding_Talent).  
– Some shared components in components/ or hooks in hooks/.  
• The folder structure is fairly typical for a React app: each page is a component, and you can import others as needed.  
• Once you start yarn start, changes appear in the browser automatically.  

4.3 Communication Between the Two Projects  
• In some areas, the React app complements or replaces certain Cordova screens. In app.js (in the Cordova code), you might see references to TempStars.App.goReact('somePage'), which routes to the React application.  
• The window.app or window.eval references are sometimes used to jump from the React environment into the Cordova environment. This is a transitional pattern: when the React app calls eval(TempStars.Dentist.Router.goForwardPage(...)), it's telling the older Cordova Router to open a particular page.  
------------------------------------------------------------------------------  
DEBUGGING & LOGGING  

5.1 Debugging Cordova  
When running in the browser:  
– Open DevTools in Chrome (Ctrl+Shift+I on Windows, Cmd+Opt+I on macOS).  
– Check the Console tab for logs or errors.  

When running on iOS/Android:  
– For iOS, you can open Safari's Develop > Simulator or USB device for debugging.  
– For Android, use Chrome DevTools: type "chrome://inspect" in Chrome to attach to your device.  

You'll see console.log statements from the various .js files. You can add more logging statements if needed.  

5.2 Debugging React  
• Simply open your browser's DevTools while the local React development server is running at http://localhost:3000.  
• You'll see logs in the console (from console.log in the React components).  
• You can also use breakpoints or React Developer Tools if you have that extension installed.  
------------------------------------------------------------------------------  
TESTING WORKFLOWS  
Below are common flows you might test or modify:  

Dentist job-posting flow (Cordova)  
– Found in src/pages/dentist/hirejob-step-description.js, hirejob-step-requirements.js, etc.  
– The user picks details, sets requirements, sees a success screen. You can just "fake" data or run it locally to see the UI.  

Hygienist onboarding flow (React or Cordova)  
– The older code in src/app/onboarding.js triggers some modals.  
– The React-based approach may handle new user guidance via Onboarding_Talent.tsx.  

Switching between roles  
– You can log in as a dentist or a hygienist in the local environment (this may require a test account or mock data).  
------------------------------------------------------------------------------  
COMMON TROUBLESHOOTING TIPS  
• If the Cordova run android or run ios command fails, ensure:  
– The respective platform is added (cordova platform add android/ios).  
– You have the required system dependencies (Android SDK, Xcode, etc.).  

• If yarn start fails for the micro-react-project:  
– Check that you ran yarn from within micro-react-project.  
– Verify no ports conflict (it defaults to http://localhost:3000).  

• If you see weird reference errors (like "TempStars is not defined") inside React code:  
– This might be because the React code is calling into the global TempStars object from Cordova. Check that you are either in the environment where TempStars is available or wrap the call in a try/catch. Usually, these references are safe only when you're inside the Cordova WebView or if the global object is attached.  
------------------------------------------------------------------------------  
MAKING A NEW FEATURE  
As an entry-level developer, here's the typical pattern for adding a new feature or modifying an existing one:  

Decide if the feature belongs in Cordova/Framework7 or in the React micro-app. Usually new features are being developed in React.  

If building a new page in Cordova:  
– Create a new .html file in src/pages/<somefolder>/<newpage>.html.  
– Create a matching .js for the logic.  
– Hook it up via app.js or an existing router.  

If building a new React component:  
– In micro-react-project/src/pages or micro-react-project/src/components, create a new .tsx file.  
– Add routing if needed in micro-react-project/src/App.tsx or wherever the routes are defined.  

Test thoroughly in your local environment.  
------------------------------------------------------------------------------  
HOW TO DEPLOY OR PACKAGE FOR PRODUCTION  
Even though your environment is just for development right now, here's how final packaging can occur:  

• For the Cordova app:  
– Typically run a Grunt or Yarn script that does grunt parseEnvironment and builds for iOS/Android. For instance:  
```


yarn build_device

  

 


```
– This will produce the final .apk (Android) or .ipa (iOS).  

• For the React app:  
– Inside micro-react-project, run:  
```


yarn build

 

 


```
– This outputs a production-ready build/ folder that can be served on a standard web server or integrated into the Cordova build pipeline.  

• For Docker (if used):  
– The devops/Dockerfile defines how to containerize it. Usually:  
```


docker build -t tempstars-app .

 


```
– Then:  
```


docker run -p 3000:3000 tempstars-app

 

 


```
------------------------------------------------------------------------------  
NEXT STEPS & BEST PRACTICES  
Use Git Flow:  
– Make a new branch for features or bug fixes.  
– Pull request for code reviews.  

Keep Code Organized:  
– Put React components in logical folders (pages/dentist, pages/hygienist, etc.).  
– Use separate .css or .scss modules in React for styling.  

Communicate with the Team:  
– If something in Cordova is unclear, ask or check for a bridging function in the React code.  
– Keep an eye on each environment's logs to confirm that calls to TempStars.Api or TempStars.App are working as expected.  
------------------------------------------------------------------------------  
CONCLUSION  
From here, you can safely run the project, explore the code, add new features, and debug any issues you run into. The key points to remember are:  
• The Cordova/Framework7 app is older but still heavily used, especially for the "Dentist" posting flows and "Hygienist" loyalty features.  
• The micro React project is your modern environment for new or refactored flows, with an easier toolchain.  

Feel free to reach out to the team if you get stuck or have questions about where to place new features.

## End of Front End Description and Guide ##

And this is a detailed guide to the api back end:

## Start Back End Description and Guide ##

TempStars API Codebase Deep Dive: A New Developer's Guide  
Welcome to the TempStars API team! This guide is designed to give you a thorough understanding of the API codebase, its structure, and the technologies it employs. Let's dive in.

1. Overall Project Scope and Intent  
TempStars is a two-sided marketplace that connects dental offices with dental professionals for temping and hiring in North America. The API you'll be working on is the backend of this platform, handling data storage, business logic, and communication with the frontend applications.  

Key Characteristics:  
Two-Sided Marketplace: The system must efficiently handle the needs of both dental offices (dentists) and dental professionals (hygienists, assistants, etc.).  

North America Focused: The API caters to users in both Canada and the United States, meaning that you may encounter logic that is country specific.  

Emphasis on Local Development: As a new developer, your workflow will primarily be in the different branches depending on the task at hand.  

API-First Approach: The project emphasizes a solid API backend that front-end applications interact with, meaning you will be building out and maintaining API endpoints.  

Real-World Scenarios: The API handles sensitive data like user profiles, payment info, and appointment scheduling, requiring a cautious approach to development and data security.  

2. High-Level Structure and File Organization  
The project is structured with separate repositories for the API (tempstars-api) and the front-end application (tempstars-app), which live alongside each other in the TEMPSTARSAPP folder. Within the API repo we find following top-level structure:
```


tempstars-api
├── config
│   ├── default.json
│   ├── development.json
│   ├── production.json
│   ├── setupEnvironment.js
│   └── test.json
├── devops
│   ├── cron
│   │   ├── Dockerfile
│   │   └── launch.sh
│   ├── Dockerfile
│   └── launch.sh
├── dist               (compiled output)
├── node_modules       (dependencies)
├── src
│   ├── cron
│   │   └── app.js
│   ├── routes
│   │   ├── admin.route.ts
│   │   ├── affiliate.route.ts
│   │   ├── aws.route.ts
│   │   ├── dentist.route.ts
│   │   ├── hygienist.route.ts
│   │   ├── job.route.ts
│   │   ├── user.route.ts
│   │   └── [other route files]
│   ├── services
│   │   ├── aws.service.ts
│   │   └── push.ts
│   ├── socket
│   │   └── socket.ts
│   └── utils
│       └── helpers.ts
├── sys
│   └── pro.html
├── test
│   ├── aws
│   │   └── index.test.js
│   ├── job.test.js
│   └── mocha.opts
├── .brackets.json
├── .dockerignore
├── .env
├── .env.example
├── .eslintrc.json
├── .gitignore
├── index.ts
├── package.json
└── tsconfig.json


 


```
This structure follows a common backend pattern, separating concerns to keep code organized and maintainable.

3. Technology Stack  
Here's a breakdown of the main technologies used in the API, and why they are used:  

Node.js: The server-side runtime environment that allows JavaScript to execute on the backend. It is asynchronous and non-blocking which is well-suited for handling multiple concurrent connections.  

TypeScript: Superset of JavaScript that adds static typing. TypeScript improves code quality and makes it easier to refactor or maintain large codebases.  

Express.js: The framework used for building the API, providing tools for routing, request handling, and middleware.  

MySQL: The database used to store application data. It is a robust, widely used open-source database management system which makes it suitable for storing user and job data.  

Yarn: A fast, reliable package manager for installing project dependencies.  

Nodemon: A utility that automatically restarts the Node.js application when file changes are detected, speeding up local development.  

Mocha: The testing framework that provides tools for writing and running unit tests.  

Chai: Assertion library that works in conjunction with Mocha, for writing expressive tests.  

Sinon: Library that provides spies, stubs, and mocks for unit testing.  

Supertest: Library for testing HTTP servers, simulating API interactions.  

JWT (JSON Web Tokens): Used to handle authentication and authorization of API requests.  

AWS SDK: The official Amazon Web Services library for Node, used to communicate with AWS services like S3.  

Stripe: A service to process financial transactions.  

4. Detailed Overview of Key Components  
4.1. src/ directory  
src/cron/: Contains scripts that are executed on a schedule (cron jobs). These tasks handle things like billing, notifications, and data cleanups:

- app.js: The main cron process entry point.  
- billing.js: Handles automatic billing processes, such as collecting payments and sending payment reminders.  
- duplicates.js: Manages the process of identifying duplicate users.  
- hireJobs.js: Manages the scheduling and expiration of hire jobs.  
- shifts.js: Manages the scheduling and expiration of temporary shifts, and payment reminders  
- user.js: Tasks relating to user management, for example sending out "bail" emails to incomplete signups  
- delayedNotifications.js: Used for sending delayed push notifications  
- promotion.js: For promotion logic in the system  
- hygienist.js: Handles tasks relating to hygienists, including status changes  

src/routes/: Defines the API endpoints and connects them to the appropriate controller functions. They are grouped by features, such as:

- admin.route.ts: Endpoints for administrative tasks, such as updating user information  
- affiliate.route.ts: Endpoints related to affiliates  
- aws.route.ts: Endpoints for AWS S3 interaction.  
- dentist.route.ts: Endpoints for interacting with dentist data.  
- hygienist.route.ts: Endpoints for managing hygienist information.  
- job.route.ts: Endpoints for temporary shift and job board listings  
- user.route.ts: Endpoints for user account management, profiles  
- invoice.route.js: Endpoints for managing invoices  
- location.route.js: Endpoints to work with Location data  
- market.route.js: Endpoints related to the market  
- newArea.route.js: Endpoints related to new locations  
- partialOffer.route.js: Endpoints to handle partial offers for jobs  
- skills.route.ts: Endpoints related to the different skills for Hygienists.  
- survey.route.js: Endpoints for submitting survey data  
- twilio.route.js: Endpoints for interacting with Twilio for SMS communications  
- jobApplication.route.js: Endpoints for handling job applications  

src/services/: Contains the core logic for the application, implementing business rules and interacting with data sources. Key services include:

- aws.ts: Handles all interactions with AWS  
- email.js: Responsible for sending emails using Mandrill and SES  
- hygienist.service.js: Functions that relate to hygienist accounts  
- invoice.service.js: Manages invoice-related functionality, for example sending out invoice emails  
- job.service.js: Includes functions for job creation, status updates and managing the logic for billing  
- location.ts: Location related functions  
- location.service.js: Location related functions and queries  
- mailChimp.js: Handles integration with Mailchimp.  
- partialOffer.service.js: Functions related to partial offers.  
- push.ts: Handles sending push notifications  
- skill.service.ts: Functions relating to the different skills in the system  
- stripe.js: handles all interactions with Stripe payment processing  
- twilio.ts: Used for connecting with and managing calls/conversations via Twilio.  
- user.service.ts: Handles user related functionality  

src/socket/: Used to configure the system's real time socket communication

- socket.ts: Sets up the Socket.io server for real-time updates to the UI  

src/utils/: Contains helper functions, constants, text messages and other utility functionality.

- constants.ts: Defines constants used throughout the application (e.g. user roles, statuses)  
- errors.ts: Defines custom error classes  
- helpers.js: Includes common helper methods and utilities  
- jwt.ts: Helper methods to use with json web tokens  
- text-constants.ts: Holds all text strings for the project  

src/models/: Defines the data structures and provides methods to interact with the database.

- aboutMeInput.model.js: Data for About Me input on user profile.  
- affiliate.model.js: For information about users, related to referral  
- blockedHygienist.model.js: Used to handle blocked hygienists.  
- blockedDentist.model.js: Used to handle blocked dentists.  
- dentist.model.js: Data and functionality related to dentist users.  
- dentistCancelled.js: Model for cancelled dentist bookings  
- favouriteDentist.model.js: Data model for favourite dentists  
- favouriteHygienist.model.js: Data model for favourite hygienists  
- hireJob.model.js: Data model for handling hire jobs  
- hygienist.model.js: Data and functionality for hygienist users  
- hygienistCancelled.model.js: Used for tracking cancelled hygienist shifts  
- hygienistCancellationScore.model.ts: For calculating hygienist rating  
- hygienistHourlyRates.model.js: For handling hygienist rate information.  
- invoice.model.js: Represents the structure of invoices in the application  
- job.model.js: Data for temporary shifts  
- jobApplication.model.js: Data model relating to job applications  
- market.model.ts: Data model relating to geographical market location  
- newArea.js: Data model for regions being targeted.  
- notification.model.js: Data for push notifications  
- partialOffer.model.js: Data model related to offers between hygienist and dentist  
- postalCode.model.js: Used for managing postal code information  
- roleMapping.model.js: For managing user roles.  
- roleMapping.model.ts: For managing user roles (typescript)  
- skills.model.ts: For handling skills for hygienists  
- shift.model.js: Data structure for managing shifts  
- surveyAnswer.model.js: For recording and storing survey responses  
- duplicate.model.js: For managing duplicate records  
- *marketingSms.model.js: For handling SMS marketing data  

4.2. config/ directory  
config/index.js: Loads all configuration settings for different environments.  
config/default.json: Contains default configuration settings.  
config/development.json: Settings specific to a development environment.  
config/production.json: Settings for a production environment.  
config/test.json: Settings for a test environment  
config/setupEnvironment.js: Environment setup script  

4.3. devops/ directory  
devops/launch.sh: A bash script to launch the API in a docker environment.  
devops/cron/launch.sh: A bash script to launch the cron application.  
devops/Dockerfile: The build steps for a docker container.  

4.4. test/ directory  
test/aws/: Tests for AWS interaction  
test/dentist.controller/: Tests for all dentist controller functions.  
test/shifts.cron/: Tests for all cron shifts functionality.  
test/user.cron/: Tests for user related cron functionality.  
test/: Various tests used by the system: unit tests, integration tests, and helper methods  

5. Local Development Workflow  
Based on the newDevSetup.md and DeveloperSetup.md files, here's the process for a new developer to start working locally:

Cloning the Repository: Clone the API and the frontend app to your local machine:
```


git clone git@github.com:drjyounger/tempstars-api.git cd tempstars-api

 

cd .. git clone git@github.com:drjyounger/tempstars-app.git cd tempstars-app

   

 


```
You will be working on your own local branch.

Install Dependencies: In both the tempstars-api and the tempstars-app folder:
```


yarn install cd micro-react-project yarn install cd ..


 


```
Database Setup: Make sure to install and start the MySQL database (see the setup documents for details). Create a database named 'tempstars' and create a user with required credentials to access that database.

Environment Variables: Create a .env file by copying .env.example and setting environment specific configurations.
```


cp .env.example .env

css

 


```
Remember to use a .gitignore to prevent committing to the repository

Start the API: In the tempstars-api directory
```


yarn start

   

 


```
Start the web app: In the tempstars-app directory
```


yarn start


 


```
Health Check: The API can be validated using a health check
```


curl[ http://localhost:11000/healthy](http://localhost:11000/healthy)

less

 


```
This should provide an empty response with a 200 status code.

API Docs: Browse the API documentation at http://localhost:11000/api-docs.

Troubleshooting Common Issues  
Port Conflicts: If the API cannot start, use  
```


lsof -i :11000

  

 


```
to find any process using port 11000 and kill the process (or change the port). Similarly, for the front end app,  
```


lsof -i :5000

   

 


```
Database Authentication Errors: If you see an auth error, check the username, database name and password.

Missing TypeScript Definitions: Add types using  
```


yarn add -D @types/your-missing-module

 


```
e.g.  
```


yarn add -D @types/express-unless

  

 


```
Rosetta 2: If you encounter issues with Apple Silicon (M1 Pro or M2), try running this in your terminal  
```


sudo softwareupdate --install-rosetta


 


```
6. Best Practices and Important Notes  
Code Style: Code formatting is consistent across the project  

Security: Take caution to avoid committing sensitive data to version control.  

Branching: Use your branch and avoid merges to staging or production.  

Testing: Write unit tests for all critical logic, which will be helpful for debugging  

Documentation: Ensure API docs are updated as new endpoints or functionality are added.  

Ask Questions: If you are unsure about something please ask the lead engineer.  

7. Working with Specific Features  
7.1. Working with Cron Jobs  
Cron jobs are scheduled tasks that run at specific times.  
Find the cron jobs located in the src/cron folder, with their main entry point in src/cron/app.js.  
Important to understand that they run in UTC time.  

7.2. Adding New API Endpoints  
Define the Route: Create a new route file (or modify an existing one) in src/routes/ defining your HTTP method (GET, POST, PUT, DELETE) and the endpoint URL.  
Create a Controller Function: Define the logic for this endpoint in src/controllers. This usually will involve database operations, data processing, and calling any necessary services.  
Test: Make sure to add a test file (or adjust an existing one) in test/ to test your code.  
Document: Use swagger comments to include API endpoint into documentation.  

7.3 Working With Models  
Models are used to interact with the database directly.  
They define the schema and methods relating to each database table.  

7.4 Working With Services  
Services are used to implement the business logic.  
Services use models to perform database actions.  
Services are what is used by the controllers.  

7.5 Working With Authentication  
Authentication is handled with jwt  
All protected routes use jwt(secret) to validate that user has a valid token  

8. Summary  
This is just a starting point, but you should now have a solid overview of the TempStars API codebase and development process.  
Be thorough with testing, and reach out when unsure.

## End Back End Guide ##