# FITNESS TRACKER (Garmin Clone)

Welcome to the **Fitness Tracker**! This is a full-stack, comprehensive health and fitness application inspired by Garmin Connect. It allows users to track their workouts, monitor health metrics, set goals, manage their nutrition, and connect with other athletes.

## 🚀 Key Functionalities & Features

### 1. User & Role Management
* **Athlete & Trainer Profiles**: Users can register as athletes (tracking sport type and skill level) or as trainers (tracking certifications and experience).
* **Supervision System**: Trainers can supervise athletes, add session notes, and provide performance ratings.
* **Authentication**: Secure login and registration using JWT and bcrypt password hashing.

### 2. Comprehensive Activity Tracking
* **Workout Logging**: Log various activities (Running, Cycling, Swimming) with detailed metrics including Duration, Distance, and Date.
* **Dashboard Analytics**: A rich dashboard displaying lifetime activity summaries (Total Activities, Duration, Distance).
* **Visualizations**: Interactive charts to visualize activity distance over time.

### 3. Health & Device Ecosystem
* **Health Metrics**: Track specific vital signs like Heart Rate and plot them dynamically on an average 7-day timeline.
* **Wearable Integration**: Virtual registry for wearable devices (Smartwatches, Fitness Bands), tracking serial numbers, GPS capabilities, and heart rate sensors.

### 4. Nutrition & Goals
* **Nutrition Tracking**: Log meals, daily caloric intake, and specific food items.
* **Goal Setting**: Users can define fitness goals (e.g., target distance or calories) with specific deadlines.
* **Achievements**: Unlock achievements (e.g., "First 5K", "Consistency") which are proudly displayed on the user's dashboard.

### 5. Social & Notifications
* **Social Network**: Follow other athletes, track followers, and build a fitness community.
* **Notification Preferences**: Highly customizable notification system to receive alerts from trainers or system milestones.

---

## 🛠️ Technology Stack
* **Frontend**: React (Vite), Tailwind CSS, Recharts (for data visualization), Lucide-React (icons).
* **Backend**: Node.js, Express.js.
* **Database**: MongoDB (Mongoose ODM).

---

## ⚙️ Setup & Installation Instructions

Follow these steps to run the project locally on your machine.

### Prerequisites
- [Node.js](https://nodejs.org/) installed
- MongoDB installed locally, or a cloud MongoDB URI (Atlas)

### 1. Database Configuration
Navigate to the `backend` folder. Open the `.env` file (create one if it doesn't exist) and include your MongoDB connection string if you aren't using a local MongoDB instance:
```env
MONGO_URI=mongodb://localhost:27017/garmin_clone
PORT=5000
```

### 2. Start the Backend Server
Open a terminal in the `backend` folder and run:
```bash
npm install
node server.js
```
*The backend API server will start on port 5000.*

### 3. Start the Frontend Application
Open a separate terminal in the `frontend` folder and run:
```bash
npm install
npm run dev
```
*The frontend interface will compile and become accessible at `http://localhost:5173`.*

---

## 🤝 Contributing
1. Clone the repository.
2. Create a new branch for your feature (`git checkout -b feature-name`).
3. Make your changes and commit (`git commit -m "Added a new feature"`).
4. Push your branch and submit a pull request for review.
