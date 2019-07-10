// Options
const CLIENT_ID = "747389777524-q6qj3m5ra0md8traispai2bbk7v7fc03.apps.googleusercontent.com";
const DISCOVERY_DOCS = ["https://www.googleapis.com/discovery/v1/apis/youtube/v3/rest"];
const SCOPES = "https://www.googleapis.com/auth/youtube.readonly";

// DOM Elements
const $authorizeButton = document.querySelector("#authorize-button");
const $signoutButton = document.querySelector("#signout-button");
const $content = document.querySelector("#content");
const $channelForm = document.querySelector("#channel-form");
const $channelInput = document.querySelector("#channel-input");
const $videoContainer = document.querySelector("#video-container");
const defaultChannel = "TechGuyWeb";

// Form submit and change channel.
$channelForm.addEventListener("submit", e => {
  e.preventDefault();
  const channel = $channelInput.value;
  getChannel(channel);
});

// Load auth2 library
function handleClientLoad() {
  gapi.load("client:auth2", initClient);
}

// Init API client library and set up sign in listeners
function initClient() {
  gapi.client.init({
      discoveryDocs: DISCOVERY_DOCS,
      clientId: CLIENT_ID,
      scope: SCOPES
    })
    .then(() => {
      // Listen for sign in state changes
      gapi.auth2.getAuthInstance().isSignedIn.listen(updateSigninStatus);
      // Handle initial sign in state
      updateSigninStatus(gapi.auth2.getAuthInstance().isSignedIn.get());
      $authorizeButton.onclick = handleAuthClick;
      $signoutButton.onclick = handleSignoutClick;
    });
}

// Update UI sign in state changes
function updateSigninStatus(isSignedIn) {
  if (isSignedIn) {
    $authorizeButton.style.display = "none";
    $signoutButton.style.display = "block";
    $content.style.display = "block";
    getChannel(defaultChannel);
  } else {
    $authorizeButton.style.display = "block";
    $signoutButton.style.display = "none";
    $content.style.display = "none";
  }
}

// Handle login
function handleAuthClick() {
  gapi.auth2.getAuthInstance().signIn();
}

// Handle logout
function handleSignoutClick() {
  gapi.auth2.getAuthInstance().signOut();
}

// Get channel from API
function getChannel(channel) {
  gapi.client.youtube.channels.list({
      part: "snippet, contentDetails, statistics",
      forUsername: channel
    })
    .then(response => {
      console.log(response);
      const channel = response.result.items[0];

      const output = /*html*/ `
        <ul class="collection">
          <li class="collection-item">Title: ${channel.snippet.title}</li>
          <li class="collection-item">ID: ${channel.id}</li>
          <li class="collection-item">Subscribers: ${numberWithCommas(channel.statistics.subscriberCount)}</li>
          <li class="collection-item">Videos: ${numberWithCommas(channel.statistics.videoCount)}</li>
          <li class="collection-item">Views: ${numberWithCommas(channel.statistics.viewCount)}</li>
        </ul>

        <p>${channel.snippet.description}</p>
        <hr>
        <a href="https://www.youtube.com/${channel.snippet.customUrl}" target="_blank" class="btn grey darken-2">Visit Channel</a>
      `;

      showChannelData(output);

      const playlistId = channel.contentDetails.relatedPlaylists.uploads;
      requestVideoPlaylist(playlistId);
    })
    .catch(err => alert("No channel by that name."));
}

function showChannelData(data) {
  const $channelData = document.querySelector("#channel-data");
  $channelData.innerHTML = data;
}

function requestVideoPlaylist(playlistId) {
  const requestOptions = {
    playlistId: playlistId,
    part: "snippet",
    maxResults: 10
  }

  const request = gapi.client.youtube.playlistItems.list(requestOptions);

  request.execute(response => {
    console.log(response);
    const playlistItems = response.items;

    if (playlistItems) {
      let output = `<h4 class="center-align">Latest Videos</h4>`;

      // Loop through videos and append output
      playlistItems.forEach(item => {
        const videoId = item.snippet.resourceId.videoId;

        output += /*html*/ `
          <div class="col s3">
          <iframe width="100%" height="auto" src="https://www.youtube.com/embed/${videoId}" frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
          </div>
        `;
      });

      // Output videos
      $videoContainer.innerHTML = output;
    } else {
      $videoContainer.innerHTML = "No uploaded videos.";
    }
    console.log(playlistItems);
  });
}

// Add commas to number
function numberWithCommas(x) {
  return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}