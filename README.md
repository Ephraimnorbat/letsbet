# Lets Bet - Frontend

A modern sports betting platform frontend built with Next.js, TypeScript, and Tailwind CSS.

## 🚀 Features

- 🎨 Modern UI with dark/light mode support
- 📱 Fully responsive design
- ⚡ Real-time live matches updates
- 🎯 Betting slip management
- 📊 User dashboard and statistics
- 🏆 Leaderboard and rankings
- 🔒 Secure token-based authentication
- 🌐 Integration with Django REST API

## 🛠️ Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **API Client**: Axios with interceptors
- **Data Fetching**: TanStack Query (React Query)
- **Animations**: Framer Motion
- **Notifications**: React Hot Toast

## 📋 Prerequisites

- Node.js 18+ 
- npm or yarn package manager
- Backend API running (Django)

## 🚀 Getting Started

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd letsbet/frontend


celery
.\venv\Scripts\activate
celery -A api worker -l info -P eventlet

.\venv\Scripts\activate
celery -A api beat -l info

###running the backeend

python -m daphne -b 127.0.0.1 -p 8000 api.asgi:application

python manage.py run_crash_engine


###how to restart the services
sudo systemctl restart letsbet-gunicorn.service
sudo systemctl restart letsbet-daphne.service
sudo systemctl restart letsbet-celery.service
sudo systemctl restart letsbet-celerybeat.service
sudo systemctl restart letsbet-next.service