# HealthHub Mobile - Ionic React App

A comprehensive healthcare mobile application built with Ionic React, designed to connect seamlessly with the HealthHub backend.

## Features

### For Patients
- **User Authentication**: Secure login and registration
- **Dashboard**: View appointments and health data at a glance
- **Appointment Booking**: Schedule appointments with doctors
- **Health Tracking**: Record and track health metrics
- **Chat**: Direct messaging with doctors
- **Medical Records**: View prescriptions and medical history
- **Feedback**: Rate and review doctor services

### For Doctors
- **Appointment Management**: View and manage patient appointments
- **Patient Records**: Access patient medical history
- **Chat**: Communicate with patients
- **Feedback**: Monitor patient reviews and ratings

### For Admin
- **Dashboard**: System overview and analytics
- **User Management**: Manage doctors, patients, and users
- **Appointment Management**: Monitor all appointments
- **Specialties Management**: Manage medical specialties

## Project Structure

```
frontend/src/
├── pages/                  # Page components
│   ├── auth/             # Authentication pages
│   ├── patient/          # Patient-specific pages
│   ├── doctor/           # Doctor-specific pages
│   └── admin/            # Admin pages
├── services/             # API service layer
│   ├── api.ts           # Base API client
│   ├── auth.service.ts  # Authentication service
│   ├── appointment.service.ts
│   ├── healthData.service.ts
│   ├── chat.service.ts
│   ├── user.service.ts
│   └── patient.service.ts
├── context/             # React Context for state management
│   └── AuthContext.tsx
├── types/               # TypeScript type definitions
├── components/          # Reusable components
├── utils/               # Utility functions
├── styles/              # Global and component styles
└── routes/              # Routing configuration
```

## Installation

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Ionic CLI: `npm install -g @ionic/cli`

### Setup Steps

1. **Navigate to frontend directory**
```bash
cd frontend
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure Backend URL**
Edit `src/services/api.ts` and update the `baseURL`:
```typescript
const baseURL: string = 'http://your-backend-url/api'
```

Or set environment variable:
```bash
REACT_APP_API_URL=http://localhost:5000/api
```

4. **Start development server**
```bash
npm start
```

The app will open at `http://localhost:3000`

## Available Scripts

### Development
```bash
npm start
```
Starts the Ionic development server with live reload.

### Build
```bash
npm run build
```
Builds the app for production.

### Test
```bash
npm test
```
Runs the test suite.

## Building for Mobile

### For Android

1. **Build the web app**
```bash
npm run build
```

2. **Sync to Capacitor**
```bash
ionic cap copy
```

3. **Open Android Studio**
```bash
ionic cap open android
```

4. **Build and run on emulator or device**
- In Android Studio: Build > Make Project
- Run > Run 'app'

### For iOS (Mac only)

1. **Build the web app**
```bash
npm run build
```

2. **Sync to Capacitor**
```bash
ionic cap copy
```

3. **Open Xcode**
```bash
ionic cap open ios
```

4. **Build and run**
- In Xcode: Product > Run or Cmd+R

## API Integration

The app communicates with the backend through the `api` service. Key endpoints:

### Authentication
- `POST /auth/login` - User login
- `POST /auth/register` - User registration
- `POST /auth/refresh` - Refresh token

### Appointments
- `GET /appointments` - Get user appointments
- `POST /appointments` - Create appointment
- `PUT /appointments/:id` - Update appointment
- `GET /appointments/queue-status` - Get queue status

### Health Data
- `GET /health-data` - Get health records
- `POST /health-data` - Add health record
- `PUT /health-data/:id` - Update health record

### Chat
- `GET /chat/sessions` - Get chat sessions
- `POST /chat/sessions` - Create new chat session
- `POST /chat/messages` - Send message
- `GET /chat/sessions/:id/messages` - Get messages from session

### Users
- `GET /doctors` - Get list of doctors
- `GET /patients` - Get list of patients
- `GET /users/:id/profile` - Get user profile

## Authentication Flow

1. User enters email and password on login page
2. Credentials are sent to backend via `AuthService.login()`
3. Backend returns JWT token and user data
4. Token is stored in localStorage
5. Token is automatically included in all API requests via interceptor
6. If token expires or is invalid, user is redirected to login

## State Management

The app uses React Context API for authentication state management:

```typescript
const { user, isAuthenticated, login, logout } = useAuth();
```

## Styling

The app uses:
- **Ionic Components**: For UI structure
- **CSS Classes**: For custom styling
- **CSS Variables**: For theming (defined in `styles/variables.css`)

Primary color: `#667eea`
Secondary color: `#764ba2`

## Error Handling

API errors are handled through:
1. Response interceptor in `api.ts`
2. Try-catch blocks in components
3. User-friendly error alerts

## Development Tips

1. **Enable Redux DevTools** (if using Redux in future)
2. **Use browser DevTools** for debugging React components
3. **Test API endpoints** with Postman before integration
4. **Check network tab** in DevTools for API calls
5. **Use React Developer Tools** extension for Chrome/Firefox

## Troubleshooting

### Port 3000 already in use
```bash
npm start -- --port 3001
```

### CORS errors
- Ensure backend has CORS enabled
- Check `baseURL` in api.ts is correct

### Token not persisting
- Check localStorage is enabled in browser
- Verify token is being saved after login

### Blank screen after build
- Clear browser cache
- Check console for errors
- Verify all dependencies are installed

## Contributing

1. Create a feature branch: `git checkout -b feature/your-feature`
2. Make your changes
3. Test thoroughly
4. Submit a pull request

## License

MIT License - See LICENSE file for details

## Support

For issues and questions:
1. Check existing GitHub issues
2. Create a new issue with detailed description
3. Contact the development team

## Future Enhancements

- [ ] Offline mode with data sync
- [ ] Push notifications
- [ ] Video consultation
- [ ] Advanced health analytics
- [ ] Insurance integration
- [ ] Payment gateway integration
- [ ] Multi-language support
- [ ] Dark mode theme
