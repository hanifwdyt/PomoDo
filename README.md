# Todo App with Authentication

A minimalist, user-based todo list application with scopes, pomodoro timer, and dark mode. Built with React and Supabase.

## Features

- **Multi-scope Todo Lists**: Organize tasks into different categories (Work, Personal, etc.)
- **Pomodoro Timer**: Built-in focus timer with work/break cycles
- **Dark/Light Mode**: Toggle between themes with persistent settings
- **User Authentication**: Secure register/login with email
- **Cloud Sync**: Tasks automatically sync across devices
- **Clean UI**: Minimalist design built with Tailwind CSS

## Tech Stack

- **Frontend**: React 18 + Vite
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Backend**: Supabase (Auth + Database + Real-time)

## Prerequisites

Before you begin, ensure you have:
- Node.js 16+ installed
- A Supabase account (free tier works great)

## Setup Instructions

### 1. Supabase Setup

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Once your project is created, go to **Settings** > **API**
3. Copy your:
   - Project URL
   - Anon/Public Key

4. In the Supabase dashboard, go to **SQL Editor** and run the following SQL:

\`\`\`sql
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
  -- Create default user settings
  INSERT INTO public.user_settings (user_id)
  VALUES (NEW.id);

  -- Create default scope
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
\`\`\`

### 2. Local Setup

1. **Configure Environment Variables**

   Edit the \`.env.local\` file and add your Supabase credentials:

   \`\`\`env
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   \`\`\`

2. **Install Dependencies**

   \`\`\`bash
   npm install
   \`\`\`

3. **Start Development Server**

   \`\`\`bash
   npm run dev
   \`\`\`

   The app will open at \`http://localhost:5173\`

## Usage

### First Time Setup

1. Click "Sign Up" to create a new account
2. Check your email for verification (if enabled in Supabase)
3. Sign in with your credentials

### Managing Todos

- **Add Tasks**: Type in the input field and press Enter or click "Add"
- **Complete Tasks**: Click the checkbox next to any task
- **Delete Tasks**: Hover over a task and click the trash icon
- **Organize with Scopes**: Create different categories (Work, Personal, etc.)
- **Rename Scopes**: Double-click on a scope tab to rename it
- **Delete Scopes**: Click the X button on a scope tab

### Using the Pomodoro Timer

1. Click "Start" to begin a 25-minute focus session
2. Timer will automatically switch to a 5-minute break when complete
3. Browser notifications will alert you when time is up
4. Use "Reset" to restart the timer

### Dark Mode

Click the moon/sun icon in the top right to toggle between light and dark themes. Your preference is saved to your account.

## Project Structure

\`\`\`
src/
├── components/
│   ├── Auth/
│   │   ├── LoginPage.jsx          # Login/Register form
│   │   └── ProtectedRoute.jsx     # Auth wrapper
│   ├── Todo/
│   │   ├── TodoApp.jsx             # Main app container
│   │   ├── TodoInput.jsx           # Task input field
│   │   ├── TodoItem.jsx            # Individual task item
│   │   └── ScopeTab.jsx            # Scope navigation tab
│   ├── Pomodoro/
│   │   └── PomodoroTimer.jsx       # Pomodoro timer
│   └── Shared/
│       └── ThemeToggle.jsx         # Dark mode toggle
├── services/
│   ├── api.js                      # API functions
│   └── supabase.js                 # Supabase client
├── hooks/
│   └── useAuth.js                  # Authentication hook
├── App.jsx                         # Root component
└── main.jsx                        # Entry point
\`\`\`

## Build for Production

\`\`\`bash
npm run build
\`\`\`

The build output will be in the \`dist/\` directory.

## Deployment

### Vercel (Recommended)

1. Install Vercel CLI: \`npm i -g vercel\`
2. Run \`vercel\` in the project directory
3. Add environment variables in Vercel dashboard:
   - \`VITE_SUPABASE_URL\`
   - \`VITE_SUPABASE_ANON_KEY\`

### Netlify

1. Connect your GitHub repository to Netlify
2. Set build command: \`npm run build\`
3. Set publish directory: \`dist\`
4. Add environment variables in Netlify dashboard

### Configure Supabase for Production

In your Supabase dashboard:
1. Go to **Authentication** > **URL Configuration**
2. Add your production domain to **Site URL**
3. Add redirect URLs if needed

## Troubleshooting

**Authentication not working:**
- Verify environment variables are set correctly
- Check Supabase project URL and anon key
- Ensure email confirmation is disabled (or check your email)

**Data not loading:**
- Verify SQL schema was created successfully
- Check RLS policies in Supabase dashboard
- Look for errors in browser console

**Pomodoro notifications not showing:**
- Grant notification permissions when prompted
- Check browser notification settings

## License

MIT

## Contributing

Feel free to submit issues and pull requests!
# PomoDo
