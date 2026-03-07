const searchInput = document.querySelector('.zaza');
const resultsContainer = document.querySelector('.new');
const searchResultsSection = document.getElementById('searchResultsSection');
const previewAudio = new Audio();

const playerTitle = document.querySelector('.player-title');
const playerArtist = document.querySelector('.player-artist');
const playerArtwork = document.querySelector('.player-artwork');
const playerPlayPauseBtn = document.getElementById('playerPlayPause');
const playerPlayPauseIcon = playerPlayPauseBtn && playerPlayPauseBtn.querySelector('i');
const playerProgressFill = document.querySelector('.player-progress-fill');

let currentPreviewUrl = null;
let currentTrackDurationMs = 0;
const API_BASE = 'https://itunes.apple.com/search';

if (searchInput && resultsContainer) {
  let debounceTimeout = null;

  searchInput.addEventListener('input', () => {
    const query = searchInput.value.trim();
    clearTimeout(debounceTimeout);

    if (query.length < 2) {
      resultsContainer.innerHTML = '';
      if (searchResultsSection) searchResultsSection.classList.remove('is-visible');
      return;
    }

    debounceTimeout = setTimeout(() => fetchMusic(query), 400);
  });

  async function fetchMusic(query) {
    if (searchResultsSection) searchResultsSection.classList.add('is-visible');
    resultsContainer.innerHTML = '<p class="search-loading">Searching…</p>';

    try {
      const res = await fetch(
        `${API_BASE}?term=${encodeURIComponent(query)}&entity=song&limit=20`
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      renderResults(data.results || []);
    } catch (e) {
      console.error(e);
      resultsContainer.innerHTML =
        '<p class="search-error">Failed to load music. Please try again.</p>';
    }
  }

  function renderResults(tracks) {
    if (!tracks.length) {
      resultsContainer.innerHTML =
        '<p class="search-empty">No results found. Try another search.</p>';
      return;
    }

    resultsContainer.innerHTML = tracks
      .map((track) => {
        const artwork =
          track.artworkUrl100 || 'https://via.placeholder.com/100x100?text=No+Image';
        const title = track.trackName || 'Unknown Title';
        const artist = track.artistName || 'Unknown Artist';
        const album = track.collectionName || '';
        const previewUrl = track.previewUrl || '';
        const durationMs = track.trackTimeMillis || 0;

        return `
          <div class="duu track-card" data-preview="${previewUrl}" data-duration-ms="${durationMs}">
            <img class="hiphop" src="${artwork}" alt="${title}">
            <h1>${title}</h1>
            <h2>${artist}${album ? ' • ' + album : ''}</h2>
          </div>
        `;
      })
      .join('');
  }

  resultsContainer.addEventListener('click', (event) => {
    const card = event.target.closest('.duu');
    if (!card) return;

    const previewUrl = card.dataset.preview;
    if (!previewUrl) return;

    currentTrackDurationMs = parseInt(card.dataset.durationMs, 10) || 0;

    const imgEl = card.querySelector('img');
    const titleEl = card.querySelector('h1');
    const artistEl = card.querySelector('h2');

    const artworkSrc =
      (imgEl && imgEl.getAttribute('src')) || 'https://via.placeholder.com/60x60?text=♪';
    const titleText = (titleEl && titleEl.textContent) || 'Unknown Title';
    const artistText = (artistEl && artistEl.textContent) || 'Unknown Artist';

    if (currentPreviewUrl === previewUrl && !previewAudio.paused) {
      previewAudio.pause();
      return;
    }

    currentPreviewUrl = previewUrl;
    previewAudio.src = previewUrl;

    if (playerArtwork) playerArtwork.src = artworkSrc;
    if (playerTitle) playerTitle.textContent = titleText;
    if (playerArtist) playerArtist.textContent = artistText;

    previewAudio.play().then(updatePlayPauseIcon).catch(console.error);
  });

  if (playerPlayPauseBtn) {
    playerPlayPauseBtn.addEventListener('click', () => {
      if (!currentPreviewUrl) return;

      if (previewAudio.paused) {
        previewAudio.play().then(updatePlayPauseIcon).catch(console.error);
      } else {
        previewAudio.pause();
        updatePlayPauseIcon();
      }
    });
  }

  previewAudio.addEventListener('timeupdate', () => {
    if (!playerProgressFill) return;
    const fullSec = currentTrackDurationMs / 1000;
    const duration = fullSec > 0 ? fullSec : (previewAudio.duration || 0);
    if (!duration || isNaN(duration)) return;
    const percent = Math.min(100, (previewAudio.currentTime / duration) * 100);
    playerProgressFill.style.width = `${percent}%`;
  });

  previewAudio.addEventListener('play', updatePlayPauseIcon);
  previewAudio.addEventListener('pause', updatePlayPauseIcon);
  previewAudio.addEventListener('ended', () => {
    if (playerProgressFill) playerProgressFill.style.width = '0%';
    updatePlayPauseIcon();
  });
}

function updatePlayPauseIcon() {
  if (!playerPlayPauseIcon) return;
  if (previewAudio.paused) {
    playerPlayPauseIcon.classList.remove('fa-pause');
    playerPlayPauseIcon.classList.add('fa-play');
  } else {
    playerPlayPauseIcon.classList.remove('fa-play');
    playerPlayPauseIcon.classList.add('fa-pause');
  }
}
