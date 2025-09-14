# 🎓 Online Teaching ERP Platform

A comprehensive full-stack Enterprise Resource Planning (ERP) platform designed specifically for online teaching institutions. Built with modern technologies to streamline educational institution management with role-based dashboards, session management, attendance tracking, and comprehensive user administration.

## 🌟 Key Features

### 🔐 **Authentication & Security**
- **JWT-based Authentication**: Secure token-based authentication system
- **Role-Based Access Control**: Admin, Teacher, and Student roles with specific permissions
- **Password Security**: bcrypt hashing with salt rounds
- **Protected Routes**: Frontend and backend route protection

### 👥 **User Management**
- **Multi-Role System**: Admin, Teacher, and Student interfaces
- **Profile Management**: Users can update their personal information
- **User Administration**: Admins can create, update, and delete user accounts
- **Role Assignment**: Dynamic role assignment and management

### 📚 **Session Management**
- **Session Creation**: Teachers can create and schedule live sessions
- **Meeting Integration**: Direct links to video meeting platforms
- **Session Scheduling**: Date/time management with timezone support
- **Recording Links**: Optional recording link storage for later access

### 📊 **Attendance System**
- **Manual Attendance**: Teachers can manually mark student attendance
- **Real-time Tracking**: Live attendance monitoring during sessions
- **Attendance Reports**: Comprehensive attendance analytics and reports
- **Student Portal**: Students can view their attendance history and statistics

### 🎨 **User Experience**
- **Responsive Design**: Mobile-friendly interface using Bootstrap
- **Role-Based Dashboards**: Customized interfaces for each user role
- **Real-time Updates**: Live data synchronization across the platform
- **Intuitive Navigation**: Clean and user-friendly interface design

## 🏗️ Technology Stack

### **Backend**
- **Runtime**: Node.js with Express.js framework
- **Database**: PostgreSQL with Neon serverless hosting
- **Authentication**: JSON Web Tokens (JWT)
- **Security**: bcrypt, CORS, input validation middleware
- **Database Driver**: Native PostgreSQL queries with pg driver

### **Frontend** 
- **Framework**: React.js (v18.2.0) with functional components
- **State Management**: Redux Toolkit for predictable state management
- **Routing**: React Router DOM with protected routes
- **UI Framework**: Bootstrap 5 + React Bootstrap components
- **HTTP Client**: Axios with interceptors for API communication
- **Build Tool**: Create React App with webpack bundling

### **Infrastructure & Deployment**
- **Backend Hosting**: Render (recommended) or Railway
- **Frontend Hosting**: Vercel or Netlify
- **Database**: Neon serverless PostgreSQL
- **Version Control**: Git with GitHub
- **Environment Management**: dotenv for configuration

## 🚀 Quick Start Guide

### **Prerequisites**
- Node.js (v16 or higher)
- npm or yarn package manager
- Git for version control
- PostgreSQL database (Neon account recommended)

### **1. Clone & Setup**
```bash
# Clone the repository
git clone <your-repository-url>
cd online-teaching-erp

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies  
cd ../frontend
npm install
```

### **2. Backend Configuration**
```bash
# Navigate to backend directory
cd backend

# Create environment file from template
cp .env.example .env

# Edit .env file with your configuration:
# DATABASE_URL=your_postgresql_connection_string
# JWT_SECRET=your_super_secret_jwt_key_64_characters_long
# PORT=5000
# NODE_ENV=development
# FRONTEND_URL=http://localhost:3000
```

### **3. Frontend Configuration**  
```bash
# Navigate to frontend directory
cd ../frontend

# Create environment file from template
cp .env.example .env

# Edit .env file with your configuration:
# REACT_APP_API_URL=http://localhost:5000/api
# REACT_APP_NAME=Online Teaching ERP
```

