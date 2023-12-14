/// This ensures that the script is loaded after the page is loaded
/// This is important because the script is loaded in the head of the html

let userInfo = {
    name: "",
    age:0,
    gender:{
        genderProbability:0,
        genderText: "",
    },
}


window.onload = function() {
  const video = document.getElementById('video')
  const startButton = document.getElementById('startButton');
  const stopButton = document.getElementById('stopButton'); 

  let isPlaying = false;
  let videoTime = 0;

  stopButton.addEventListener('click', () => {
    if (!video.paused) {
      videoTime = video.currentTime;
      video.pause();
      isPlaying = false;
    } else {
      video.currentTime = 0;
      video.play();
      isPlaying = true;
    }
  });

  startButton.addEventListener('click', () => { 
    if (!isPlaying) {
      video.currentTime = videoTime;
      video.play();
      isPlaying = true;
    } else if (video.paused) {
      video.play();
    }
  }); 

  stopButton.addEventListener('click', () => {
    if (!video.paused) {
      videoTime = video.currentTime;
      video.pause();
      isPlaying = false;
    } else {
      video.currentTime = 0;
      video.play();
      isPlaying = true;
    }
    startButton.disabled = false; // Enable the startButton
  });


  Promise.all([
    faceapi.nets.tinyFaceDetector.loadFromUri('/model'),
    faceapi.nets.faceLandmark68Net.loadFromUri('/model'),
    faceapi.nets.faceRecognitionNet.loadFromUri('/model'),
    faceapi.nets.faceExpressionNet.loadFromUri('/model'),
    faceapi.nets.ssdMobilenetv1.loadFromUri('/model'),
    faceapi.nets.ageGenderNet.loadFromUri('/model'),
  ]).then(startVideo)

  function startVideo() {
    navigator.getUserMedia(
      { video: {} },
      stream => video.srcObject = stream,
      err => console.error(err)
    )
  }

  video.addEventListener('play', () => {
    const canvas = faceapi.createCanvasFromMedia(video)
    document.body.append(canvas)
    const displaySize = { width: video.width, height: video.height }
    faceapi.matchDimensions(canvas, displaySize)
    setInterval(async () => {
      const detections = await faceapi.detectAllFaces(video, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks().withFaceExpressions().withAgeAndGender();
      const resizedDetections = faceapi.resizeResults(detections, displaySize)
      canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height)
      faceapi.draw.drawDetections(canvas, resizedDetections)
      /// Landmarks draw the basic eye and nose expressions
      // faceapi.draw.drawFaceLandmarks(canvas, resizedDetections)
      faceapi.draw.drawFaceExpressions(canvas, resizedDetections)

      const genderAndAge = await faceapi.detectSingleFace(video).withAgeAndGender()
      if (genderAndAge) {
        const {age,gender, genderProbability} = genderAndAge

        userInfo.age = Math.round(age);
        userInfo.gender = {
            genderProbability: genderProbability,
            genderText: gender,
        }


        const ctx = canvas.getContext('2d')
        ctx.font = '30px Arial'
        ctx.fillStyle = 'white'
        ctx.fillText(`Age: ${Math.round(age)}`,10,50);
        ctx.fillText(`Gender: ${gender} (${Math.round(genderProbability * 100)}%)`,10,100);
        console.log(userInfo)
      }
    }, 100)
  })
}