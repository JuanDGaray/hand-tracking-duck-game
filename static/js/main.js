document.addEventListener('DOMContentLoaded', function() {
    const loadingSpinner = document.getElementById('loading-spinner');
    const handImage = document.getElementById('hand-image');
    const labelCenter = document.getElementById('label-center');
    const pointerImage = document.getElementById('pointer-image');
    const duckSoundFlapping = new Audio('/static/assets/sounds/duck_flapping.mp3');
    const soundDropDuck = new Audio('/static/assets/sounds/duck_drop.mp3');
    const soundGun = new Audio('/static/assets/sounds/pistol-shot.mp3');
    const soundDuckDown = new Audio('/static/assets/sounds/duck_down.mp3');
    
    lastFivePositions = [];
    lastPositionAbsolute = {x: null, y: null};
    lastPositionRelative = {x: 0, y: 0};
    isReady = false;
    gameActive = false;

    function checkCollision(pointer, bird) {
        const pointerRect = pointer.getBoundingClientRect();
        const birdRect = bird.getBoundingClientRect();
        return !(pointerRect.right < birdRect.left || 
                pointerRect.left > birdRect.right || 
                pointerRect.bottom < birdRect.top || 
                pointerRect.top > birdRect.bottom);
    }

    function changeAnimation(char, classRemove, classAdd) {
        classRemove.forEach(classItem => {
            if (char.classList.contains(classItem)) {
                char.classList.remove(classItem);
                char.querySelector('#bird-image').classList.remove(classItem);
            }
        });
        classAdd.forEach(classItem => {
            char.classList.add(classItem);
            char.querySelector('#bird-image').classList.add(classItem);
        });
    }
    function getRandomAnimation(list) {
        randomItem = list[Math.floor(Math.random() * list.length)];
        return randomItem;
    }

    function resetBird(bird) {
        changeAnimation(bird, ['dead-down'], []);
        bird.style.top = null;
        bird.style.left = null;
        bird.style.transform = null;
        const randomAnimation = getRandomAnimation(['horizontal-invert', 'horizontal'])
        changeAnimation(bird,[],[randomAnimation]);
        changeRandomAnimationDuration(bird);
        duckSoundFlapping.play();
    }

    function changeRandomAnimationDuration(bird) {
        const randomDuration = Math.random() * (6 - 4) + 4;
        const randomDelay = Math.random() * (2 - 0) + 0;
        bird.style.animationDuration = `${randomDuration}s`;
        bird.style.animationDelay = `${randomDelay}s`;
    }


    function getHandPosition() {
        fetch('/hand_position')
            .then(response => response.json())
            .then(data => {
                if (isNaN(data.relative.x) || isNaN(data.relative.y)) {
                    return;
                }
    
                if (lastFivePositions.length >= 5) {
                    lastFivePositions.shift();
                    const lastIndex = lastFivePositions.length - 1;
                    const secondLastIndex = lastIndex - 1;
                    if (!isReady) {
                        if (lastFivePositions[lastIndex].x !== lastFivePositions[secondLastIndex].x || lastFivePositions[lastIndex].y !== lastFivePositions[secondLastIndex].y) {
                            console.log('Hand moved');
                            loadingSpinner.style.display = 'none';
                            isReady = true;
                            handImage.remove();
                            getLimitScreenLeft();
                        }
                    }
                }

                if (gameActive) {
                    const xDiff = Math.abs(lastPositionRelative.x - data.relative.x);
                    const yDiff = Math.abs(lastPositionRelative.y - data.relative.y);
                    threshold = 0.1;
                    if (xDiff >= threshold || yDiff >= threshold) {
                        pointerImage.style.left = `${data.relative.x}%`;
                        pointerImage.style.top = `${data.relative.y}%`;
                        lastPositionRelative = {x: data.relative.x, y: data.relative.y};
                    } 
                    if (data.shot) {
                        const birdsContainers = document.querySelectorAll('.container-bird');
                        birdsContainers.forEach(bird => {
                            isColision = checkCollision(pointerImage, bird);
                            if (isColision && !bird.classList.contains('stop') && !bird.classList.contains('dead-down')) {
                                    console.log('Collision detected');
                                    changeAnimation(bird, ['horizontal', 'horizontal-invert'], ['stop']);
                                    duckSoundFlapping.pause();
                                    bird.style.top = `${data.relative.y}%`;
                                    bird.style.left = `${data.relative.x}%`;
                                    bird.style.animationDuration = ``;
                                    bird.style.animationDelay = ``;
                                    bird.style.transform = 'translate(-50%, -50%)';
                                    soundDropDuck.play();
                                    setTimeout(() => {
                                        changeAnimation(bird, ['stop'], ['dead-down']);
                                        soundDuckDown.volume = 0.2;
                                        soundDuckDown.play();
                                        setTimeout(() => {
                                            resetBird(bird);
                                        }, 1000);
                                    }, 1000);
                            }
                        });
                        
                        soundGun.volume = 0.5;
                        soundGun.play();
                    }
                }
                lastFivePositions.push({x: data.relative.x.toFixed(2), y: data.relative.y.toFixed(2)});
                document.getElementById('position').textContent = `X: ${data.relative.x.toFixed(2)}%, Y: ${data.relative.y.toFixed(2)}%`;
                document.getElementById('positionAbsolute').textContent = `X: ${data.absolute.x.toFixed(2)}, Y: ${data.absolute.y.toFixed(2)}`;

                lastPositionAbsolute = {x: data.absolute.x, y: data.absolute.y};
                let positionsText = "Last 5 positions: ";
                for (let i = 0; i < lastFivePositions.length; i++) {
                    positionsText += `(${lastFivePositions[i].x}, ${lastFivePositions[i].y}) `;
                }
                document.getElementById('last-five-positions').textContent = positionsText;
            })
            .catch(error => {
                console.error('Error fetching hand position:', error);
            });
    }

    function getLimitScreenLeft() {
        const pointSpinner = document.getElementById('point-spinner');
        pointSpinner.classList.remove('d-none');
        labelCenter.textContent = "Point your index finger to the limit left of the screen and press space when you are ready.";
        container = document.querySelector('.container');
        container.classList.add('border-start', 'border-warning', 'border-5');
        document.addEventListener('keydown', function(event) {
            if (event.code === 'Space') {
                x_left = lastPositionAbsolute.x;
                y_center = lastPositionAbsolute.y;
                getLimitScreenRight(x_left, y_center);
                document.removeEventListener('keydown', arguments.callee);
            }
        });
    }

    function getLimitScreenRight(x_left, y_center) {
        const pointSpinner = document.getElementById('point-spinner');
        labelCenter.textContent = "Point your index finger to the limit right of the screen and press space when you are ready.";
        container = document.querySelector('.container');
        container.classList.remove('border-start');
        container.classList.add('border-end',);
        pointSpinner.classList.remove('start-0');
        pointSpinner.classList.add('end-0');
        document.addEventListener('keydown', function(event) {
            if (event.code === 'Space') {
                x_left = x_left;
                y_center = y_center;
                x_right = lastPositionAbsolute.x;
                sendBoxScreenPosition(x_left, y_center, x_right);
                document.removeEventListener('keydown', arguments.callee);
            }
        });
    }

    function sendBoxScreenPosition(x_left, y_center, x_right){
        fetch('/put_limit', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ left: x_left, right: x_right, center: y_center, })
        })
        .then(response => response.json())
        .then(data => {
            console.log(data.message);
            activeGame()
        })
        .catch(error => {
            console.error('Error sending limits:', error);
        });
    }

    function activeGame() {
        const pointSpinner = document.getElementById('point-spinner');
        pointSpinner.classList.add('d-none');
        container = document.querySelector('.container');
        container.classList.remove('border-end');
        const pointerImage = document.getElementById('pointer-image');
        pointerImage.classList.remove('d-none');
        labelCenter.classList.add('d-none');
        gameActive = true;
        duckSoundFlapping.loop = true;
        duckSoundFlapping.volume = 0.1;
        duckSoundFlapping.play();
        fetch('/start_game')
        .then(response => response.json())
        .then(data => {
            console.log(data.message);
        })
        .catch(error => {
            console.error('Error starting game:', error);
        });
    }



    setInterval(getHandPosition, 100); 

});

