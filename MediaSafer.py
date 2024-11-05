// Select all media elements
const images = document.querySelectorAll('img');
const videos = document.querySelectorAll('video');
const audios = document.querySelectorAll('audio');
const styles = document.querySelectorAll('style');
const links = document.querySelectorAll('link[rel="stylesheet"]');
const scripts = document.querySelectorAll('script[src]');

// Step 2: Prepare HTML for the new file
let mediaHTML = '<!DOCTYPE html><html><head><title>Extracted Media</title>';

// Step 3: Insert all CSS links into the HTML document
links.forEach(link => {
    const href = link.href;
    mediaHTML += `
<style>
        /
/* Standard-Reset */
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

/* Body Styling */
body {
    display: grid;
    font-family: Arial, sans-serif;
    background-color: #121212;
    color: #fff;
    padding: 10px;
}

hr {
    background-color: greyblack;
    border: 1px flexible #cfcfcf5c;
    border-radius: 5px;
    padding: 2px;
    text-align: center;
    margin-bottom: 2px;
    margin-top: 2px;
}

/* Header Navigation */
header {
    background-color: #1e1e1e;
    border: 25px #0f0f0f;
    border-radius: 5px;
    padding: 25px;
    text-align: center;
    margin-bottom: 2px;
    margin-top: 2px;
}

nav ul {
    list-style-type: none;
}

nav ul li {
    display: inline;
    margin-right: 15px;
}

nav ul li a {
    color: #f0f0f0;
    text-decoration: none;
    font-weight: bold;
}

#hidden-video {
    display: none; /* Das Video wird unsichtbar gemacht */
}

/* Grid Layout for Image Gallery */
.image-gallery {
    display: grid;
    grid-template-columns: repeat(10, 2fr);
    grid-gap: 10px;
    border: 5px;
    border-radius: 5px;
    justify-items: center;
}

.image-gallery img {
    width: 75%;
    border-radius: 25px;
    transition: transform 0.3s ease;
    border: 2px solid; /* Standardrahmen */
    border-shadow: 0 0 15px transparent;
    transition: border-color 0.3s;
    max-width: 100%; /* Bild wird responsiv und passt sich an die Container-Breite an */
    height: auto; /* Beibehaltung des Seitenverhältnisses */
}

.image-gallery img:hover {
    transform: scale(1.05);
}

.image-gallery figure {
    text-align: center; /* Zentriert den Text in der figure */
    margin: 10px; /* Fügt Abstand zwischen den Bildern hinzu */
}

/* Grid Layout for Image Gallery 2 */
.image-gallery2 {
    display: grid;
    grid-template-columns: repeat(12, 1fr);
    grid-gap: 10px;
    justify-items: center;
}

.image-gallery2 img {
    width: 75%;
    border-radius: 15px;
    transition: transform 0.3s ease;
    border: 2px solid; /* Standardrahmen */
    border-shadow: 0 0 15px transparent;
    transition: border-color 0.3s;
    max-width: 100%; /* Bild wird responsiv und passt sich an die Container-Breite an */
    height: auto; /* Beibehaltung des Seitenverhältnisses */
}

.image-gallery2 img:hover {
    transform: scale(1.05);
}

.image-gallery2 figure {
    text-align: center; /* Zentriert den Text in der figure */
    margin: 10px; /* Fügt Abstand zwischen den Bildern hinzu */
}

/* Pulsierende Effekte */
.pulsate-green {
    animation: pulse-green 1.5s infinite;
}

.pulsate-red {
    animation: pulse-red 1.5s infinite;
}

@keyframes pulse-green {
    0% {
        transform: scale(1);
        border-color: yellowgreen;
    }
    50% {
        transform: scale(1.1);
        border-color: green; /* Farbänderung für den Puls-Effekt */
    }
    100% {
        transform: scale(1);
        border-color: yellowgreen;
    }
}

@keyframes pulse-red {
    0% {
        transform: scale(1);
        border-color: red;
    }
    50% {
        transform: scale(1.1);
        border-color: darkred; /* Farbänderung für den Puls-Effekt */
    }
    100% {
        transform: scale(1);
        border-color: red;
    }
}
/* Styling for the About Section */
.about-main {
    max-width: 900px;
    margin: 0 auto;
    padding: 20px;
    background-color: #1e1e1e;
    border-radius: 10px;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.about-main h1 {
    font-size: 2.5rem;
    color: darkred;
    text-align: center;
    text-shadow: 0.4px -0.5px 1px white;
    margin-bottom: 20px;
}

.u-color {
    color: black;
}

.about-main p {
    display: grid;
    font-size: 1.2rem;
    color: black;
    text-align: center;
    text-shadow: 0.4px -0.5px 1px white;
    line-height: 1.6;
    margin-bottom: 15px;
}

.completed {
    border-color: green; /* Grüne Umrandung für abgeschlossene Errungenschaften */
}

@media only screen and (max-width: 768px) {
    .about-main h1 {
        font-size: 2rem;
    }

    .about-main p {
        font-size: 1rem;
    }
}

/* Footer */
footer {
    margin-top: 25px;
    text-align: center;
    padding: 25px;
    background-color: #1e1e1e;
    color: #faba0a;
    position: bottom; /* Um sicherzustellen, dass der Footer immer am Ende ist */
    width: 100%; /* Setzt die Breite auf 100% */
}

.footer-links {
    margin-top: 10px; /* Abstand zwischen Copyright und Links */
}

.footer-links a {
    color: #aaa; /* Linkfarbe */
    margin: 0 10px; /* Abstand zwischen Links */
    text-decoration: none; /* Keine Unterstreichung der Links */
}

.footer-links a:hover {
    text-decoration: underline; /* Unterstreichung beim Hover-Effekt */
}

/* Responsive Design for Mobile Devices */
@media only screen and (max-width: 768px) {
    .image-gallery {
        grid-template-columns: repeat(2, 1fr);
    }
}

.ranch-ui {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    height: 70vh; /* Vertikale Zentrierung */
    background-color: #d2b48c65; /* Beige Hintergrund passend zum Ranch-Thema */
    border-radius: 50px;
    padding: 20px;
    margin: 20px auto;
    width: 80%;
    max-width: 600px;
    box-shadow: 0 0 15px #d2b48c;
}

.ranch-ui h1 {
    color: #0b3f0f95;
    margin-bottom: 20px;
    font-size: 2.5rem;
    text-shadow: 0.4px -0.5px 1px #ffffff95;
}

.ranch-ui form {
    display: flex;
    color: red;
    flex-direction: column;
    align-items: center;
    width: 100%;
}

.ranch-ui form label {
    font-size: 1.2rem;
    color: #4b3b24;
}

.ranch-ui form input {
    padding: 10px;
    margin-bottom: 20px;
    border: 2px solid #654321;
    border-radius: 5px;
    width: 80%;
    max-width: 300px;
}

.ranch-button {
    background-color: #4b3b2495;
    color: #ffffff95;
    border: none;
    padding: 10px 20px;
    text-transform: uppercase;
    letter-spacing: 1px;
    font-size: 1rem;
    cursor: pointer;
    border-radius: 5px;
    transition: background-color 0.3s;
    margin-top: 10px;
    display: inline-block;
}

.ranch-button:hover {
    background-color: #6a4e2e;
}
    </style>`;
});

