# 💬 DA-Bubble

<p align="center">
  <img
    src="https://raw.githubusercontent.com/serhat-ozcakir/DA-Bubble/master/DA-Bubble/public/assets/img/header/header_logo.png"
    width="150"
    alt="DA-Bubble Logo">
</p>

<h3 align="center">
A full-featured real-time team communication platform built with Angular 20 and Supabase.
</h3>

<p align="center">
  Inspired by modern collaboration platforms such as Slack and Discord.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Angular-20-DD0031?style=for-the-badge&logo=angular&logoColor=white"/>
  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white"/>
  <img src="https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white"/>
  <img src="https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white"/>
  <img src="https://img.shields.io/badge/SCSS-CC6699?style=for-the-badge&logo=sass&logoColor=white"/>
</p>

<p align="center">
  <a href="https://serhat-oezcakir.de/DA-Bubble/">
    🚀 Live Demo
  </a>
  •
  <a href="https://serhat-oezcakir.de">
    🌐 Portfolio
  </a>
</p>

---

## 📖 About the Project

**DA-Bubble** is a responsive real-time communication platform for teams and communities.

Users can communicate through channels, direct messages and threaded conversations while message updates, reactions, memberships and user data are synchronized in real time.

The application was developed with **Angular 20**, **TypeScript** and **Supabase** and focuses on clean architecture, responsive UX, real-time communication and secure database access.

The project includes a complete authentication flow, channel management, direct messaging, threaded discussions, reactions, search, mentions and guest access.

---

## ✨ Key Features

### 🔐 Authentication

- Email & password authentication
- Google OAuth login
- Anonymous guest login
- Password reset flow
- Persistent authentication sessions
- Protected workspace routes

### 💬 Messaging

- Public channel conversations
- Private direct messages
- Threaded discussions
- Message editing
- Real-time message synchronization
- Real-time thread updates
- Last reply information
- Automatic message state synchronization

### 😀 Reactions & Mentions

- Emoji picker
- Emoji reactions
- Reaction toggle
- Reaction summaries
- Recently used reactions
- `@User` mentions
- `#Channel` mentions

### 👥 Channels & Users

- Create channels
- Edit channel name and description
- Add members to channels
- Leave channels
- Real-time channel membership updates
- User profiles and avatars
- Online / offline status
- Guest profiles with automatically generated identities

### 🔍 Search

- Search users
- Search channels
- Search messages
- Direct-message search
- `@` and `#` based search modes

### 📱 Responsive UX

- Fully responsive desktop and mobile layouts
- Dedicated mobile navigation
- Mobile channel management
- Mobile thread view
- Mobile search
- Optimized virtual-keyboard behavior
- Support down to small smartphone screen sizes

---

## ⚡ Real-Time Architecture

DA-Bubble uses **Supabase Realtime** to synchronize important application state without requiring page refreshes.

Real-time synchronization is implemented for:

- Channel messages
- Direct messages
- Thread replies
- Message edits
- Emoji reactions
- Channel updates
- Channel memberships
- User profiles

Angular **Signals** are used throughout the application to keep UI state synchronized efficiently with incoming database events.

---

## 🔒 Security

Database access is protected through **Supabase Row Level Security (RLS)**.

Policies control access to application data such as:

- Profiles
- Channels
- Channel memberships
- Messages
- Direct messages
- Reactions

Authentication and authorization are handled through Supabase Auth together with protected Angular routes.

---

## 🏗️ Architecture

The project follows a feature-oriented Angular structure with a clear separation between:

- UI Components
- Feature Components
- Services
- Models
- Routing
- Authentication
- Database communication
- Real-time synchronization

Application-wide state such as messages, selected conversations, reactions and UI state is managed primarily with **Angular Signals**.

Routes are lazy-loaded to reduce the initial application bundle and separate authentication and workspace features.

---

## 🛠️ Tech Stack

### Frontend

- Angular 20
- TypeScript
- Angular Signals
- Standalone Components
- Angular Router
- Reactive Forms
- RxJS
- SCSS

### Backend & Database

- Supabase
- PostgreSQL
- Supabase Authentication
- Supabase Realtime
- Row Level Security (RLS)

### Authentication

- Email / Password
- Google OAuth
- Anonymous Guest Authentication

### Development Tools

- Git
- GitHub
- Figma
- Visual Studio Code
- Angular CLI

---

## 📸 Screenshots

### Workspace

<p align="center">
  <img
    src="assets/img/DABubble.png"
    alt="DA-Bubble Workspace"
    width="900">
</p>

---

## 🚀 Running the Project Locally

Clone the repository:

```bash
git clone https://github.com/serhat-ozcakir/DA-Bubble.git
