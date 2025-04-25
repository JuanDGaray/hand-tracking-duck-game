# Hand Tracking Game 🎮

An interactive game that uses real-time hand tracking to simulate a classic duck hunting game. The project uses your webcam to detect hand movements and allows players to aim and shoot using natural gestures.

## 🚀 Features

- Real-time hand tracking using MediaPipe
- Interactive game interface
- Sound effects and animations
- Scoring system
- Animated sprites (duck and dog)
- Real-time collision detection

## 🛠️ Technologies Used

- **Backend:**
  - Python 3.x
  - Flask
  - OpenCV
  - MediaPipe

- **Frontend:**
  - HTML5
  - CSS3
  - JavaScript
  - Bootstrap 5

## 📋 Prerequisites

- Python 3.8 or higher
- Webcam
- Modern web browser
- Pip (Python package manager)

## 🔧 Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/hand-tracking-game.git
cd hand-tracking-game
```

2. Create a virtual environment:
```bash
python -m venv venv
```

3. Activate the virtual environment:
- On Windows:
```bash
venv\Scripts\activate
```
- On macOS/Linux:
```bash
source venv/bin/activate
```

4. Install dependencies:
```bash
pip install -r requirements.txt
```

5. Run the application:
```bash
python app.py
```

6. Open your browser and visit:
```
http://localhost:5000
```

## 🎮 How to Play

1. Allow webcam access when prompted by the browser
2. Place your hand in the center of the screen
3. Use your hand as a pointer:
   - Index finger controls direction
   - Join thumb and index finger to shoot
4. Aim at the ducks and shoot!

## 📁 Project Structure

```
hand_tracking_flask/
│
├── app.py                # Main Flask application file
├── templates/           # HTML files folder
│   ├── index.html      # Main page
│   └── components/     # Reusable HTML components
│       ├── birdSprite.html
│       └── dogSprite.html
├── static/             # Static files
│   ├── assets/        # Multimedia resources
│   │   ├── img/
│   │   ├── sounds/
│   │   └── sprites/
│   ├── css/
│   └── js/
└── requirements.txt    # Project dependencies
```

## 🤝 Contributing

Contributions are welcome. For major changes, please open an issue first to discuss what you would like to change.

1. Fork the project  
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)  
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)  
4. Push to the branch (`git push origin feature/AmazingFeature`)  
5. Open a Pull Request  

---

### 📌 Note

This project was just an experiment and is no longer maintained. Feel free to use it for any purpose you like.
## 📝 License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details.


