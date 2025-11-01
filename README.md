# PomoDo

A minimalist productivity app combining Pomodoro timer and todo list management. Built with React, Tailwind CSS, and Supabase.

**Focus. Complete. Achieve.**

---

## ✨ Features

### 📝 **Todo Management**
- **Multi-scope Organization**: Organize tasks into different categories (Work, Personal, Projects, etc.)
- **Quick Add**: Press `/` or `Cmd+K` to focus input instantly
- **Inline Editing**: Click on task text to rename
- **Smart Completion**: Check off tasks and track your progress
- **Undo Support**: Accidentally deleted? Undo within 5 seconds
- **Persistent State**: All your tasks sync across devices

### ⏱️ **Pomodoro Timer**
- **Customizable Duration**: Set your own work and break periods
- **Audio Notifications**: Get notified when timer completes
- **Visual Progress**: Clean progress bar with time remaining
- **Persistent Timer**: Timer continues running even after page refresh
- **Mobile Optimized**: Collapsible timer on mobile devices

### 🎵 **Music/Podcast Player**
- **YouTube Integration**: Play background music or podcasts while working
- **Clean Controls**: Play, pause, mute controls
- **Persistent Playback**: Resume playback after page reload
- **Visual Feedback**: Animated waveform bars when playing
- **Minimal Widget**: Non-intrusive player that aligns with your todo list

### 🎨 **User Experience**
- **Dark/Light Mode**: Toggle themes with persistent preference
- **Keyboard Shortcuts**: Navigate efficiently with hotkeys
- **Responsive Design**: Perfect on desktop, tablet, and mobile
- **Touch-Friendly**: Optimized touch targets for mobile
- **Smooth Animations**: Polished micro-interactions throughout

### 🔐 **Authentication & Security**
- **Secure Login**: Email authentication with Supabase
- **Password Visibility**: Toggle password visibility during input
- **Loading States**: Clear feedback during authentication
- **Success Messages**: Smooth transitions with status updates
- **Row-Level Security**: Your data is private and secure

### 📱 **Progressive Web App (PWA)**
- **Install to Home Screen**: Works like a native app on mobile
- **Offline UI**: App loads and works without internet
- **Fast Loading**: Service worker caching for instant load times
- **App-Like Experience**: Full screen mode on mobile devices

---

## 🚀 Quick Start

### Prerequisites
- Node.js 16 or higher
- A Supabase account (free tier works)

### 1. Supabase Setup

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to **Settings** → **API** and copy:
   - Project URL
   - Anon/Public Key

3. Run this SQL in **SQL Editor**:

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- User Settings table
CREATE TABLE user_settings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  dark_mode BOOLEAN DEFAULT false,
  pomodoro_work_time INTEGER DEFAULT 25,
  pomodoro_break_time INTEGER DEFAULT 5,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Scopes table
CREATE TABLE scopes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Todos table
CREATE TABLE todos (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  scope_id UUID REFERENCES scopes(id) ON DELETE CASCADE NOT NULL,
  text TEXT NOT NULL,
  completed BOOLEAN DEFAULT false,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_scopes_user_id ON scopes(user_id);
CREATE INDEX idx_scopes_position ON scopes(position);
CREATE INDEX idx_todos_scope_id ON todos(scope_id);
CREATE INDEX idx_todos_position ON todos(position);

-- Row Level Security (RLS) Policies
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE scopes ENABLE ROW LEVEL SECURITY;
ALTER TABLE todos ENABLE ROW LEVEL SECURITY;

-- User Settings Policies
CREATE POLICY "Users can view own settings"
  ON user_settings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own settings"
  ON user_settings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own settings"
  ON user_settings FOR UPDATE
  USING (auth.uid() = user_id);

-- Scopes Policies
CREATE POLICY "Users can view own scopes"
  ON scopes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own scopes"
  ON scopes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own scopes"
  ON scopes FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own scopes"
  ON scopes FOR DELETE
  USING (auth.uid() = user_id);

-- Todos Policies
CREATE POLICY "Users can view own todos"
  ON todos FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM scopes
      WHERE scopes.id = todos.scope_id
      AND scopes.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own todos"
  ON todos FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM scopes
      WHERE scopes.id = todos.scope_id
      AND scopes.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own todos"
  ON todos FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM scopes
      WHERE scopes.id = todos.scope_id
      AND scopes.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own todos"
  ON todos FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM scopes
      WHERE scopes.id = todos.scope_id
      AND scopes.user_id = auth.uid()
    )
  );

-- Function to automatically create default scope on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_settings (user_id)
  VALUES (NEW.id);

  INSERT INTO public.scopes (user_id, name, position)
  VALUES (NEW.id, 'Personal', 0);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to run function on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_user_settings_updated_at
  BEFORE UPDATE ON user_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_scopes_updated_at
  BEFORE UPDATE ON scopes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_todos_updated_at
  BEFORE UPDATE ON todos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### 2. Local Setup

1. **Clone and Install**
   ```bash
   git clone <your-repo-url>
   cd todolist-app
   npm install
   ```

