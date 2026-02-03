# Grapes Poker League

A comprehensive web application for managing and viewing poker tournament statistics, leaderboards, and player performance across multiple tournaments.

## Features

- **Welcome Animation** - Stunning Royal Flush card animation on application launch
- **Tournament Management** - View and switch between multiple poker tournaments
- **Real-time Leaderboards** - Multiple leaderboard views:
  - Points ranking
  - Winnings ranking
  - Knockouts ranking
  - Bounties ranking
- **Player Statistics** - Comprehensive player profiles with:
  - Overall statistics across all tournaments
  - Individual tournament breakdowns
  - Game history with detailed performance metrics
- **Tournament Analytics** - Interactive charts showing:
  - Player participation trends
  - Prize pool progression
  - Weekly tournament statistics
- **Points Structure** - Display of league points system
- **Next Game Information** - Upcoming game details with buy-in, location, and configuration

## Technology Stack

- **Frontend Framework:** React 18 with TypeScript
- **Build Tool:** Vite 5
- **Styling:** Tailwind CSS 3
- **Routing:** React Router DOM 6
- **Charts:** Recharts 2
- **API Integration:** REST API with HCL Volt MX Foundry backend

## Project Structure

```
/home/node/txai-projects/project/
├── src/
│   ├── components/
│   │   ├── WelcomeAnimation.tsx      # Royal flush card animation
│   │   ├── Dashboard.tsx             # Main dashboard view
│   │   ├── Leaderboard.tsx           # Tournament leaderboard with tabs
│   │   ├── PlayerDetailModal.tsx     # Player game history modal
│   │   ├── PlayerStatsScreen.tsx     # Player statistics screen
│   │   └── TournamentChart.tsx       # Tournament analytics charts
│   ├── services/
│   │   └── api.ts                    # API service layer
│   ├── types/
│   │   └── api.ts                    # TypeScript type definitions
│   ├── App.tsx                       # Main application component
│   ├── main.tsx                      # Application entry point
│   ├── index.css                     # Global styles
│   └── vite-env.d.ts                 # Vite environment types
├── index.html
├── package.json
├── vite.config.ts                    # Vite configuration
├── tsconfig.json                     # TypeScript configuration
├── tailwind.config.js                # Tailwind CSS configuration
├── postcss.config.js                 # PostCSS configuration
└── .env                              # Environment variables
```

## Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment variables:**

   The `.env` file is already configured with the poker league API endpoints:
   ```bash
   VITE_BASE_PATH=/
   VITE_API_BASE_URL=https://dsta-academy.demo-hclvoltmx.net:443/services/data/v1/PTourObjects/objects
   VITE_ORG_ID=1945fc8ebc6-3b44fc
   ```

## Running the Application

### Development Mode

Start the development server with hot module replacement:

```bash
npm run dev
```

The application will be available at `http://localhost:5173`

### Production Build

Build the application for production:

```bash
npm run build
```

The optimized build will be output to the `dist/` directory.

### Preview Production Build

Preview the production build locally:

```bash
npm run preview
```

## Application Flow

1. **Welcome Screen** - On first load, users see an animated Royal Flush with playing cards flying across the screen, followed by the "Welcome to the Grapes Poker League" message.

2. **Dashboard** - The main dashboard displays:
   - Tournament selector sidebar (left)
   - Tournament details and next scheduled game (right)
   - Leaderboard with multiple sorting options
   - Tournament progression charts
   - Points structure table

3. **Leaderboard Interaction** - Users can:
   - Switch between Points, Winnings, Knockouts, and Bounties views
   - Click on any player to view their detailed game history

4. **Player Statistics** - Access comprehensive player statistics:
   - Search and select any player
   - View overall performance across all tournaments
   - See tournament-specific breakdowns
   - Track winnings, points, knockouts, and bounties

## API Integration

The application integrates with HCL Volt MX Foundry backend services:

- **Tournaments** - List of all tournaments with filtering and sorting
- **Game Configurations** - Game types, buy-ins, and settings
- **Tournament Schedule** - Upcoming and past games
- **Live Games** - Game results and statistics
- **Live Players** - Player performance in individual games
- **Players** - Player profiles and information
- **Tournament Players** - Player standings in tournaments
- **Points Structure** - League points system
- **Point Levels** - Position-based point awards
- **Prizes** - Prize distribution information

All API calls are managed through the `PokerLeagueAPI` service layer in `src/services/api.ts`.

### Organization Filtering

The application implements **dual-layer filtering** to ensure only tournaments and data for the Grapes Poker League organization (`orgID: 1945fc8ebc6-3b44fc`) are displayed:

1. **Server-side filtering**: All API requests include `$filter` query parameters to filter by `orgID` at the database level
2. **Client-side filtering**: Additional JavaScript filtering ensures only records matching the exact `orgID` are displayed in the UI

This ensures tournaments from other organizations are never shown, even if the API returns unexpected data. The filtering is logged to the browser console for debugging purposes.

## Design Highlights

- **Poker Theme** - Custom poker-themed color palette (green, gold, red)
- **Responsive Design** - Fully responsive layout using Tailwind CSS breakpoints
- **Smooth Animations** - Card flying animations, pulse effects, and transitions
- **Interactive Charts** - Visual representation of tournament progression
- **Modal Windows** - Player detail views with comprehensive game history
- **Custom Scrollbars** - Themed scrollbars matching the poker aesthetic

## Browser Compatibility

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## Troubleshooting

### API Connection Issues

If the application cannot connect to the API:
1. Verify the API endpoints in `.env` are correct
2. Check network connectivity
3. Ensure CORS is properly configured on the backend
4. Check browser console for detailed error messages

### Development Server Issues

If `npm run dev` fails:
1. Delete `node_modules` and `package-lock.json`
2. Run `npm install` again
3. Ensure port 5173 is not already in use

### Build Issues

If `npm run build` fails:
1. Check for TypeScript errors: `npm run lint`
2. Ensure all dependencies are installed
3. Verify Node.js version (v18+ recommended)

## Performance Considerations

- API calls are optimized with Promise.all for parallel requests
- Charts are rendered only when data is available
- Player statistics are loaded on-demand
- Images and assets are optimized for web delivery

---

<div align="center">
  <p><strong>✨ Built by Leona - Vibe coding Agent from HCL Software</strong></p>
</div>