### **4. Database Setup (Neon)**
1. Create free account at [neon.tech](https://neon.tech)
2. Create new project and database
3. Copy connection string to your backend `.env` file
4. Database tables will auto-initialize on first backend startup

### **5. Start Development Servers**
```bash
# Terminal 1: Start backend server
cd backend
npm run dev
# Server runs on http://localhost:5000

# Terminal 2: Start frontend server  
cd frontend
npm start
# Application opens at http://localhost:3000
```

## 👥 User Roles & Capabilities

### 🔑 **Administrator**
- **Complete System Control**: Full access to all platform features
- **User Management**: Create, update, delete, and manage all user accounts
- **Role Assignment**: Assign and modify user roles (Admin/Teacher/Student)
- **Session Oversight**: View, edit, and delete all teaching sessions
- **Attendance Analytics**: Access comprehensive attendance reports and statistics
- **System Monitoring**: Monitor platform usage and performance metrics

### 👨‍🏫 **Teacher**
- **Session Management**: Create, schedule, and manage their own teaching sessions
- **Attendance Control**: Mark student attendance manually for their sessions
- **Student Monitoring**: View attendance reports for students in their classes  
- **Profile Management**: Update personal information and preferences
- **Meeting Integration**: Add video meeting links to sessions
- **Recording Management**: Upload and manage session recordings

### 👨‍🎓 **Student**
- **Session Access**: View enrolled sessions and upcoming class schedules
- **Attendance Tracking**: Monitor personal attendance history and statistics
- **Live Session Joining**: Direct access to join live sessions via meeting links
- **Progress Monitoring**: Track attendance percentage and academic progress
- **Profile Updates**: Manage personal information and account settings
- **Schedule Overview**: View personalized calendar of upcoming sessions

## 📊 Database Schema

### Users Table
```sql
users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(20) DEFAULT 'student',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)
```

### Sessions Table
```sql
sessions (
  id SERIAL PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  date_time TIMESTAMP NOT NULL,
  meeting_link VARCHAR(500) NOT NULL,
  recording_link VARCHAR(500),
  teacher_id INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)
```

### Attendance Table
```sql
attendance (
  id SERIAL PRIMARY KEY,
  session_id INTEGER REFERENCES sessions(id),
  student_id INTEGER REFERENCES users(id),
  status VARCHAR(20) DEFAULT 'absent',
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(session_id, student_id)
)
```

## 🔐 Security Features

### Authentication
- JWT-based stateless authentication
- Secure password hashing with bcrypt
- Token expiration and refresh handling
- Protected API endpoints

### Authorization
- Role-based access control (RBAC)
- Resource ownership validation
- Administrative privilege checks
- Route-level protection

### Input Validation
- Comprehensive request validation
- SQL injection prevention
- XSS protection
- Data sanitization

## 📡 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout

### User Management
- `GET /api/users` - Get all users (Admin only)
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user (Admin only)

### Session Management
- `GET /api/sessions` - Get all sessions
- `POST /api/sessions` - Create session (Admin/Teacher)
- `PUT /api/sessions/:id` - Update session
- `DELETE /api/sessions/:id` - Delete session (Admin)

### Attendance
- `POST /api/attendance/:sessionId/:studentId` - Mark attendance
- `GET /api/attendance/session/:sessionId` - Get session attendance
- `GET /api/attendance/student/:studentId` - Get student attendance

## 🚀 Deployment Guide

### Backend Deployment (Render)

1. **Prepare for Deployment**:
   ```bash
   # Ensure all dependencies are in package.json
   npm install --production
   ```

2. **Connect to Render**:
   - Link your GitHub repository to Render
   - Select "Web Service" deployment type
   - Set build command: `npm install`
   - Set start command: `npm start`

3. **Environment Variables**:
   ```env
   DATABASE_URL=your_production_database_url
   JWT_SECRET=your_production_jwt_secret
   NODE_ENV=production
   PORT=5000
   FRONTEND_URL=https://your-frontend-domain.vercel.app
   ```

### Frontend Deployment (Vercel)

1. **Prepare for Deployment**:
   ```bash
   # Build the project locally to test
   npm run build
   ```

2. **Connect to Vercel**:
   - Install Vercel CLI: `npm i -g vercel`
   - Login: `vercel login`
   - Deploy: `vercel` (follow the prompts)

3. **Environment Variables**:
   ```env
   REACT_APP_API_URL=https://your-backend-api.render.com/api
   REACT_APP_NAME=Online Teaching ERP
   NODE_ENV=production
   ```

### Database Setup (Neon)

1. **Create Neon Account**: Sign up at [neon.tech](https://neon.tech)
2. **Create Database**: Create a new project and database
3. **Get Connection String**: Copy the PostgreSQL connection string
4. **Initialize Schema**: Run the database initialization script

## 🧪 Testing

### Backend Testing
```bash
cd backend
npm test
```

### Frontend Testing
```bash
cd frontend
npm test
```

### Integration Testing
1. Start backend server: `npm run dev`
2. Start frontend server: `npm start`
3. Test authentication flow
4. Verify role-based access
5. Test CRUD operations

## 📁 Project Structure

```
online-teaching-erp/
├── backend/                    # Node.js backend
│   ├── src/
│   │   ├── config/            # Database configuration
│   │   ├── controllers/       # Business logic
│   │   ├── middleware/        # Authentication & validation
│   │   ├── models/            # Data models
│   │   └── routes/            # API routes
│   ├── package.json
│   ├── server.js              # Main server file
│   └── README.md
├── frontend/                   # React.js frontend
│   ├── src/
│   │   ├── components/        # Reusable components
│   │   ├── pages/            # Page components
│   │   ├── services/         # API services
│   │   ├── store/            # Redux store
│   │   └── utils/            # Utility functions
│   ├── package.json
│   └── README.md
├── .gitignore
└── README.md                   # This file
```

## 🔧 Development Workflow

### Setting Up Development Environment

1. **Clone and Setup**:
   ```bash
   git clone <repository-url>
   cd online-teaching-erp
   ```

2. **Backend Setup**:
   ```bash
   cd backend
   npm install
   cp .env.example .env
   # Configure environment variables
   npm run dev
   ```

3. **Frontend Setup** (new terminal):
   ```bash
   cd frontend
   npm install
   cp .env.example .env
   # Configure environment variables
   npm start
   ```

### Making Changes

1. **Backend Changes**:
   - Modify controllers, models, or routes in `/backend/src/`
   - Server auto-restarts with nodemon
   - Test API endpoints with Postman or curl

2. **Frontend Changes**:
   - Modify components or pages in `/frontend/src/`
   - Hot reload updates the browser automatically
   - Check browser console for errors

### Git Workflow

```bash
# Create feature branch
git checkout -b feature/your-feature-name

# Make changes and commit
git add .
git commit -m "Add your feature description"

# Push and create pull request
git push origin feature/your-feature-name
```

## 🐛 Troubleshooting

### Common Issues

#### Backend Issues
- **Database Connection**: Check DATABASE_URL and database status
- **Port Conflicts**: Ensure port 5000 is available
- **JWT Errors**: Verify JWT_SECRET is set correctly

#### Frontend Issues
- **API Connection**: Verify REACT_APP_API_URL points to running backend
- **CORS Errors**: Check backend CORS configuration
- **Build Errors**: Clear node_modules and reinstall dependencies

#### Database Issues
- **Migration Errors**: Check database schema and permissions
- **Connection Timeout**: Verify network connectivity to database
- **Query Errors**: Check SQL syntax and table existence

### Debug Commands

```bash
# Check backend logs
cd backend && npm run dev

# Check frontend console
# Open browser DevTools → Console tab

# Test API endpoints
curl -X GET http://localhost:5000/api/health

# Check database connection
psql $DATABASE_URL
```

## 📚 Documentation

- [Backend README](./backend/README.md) - Detailed backend documentation
- [Frontend README](./frontend/README.md) - Detailed frontend documentation
- [API Documentation](./backend/README.md#api-documentation) - Complete API reference

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow existing code structure and naming conventions
- Add comments for complex logic
- Write tests for new features
- Update documentation for API changes
- Ensure responsive design for UI changes

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- React.js community for excellent documentation
- Express.js for robust backend framework
- Bootstrap for responsive UI components
- Neon for serverless PostgreSQL hosting
- Vercel and Render for seamless deployment

## 📞 Support

For support, please:
1. Check the troubleshooting section above
2. Review the detailed README files in backend and frontend directories
3. Create an issue in the GitHub repository
4. Check existing issues for similar problems

---

**Built with ❤️ for the online education community**