// Step 4: Insert all <style> tags into the HTML document
styles.forEach(style => {
    mediaHTML += `<style>${style.innerHTML}</style>`;
});

mediaHTML += '</head><body><center>';

// Step 5: Insert all images into the HTML document with download links
mediaHTML += '<h1><u>Images</u></h1>';
images.forEach(img => {
    const src = img.src;
    const alt = img.alt || 'Image';  // Fallback if alt is missing
    mediaHTML += `<br><hr><br><a href="${src}" download><img src="${src}" alt="${alt}" /><br>Download ${alt}</a><br>`;
});

// Step 6: Insert all videos into the HTML document
mediaHTML += '<h1><u>Videos</u></h1>';
videos.forEach(video => {
    const src = video.src;
    if (src) {
        mediaHTML += `<br><hr><br><video controls><source src="${src}" type="video/mp4">Your browser does not support the video tag.</video><br>`;
    } else {
        // For videos with multiple sources
        const sources = video.querySelectorAll('source');
        if (sources.length > 0) {
            mediaHTML += '<video controls>';
            sources.forEach(source => {
                mediaHTML += `<source src="${source.src}" type="${source.type}">`;
            });
            mediaHTML += 'Your browser does not support the video tag.</video><br>';
        }
    }
});

// Step 7: Insert all audio files into the HTML document
mediaHTML += '<h1><u>Audio</u></h1>';
audios.forEach(audio => {
    const src = audio.src;
    if (src) {
        mediaHTML += `<br><hr><br><audio controls><source src="${src}" type="audio/mpeg">Your browser does not support the audio element.</audio><br>`;
    } else {
        const sources = audio.querySelectorAll('source');
        if (sources.length > 0) {
            mediaHTML += '<audio controls>';
            sources.forEach(source => {
                mediaHTML += `<source src="${source.src}" type="${source.type}">`;
            });
            mediaHTML += 'Your browser does not support the audio element.</audio><br>';
        }
    }
});

// Step 8: Close the HTML
mediaHTML += '</center></body></html>';

// Step 9: Create and download the HTML document
const blob = new Blob([mediaHTML], { type: 'text/html' });
const url = URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = 'YouTube-WAutscher.html';
a.click();
URL.revokeObjectURL(url);

console.log("The file 'Web-Media.html' has been created and downloaded.");
