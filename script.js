let currentAudio = new Audio(); // To track the currently playing audio
let songUrls;
let songNames = []; // Add this to store song names

async function fetchSongs(folder) {
    try {
        // Fetch the listing from the server
        let response = await fetch(`http://127.0.0.1:5500/${folder}/`);
        let text = await response.text();

        // Parse the HTML response
        let parser = new DOMParser();
        let doc = parser.parseFromString(text, "text/html");

        // Extract song links
        let songs = Array.from(doc.querySelectorAll("a")).filter(a => a.href.endsWith(".mp3")); // Filter only .mp3 files

        // Create arrays for song names and URLs
        songNames = [];
        songUrls = [];

        songs.forEach(a => {
            // Get the song name (remove .mp3 extension)
            let songName = a.textContent.split('.mp3')[0].trim();

            // Push song name and URL to respective arrays
            songNames.push(songName);
            songUrls.push(a.href);
        });

        // Populate song list in HTML
        let songUL = document.querySelector(".songList").getElementsByTagName("ul")[0];
        songUL.innerHTML = "";

        for (const song of songNames) {
            songUL.innerHTML +=
            `<li>
                <img class="invert" src="Assets/svgs/music.svg" alt="">
                <div class="info">
                    <div>${song}</div>
                    <div>Vedansh</div>
                </div>
                <div class="play-now"> 
                    <span>Play now</span>
                    <img class="invert playuti" src="Assets/play-button.png" alt="">
                </div>
            </li>`;
        }

        // Return the song URLs for playback
        return songUrls;
    } catch (error) {
        console.error("Error fetching songs:", error);
        return [];
    }
}

// Utility to format time in mm:ss
function formatTime(seconds) {
    if (isNaN(seconds)) return "00:00"; // Handle invalid durations
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60).toString().padStart(2, "0");
    return `${mins}:${secs}`;
}

async function displayAlbums() {
    try {
        let a = await fetch('http://127.0.0.1:5500/songs/');
        let response = await a.text();
        
        let div = document.createElement("div");
        div.innerHTML = response; // Set the innerHTML before querying the <a> tags
        
        let anchors = div.getElementsByTagName("a");
        let folders = [];
        let cardContainer = document.querySelector(".cardContainer");
        
        let array = Array.from(anchors);
        for (let index = 0; index < array.length; index++) {
            const e = array[index];
            
            if (e.href.includes("/songs")) {
                let folder = e.href.split("/").slice(-1)[0];
                
                try {
                    // Get the metadata of the folder
                    let a = await fetch(`http://127.0.0.1:5500/songs/${folder}/info.json`);
                    let folderInfo = await a.json();
                    
                    // Add the folder information as a new card
                    cardContainer.innerHTML += `
                        <div class="card" data-folder="${folder}">
                            <div class="play">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M5 20V4L19 12L5 20Z" fill="#000" stroke="#141B34" stroke-width="1.5" stroke-linejoin="round" />
                                </svg>
                            </div>
                            <img src="/songs/${folder}/cover.jpeg" alt="">
                            <h2>${folderInfo.title}</h2>
                            <p>${folderInfo.description}</p>
                        </div>
                    `;
                } catch (err) {
                    console.error('Error loading folder metadata:', err);
                }
            }
        }
        
        // Load the playlist when a card is clicked
        Array.from(document.getElementsByClassName("card")).forEach(e => {
            e.addEventListener("click", async (item) => {
                const folder = item.currentTarget.dataset.folder;
                console.log('Folder:', folder);  // Log the folder to check if it's correctly set

                // Check if the folder is valid before proceeding
                if (!folder) {
                    console.error('No folder path provided.');
                    return; // Prevent further action if folder is not defined
                }

                const songUrls = await fetchSongs(`songs/${folder}`);

                if (songUrls.length > 0) {
                    // Re-attach click listeners to the new song list items
                    Array.from(document.querySelector(".songList").getElementsByTagName("li")).forEach((e, index) => {
                        e.addEventListener("click", () => {
                            if (currentAudio) {
                                currentAudio.pause();
                                currentAudio.currentTime = 0;
                            }

                            currentAudio = new Audio(songUrls[index]);
                            const songName = e.querySelector(".info").firstElementChild.innerHTML;

                            currentAudio.play().catch(err => console.error("Playback error:", err));
                            document.querySelector("#play").src = "Assets/svgs/pause.svg";
                            document.querySelector(".songinfo").innerHTML = songName;
                            document.querySelector(".songtime").innerHTML = "00:00 / 00:00";

                            currentAudio.addEventListener("timeupdate", () => {
                                document.querySelector(".songtime").innerHTML =
                                    `${formatTime(currentAudio.currentTime)} / ${formatTime(currentAudio.duration)}`;
                                document.querySelector(".circle").style.left = (currentAudio.currentTime / currentAudio.duration) * 100 + "%";
                            });

                            document.querySelector(".seekbar").addEventListener("click", e => {
                                let percent = (e.offsetX / e.target.getBoundingClientRect().width) * 100;
                                document.querySelector(".circle").style.left = percent + "%";
                                currentAudio.currentTime = ((currentAudio.duration) * percent) / 100;
                            });

                            currentAudio.addEventListener("loadeddata", () => {
                                console.log("Now Playing:", `Song URL: ${songUrls[index]}`);
                                console.log("Song Name:", songName);
                                console.log("Duration:", currentAudio.duration);
                            });
                        });
                    });
                }
            });
        });
    } catch (error) {
        console.error("Error fetching albums:", error);
    }
}

