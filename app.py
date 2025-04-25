from flask import Flask, Response, jsonify, render_template, request
import cv2
import mediapipe as mp
import math


app = Flask(__name__)

# Global variables for tracking position
last_position = {"x_percentage": None, "y_percentage": None}
positionRelative_data = {"x": None, "y": None}
positionAbsolute_data = {"x": None, "y": None}
fixed_limits = {"left": None, "right": None, "center": None, "top": None}
gameOn = False
shot = False
isShotLastFivetimes = []

@app.route('/put_limit', methods=['POST'])
def put_limit():
    print(request.get_json())
    global fixed_limits
    data = request.get_json()
    try:
        fixed_limits["left"] = int(data.get("left")) if data.get("left") is not None else None
        fixed_limits["right"] = int(data.get("right")) if data.get("right") is not None else None
        fixed_limits["center"] = int(data.get("center")) if data.get("center") is not None else None
    except (ValueError, TypeError):
        return jsonify({"error": "Invalid data format"}), 400

    return jsonify({"message": "Limits set successfully"}), 200


def hand_tracking_stream():
    global positionRelative_data, positionAbsolute_data, fixed_limits, shot, isShotLastFivetimes
    mp_hands = mp.solutions.hands
    hands = mp_hands.Hands(static_image_mode=False, max_num_hands=1, min_detection_confidence=0.7)
    mp_draw = mp.solutions.drawing_utils

    cap = cv2.VideoCapture(0)

    while True:
        ret, frame = cap.read()
        if not ret:
            break

        frame = cv2.flip(frame, 1)
        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        results = hands.process(rgb_frame)

        h, w, _ = frame.shape
        if results.multi_hand_landmarks:
            for hand_landmarks in results.multi_hand_landmarks:
                middle_finger_knuckle = hand_landmarks.landmark[9]
                middle_x = middle_finger_knuckle.x
                middle_y = middle_finger_knuckle.y

                filtered_landmarks = [landmark for i, landmark in enumerate(hand_landmarks.landmark) if i not in [0, 1, 2, 3, 4]]

                if fixed_limits["left"] is None and fixed_limits["center"] is None and fixed_limits["right"] is None:
                    x_coords = [landmark.x for landmark in filtered_landmarks]
                    y_coords = [landmark.y for landmark in filtered_landmarks]

                    min_x = min(x_coords)
                    max_x = max(x_coords)
                    min_y = min(y_coords)
                    max_y = max(y_coords)

                    center_x = int(middle_x * w)
                    center_y = int(middle_y * h)
                    bbox_width = int((max_x - min_x) * w)
                    bbox_height = int((max_y - min_y) * h)

                    desired_width = max(bbox_width, int(bbox_height * 16 / 9))
                    desired_height = max(bbox_height, int(bbox_width * 9 / 16))

                    bbox_x1 = max(0, center_x - desired_width // 2)
                    bbox_x2 = min(w, center_x + desired_width // 2)
                    bbox_y1 = max(0, center_y - desired_height // 2)
                    bbox_y2 = min(h, center_y + desired_height // 2)
                elif fixed_limits["left"] is not None and fixed_limits["right"] is not None and fixed_limits["center"] is not None:
                    try:
                        bbox_x1 = fixed_limits["left"]
                        bbox_x2 = fixed_limits["right"]
                        rect_width = bbox_x2 - bbox_x1
                        rect_height = int(rect_width * 9 / 16)
                        y_center = fixed_limits["center"] or (h // 2)
                        bbox_y1 = max(0, y_center - rect_height // 2)
                        bbox_y2 = min(h, y_center + rect_height // 2)
                    except Exception as e:
                        print(f"Error in rectangle calculation: {e}")
                        continue  # Saltar la iteración si hay errores
                else:
                    print("Fixed limits not set or incomplete.")
                    continue  # Saltar si no hay suficientes datos

                cv2.rectangle(frame, (bbox_x1, bbox_y1), (bbox_x2, bbox_y2), (0, 255, 0), 2)
                
                
                #index finger
                index_finger_tip = hand_landmarks.landmark[8]
                index_x = index_finger_tip.x
                index_y = index_finger_tip.y
                cv2.circle(frame, (int(index_x * w), int(index_y * h)), 10, (255, 0, 0), -1)
                
                rel_x = (index_x * w - bbox_x1) / (bbox_x2 - bbox_x1) * 100
                rel_y = (index_y * h - bbox_y1) / (bbox_y2 - bbox_y1) * 100
                
                #thumb finger
                if gameOn:
                    thumb_finger_tip = hand_landmarks.landmark[4]
                    thumb_x = thumb_finger_tip.x
                    thumb_y = thumb_finger_tip.y
                    cv2.circle(frame, (int(thumb_x * w), int(thumb_y * h)), 10, (0, 255, 0), -1)
                    
                    cv2.circle(frame, (int(thumb_x * w), int(thumb_y * h)), 10, (0, 255, 0), -1)
                    
                    distance = math.sqrt((index_x - thumb_x) ** 2 + (index_y - thumb_y) ** 2)
                    threshold = 0.06
                    if distance < threshold:
                        shot = True
                        
                    #middle_point
                    mid_x = (index_x + thumb_x) / 2
                    mid_y = (index_y + thumb_y) / 2
                    mid_x_pixel = int(mid_x * w)
                    mid_y_pixel = int(mid_y * h)
                    crosshair_color = (0, 0, 255)
                    crosshair_size = 20
                    cv2.line(frame, (mid_x_pixel - crosshair_size, mid_y_pixel), 
                            (mid_x_pixel + crosshair_size, mid_y_pixel), crosshair_color, 2)
                    cv2.line(frame, (mid_x_pixel, mid_y_pixel - crosshair_size), 
                            (mid_x_pixel, mid_y_pixel + crosshair_size), crosshair_color, 2)
                    
                    rel_x = (mid_x * w - bbox_x1) / (bbox_x2 - bbox_x1) * 100
                    rel_y = (mid_y * h - bbox_y1) / (bbox_y2 - bbox_y1) * 100


                positionRelative_data = {"x": rel_x, "y": rel_y}
                positionAbsolute_data = {"x": int(index_x * w), "y": int(index_y * h)}
                isShotLastFivetimes.append(shot)
                if len(isShotLastFivetimes) > 5:
                    isShotLastFivetimes.pop(0)

                cv2.circle(frame, (int(index_x * w), int(index_y * h)), 10, (255, 0, 0), -1)

        ret, buffer = cv2.imencode('.jpg', frame)
        frame = buffer.tobytes()
        yield (b'--frame\r\n'
               b'Content-Type: image/jpeg\r\n\r\n' + frame + b'\r\n')

    cap.release()
    hands.close()

@app.route('/video_feed')
def video_feed():
    return Response(hand_tracking_stream(),
                    mimetype='multipart/x-mixed-replace; boundary=frame')

@app.route('/start_game')  # Ruta para iniciar el juego
def start_game():
    global gameOn
    gameOn = True
    return jsonify({"message": "Game started successfully"}), 200

def get_hand_position():
    global positionRelative_data, positionAbsolute_data, shot
    lastShot = shot
    if shot == True:
        shot = False
    return {"relative": positionRelative_data, "absolute": positionAbsolute_data, "shot": lastShot}

@app.route('/hand_position')
def hand_position():
    return jsonify(get_hand_position())

@app.route('/')
def index():
    return render_template('index.html')

if __name__ == '__main__':
    host = '127.0.0.1'
    port = 5000
    print(f"* Running on http://{host}:{port}/ (Press CTRL+C to quit)")
    app.run(debug=True, host=host, port=port)