# QuestBoard – Turn Your Tasks Into Quests

**QuestBoard** is a webb-application that transforms everyday task into an game-like quest application.  
Built with **Next.js** and **Supabase**, it combines quests, XP, coins, streaks, and badges into a fun, motivational app.

**Live Demo:** [https://questboard.it.com/](https://questboard.it.com/)

---

## Overview

QuestBoard gamifies personal productivity through a quest-based task management system.  
Users complete **daily**, **weekly**, and **one-time** quests to earn **XP**, **coins**, and **badges**, which can be used to **customize avatars** and unlock **celebration animations**.

---

## Core Features

### Quest Management System
- **Quest Types:** Daily, weekly, and one-time quests with automatic recurrence  
- **Smart Scheduling:** Upcoming quests appear in advance  
- **Deadline Warnings:** Alerts for quests due soon (within 2 hours)  
- **Quest History:** Collapsible sections for "Today", "Yesterday", and "Last Week"  
- **Quest Editing:** Edit quests directly via modal interface  

### Gamification & Progression
- **XP System:** Gain experience to level up  
- **Coin Economy:** Earn and spend coins in the shop  
- **Daily Streaks:** Maintain login streaks for bonuses  
- **Badge System:** Unlock badges like “7-day-streak” and “10-quests”  
- **Activity Dashboard:** Visualize your quest and login history  

### Shop & Customization
- **Avatars:** DiceBear-generated with custom ring designs  
- **Celebration Animations:** Buy confetti, fireworks, emoji rain, and more  
- **Ownership Tracking:** Persistent items stored via local storage  
- **Default Avatar:** Automatically assigned to new users  

### UX & Visuals
- **Responsive Design:** Mobile-first, with desktop sidebar  
- **Animations:** Canvas confetti, fireworks, and particle effects  
- **Live Updates:** Real-time XP and coin updates  
- **Progress Bars:** Visual feedback for task progress and streaks  

---

## Technical Architecture

### Frontend
- [Next.js](https://nextjs.org/) with App Router  
- [TypeScript](https://www.typescriptlang.org/) for strict typing  
- [Tailwind CSS](https://tailwindcss.com/) for utility-first styling  
- [Canvas Confetti](https://www.npmjs.com/package/canvas-confetti) & Fireworks.js for animations  
- [React Hooks](https://react.dev/reference/react) for state and lifecycle logic  

### Backend & Database
- [Supabase](https://supabase.com/) for authentication and real-time syncing  
- [PostgreSQL](https://www.postgresql.org/) as main database  
- [Prisma ORM](https://www.prisma.io/) for database modeling
- RESTful API routes for quests, users, and shop operations  

---

## Database Schema

| Model | Description |
|-------|--------------|
| **User** | Stores profile info, XP, coins, level, streaks, and badges |
| **Quest** | Details each quest: title, type, due date, completion, and reward |

---

## Key Technical Highlights

- **Real-time Updates:** Event-driven state management  
- **Optimistic UI:** Instant updates while syncing in background  
- **Connection Pooling:** Efficient database performance  
- **Type Safety:** End-to-end through TypeScript and Prisma  
- **Production Deployment:** Optimized builds on Vercel  

---

## Authentication

- Supabase handles signup, login, and session management  
- On first login, a default profile and avatar are generated automatically  

---

## User Flow

1. **Login / Signup** → Supabase auth  
2. **Create Quests** → Choose type and schedule  
3. **Complete Tasks** → Earn XP and coins  
4. **View Dashboard** → See streaks and quest history  
5. **Spend Coins** → Buy avatars or celebration animations in the Shop  

---

## Deployment

- **Platform:** [Vercel](https://vercel.com)  
- **Production URL:** [https://questboard.it.com](https://questboard.it.com)  
- **Build Command:** `npm run build`  
- **Start Command:** `npm start`  
