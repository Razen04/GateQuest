
<div align="center">
  <img src="public/logo.svg" alt="GATEQuest Logo" width="100" />
  <h1>GATEQuest</h1>
  <p>Modern, open-source GATE exam practice and preparation app</p>
</div>

---

## Features

- 📝 **Practice GATE Questions**: Organized by subject, year, and difficulty
- 🔖 **Bookmark Questions**: Save questions for later review
- 📊 **Progress & Stats**: Track your accuracy, progress, and study time
- ⏱️ **Auto Timer**: Practice with a built-in timer
- 🎨 **Dark Mode**: Switch between light and dark themes
- 🔊 **Sound Effects**: Optional feedback for correct/wrong answers
- 🔐 **Google Login**: Secure authentication with Supabase
- ☁️ **Cloud Sync**: User profile and progress synced to Supabase
- 📱 **PWA**: Installable as a Progressive Web App

## Tech Stack

- **Frontend**: React (Vite), Tailwind CSS
- **State Management**: React Context API
- **Backend**: Supabase (auth, database)
- **Icons**: react-icons
- **Animations**: framer-motion

## Project Structure

```
GateQuest/
├── public/                # Static assets (logo, sounds)
├── src/
│   ├── assets/            # SVG icons and other assets
│   ├── components/        # Reusable React components
│   ├── context/           # React Context providers for state management
│   ├── data/              # Static data like subject lists
│   ├── hooks/             # Custom React hooks for component logic
│   ├── pages/             # Top-level page components
│   ├── routes/            # Route definitions for the application
│   ├── utils/             # Utility functions
│   ├── App.jsx            # Main application component
│   ├── main.jsx           # Application entry point
│   └── index.css          # Global and Tailwind CSS styles
├── .github/               # GitHub-specific files (templates)
├── supabaseClient.js      # Supabase client initialization
├── vite.config.js         # Vite configuration
├── package.json           # Project dependencies and scripts
└── README.md              # This file
```

## Getting Started

1. **Clone the repo:**
   ```sh
   git clone https://github.com/Razen04/GateQuest.git
   cd GateQuest
   ```
2. **Install dependencies:**
   ```sh
   npm install
   ```
3. **Set up environment variables:**
   - Copy `.env.example` to `.env` and fill in your Supabase project URL and anon key:
     ```sh
     cp .env.example .env
     # Edit .env with your Supabase credentials
     ```
4. **Run the app locally:**
   ```sh
   npm run dev
   ```
5. **Build for production:**
   ```sh
   npm run build
   ```

## Environment Variables

Create a `.env` file with:
```
VITE_SUPABASE_PROJECT_URL=your_supabase_url
VITE_SUPABASE_ANON_PUBLIC_KEY=your_supabase_anon_key
VITE_API_BASE=your_api_base_url
```

## Contributing

Contributions are what make the open source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

For major changes, please open an issue first to discuss what you would like to change. Please make sure to update tests as appropriate.

Please read our [Contributing Guidelines](CONTRIBUTING.md) and [Code of Conduct](CODE_OF_CONDUCT.md) for more information.

## License

[MIT](LICENSE)
