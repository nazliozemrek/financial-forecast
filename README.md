# Financial Forecast App 💰📊

A modern financial forecasting application that helps users plan their financial future by connecting bank accounts, analyzing transactions, and simulating future scenarios.

## 🌟 Live Demo

**🚀 [View Live App](https://stalwart-quokka-38cfe6.netlify.app/)**

## ✨ Features

### 🔐 Authentication
- **Google OAuth** - Secure sign-in with Google accounts
- **Email/Password** - Traditional authentication
- **User Profiles** - Personalized experience with user data

### 🏦 Bank Integration
- **Plaid API** - Connect real bank accounts securely
- **Transaction Sync** - Automatic transaction fetching and categorization
- **Multi-Bank Support** - Connect multiple bank accounts
- **Secure Disconnection** - Safely unlink bank accounts

### 📅 Financial Planning
- **Smart Calendar** - Visual transaction timeline
- **Event Management** - Add recurring and one-time financial events
- **Forecast Simulation** - Predict future financial scenarios
- **Balance Tracking** - Real-time balance projections

### 📊 Analytics & Insights
- **Transaction Analysis** - Categorize and analyze spending patterns
- **Recurring Detection** - Automatically identify recurring transactions
- **AI Insights** - Personalized financial recommendations
- **Scenario Planning** - Save and compare different financial scenarios

### 🎯 Simulation Features
- **Quick Simulations** - Fast financial scenario testing
- **Saved Scenarios** - Store and compare different forecasts
- **Visual Charts** - Interactive balance progression charts
- **Export Options** - Download simulation results

## 🛠️ Tech Stack

### Frontend
- **React 18** - Modern UI framework
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **Vite** - Fast build tool
- **React Hot Toast** - User notifications
- **Lucide React** - Beautiful icons

### Backend
- **Netlify Functions** - Serverless API endpoints
- **Firebase Admin SDK** - Secure backend operations
- **Plaid API** - Bank account integration
- **Firestore** - Real-time database

### Authentication & Security
- **Firebase Auth** - Secure authentication
- **Google OAuth** - Social login
- **Environment Variables** - Secure configuration
- **CORS** - Cross-origin security

## 🚀 Deployment

### Production
- **Platform**: Netlify
- **URL**: https://stalwart-quokka-38cfe6.netlify.app/
- **Functions**: Serverless API endpoints
- **Database**: Firebase Firestore
- **CDN**: Global content delivery

### Development
```bash
# Clone the repository
git clone https://github.com/nazliozemrek/financial-forecast.git
cd financial-forecast

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## 🔧 Environment Setup

### Required Environment Variables

Create a `.env` file in the root directory:

```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id

# Plaid Configuration
PLAID_CLIENT_ID=your_plaid_client_id
PLAID_SECRET=your_plaid_secret
PLAID_ENV=sandbox

# Firebase Admin (Base64 encoded service account)
FIREBASE_SERVICE_ACCOUNT_BASE64=your_base64_encoded_service_account
```

### Firebase Setup
1. Create a Firebase project
2. Enable Authentication (Google, Email/Password)
3. Enable Firestore Database
4. Add your domain to authorized domains
5. Generate service account key and encode as base64

### Plaid Setup
1. Create a Plaid account
2. Get your Client ID and Secret
3. Configure webhook URLs (optional)
4. Set up sandbox environment for testing

## 📁 Project Structure

```
financial-forecast/
├── api/                    # Netlify Functions (Backend)
│   ├── create-link-token.js
│   ├── exchange-public-token.js
│   ├── unlink-bank.js
│   ├── transactions.js
│   └── debug-*.js
├── src/
│   ├── components/         # React Components
│   │   ├── plaid/         # Bank integration
│   │   ├── layout/        # UI layout
│   │   ├── modals/        # Modal components
│   │   └── simulation/    # Forecast features
│   ├── hooks/             # Custom React hooks
│   ├── pages/             # Page components
│   ├── utils/             # Utility functions
│   └── types.ts           # TypeScript types
├── firebase/
│   └── config.ts          # Firebase configuration
├── lib/                   # Shared libraries
│   ├── plaidClient.js     # Plaid API client
│   └── firebaseAdmin.js   # Firebase Admin setup
└── netlify.toml          # Netlify configuration
```

## 🔄 API Endpoints

### Authentication
- `POST /api/create-link-token` - Create Plaid Link token
- `POST /api/exchange-public-token` - Exchange public token for access token

### Bank Management
- `POST /api/unlink-bank` - Disconnect bank account
- `POST /api/transactions` - Fetch bank transactions

### Debug (Development)
- `POST /api/debug-bank-data` - Debug bank data retrieval
- `POST /api/debug-transactions` - Debug transaction fetching

## 🎨 UI/UX Features

- **Dark Theme** - Modern dark interface
- **Responsive Design** - Works on all devices
- **Loading States** - Smooth user experience
- **Error Handling** - User-friendly error messages
- **Toast Notifications** - Real-time feedback
- **Interactive Charts** - Visual data representation

## 🔒 Security Features

- **Secure API Keys** - Environment variable protection
- **Firebase Security Rules** - Database access control
- **CORS Protection** - Cross-origin request security
- **Input Validation** - Data sanitization
- **Error Logging** - Secure error handling

## 🚀 Getting Started

1. **Fork the repository**
2. **Set up environment variables**
3. **Install dependencies**: `npm install`
4. **Start development**: `npm run dev`
5. **Deploy to Netlify** (or your preferred platform)

## 🤝 Contributing

1. Fork the project
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Plaid** - For secure bank account integration
- **Firebase** - For authentication and database
- **Netlify** - For hosting and serverless functions
- **React Community** - For the amazing ecosystem

## 📞 Support

If you have any questions or need help, please open an issue on GitHub or contact the maintainers.

---

**Made with ❤️ by Kaan Nazlioz**

*Built for modern financial planning and forecasting*
