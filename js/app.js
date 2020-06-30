// replace these values with those generated in your TokBox Account
var apiKey = "";
var sessionId = "";
var token = "";

var session;
var publisher;
var options = {
  'audio': document.getElementById('audio-toggle'),
  'video': document.getElementById('video-toggle'),
  'screen_share_on': document.getElementById('screen-share-on'),
  'screen_share_off': document.getElementById('screen-share-off')
};
var elements = {
    'screen': document.getElementById("screen"),
    'input_name': document.getElementById("enter-name"),
    'join_meeting': document.getElementById("join-meeting"),
    'name_section': document.getElementById("name-section"),
    'video_main': document.getElementById("video-main")
};

var username;

elements.video_main.style.display = "none";

// (optional) add server code here

function initializeSession() {
  session = OT.initSession(apiKey, sessionId);

  // Subscribe to a newly created stream
  sessionCallBack(session);
  initializePublisher(session);
}

function sessionCallBack(session) {
  let sessionOptions = {
      insertMode: "append",
      width: "50%",
      height: "50%"
  };

  session.on('streamCreated', function(event) {
    const streamContainer = event.stream.videoType === "screen" ? "screen" : "subscriber";
    session.subscribe(
        event.stream,
        streamContainer,
        sessionOptions,
        handleScreenShare(event.stream.videoType));
  });

  session.on("streamDestroyed", event => {
    elements.screen.classList.remove("sub-active");
  });
}

// Screenshare layout
function handleScreenShare(streamType, error) {
  if (error) {
    console.log("error: " + error.message);
  } else {
    if (streamType === "screen") {
      elements.screen.classList.add("sub-active");
    }
  }
}


function initializePublisher(session) {
  // Create a publisher
  var publisher_options = {
    publishAudio: false,
    publishVideo: false,
    name: username
  };

  options.audio.value = publisher_options.publishAudio;
  options.video.value = publisher_options.publishVideo;
  audioState(options.audio.value);
  videoState(options.video.value);


  publisher = OT.initPublisher('publisher', publisher_options, {
    insertMode: 'append',
    width: '100%',
    height: '100%',
    name: username
  }, handleError);

  // Connect to the session
  session.connect(token, function(error) {
    if (session.capabilities.publish === 1) {
      session.publish(publisher);
    } else {
      console.log("You cannot publish an audio-video stream.");
    }
  });

  var msgHistory = document.querySelector('#history');
  session.on('signal:msg', function signalCallback(event) {
     var msg = document.createElement('p');
     msg.textContent = event.data;
     msg.className = event.from.connectionId === session.connection.connectionId ? 'mine' : 'theirs';
     msgHistory.appendChild(msg);
     msg.scrollIntoView();
  });
}

function audioState(state) {
  if (state === true) {
    options.audio.innerText = "Audio Off"
  } else {
    options.audio.innerText = "Audio On"
  }
}

function videoState(state) {
  if (state === true) {
    options.video.innerText = "Video Off"
  } else {
    options.video.innerText = "Video On"
  }
}

// Handling all of our errors here by alerting them
function handleError(error) {
  if (error) {
    alert(error.message);
  }
}

//Options Event Listeners
options.video.addEventListener("click", function(event) {
  let video_value = JSON.parse(options.video.value);
  publisher.publishVideo(!video_value);
  options.video.value = !video_value;
  videoState(!video_value);
});

options.audio.addEventListener("click", function(event) {
  let audio_value = JSON.parse(options.audio.value);
  publisher.publishAudio(!audio_value);
  options.audio.value = !audio_value;
  audioState(!audio_value);
});

options.screen_share_on.addEventListener("click", function (event) {
    let screenSharePublisher;
    const screenShareOptions = {
            insertMode: "append",
            width: "100%",
            height: "100%",
            videoSource: "screen",
            publishAudio: true
          };

    OT.checkScreenSharingCapability(function(response) {
        if (!response.supported || response.extensionRegistered === false) {
            alert("Screen sharing not supported");
        } else if (response.extensionInstalled === false) {
            alert("Browser requires extension");
        } else {
            screenSharePublisher = OT.initPublisher("screen", screenShareOptions, handleError);
            screenSharePublisher.on('mediaStopped', function(event) {
                elements.screen.classList.remove("sub-active");
                options.screen_share_off.style.display = "none";
                options.screen_share_on.style.display = "block";
                elements.screen.classList.remove("pub-inactive");
            });
            session.publish(screenSharePublisher, handleError);

            elements.screen.classList.add("pub-inactive");
            options.screen_share_off.style.display = "block";
            options.screen_share_on.style.display = "none";

            options.screen_share_off.addEventListener("click", function(event) {
                screenSharePublisher.destroy();
                options.screen_share_off.style.display = "none";
                options.screen_share_on.style.display = "block";
                elements.screen.classList.remove("pub-inactive");
            });
        }
    });
});

elements.join_meeting.addEventListener("click", function (event) {
    let user = elements.input_name.value;
    if (user.length <= 1) {
        alert('Please enter a valid name')
    } else {
        username = user;
        elements.name_section.style.display = "none";
        elements.video_main.style.removeProperty("display");
        initializeSession();
    }
});

// Text chat
var form = document.querySelector('form');
var msgTxt = document.querySelector('#msgTxt');

// Send a signal once the user enters data in the form
form.addEventListener('submit', function submit(event) {
  event.preventDefault();

  session.signal({
    type: 'msg',
    data: username + ": " + msgTxt.value
  }, function signalCallback(error) {
    if (error) {
      console.error('Error sending signal:', error.name, error.message);
    } else {
      msgTxt.value = '';
    }
  });
});