async function main() {
    try {
        // Fetch songs and get their URLs
        const songUrls = await fetchSongs("songs/cs");

        // Display all the albums on the page
        displayAlbums();

        if (songUrls.length > 0) {
            // Attach an event listener to each song
            Array.from(document.querySelector(".songList").getElementsByTagName("li")).forEach((e, index) => {
                e.addEventListener("click", () => {
                    // Stop the currently playing audio
                    if (currentAudio) {
                        currentAudio.pause();
                        currentAudio.currentTime = 0; // Reset playback
                    }

                    // Create a new audio object for the clicked song
                    currentAudio = new Audio(songUrls[index]);
                    const songName = e.querySelector(".info").firstElementChild.innerHTML;

                    // Play the clicked song
                    currentAudio.play().catch(err => console.error("Playback error:", err));
                    document.querySelector("#play").src = "Assets/svgs/pause.svg";
                    document.querySelector(".songinfo").innerHTML = songName;
                    document.querySelector(".songtime").innerHTML = "00:00 / 00:00";

                    // Attach a timeupdate event listener
                    currentAudio.addEventListener("timeupdate", () => {
                        document.querySelector(".songtime").innerHTML =
                            `${formatTime(currentAudio.currentTime)} / ${formatTime(currentAudio.duration)}`;
                        document.querySelector(".circle").style.left = (currentAudio.currentTime / currentAudio.duration) * 100 + "%";
                    });

                    // Attach an event listener to the seekbar
                    document.querySelector(".seekbar").addEventListener("click", e => {
                        let percent = (e.offsetX / e.target.getBoundingClientRect().width) * 100;
                        document.querySelector(".circle").style.left = percent + "%";
                        currentAudio.currentTime = ((currentAudio.duration) * percent) / 100;
                    });

                    // Log the audio details when loaded
                    currentAudio.addEventListener("loadeddata", () => {
                        console.log("Now Playing:", `Song URL: ${songUrls[index]}`);
                        console.log("Song Name:", songName);
                        console.log("Duration:", currentAudio.duration);
                    });
                });
            });
        } else {
            console.log("No songs found to play.");
        }
    } catch (error) {
        console.error("Error in main function:", error);
    }

    // Event listener to play, next and previous
    const play = document.querySelector("#play");
    play.addEventListener("click", () => {
        if (currentAudio.paused) {
            currentAudio.play();
            play.src = "Assets/svgs/pause.svg";
        } else {
            currentAudio.pause();
            play.src = "Assets/svgs/play.svg";
        }
    });

    // Add an event listener for hamburger
    document.querySelector(".hamburger").addEventListener("click", () => {
        document.querySelector(".left").style.left = "0";
    });

    // Add an event listener for close button
    document.querySelector(".close").addEventListener("click", () => {
        document.querySelector(".left").style.left = "-120%";
    });

    // Add an event listener to previous and next
    const previous = document.querySelector("#previous");
    const next = document.querySelector("#next");

    // Function to update song info
    function updateSongInfo(index) {
        if (index >= 0 && index < songNames.length) {
            document.querySelector(".songinfo").innerHTML = songNames[index];
            document.querySelector("#play").src = "Assets/svgs/pause.svg";
        }
    }

    previous.addEventListener("click", () => {
        console.log("Previous clicked");

        let currentFile = currentAudio.src.split("/").pop(); // Get the last part of the URL
        let normalizedSongUrls = songUrls.map(url => url.split("/").pop());

        let index = normalizedSongUrls.indexOf(currentFile);
        if (index === -1) {
            console.error("Current song not found in the playlist");
            return;
        }

        let previousIndex = (index - 1 + normalizedSongUrls.length) % normalizedSongUrls.length;
        currentAudio.src = songUrls[previousIndex];
        updateSongInfo(previousIndex);
        currentAudio.play();
    });

    next.addEventListener("click", () => {
        console.log("Next clicked");

        let currentFile = currentAudio.src.split("/").pop(); // Get the last part of the URL
        let normalizedSongUrls = songUrls.map(url => url.split("/").pop());

        let index = normalizedSongUrls.indexOf(currentFile);
        if (index === -1) {
            console.error("Current song not found in the playlist");
            return;
        }

        let nextIndex = (index + 1) % normalizedSongUrls.length;
        currentAudio.src = songUrls[nextIndex];
        updateSongInfo(nextIndex);
        currentAudio.play();
    });

    // Add volume control functionality
    const volumeSlider = document.querySelector(".volume");
    volumeSlider.addEventListener("input", (e) => {
        if (currentAudio) {
            currentAudio.volume = e.target.value / 100;
        }
    });

    // Set initial volume
    if (currentAudio) {
        currentAudio.volume = volumeSlider.value / 100;
    }
}

main();
