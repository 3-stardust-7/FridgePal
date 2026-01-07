# FridgePal 🧊

**An AI-powered Smart Fridge Assistant** that helps you manage your fridge inventory, discover recipes, and track nutrition—all with offline AI capabilities.

FridgePal combines computer vision, natural language processing, and mobile-first design to transform how you manage food and plan meals.

## Demo 🎥

Check out the demo of FridgePal in action:
[Watch Demo](https://drive.google.com/file/d/1qBMPQ5CTlkyfSmLyUsg32lsF5cP2gTdo/view?usp=drivesdk)

## Features ✨

### 🎯 Core Features
- **Smart Item Detection** - Automatically detect and catalog items by taking photos of your fridge
- **Inventory Management** - Track food items, quantities, and expiration dates
- **Smart Recipe Discovery** - Get personalized recipe recommendations based on what you have
- **Nutrition Tracking** - Monitor daily calorie and macro intake
- **Expiry Alerts** - Get notified before items expire
- **Food Recognition** - Powered by YOLOv8 object detection and Google Gemini AI

### 📊 User Capabilities
- **Profile Management** - Set dietary goals, preferences, and health metrics
- **Calorie & Macro Tracking** - Monitor daily nutritional intake with detailed breakdowns
- **Meal Planning** - Plan meals and track what you've prepared
- **Recipe Customization** - Save favorite recipes and view personalized recommendations
- **Water Intake Tracking** - Stay hydrated with daily water reminders

## Tech Stack 🛠️

### Frontend
- **React Native** (v0.83.1) - Cross-platform mobile development
- **Redux Toolkit** - State management
- **React Navigation** - Navigation and routing
- **Supabase Client** - Backend authentication and database
- **Google Gemini AI** - Recipe generation and food insights

### Backend
- **FastAPI** - Modern Python web framework
- **YOLOv8** (Ultralytics) - Object detection for food items
- **Tesseract OCR** - Optical character recognition for nutrition labels
- **PyTorch** - Deep learning inference
- **OpenCV** - Image processing

### Database
- **Supabase** (PostgreSQL) - User auth, profiles, and data storage

### Platforms
- **iOS** - Native iOS app with Swift integration
- **Android** - Native Android with React Native bridge

## Project Structure 📁

```
FridgePal/
├── frontend/
│   ├── src/
│   │   ├── components/       # Reusable UI components
│   │   ├── pages/            # Screen components (Auth, Home, Scanner, etc.)
│   │   ├── services/         # API and service integrations
│   │   ├── hooks/            # Custom React hooks
│   │   ├── config/           # Configuration (backend, supabase)
│   │   ├── store/            # Redux store and slices
│   │   └── utils/            # Helper functions
│   ├── Navigation/           # Navigation structure
│   ├── package.json
│   └── tsconfig.json
├── backend/
│   ├── main.py               # FastAPI application
│   ├── services/
│   │   ├── detection.py      # YOLOv8 food detection
│   │   ├── ocr.py            # Tesseract OCR
│   │   ├── food_inference.py # Food classification
│   │   └── __init__.py
│   ├── models/               # Pydantic schemas
│   ├── utils/                # Image processing utilities
│   ├── requirements.txt
│   └── config.py
├── ios/                      # iOS app configuration
├── android/                  # Android app configuration
├── supabase/
│   └── schema.sql            # Database schema
└── README.md
```

## Getting Started 🚀

### Prerequisites
- **Node.js** (v16+) and npm
- **Python** (3.9+) with pip
- **React Native CLI**
- **Xcode** (for iOS development)
- **Android Studio** (for Android development)
- **Supabase Account** (or local setup)

### Installation

#### 1. Clone the Repository
```bash
git clone https://github.com/Pallavi-Madhu/FridgePal.git
cd FridgePal
```

#### 2. Set Up Backend

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create .env file with your configuration
cp .env.example .env  # If available, or create manually
```

**Required Environment Variables:**
```env
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key
GOOGLE_GENAI_KEY=your_gemini_api_key
```

#### 3. Set Up Frontend

```bash
# Install Node dependencies
npm install

# Create .env or use react-native-dotenv
# Configure your backend URL and Supabase credentials
```

#### 4. Set Up Database

1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Run the SQL schema:
```bash
# Copy contents of supabase/schema.sql into Supabase SQL Editor
# Or use Supabase CLI
supabase db push
```

## Running the Application 🎬

### Backend Server
```bash
cd backend
python -m uvicorn main:app --reload --port 8000
```

The API will be available at `http://localhost:8000`

API Documentation: `http://localhost:8000/docs`

### Frontend (Development)

#### Start Development Server
```bash
npm start
```

#### Run on Android
```bash
npm run android
```

#### Run on iOS
```bash
npm run ios
```

## API Endpoints 📡

### Detection Service
- `POST /detect` - Detect food items in image
  - Input: Base64 encoded image
  - Output: Detected items with bounding boxes and confidence scores

### OCR Service
- `POST /ocr` - Extract text from nutrition labels
  - Input: Image region
  - Output: Recognized text

### Food Inference
- `POST /food-classify` - Classify and get nutritional info
  - Input: Detected food items
  - Output: Food names with nutritional data

### Gemini Integration
- `POST /generate-recipes` - Get recipe recommendations
  - Input: Available ingredients
  - Output: Recipe suggestions with instructions

## Key Components 🧩

### Frontend Pages
- **Auth** - Sign in and registration
- **Home** - Dashboard with fridge overview
- **Scanner** - Camera interface for item detection
- **Recipe** - Recipe discovery and saved recipes
- **CalTracker** - Nutrition and calorie tracking
- **Profile** - User settings and preferences

### Redux Slices
- `userSlice` - User authentication and profile
- `fridgeSlice` - Fridge inventory management
- `recipeSlice` - Recipe management
- `nutritionSlice` - Nutrition tracking

### Backend Services
- **DetectionService** - YOLOv8 model inference
- **OCRService** - Tesseract OCR wrapper
- **FoodInferenceEngine** - Food classification and nutrition lookup
- **ImageUtils** - Image cropping and preprocessing

## Database Schema 🗄️

### Main Tables
- **profiles** - User profiles with health goals
- **fridge_items** - Tracked food items with expiry dates
- **recipes** - Recipe database with ingredients and instructions
- **saved_recipes** - User's saved recipes (junction table)
- **user_meals** - Tracked meals with dates
- **nutrition_logs** - Daily nutrition data

See `supabase/schema.sql` for complete schema.

## Development 💻

### Running Tests
```bash
npm test              # Frontend tests
cd backend && pytest  # Backend tests
```

### Linting
```bash
npm run lint
```

### Code Structure Guidelines
- Use TypeScript in React components where possible
- Follow Redux pattern for state management
- Use custom hooks for reusable logic
- Implement error handling in API calls
- Add PropTypes or TypeScript types for components

## Key Technologies Deep Dive 🔬

### Computer Vision Pipeline
1. **Image Capture** - React Native Vision Camera
2. **Preprocessing** - OpenCV for normalization
3. **Detection** - YOLOv8 for food identification
4. **OCR** - Tesseract for nutrition label reading
5. **Classification** - Fine-tuned model for food names

### AI Features
- **Food Recognition** - YOLOv8 trained on food datasets
- **Recipe Generation** - Google Gemini for contextual recipes
- **Nutrition Data** - Database lookup + AI enhancement
- **Personalization** - Redux-based user preferences

## Configuration 🔧

### Backend Config (`backend/config.py`)
- Model paths
- API endpoints
- Database connections
- CORS settings

### Frontend Config (`src/config/`)
- `backend.js` - Backend API URL
- `supabase.js` - Supabase credentials and settings

## Deployment 📦

### Backend Deployment
- Deploy to Heroku, AWS Lambda, or Docker
- Set environment variables for production
- Configure database URLs

### Frontend Deployment
- Build APK for Android: `./gradlew build`
- Build IPA for iOS using Xcode
- Distribute via app stores or TestFlight

## Contributing 🤝

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Known Limitations & Future Work 🚧

### Current Limitations
- YOLOv8 detection performance depends on lighting conditions
- OCR accuracy varies with label quality
- Offline mode requires pre-downloaded models

### Planned Features
- 🌐 Offline mode with cached recipes
- 🤖 Machine learning for personalized recommendations
- 📱 Widget support for quick inventory checks
- 🌍 Multi-language support
- 🍽️ Integration with meal planning services
- 📊 Advanced nutrition analytics

## Troubleshooting 🔧

### Backend Issues
- **Model loading errors**: Ensure YOLOv8 model is downloaded
- **CORS errors**: Check frontend URL in CORS middleware
- **Database connection**: Verify Supabase credentials in .env

### Frontend Issues
- **Camera permissions**: Ensure app has camera access granted
- **Image processing slow**: Reduce image resolution
- **Supabase auth errors**: Check API keys and authentication config

## License 📄

This project is licensed under the MIT License - see LICENSE file for details.

## Support & Contact 💬

For issues, questions, or suggestions:
- Open an issue on GitHub
- Contact the development team

## Acknowledgments 🙏

- YOLOv8 by Ultralytics
- Google Gemini AI
- Supabase for backend services
- React Native community

---

**Made with ❤️ by the FridgePal Team**
