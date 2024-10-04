function authenticateUser() {
  // Werte aus den Feldern
  var username = document.getElementById('username').value;
  var password = document.getElementById('password').value;

  // Überprüfen der Anmeldedaten
  if (username === 'WLC_Admin' && password === 'Ws8tjrzt1993.') {
      // Erfolg: Spielstart-Button anzeigen
      window.location.href = 'editor.html'; // Ersetze 'neue-seite.html' durch die gewünschte URL
      document.getElementById('error-message').style.display = 'none';
  } else {
      // Fehler: Fehlermeldung anzeigen
      document.getElementById('error-message').style.display = 'block';
      document.getElementById('fail').style.display = 'inline-block';
  }
}

function logout() {
  // Benachrichtigung
  alert('Du wurdest ausgeloggt. Deine gespeicherten Daten wurden gelöscht.');
  window.location.href = 'steamstart.html';
}

document.addEventListener('DOMContentLoaded', function () {
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const loginForm = document.getElementById('loginForm');
    const logoutButton = document.getElementById('logoutButton');
  
    // Überprüfe, ob Benutzerdaten im localStorage vorhanden sind
    if (localStorage.getItem('username') && localStorage.getItem('password')) {
      usernameInput.value = localStorage.getItem('username');
      passwordInput.value = localStorage.getItem('password');
      loginForm.classList.add('hidden'); // Versteckt das Login-Formular
      logoutButton.classList.remove('hidden'); // Zeigt den Logout-Button
    }
  
    // Login-Formular-Submit Event
    loginForm.addEventListener('submit', function (e) {
      e.preventDefault();
  
      const username = usernameInput.value;
      const password = passwordInput.value;
    
      // Speichere die Anmeldedaten im localStorage
      localStorage.setItem('username', username);
      localStorage.setItem('password', password);
    
      alert('Anmeldung erfolgreich! Deine Daten wurden gespeichert.');
      loginForm.classList.add('hidden'); // Versteckt das Login-Formular
      logoutButton.classList.remove('hidden'); // Zeigt den Logout-Button
    });
  
    // Logout-Button-Click Event
    logoutButton.addEventListener('click', function () {
      window.location.href = 'index.html';
  
      alert('Du wurdest ausgeloggt. Deine gespeicherten Daten wurden gelöscht.');
        loginForm.classList.remove('hidden'); // Zeigt das Login-Formular wieder an
        logoutButton.classList.add('hidden'); // Versteckt den Logout-Button
    });
  });
    