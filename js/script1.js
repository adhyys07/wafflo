class MP3Player {
    constructor() {
        this.audio = document.getElementById('audioPlayer');
        this.playPauseBtn = document.getElementById('playPauseBtn');
        this.prevBtn = document.getElementById('prevBtn');
        this.nextBtn = document.getElementById('nextBtn');
        this.progress = document.getElementById('progress');
        this.progressBar = document.querySelector('.progress-bar');
        this.currentTimeEl = document.getElementById('currentTime');
        this.durationEl = document.getElementById('duration');
        this.volumeSlider = document.getElementById('volumeSlider');
        this.fileInput = document.getElementById('fileInput');
        this.songTitle = document.getElementById('songTitle');
        this.artist = document.getElementById('artist');
        this.albumArt = document.getElementById('albumArt');
        this.playlistItems = document.getElementById('playlistItems');
        this.favouritePicksBtn = document.getElementById('favouritePicksBtn');
        
        this.playlist = [];
        this.favourites = JSON.parse(localStorage.getItem('favouriteSongs')) || [];
        this.currentSongIndex = 0;
        this.isPlaying = false;
        this.isDragging = false;
        this.showingFavourites = false;
        
        this.initializeEventListeners();
        this.setVolume(50);
    }
    
    initializeEventListeners() {
        // Play/Pause button
        this.playPauseBtn.addEventListener('click', () => this.togglePlayPause());
        
        // Previous/Next buttons
        this.prevBtn.addEventListener('click', () => this.previousSong());
        this.nextBtn.addEventListener('click', () => this.nextSong());
        
        // File input
        this.fileInput.addEventListener('change', (e) => this.handleFileSelect(e));
        
        // Volume control
        this.volumeSlider.addEventListener('input', (e) => this.setVolume(e.target.value));
        
        // Favourite picks button
        this.favouritePicksBtn.addEventListener('click', () => this.toggleFavouritePicks());
        
        // Progress bar
        this.progressBar.addEventListener('mousedown', (e) => this.startDragging(e));
        this.progressBar.addEventListener('click', (e) => this.setProgress(e));
        
        document.addEventListener('mousemove', (e) => this.handleDragging(e));
        document.addEventListener('mouseup', () => this.stopDragging());
        
        // Audio events
        this.audio.addEventListener('loadedmetadata', () => this.updateDuration());
        this.audio.addEventListener('timeupdate', () => this.updateProgress());
        this.audio.addEventListener('ended', () => this.nextSong());
        this.audio.addEventListener('loadstart', () => this.showLoading());
        this.audio.addEventListener('canplay', () => this.hideLoading());
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleKeyboard(e));
    }
    
    handleFileSelect(event) {
        const files = Array.from(event.target.files);
        this.playlist = [];
        
        files.forEach((file, index) => {
            if (file.type.startsWith('audio/')) {
                const url = URL.createObjectURL(file);
                const song = {
                    name: file.name.replace('.mp3', '').replace('.mpeg', ''),
                    artist: 'Unknown Artist',
                    url: url,
                    file: file
                };
                this.playlist.push(song);
            }
        });
        
        if (this.playlist.length > 0) {
            this.currentSongIndex = 0;
            this.loadSong(this.currentSongIndex);
            this.updatePlaylist();
        }
    }
    
    loadSong(index) {
        if (index < 0 || index >= this.playlist.length) return;
        
        const song = this.playlist[index];
        this.audio.src = song.url;
        this.songTitle.textContent = song.name;
        
        // Update active playlist item
        this.updateActivePlaylistItem(index);
        
        // Reset progress
        this.progress.style.width = '0%';
        this.currentTimeEl.textContent = '0:00';
    }
    
    togglePlayPause() {
        if (this.playlist.length === 0) {
            alert('Please select MP3 files first!');
            return;
        }
        
        if (this.isPlaying) {
            this.pause();
        } else {
            this.play();
        }
    }
    
    play() {
        this.audio.play().then(() => {
            this.isPlaying = true;
            this.playPauseBtn.innerHTML = '<i class="fas fa-pause"></i>';
            this.albumArt.parentElement.classList.add('playing');
        }).catch(error => {
            console.error('Error playing audio:', error);
        });
    }
    
    pause() {
        this.audio.pause();
        this.isPlaying = false;
        this.playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
        this.albumArt.parentElement.classList.remove('playing');
    }
    
    previousSong() {
        if (this.playlist.length === 0) return;
        
        this.currentSongIndex = (this.currentSongIndex - 1 + this.playlist.length) % this.playlist.length;
        this.loadSong(this.currentSongIndex);
        
        if (this.isPlaying) {
            this.play();
        }
    }
    
    nextSong() {
        if (this.playlist.length === 0) return;
        
        this.currentSongIndex = (this.currentSongIndex + 1) % this.playlist.length;
        this.loadSong(this.currentSongIndex);
        
        if (this.isPlaying) {
            this.play();
        }
    }
    
    setVolume(value) {
        this.audio.volume = value / 100;
        this.volumeSlider.value = value;
    }
    
    startDragging(event) {
        this.isDragging = true;
        this.setProgress(event);
    }
    
    handleDragging(event) {
        if (this.isDragging) {
            this.setProgress(event);
        }
    }
    
    stopDragging() {
        this.isDragging = false;
    }
    
    setProgress(event) {
        const rect = this.progressBar.getBoundingClientRect();
        const percent = (event.clientX - rect.left) / rect.width;
        const newTime = percent * this.audio.duration;
        
        if (isFinite(newTime)) {
            this.audio.currentTime = newTime;
            this.updateProgress();
        }
    }
    
    updateProgress() {
        if (this.isDragging) return;
        
        const percent = (this.audio.currentTime / this.audio.duration) * 100;
        this.progress.style.width = `${percent || 0}%`;
        this.currentTimeEl.textContent = this.formatTime(this.audio.currentTime);
    }
    
    updateDuration() {
        this.durationEl.textContent = this.formatTime(this.audio.duration);
    }
    
    formatTime(seconds) {
        if (isNaN(seconds) || !isFinite(seconds)) return '0:00';
        
        const minutes = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${minutes}:${secs.toString().padStart(2, '0')}`;
    }
    
    updatePlaylist() {
        this.playlistItems.innerHTML = '';
        
        const songsToShow = this.showingFavourites ? this.favourites : this.playlist;
        
        songsToShow.forEach((song, index) => {
            const li = document.createElement('li');
            li.innerHTML = `
                <span class="song-name">${song.name}</span>
                <div class="song-actions">
                    <button class="heart-btn ${this.isFavourite(song) ? 'active' : ''}" onclick="player.toggleFavourite(${this.showingFavourites ? this.getOriginalIndex(song) : index})">
                        <i class="fas fa-heart"></i>
                    </button>
                </div>
            `;
            li.addEventListener('click', (e) => {
                if (e.target.closest('.heart-btn')) return;
                const actualIndex = this.showingFavourites ? this.getOriginalIndex(song) : index;
                this.currentSongIndex = actualIndex;
                this.loadSong(actualIndex);
                if (this.isPlaying) {
                    this.play();
                }
            });
            this.playlistItems.appendChild(li);
        });
        
        // If no songs, show a message
        if (songsToShow.length === 0) {
            const li = document.createElement('li');
            li.textContent = this.showingFavourites ? 'No favourite songs yet.' : 'No songs in playlist.';
            li.style.color = '#00ff41';
            this.playlistItems.appendChild(li);
        }
        
        this.updateActivePlaylistItem(this.currentSongIndex);
    }
    
    toggleFavouritePicks() {
        this.showingFavourites = !this.showingFavourites;
        
        if (this.showingFavourites) {
            this.favouritePicksBtn.innerHTML = '<i class="fas fa-list"></i> All Songs';
            this.favouritePicksBtn.style.background = 'rgba(255, 107, 107, 0.2)';
        } else {
            this.favouritePicksBtn.innerHTML = '<i class="fas fa-heart"></i> Favourite Picks';
            this.favouritePicksBtn.style.background = 'rgba(255, 255, 255, 0.15)';
        }
        
        this.updatePlaylist();
    }
    
    toggleFavourite(songIndex) {
        const song = this.playlist[songIndex];
        const existingIndex = this.favourites.findIndex(fav => fav.name === song.name);
        if (existingIndex > -1) {
            this.favourites.splice(existingIndex, 1);
        } else {
            this.favourites.push({ name: song.name }); // Only store the name
        }
        localStorage.setItem('favouriteSongs', JSON.stringify(this.favourites));
        this.updatePlaylist();
    }
    
    isFavourite(song) {
        return this.favourites.some(fav => fav.name === song.name);
    }
    
    getOriginalIndex(song) {
        return this.playlist.findIndex(playlistSong => playlistSong.name === song.name);
    }
    
    updateActivePlaylistItem(activeIndex) {
        const items = this.playlistItems.querySelectorAll('li');
        items.forEach((item, index) => {
            if (index === activeIndex) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });
    }
    
    showLoading() {
        // Do not overwrite the song title with 'Loading...'
    }
    
    hideLoading() {
        // Loading complete - metadata should be updated
    }
    
    handleKeyboard(event) {
        // Prevent conflicts when typing in input fields
        if (event.target.tagName === 'INPUT') return;
        
        switch(event.code) {
            case 'Space':
                event.preventDefault();
                this.togglePlayPause();
                break;
            case 'ArrowLeft':
                event.preventDefault();
                this.previousSong();
                break;
            case 'ArrowRight':
                event.preventDefault();
                this.nextSong();
                break;
            case 'ArrowUp':
                event.preventDefault();
                this.setVolume(Math.min(100, this.audio.volume * 100 + 10));
                break;
            case 'ArrowDown':
                event.preventDefault();
                this.setVolume(Math.max(0, this.audio.volume * 100 - 10));
                break;
        }
    }
}

// Initialize the MP3 player when the page loads
document.addEventListener('DOMContentLoaded', () => {
    window.player = new MP3Player();
});

// Add some utility functions for enhanced functionality
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// Add service worker registration for PWA capabilities (optional)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('SW registered: ', registration);
            })
            .catch(registrationError => {
                console.log('SW registration failed: ', registrationError);
            });
    });
}

// Update song title when a file is selected
function updateSongInfo(fileName) {
    document.getElementById('songTitle').textContent = fileName;
}

document.getElementById('fileInput').addEventListener('change', function(event) {
    const files = event.target.files;
    if (files.length > 0) {
        const fileName = files[0].name;
        updateSongInfo(fileName);
    }
});
