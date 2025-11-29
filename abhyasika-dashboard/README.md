# Abhyasika Dashboard - Frontend

A modern library/reading room management dashboard built with React, Vite, and Tailwind CSS.

## Features

- 📊 Dashboard with real-time analytics
- 👥 Student management with KYC
- 💳 Payment tracking and receipts
- 🪑 Seat allocation system
- 📅 Renewal reminders
- 📱 QR code self-enrollment
- 🌙 Dark mode support
- 📊 Reports and analytics
- 💰 Expense tracking

## Tech Stack

- **React 18** - UI library
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **Supabase** - Backend & Database
- **Lucide React** - Icons
- **React Toastify** - Notifications
- **jsPDF** - PDF generation
- **XLSX** - Excel import/export

## Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Update .env with your values
# VITE_SUPABASE_URL=your-supabase-url
# VITE_SUPABASE_ANON_KEY=your-anon-key
# VITE_API_BASE_URL=your-api-url

# Run development server
npm run dev
```

The app will be available at http://localhost:5173

### Build for Production

```bash
npm run build
```

Build output will be in the `dist` directory.

### Preview Production Build

```bash
npm run preview
```

## Deployment

### Deploy to Vercel (Recommended)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone)

1. Push code to GitHub
2. Import project on Vercel
3. Set environment variables
4. Deploy!

See [DEPLOYMENT_GUIDE.md](../DEPLOYMENT_GUIDE.md) for detailed instructions.

### Deploy to Netlify

[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start)

1. Import from GitHub
2. Build settings:
   - Build command: `npm run build`
   - Publish directory: `dist`
3. Set environment variables
4. Deploy!

## Environment Variables

Create a `.env` file based on `.env.example`:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
VITE_API_BASE_URL=https://your-api.com/api
```

**Important**: All environment variables must be prefixed with `VITE_` to be accessible in the app.

## Project Structure

```
abhyasika-dashboard/
├── public/             # Static assets
├── src/
│   ├── components/     # React components
│   │   ├── common/     # Shared components
│   │   ├── layout/     # Layout components
│   │   └── modals/     # Modal dialogs
│   ├── context/        # React context providers
│   ├── lib/            # Utilities and helpers
│   ├── views/          # Page views
│   ├── App.jsx         # Main app component
│   └── main.jsx        # Entry point
├── .env.example        # Environment variables template
├── vercel.json         # Vercel configuration
├── vite.config.js      # Vite configuration
└── tailwind.config.js  # Tailwind CSS configuration
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Dark Mode

The app supports dark mode with automatic system preference detection. Toggle manually using the theme switcher in the sidebar.

## Browser Support

- Chrome/Edge (last 2 versions)
- Firefox (last 2 versions)
- Safari (last 2 versions)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## License

Private - All rights reserved

## Support

For issues or questions, please open an issue in the repository.