2. **Configure Environment**

   Create `.env.local` in the root directory:
   ```env
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

3. **Start Development Server**
   ```bash
   npm run dev
   ```

   Open http://localhost:5173

---

## 📖 User Guide

### Getting Started

1. **Sign Up**: Create account with email and password (minimum 6 characters)
2. **Sign In**: Login with your credentials
3. **Add Tasks**: Type in input field and press Enter
4. **Organize**: Create multiple scopes for different projects

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `/` or `Cmd+K` | Focus task input |
| `Esc` | Clear input (when focused) |
| `Cmd+1/2/3...` | Switch between scopes |
| `Enter` | Submit form |
| `Double Click` | Rename scope tab |

### Todo Management

- **Add Task**: Type and press Enter or click "Add"
- **Complete Task**: Click checkbox
- **Edit Task**: Click on task text to rename
- **Delete Task**: Click trash icon (hover on desktop)
- **Undo Delete**: Click "Undo" within 5 seconds

### Scope Management

- **Create Scope**: Click "+" button next to tabs
- **Rename Scope**: Double-click tab name
- **Delete Scope**: Click "X" on tab (cannot delete last scope)
- **Switch Scopes**: Click tab or use `Cmd+1/2/3`

### Pomodoro Timer

1. **Start Timer**: Click clock icon
2. **Configure**: Click settings icon to adjust durations
3. **Control**: Use Play/Pause and Reset buttons
4. **Notifications**: Browser will notify when timer completes
5. **Close Timer**: Click X to hide timer

### Music Player

1. **Add Music**: Click music icon → Paste YouTube URL
2. **Controls**: Play, Pause, Mute buttons
3. **Change Track**: Click on player widget title
4. **Close Player**: Click X to remove music

### Dark Mode

- Toggle with moon/sun icon (top right)
- Preference saved to your account
- Syncs across devices

---

## 🏗️ Tech Stack

### Frontend
- **React 18** - UI library
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Utility-first styling
- **Lucide React** - Icon library

### Backend
- **Supabase** - Backend as a Service
  - PostgreSQL database
  - User authentication
  - Row-level security
  - Real-time subscriptions

### PWA
- **Vite PWA Plugin** - Service worker generation
- **Workbox** - Caching strategies
- **Web App Manifest** - Install to home screen

---

## 📁 Project Structure

```
src/
├── components/
│   ├── Auth/
│   │   └── LoginPage.jsx          # Authentication UI
│   ├── Todo/
│   │   └── TodoApp.jsx             # Main app with todos & timer
│   └── Music/
│       └── MusicPlayer.jsx         # YouTube music player
├── services/
│   ├── api.js                      # Supabase API functions
│   ├── supabase.js                 # Supabase client
│   └── offlineQueue.js             # PWA offline queue (future)
├── App.jsx                         # Root component
├── main.jsx                        # Entry point
└── index.css                       # Global styles & animations

public/
├── manifest.json                   # PWA manifest
├── sw.js                           # Service worker (auto-generated)
└── icon.svg                        # App icon
```

---

## 🎨 Design Philosophy

### Minimalist UI
- Clean, distraction-free interface
- Focus on content, not chrome
- Generous whitespace
- Subtle animations

### Typography
- Lora font for elegance
- Clear hierarchy
- Optimal line length
- Responsive sizing

### Color Palette
- Dark mode: `#1a1a1a` background
- Light mode: `#fafafa` background
- Neutral grays for UI elements
- Accent colors for interactions

### Mobile-First
- Responsive breakpoint at 768px
- Touch-friendly targets (min 44px)
- Optimized spacing for small screens
- Smart layout adjustments

---

## 🚢 Deployment

### Build for Production
```bash
npm run build
```

Output will be in `dist/` directory.

### Deploy to Vercel (Recommended)
```bash
npm i -g vercel
vercel
```

Add environment variables in Vercel dashboard:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

### Deploy to Netlify
1. Connect GitHub repository to Netlify
2. Build command: `npm run build`
3. Publish directory: `dist`
4. Add environment variables

### Configure Supabase for Production
1. Go to **Authentication** → **URL Configuration**
2. Add production domain to **Site URL**
3. Add redirect URLs

---

## 🐛 Troubleshooting

### Authentication Issues
- Verify `.env.local` variables are set correctly
- Check Supabase project URL and anon key
- Ensure email confirmation is disabled (Settings → Authentication)

### Data Not Loading
- Verify SQL schema ran successfully
- Check RLS policies in Supabase dashboard
- Check browser console for errors

### Timer Persists After Refresh
- This is intentional! Timer state is saved to localStorage
- Click Reset or Close timer to clear

### Music Player Issues
- Service Worker may be caching old version
- Hard refresh (Cmd+Shift+R / Ctrl+Shift+F5)
- Clear service worker in DevTools → Application → Service Workers

### PWA Not Installing
- PWA requires HTTPS in production
- Icons must be 192x192 and 512x512 PNG
- Check manifest.json in DevTools → Application

---

## 🔮 Future Enhancements

### Planned Features
- [ ] Offline sync queue (infrastructure ready in `offlineQueue.js`)
- [ ] Task priority levels
- [ ] Subtasks / checklists
- [ ] Due dates and reminders
- [ ] Task statistics and analytics
- [ ] Export/import tasks
- [ ] Keyboard shortcuts customization
- [ ] Custom themes
- [ ] Push notifications for timer

### PWA Improvements
- [ ] Background sync for offline changes
- [ ] Push notifications
- [ ] Share target (share links to PomoDo)
- [ ] App shortcuts menu

---

## 📄 License

MIT License - feel free to use for personal or commercial projects.

---

## 🙏 Credits

Built with modern web technologies:
- React team for React 18
- Vercel for Vite
- Tailwind Labs for Tailwind CSS
- Supabase for amazing BaaS
- Lucide for beautiful icons

---

## 💬 Support

Issues? Suggestions? Feel free to open an issue or submit a pull request!

**Made with focus and simplicity.**
