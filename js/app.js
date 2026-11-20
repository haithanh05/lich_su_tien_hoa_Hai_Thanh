/**
 * LỊCH SỬ TIẾN HÓA CỦA HẢI THÀNH (2007 - 2026)
 * Senior Frontend Core Application Script (Vanilla JavaScript)
 */

(function () {
  'use strict';

  // State Management
  const state = {
    data: null,
    currentFilter: 'all', // 'all' | 'photos' | 'quotes'
    currentAudio: null,
    currentAudioBtn: null,
    currentVinyl: null,
    currentStageForModal: null,
    currentModalMonth: 'all',
    bgMusic: {
      playlist: [],
      currentIndex: 0,
      audio: new Audio(),
      isPlaying: true,
      isUserMuted: false
    },
    lightbox: {
      images: [],
      currentIndex: 0,
      memory: null,
      isZoomed: false
    },
    game: {
      pool: [],
      questions: [],
      currentIndex: 0,
      score: 0,
      hasAnswered: false
    },
    cinema: {
      slides: [],
      currentIndex: 0,
      isPlaying: false,
      isMuted: false,
      timer: null,
      elapsedMs: 0,
      slideDurationMs: 5000,
      currentTrackSrc: null
    }
  };

  // Helper: Format Seconds to MM:SS
  function formatTime(seconds) {
    if (isNaN(seconds) || seconds < 0) return '00:00';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }

  // Helper: Generate Golden Stars SVG (supports half star 0.5)
  function renderStars(rating) {
    const maxStars = 5;
    const num = typeof rating === 'number' ? rating : parseFloat(rating) || 0;
    let html = '<div class="star-rating-box" title="' + num + ' / 5 sao">';

    for (let i = 1; i <= maxStars; i++) {
      if (num >= i) {
        // Full star
        html += `
          <svg class="star-icon full" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
          </svg>`;
      } else if (num >= i - 0.5) {
        // Half star
        html += `
          <svg class="star-icon half" viewBox="0 0 24 24">
            <defs>
              <linearGradient id="half-star-${i}">
                <stop offset="50%" stop-color="#fbbf24"/>
                <stop offset="50%" stop-color="rgba(255, 255, 255, 0.15)"/>
              </linearGradient>
            </defs>
            <path fill="url(#half-star-${i})" d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
          </svg>`;
      } else {
        // Empty star
        html += `
          <svg class="star-icon empty" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
          </svg>`;
      }
    }
    html += '</div>';
    return html;
  }

  // ========================================================
  // 1. INITIALIZATION & DATA BINDING
  // ========================================================
  function init() {
    if (!window.MEMORIES_DATA) {
      console.error('Không tìm thấy dữ liệu MEMORIES_DATA trong window!');
      return;
    }

    state.data = window.MEMORIES_DATA;

    initHeroSection();
    initStickyNav();
    initThemeSwitcher();
    initAchievements();
    renderStages();
    updateFilterCounts();
    initTimeCapsule();
    initTicketStation();
    initBackgroundMusic();
    bindGlobalEvents();
  }

  // ========================================================
  // 2. HERO SECTION SETUP
  // ========================================================
  function initHeroSection() {
    const { siteInfo, stats, stages } = state.data;

    // Site Title & Intro
    if (siteInfo.title.includes('Lịch Sử Tiến Hóa')) {
      document.getElementById('hero-title').innerHTML = `Lịch Sử <span class="text-gradient">${siteInfo.title.replace('Lịch Sử ', '')}</span>`;
    } else {
      document.getElementById('hero-title').innerHTML = `Bảo Tàng <span class="text-gradient">${siteInfo.title.replace('Bảo Tàng ', '')}</span>`;
    }
    document.getElementById('hero-intro').textContent = siteInfo.intro;

    // Genesis Image & Texts
    const genesisImg = document.getElementById('genesis-img');
    genesisImg.src = siteInfo.heroImage;
    genesisImg.alt = siteInfo.heroTitle;
    document.getElementById('genesis-title').textContent = siteInfo.heroTitle;
    document.getElementById('genesis-description').textContent = `"${siteInfo.heroDescription}"`;

    // 3D Flip Card Toggle
    const genesisCard = document.getElementById('genesis-card');
    const btnFlipBack = document.getElementById('btn-flip-back');
    const btnOpenInfo = document.getElementById('btn-open-genesis-info');

    genesisCard.addEventListener('click', function (e) {
      if (e.target.id === 'btn-flip-back') return;
      genesisCard.classList.toggle('flipped');
    });

    btnFlipBack.addEventListener('click', function (e) {
      e.stopPropagation();
      genesisCard.classList.remove('flipped');
    });

    btnOpenInfo.addEventListener('click', function () {
      genesisCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setTimeout(() => {
        genesisCard.classList.add('flipped');
      }, 400);
    });

    // Keyboard accessibility for 3D flip card
    genesisCard.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        genesisCard.classList.toggle('flipped');
      }
    });

    // Stats Bar
    document.getElementById('stat-stages').textContent = stats.totalStages;
    document.getElementById('stat-images').textContent = `${stats.totalImages}+`;
    document.getElementById('stat-years').textContent = stats.yearSpan;
    document.getElementById('stat-highlights').textContent = stats.totalHighlights;

    // Chapter Select Chips in Hero
    const chipsRow = document.getElementById('hero-chapter-chips');
    chipsRow.innerHTML = '';

    stages.forEach(stage => {
      const chip = document.createElement('a');
      chip.className = 'hero-chip-card';
      chip.href = `#stage-${stage.id}`;
      
      const levelShort = stage.level.split('-')[0].trim();

      chip.innerHTML = `
        <span class="hero-chip-period">${stage.period}</span>
        <span class="hero-chip-title">${stage.title.replace('Giai đoạn ', '')}</span>
        <span class="hero-chip-level">${levelShort}</span>
      `;
      chipsRow.appendChild(chip);
    });
  }

  // ========================================================
  // 3. STICKY TOP NAV & SCROLL SPY
  // ========================================================
  function initStickyNav() {
    const navBar = document.getElementById('nav-chapters-bar');
    navBar.innerHTML = '';

    state.data.stages.forEach(stage => {
      const chip = document.createElement('a');
      chip.className = 'nav-chip';
      chip.href = `#stage-${stage.id}`;
      chip.dataset.stageId = stage.id;
      chip.textContent = stage.period;
      navBar.appendChild(chip);
    });

    // Scroll Progress & Active Chapter Tracking
    const scrollLine = document.getElementById('scroll-progress');
    const navChips = navBar.querySelectorAll('.nav-chip');

    window.addEventListener('scroll', () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
      scrollLine.style.width = `${progress}%`;

      // Determine active section
      const stageSections = document.querySelectorAll('.stage-section');
      let currentSectionId = '';

      stageSections.forEach(sec => {
        const top = sec.offsetTop - 120;
        const height = sec.offsetHeight;
        if (scrollTop >= top && scrollTop < top + height) {
          currentSectionId = sec.id.replace('stage-', '');
        }
      });

      navChips.forEach(chip => {
        if (chip.dataset.stageId === currentSectionId) {
          chip.classList.add('active');
        } else {
          chip.classList.remove('active');
        }
      });
    }, { passive: true });
  }

  // ========================================================
  // 4. RENDER STAGES, RPG CARDS, MUSIC PLAYERS & HIGHLIGHTS
  // ========================================================
  function renderStages() {
    const container = document.getElementById('stages-container');
    container.innerHTML = '';

    state.data.stages.forEach((stage, index) => {
      const section = document.createElement('section');
      section.className = 'stage-section';
      section.id = `stage-${stage.id}`;

      const stageNumber = (index + 1).toString().padStart(2, '0');
      const totalStages = state.data.stages.length.toString().padStart(2, '0');

      // Top Header Block
      let html = `
        <div class="container">
          <div class="stage-header-block">
            <span class="stage-index-tag">GIAI ĐOẠN ${stageNumber} / ${totalStages} &bull; ${stage.period}</span>
            <h2 class="stage-main-title">${stage.title}</h2>
            <div class="stage-reel-btn-wrap">
              <button class="btn-stage-reel" data-stage-id="${stage.id}" title="Phát phim kỷ niệm giai đoạn ${stage.period}">
                <span class="reel-icon">▶</span>
                <span>Phát phim giai đoạn này</span>
              </button>
            </div>
          </div>

          <!-- Stage RPG & Music Top Row -->
          <div class="stage-top-grid">
            
            <!-- RPG Character Profile Card -->
            <div class="rpg-card">
              <div class="rpg-header">
                <div class="rpg-avatar">
                  <img src="${stage.coverImage}" alt="${stage.title}" loading="lazy" onerror="this.src='images/Lúc nhỏ/IMG_0025_Original.JPG';">
                </div>
                <div class="rpg-title-group">
                  <span class="rpg-badge-tag">HỒ SƠ NHÂN VẬT RPG</span>
                  <h3 class="rpg-level-name">${stage.level}</h3>
                </div>
              </div>

              <div class="rpg-stats-container">
                <!-- Primary Stats (Progress Bars) -->
                <div class="rpg-stat-col">
                  <div class="rpg-stat-col-title">
                    <span>⚡ Chỉ số chính</span>
                  </div>
                  <div class="stat-bar-group">
      `;

      // Main stats rendering
      const barColors = ['fill-emerald', 'fill-cyan', 'fill-gold', 'fill-violet'];
      stage.mainStats.forEach((stat, sIdx) => {
        const colorClass = barColors[sIdx % barColors.length];
        html += `
          <div class="stat-bar-item">
            <div class="stat-bar-labels">
              <span class="stat-bar-name">${stat.label}</span>
              <span class="stat-bar-val">${stat.value}%</span>
            </div>
            <div class="stat-progress-track">
              <div class="stat-progress-fill ${colorClass}" style="width: ${stat.value}%"></div>
            </div>
          </div>
        `;
      });

      html += `
                  </div>
                </div>

                <!-- Secondary Stats (Gold Stars) -->
                <div class="rpg-stat-col">
                  <div class="rpg-stat-col-title">
                    <span>⭐ Chỉ số phụ</span>
                  </div>
                  <div class="star-stat-group">
      `;

      stage.subStats.forEach(stat => {
        html += `
          <div class="star-stat-item">
            <span class="star-stat-name">${stat.label}</span>
            ${renderStars(stat.value)}
          </div>
        `;
      });

      html += `
                  </div>
                </div>
              </div>
            </div>

            <!-- Mini Vinyl Music Player -->
            <div class="music-player-card" data-stage-id="${stage.id}">
              <div class="player-header">
                <span class="player-badge">🎵 NHẠC CHỦ ĐỀ GIAI ĐOẠN</span>
                <span class="player-status-dot" id="dot-${stage.id}"></span>
              </div>

              <div class="player-body">
                <div class="vinyl-container">
                  <div class="vinyl-disc" id="vinyl-${stage.id}">
                    <div class="vinyl-center">
                      <div class="vinyl-hole"></div>
                    </div>
                  </div>
                </div>

                <div class="player-info">
                  <div class="track-label">Đang phát</div>
                  <div class="track-title" title="${stage.themeSong.title}">${stage.themeSong.title || 'Giai điệu hoài niệm'}</div>
                  
                  <div class="player-controls-row">
                    <button class="play-toggle-btn" id="play-btn-${stage.id}" aria-label="Phát nhạc">
                      <span class="play-icon">▶</span>
                    </button>
                    
                    <div class="audio-progress-wrap">
                      <div class="audio-progress-bar" id="progress-bar-${stage.id}">
                        <div class="audio-progress-fill" id="progress-fill-${stage.id}"></div>
                      </div>
                      <div class="audio-time-row">
                        <span id="time-curr-${stage.id}">00:00</span>
                        <span id="time-dur-${stage.id}">--:--</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Hidden Audio Element -->
              <audio id="audio-${stage.id}" preload="none">
                <source src="${encodeURI(stage.themeSong.src)}" type="audio/mpeg">
              </audio>
            </div>

          </div>

          <!-- Highlight Memories Section (Max 3-5 highlights) -->
          <div class="stage-highlights-section">
            <div class="highlights-title-row">
              <h3 class="highlights-title">
                <span>✨ Kỷ niệm điểm nhấn</span>
              </h3>
              <span class="highlights-desc">Các khoảnh khắc nổi bật &amp; tâm sự sâu lắng</span>
            </div>

            <div class="highlights-grid" id="highlights-grid-${stage.id}">
      `;

      // Filter highlights (max 3-5 highlights)
      const highlights = stage.memories.filter(m => m.isHighlight).slice(0, 5);

      highlights.forEach(mem => {
        html += renderMemoryCardHTML(mem);
      });

      html += `
            </div>
          </div>

          <!-- Bottom CTA: View Full Stage Archive -->
          <div class="stage-archive-row">
            <button class="btn-open-archive" data-stage-id="${stage.id}">
              <span class="archive-icon">🎞️</span>
              <span>Xem toàn bộ kỷ niệm giai đoạn ${stage.period} (${stage.memories.length} khoảnh khắc)</span>
            </button>
          </div>

        </div>
      `;

      section.innerHTML = html;
      container.appendChild(section);

      // Attach Music Player Events for this stage
      setupStageAudioPlayer(stage.id);
    });

    // Attach Event Listeners to Memory Cards (Lightbox triggers)
    attachMemoryCardEvents();

    // Attach Event Listeners to "View Full Stage Archive" buttons
    attachArchiveButtons();

    // Attach Event Listeners to Stage Reel buttons
    attachStageReelButtons();
  }

  // ========================================================
  // 5. MEMORY CARD HTML BUILDER (Photo / Stack / Quote)
  // ========================================================
  function renderMemoryCardHTML(mem) {
    const imgList = mem.image || [];
    const hasImages = imgList.length > 0;
    const isMultiImage = imgList.length >= 2;

    // Type 1: Quote Card (No image -> Warm Paper Journal Card)
    if (!hasImages) {
      return `
        <div class="memory-card card-quote" data-type="quote" data-id="${mem.id}">
          <div>
            <div class="quote-top-row">
              <span class="quote-tag">${mem.tag || 'Tâm sự'}</span>
              <span class="quote-time">${mem.time}</span>
            </div>
            <h4 class="quote-heading">${mem.title}</h4>
            <p class="quote-content">"${mem.description}"</p>
          </div>
          <div class="quote-footer">
            <span class="quote-author">Trang nhật ký</span>
            <span class="quote-symbol">✒️</span>
          </div>
        </div>
      `;
    }

    // Type 2: Photo Stack Card (2 or more images)
    if (isMultiImage) {
      const extraCount = imgList.length - 1;
      const focalStyle = mem.focalPoint ? `style="object-position: ${mem.focalPoint};"` : '';
      return `
        <div class="memory-card card-stack" data-type="photo" data-id="${mem.id}">
          <div class="stack-wrapper" data-memory-id="${mem.id}">
            <div class="stack-badge">+${extraCount} ảnh</div>
            <span class="card-tag-badge">${mem.tag || 'Kỷ niệm'}</span>

            <!-- Stack Layers -->
            <div class="stack-layer stack-layer-1">
              <img src="${imgList[1]}" alt="${mem.title}" loading="lazy" ${focalStyle}>
            </div>
            ${imgList.length > 2 ? `
              <div class="stack-layer stack-layer-2">
                <img src="${imgList[2]}" alt="${mem.title}" loading="lazy" ${focalStyle}>
              </div>
            ` : ''}
            <div class="stack-layer stack-layer-main">
              <img src="${imgList[0]}" alt="${mem.title}" loading="lazy" ${focalStyle}>
            </div>
          </div>

          <div class="card-body-content">
            <div class="card-time-text">${mem.time}</div>
            <h4 class="card-heading">${mem.title}</h4>
            <p class="card-note-text">${mem.description || 'Bộ ảnh kỷ niệm đặc biệt.'}</p>
          </div>
        </div>
      `;
    }

    // Type 3: Standard Single Photo Card
    const focalStyle = mem.focalPoint ? `style="object-position: ${mem.focalPoint};"` : '';
    return `
      <div class="memory-card card-photo" data-type="photo" data-id="${mem.id}">
        <div class="card-img-container" data-memory-id="${mem.id}">
          <span class="card-tag-badge">${mem.tag || 'Khoảnh khắc'}</span>
          <img src="${imgList[0]}" alt="${mem.title}" loading="lazy" ${focalStyle}>
        </div>
        <div class="card-body-content">
          <div class="card-time-text">${mem.time}</div>
          <h4 class="card-heading">${mem.title}</h4>
          ${mem.description ? `<p class="card-note-text">${mem.description}</p>` : ''}
        </div>
      </div>
    `;
  }

  // ========================================================
  // 6. AUDIO PLAYER LOGIC
  // ========================================================
  function setupStageAudioPlayer(stageId) {
    const audio = document.getElementById(`audio-${stageId}`);
    const playBtn = document.getElementById(`play-btn-${stageId}`);
    const vinyl = document.getElementById(`vinyl-${stageId}`);
    const dot = document.getElementById(`dot-${stageId}`);
    const progressBar = document.getElementById(`progress-bar-${stageId}`);
    const progressFill = document.getElementById(`progress-fill-${stageId}`);
    const timeCurr = document.getElementById(`time-curr-${stageId}`);
    const timeDur = document.getElementById(`time-dur-${stageId}`);

    if (!audio || !playBtn) return;

    // Handle duration loaded
    audio.addEventListener('loadedmetadata', () => {
      timeDur.textContent = formatTime(audio.duration);
    });

    // Time update & Progress fill
    audio.addEventListener('timeupdate', () => {
      if (audio.duration) {
        const pct = (audio.currentTime / audio.duration) * 100;
        progressFill.style.width = `${pct}%`;
        timeCurr.textContent = formatTime(audio.currentTime);
      }
    });

    // Audio Ended
    audio.addEventListener('ended', () => {
      resetPlayerUI(playBtn, vinyl, dot, progressFill, timeCurr);
      state.currentAudio = null;
      if (state.bgMusic && !state.bgMusic.isUserMuted) {
        playBgMusic();
      }
    });

    // Audio Error Handling (Graceful fallback)
    audio.addEventListener('error', () => {
      console.warn(`File nhạc cho giai đoạn ${stageId} không thể tải hoặc chưa tồn tại.`);
      playBtn.style.opacity = '0.5';
      playBtn.style.cursor = 'not-allowed';
      playBtn.title = 'File nhạc đang được chuẩn bị';
    });

    // Click to Play/Pause
    playBtn.addEventListener('click', () => {
      if (audio.error) {
        alert('File nhạc cho giai đoạn này hiện đang được cập nhật.');
        return;
      }

      if (audio.paused) {
        // Stop background music
        pauseBgMusic(true);

        // Stop currently playing other audio if any
        if (state.currentAudio && state.currentAudio !== audio) {
          state.currentAudio.pause();
          if (state.currentAudioBtn && state.currentVinyl) {
            state.currentAudioBtn.innerHTML = '<span class="play-icon">▶</span>';
            state.currentVinyl.classList.remove('spinning');
            if (state.currentDot) state.currentDot.classList.remove('active');
          }
        }

        audio.play().then(() => {
          playBtn.innerHTML = '<span class="pause-icon">⏸</span>';
          vinyl.classList.add('spinning');
          dot.classList.add('active');

          state.currentAudio = audio;
          state.currentAudioBtn = playBtn;
          state.currentVinyl = vinyl;
          state.currentDot = dot;

          // Update sticky nav audio status
          const globalAudioBtn = document.getElementById('global-audio-toggle');
          if (globalAudioBtn) globalAudioBtn.classList.add('playing');
        }).catch(err => {
          console.warn('Playback error:', err);
        });
      } else {
        audio.pause();
        playBtn.innerHTML = '<span class="play-icon">▶</span>';
        vinyl.classList.remove('spinning');
        dot.classList.remove('active');
        state.currentAudio = null;

        const globalAudioBtn = document.getElementById('global-audio-toggle');
        if (globalAudioBtn) globalAudioBtn.classList.remove('playing');

        // Resume background music if not muted by user
        if (state.bgMusic && !state.bgMusic.isUserMuted) {
          playBgMusic();
        }
      }
    });

    // Scrub Progress Bar
    progressBar.addEventListener('click', (e) => {
      if (!audio.duration) return;
      const rect = progressBar.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const newPct = Math.max(0, Math.min(1, clickX / rect.width));
      audio.currentTime = newPct * audio.duration;
    });
  }

  function resetPlayerUI(btn, vinyl, dot, fill, curr) {
    btn.innerHTML = '<span class="play-icon">▶</span>';
    vinyl.classList.remove('spinning');
    dot.classList.remove('active');
    fill.style.width = '0%';
    curr.textContent = '00:00';
  }

  // ========================================================
  // 7. MEMORY CARD EVENTS & LIGHTBOX TRIGGER
  // ========================================================
  function attachMemoryCardEvents() {
    const cardTriggers = document.querySelectorAll('[data-memory-id]');

    cardTriggers.forEach(el => {
      el.addEventListener('click', () => {
        const memId = el.dataset.memoryId;
        const memory = findMemoryById(memId);
        if (memory && memory.image && memory.image.length > 0) {
          openLightbox(memory, 0);
        }
      });
    });
  }

  function findMemoryById(memId) {
    for (const stage of state.data.stages) {
      const found = stage.memories.find(m => m.id === memId);
      if (found) return found;
    }
    return null;
  }

  // ========================================================
  // 8. GLOBAL FILTER (Tất cả | Khoảnh khắc | Tâm sự)
  // ========================================================
  function updateFilterCounts() {
    let totalAll = 0;
    let totalPhotos = 0;
    let totalQuotes = 0;

    state.data.stages.forEach(st => {
      const hl = st.memories.filter(m => m.isHighlight).slice(0, 5);
      totalAll += hl.length;
      totalPhotos += hl.filter(m => m.image && m.image.length > 0).length;
      totalQuotes += hl.filter(m => !m.image || m.image.length === 0).length;
    });

    document.getElementById('filter-count-all').textContent = totalAll;
    document.getElementById('filter-count-photos').textContent = totalPhotos;
    document.getElementById('filter-count-quotes').textContent = totalQuotes;
  }

  function applyFilter(filterType) {
    state.currentFilter = filterType;

    // Update active tab buttons
    const tabs = document.querySelectorAll('.filter-tab');
    tabs.forEach(t => {
      if (t.dataset.filter === filterType) {
        t.classList.add('active');
        t.setAttribute('aria-selected', 'true');
      } else {
        t.classList.remove('active');
        t.setAttribute('aria-selected', 'false');
      }
    });

    // Show/hide cards
    const allCards = document.querySelectorAll('.memory-card');
    allCards.forEach(card => {
      const cardType = card.dataset.type; // 'photo' or 'quote'
      if (filterType === 'all') {
        card.style.display = 'flex';
      } else if (filterType === 'photos') {
        card.style.display = cardType === 'photo' ? 'flex' : 'none';
      } else if (filterType === 'quotes') {
        card.style.display = cardType === 'quote' ? 'flex' : 'none';
      }
    });
  }

  // ========================================================
  // 9. FILMSTRIP GRID MODAL (35mm Cuộn Phim Toàn Bộ Kỷ Niệm)
  // ========================================================
  function attachArchiveButtons() {
    const archiveBtns = document.querySelectorAll('.btn-open-archive');
    archiveBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const stageId = btn.dataset.stageId;
        openFilmstripModal(stageId);
      });
    });
  }

  function openFilmstripModal(stageId) {
    const stage = state.data.stages.find(s => s.id === stageId);
    if (!stage) return;

    state.currentStageForModal = stage;
    state.currentModalMonth = 'all';

    const modal = document.getElementById('filmstrip-modal');
    document.getElementById('modal-stage-title').textContent = stage.title;
    document.getElementById('modal-stage-subtitle').textContent = `Kho lưu trữ gồm ${stage.memories.length} khoảnh khắc & tư liệu`;

    // 1. Tự động tạm dừng các nhạc khác và phát nhạc chủ đề của giai đoạn (Nâng cấp 3)
    playStageAudio(stageId);

    // Build Month Filter Chips
    buildModalMonthChips(stage);

    // Render Filmstrip Grid items
    renderFilmstripGrid(stage, 'all');

    // Show Modal
    modal.classList.add('active');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function closeFilmstripModal() {
    const modal = document.getElementById('filmstrip-modal');
    modal.classList.remove('active');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';

    // Tạm dừng nhạc giai đoạn và khôi phục nhạc nền nếu có
    if (state.currentAudio) {
      state.currentAudio.pause();
      if (state.currentAudioBtn) state.currentAudioBtn.innerHTML = '<span class="play-icon">▶</span>';
      if (state.currentVinyl) state.currentVinyl.classList.remove('spinning');
      if (state.currentDot) state.currentDot.classList.remove('active');
      state.currentAudio = null;
      const globalAudioBtn = document.getElementById('global-audio-toggle');
      if (globalAudioBtn) globalAudioBtn.classList.remove('playing');
    }

    if (state.bgMusic && !state.bgMusic.isUserMuted) {
      playBgMusic();
    }
  }

  function buildModalMonthChips(stage) {
    const chipsContainer = document.getElementById('modal-month-chips');
    chipsContainer.innerHTML = '';

    // Collect distinct months present in this stage
    const monthsSet = new Set();
    let hasOther = false;

    stage.memories.forEach(m => {
      if (m.month !== null && m.month !== undefined) {
        monthsSet.add(m.month);
      } else {
        hasOther = true;
      }
    });

    const sortedMonths = Array.from(monthsSet).sort((a, b) => a - b);

    // 1. "Tất cả" chip
    const allChip = document.createElement('button');
    allChip.className = 'month-chip active';
    allChip.dataset.month = 'all';
    allChip.textContent = `Tất cả (${stage.memories.length})`;
    chipsContainer.appendChild(allChip);

    // 2. Month chips T1 - T12
    sortedMonths.forEach(mNum => {
      const count = stage.memories.filter(m => m.month === mNum).length;
      const chip = document.createElement('button');
      chip.className = 'month-chip';
      chip.dataset.month = mNum.toString();
      chip.textContent = `Tháng ${mNum} (${count})`;
      chipsContainer.appendChild(chip);
    });

    // 3. Other / Childhood chip if any
    if (hasOther) {
      const otherCount = stage.memories.filter(m => m.month === null || m.month === undefined).length;
      const otherChip = document.createElement('button');
      otherChip.className = 'month-chip';
      otherChip.dataset.month = 'other';
      otherChip.textContent = `Tuổi thơ / Khác (${otherCount})`;
      chipsContainer.appendChild(otherChip);
    }

    // Attach click events to month chips
    chipsContainer.querySelectorAll('.month-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        chipsContainer.querySelectorAll('.month-chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        state.currentModalMonth = chip.dataset.month;
        renderFilmstripGrid(stage, chip.dataset.month);
      });
    });
  }

  function renderFilmstripGrid(stage, monthFilter) {
    const grid = document.getElementById('modal-filmstrip-grid');
    const emptyState = document.getElementById('modal-empty-state');
    grid.innerHTML = '';

    let filtered = stage.memories;
    if (monthFilter === 'other') {
      filtered = stage.memories.filter(m => m.month === null || m.month === undefined);
    } else if (monthFilter !== 'all') {
      const targetMonth = parseInt(monthFilter, 10);
      filtered = stage.memories.filter(m => m.month === targetMonth);
    }

    if (filtered.length === 0) {
      emptyState.style.display = 'block';
      return;
    }
    emptyState.style.display = 'none';

    filtered.forEach((mem, idx) => {
      const frameNumber = (idx + 1).toString().padStart(2, '0');
      const frame = document.createElement('div');
      frame.className = 'film-frame';
      frame.dataset.memoryId = mem.id;

      const imgSource = (mem.image && mem.image.length > 0) 
        ? mem.image[0] 
        : 'images/Lúc nhỏ/IMG_0025_Original.JPG';

      const focalStyle = mem.focalPoint ? `style="object-position: ${mem.focalPoint};"` : '';

      frame.innerHTML = `
        <span class="film-number">#${frameNumber}</span>
        <div class="film-thumb-box">
          <img src="${imgSource}" alt="${mem.title}" loading="lazy" ${focalStyle} onerror="this.src='images/Lúc nhỏ/IMG_0025_Original.JPG';">
        </div>
        <div class="film-frame-info">
          <span class="film-frame-time">${mem.time}</span>
          <h5 class="film-frame-title">${mem.title}</h5>
        </div>
      `;

      frame.addEventListener('click', () => {
        if (mem.image && mem.image.length > 0) {
          openLightbox(mem, 0);
        }
      });

      grid.appendChild(frame);
    });
  }

  // ========================================================
  // 10. LIGHTBOX VIEWER
  // ========================================================
  function openLightbox(memory, startIndex) {
    if (!memory || !memory.image || memory.image.length === 0) return;

    state.lightbox.memory = memory;
    state.lightbox.images = memory.image;
    state.lightbox.currentIndex = startIndex || 0;
    state.lightbox.isZoomed = false;

    updateLightboxView();

    const modal = document.getElementById('lightbox-modal');
    modal.classList.add('active');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function updateLightboxView() {
    const { memory, images, currentIndex } = state.lightbox;
    const currentImgUrl = images[currentIndex];

    const imgEl = document.getElementById('lightbox-img');
    const counterEl = document.getElementById('lightbox-counter');
    const tagEl = document.getElementById('lightbox-tag');
    const titleEl = document.getElementById('lightbox-title');
    const descEl = document.getElementById('lightbox-desc');
    const timeEl = document.getElementById('lightbox-time');
    const thumbsContainer = document.getElementById('lightbox-thumbs');
    const prevBtn = document.getElementById('lightbox-btn-prev');
    const nextBtn = document.getElementById('lightbox-btn-next');
    const wrapper = document.getElementById('lightbox-img-wrapper');

    // Reset zoom
    wrapper.classList.remove('zoomed');
    state.lightbox.isZoomed = false;

    // Image & Counter
    imgEl.src = currentImgUrl;
    imgEl.alt = memory.title;
    counterEl.textContent = `${currentIndex + 1} / ${images.length}`;

    // Nav buttons visibility
    prevBtn.style.visibility = images.length > 1 ? 'visible' : 'hidden';
    nextBtn.style.visibility = images.length > 1 ? 'visible' : 'hidden';

    // Caption
    tagEl.textContent = memory.tag || 'Khoảnh khắc';
    titleEl.textContent = memory.title;
    descEl.textContent = memory.description || '';
    timeEl.textContent = memory.time;

    // Thumbnails
    thumbsContainer.innerHTML = '';
    if (images.length > 1) {
      images.forEach((imgUrl, idx) => {
        const thumb = document.createElement('div');
        thumb.className = `lightbox-thumb ${idx === currentIndex ? 'active' : ''}`;
        thumb.innerHTML = `<img src="${imgUrl}" alt="Thumb" loading="lazy">`;
        thumb.addEventListener('click', () => {
          state.lightbox.currentIndex = idx;
          updateLightboxView();
        });
        thumbsContainer.appendChild(thumb);
      });
    }
  }

  function closeLightbox() {
    const modal = document.getElementById('lightbox-modal');
    modal.classList.remove('active');
    modal.setAttribute('aria-hidden', 'true');
    // Only reset body overflow if filmstrip modal isn't also open
    const filmModal = document.getElementById('filmstrip-modal');
    if (!filmModal.classList.contains('active')) {
      document.body.style.overflow = '';
    }
  }

  function prevLightboxImage() {
    const { images, currentIndex } = state.lightbox;
    if (images.length <= 1) return;
    state.lightbox.currentIndex = (currentIndex - 1 + images.length) % images.length;
    updateLightboxView();
  }

  function nextLightboxImage() {
    const { images, currentIndex } = state.lightbox;
    if (images.length <= 1) return;
    state.lightbox.currentIndex = (currentIndex + 1) % images.length;
    updateLightboxView();
  }

  // ========================================================
  // 11. MINI-GAME: THỬ THÁCH ĐOÁN NĂM (GUESS THE YEAR)
  // ========================================================
  function shuffleArray(array) {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  function buildGameImagePool() {
    const pool = [];
    if (!state.data || !state.data.stages) return pool;

    state.data.stages.forEach(stage => {
      stage.memories.forEach(mem => {
        const imgs = mem.image || [];
        imgs.forEach(imgUrl => {
          if (imgUrl && typeof imgUrl === 'string') {
            pool.push({
              imageUrl: imgUrl,
              stageId: stage.id,
              stageTitle: stage.title,
              period: stage.period,
              title: mem.title || 'Khoảnh khắc kỷ niệm',
              time: mem.time || stage.period,
              description: mem.description || ''
            });
          }
        });
      });
    });

    return pool;
  }

  function startNewGame() {
    const pool = buildGameImagePool();
    if (pool.length < 4) {
      alert('Không đủ hình ảnh để bắt đầu trò chơi.');
      return;
    }

    // Pick 10 unique random images
    const shuffledPool = shuffleArray(pool);
    const questionsCount = Math.min(10, shuffledPool.length);
    state.game.questions = shuffledPool.slice(0, questionsCount);
    state.game.currentIndex = 0;
    state.game.score = 0;
    state.game.hasAnswered = false;

    // Reset UI screens
    document.getElementById('game-play-screen').style.display = 'flex';
    document.getElementById('game-result-screen').style.display = 'none';

    // Show Game Modal
    const modal = document.getElementById('game-modal');
    modal.classList.add('active');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';

    // Render Question 0
    renderGameQuestion(0);
  }

  function closeGameModal() {
    const modal = document.getElementById('game-modal');
    modal.classList.remove('active');
    modal.setAttribute('aria-hidden', 'true');
    const filmModal = document.getElementById('filmstrip-modal');
    const lightboxModal = document.getElementById('lightbox-modal');
    if (!filmModal.classList.contains('active') && !lightboxModal.classList.contains('active')) {
      document.body.style.overflow = '';
    }
  }

  function renderGameQuestion(index) {
    const { questions } = state.game;
    if (index >= questions.length) {
      showGameResult();
      return;
    }

    state.game.hasAnswered = false;
    const currentQ = questions[index];

    // Update Status Bar
    document.getElementById('game-q-counter').textContent = `Câu ${index + 1} / ${questions.length}`;
    document.getElementById('game-score-badge').textContent = `Điểm: ${state.game.score}`;
    const progressPct = ((index + 1) / questions.length) * 100;
    document.getElementById('game-progress-fill').style.width = `${progressPct}%`;

    // Hide reveal card
    const revealCard = document.getElementById('game-reveal-card');
    revealCard.style.display = 'none';

    // Set Image (Strictly no titles, dates, or stage hints)
    const imgEl = document.getElementById('game-current-img');
    imgEl.src = currentQ.imageUrl;
    imgEl.alt = 'Bức ảnh bí ẩn cần đoán năm';

    // Generate 4 Options (1 correct + 3 distinct distractors from other stages)
    const allStages = state.data.stages;
    const correctStage = allStages.find(s => s.id === currentQ.stageId);
    const otherStages = allStages.filter(s => s.id !== currentQ.stageId);
    
    function getGameStageLabel(st) {
      if (st.id === 'luc-nho' || st.period.toLowerCase().includes('tuổi thơ')) {
        return 'Lúc nhỏ (Tuổi thơ)';
      }
      return `Năm ${st.period}`;
    }

    const shuffledOthers = shuffleArray(otherStages).slice(0, 3);
    
    const options = [
      { stageId: correctStage.id, label: getGameStageLabel(correctStage), isCorrect: true },
      ...shuffledOthers.map(s => ({ stageId: s.id, label: getGameStageLabel(s), isCorrect: false }))
    ];

    const shuffledOptions = shuffleArray(options);

    // Render Option Buttons
    const optionsGrid = document.getElementById('game-options-grid');
    optionsGrid.innerHTML = '';
    const letters = ['A', 'B', 'C', 'D'];

    shuffledOptions.forEach((opt, optIdx) => {
      const btn = document.createElement('button');
      btn.className = 'game-opt-btn';
      btn.dataset.isCorrect = opt.isCorrect ? 'true' : 'false';
      btn.dataset.stageId = opt.stageId;

      btn.innerHTML = `
        <span class="game-opt-prefix">${letters[optIdx]}</span>
        <span class="game-opt-text">${opt.label}</span>
      `;

      btn.addEventListener('click', () => {
        handleGameOptionSelect(btn, currentQ, opt.isCorrect);
      });

      optionsGrid.appendChild(btn);
    });
  }

  function handleGameOptionSelect(selectedBtn, question, isCorrect) {
    if (state.game.hasAnswered) return;
    state.game.hasAnswered = true;

    const optionsGrid = document.getElementById('game-options-grid');
    const allBtns = optionsGrid.querySelectorAll('.game-opt-btn');

    // Disable all option buttons
    allBtns.forEach(btn => {
      btn.classList.add('disabled');
      btn.setAttribute('disabled', 'true');
    });

    const revealCard = document.getElementById('game-reveal-card');
    const statusIcon = document.getElementById('reveal-status-icon');
    const statusText = document.getElementById('reveal-status-text');
    const revealHeader = revealCard.querySelector('.reveal-header');

    if (isCorrect) {
      state.game.score += 1;
      selectedBtn.classList.add('correct');
      document.getElementById('game-score-badge').textContent = `Điểm: ${state.game.score}`;

      revealHeader.className = 'reveal-header is-correct';
      statusIcon.textContent = '🎉';
      statusText.textContent = 'CHÍNH XÁC!';
    } else {
      selectedBtn.classList.add('wrong');
      allBtns.forEach(btn => {
        if (btn.dataset.isCorrect === 'true') {
          btn.classList.add('correct');
        }
      });

      revealHeader.className = 'reveal-header is-wrong';
      statusIcon.textContent = '😅';
      statusText.textContent = 'TIẾC QUÁ, CHƯA CHUẨN RỒI!';
    }

    // Populate Reveal Memory Details
    document.getElementById('reveal-memory-title').textContent = question.title;
    document.getElementById('reveal-memory-time').textContent = `📅 Thời gian: ${question.time}`;
    document.getElementById('reveal-memory-desc').textContent = question.description || 'Khoảnh khắc quý giá được lưu giữ trong bảo tàng.';

    // Next Button Text
    const nextBtn = document.getElementById('btn-game-next');
    const isLast = (state.game.currentIndex === state.game.questions.length - 1);
    nextBtn.innerHTML = isLast 
      ? `<span>Xem kết quả tổng kết</span> <span>🏆</span>` 
      : `<span>Câu tiếp theo</span> <span>→</span>`;

    // Show Reveal Card
    revealCard.style.display = 'flex';
  }

  function showGameResult() {
    document.getElementById('game-play-screen').style.display = 'none';
    const resultScreen = document.getElementById('game-result-screen');
    resultScreen.style.display = 'flex';

    const score = state.game.score;
    const total = state.game.questions.length;
    document.getElementById('result-score-highlight').textContent = `${score} / ${total}`;

    let trophy = '🏆';
    let rank = '';
    let commentary = '';

    if (score === 10) {
      trophy = '👑';
      rank = 'BẬC THẦY KÝ ỨC TUYỆT ĐỐI';
      commentary = 'Trí nhớ đỉnh của chóp! Bạn nhớ từng chi tiết nhỏ nhất trong cuộc đời mình, như thể bạn có gắn chip nhớ SSD 1TB trong đầu vậy!';
    } else if (score >= 8) {
      trophy = '🏆';
      rank = 'CHIẾN THẦN HOÀI NIỆM';
      commentary = 'Phong độ quá đẳng cấp! Bạn chỉ nhầm một chút ở những góc chụp hiểm hóc thôi, ký ức của bạn cực kỳ sắc bén!';
    } else if (score >= 6) {
      trophy = '🌟';
      rank = 'NGƯỜI LỮ HÀNH TỈNH TÁO';
      commentary = 'Khá lắm! Đa số các mốc thời gian lớn bạn đều bắt chuẩn, chỉ có vài tấm quậy phá làm bạn hơi lú một tẹo.';
    } else if (score >= 4) {
      trophy = '🤔';
      rank = 'KÝ ỨC CHẠY MẠNG 3G';
      commentary = 'Hình như não bộ đang load dữ liệu qua mạng 3G chập chờn? Lúc nhớ lúc quên, nhưng nhìn lại ảnh vẫn thấy xúc động đúng không!';
    } else {
      trophy = '🐟';
      rank = 'BỘ NHỚ CÁ VÀNG - CẦN RESET NÃO';
      commentary = 'Ủa đây là tôi sao? Ai chụp lúc nào vậy?! Bạn cần ngay một chuyến tham quan lại toàn bộ bảo tàng để phục hồi ký ức khẩn cấp!';
    }

    document.getElementById('result-trophy-icon').textContent = trophy;
    document.getElementById('result-rank-badge').textContent = rank;
    document.getElementById('result-commentary').textContent = commentary;
  }

  function attachStageReelButtons() {
    const stageReelBtns = document.querySelectorAll('.btn-stage-reel');
    stageReelBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        startCinemaReel(btn.dataset.stageId);
      });
    });
  }

  // ========================================================
  // 12. CHẾ ĐỘ CHIẾU PHIM TỰ ĐỘNG (CINEMA MEMORY REEL)
  // ========================================================
  function buildCinemaSlides(targetStageId) {
    const slides = [];
    if (!state.data || !state.data.stages) return slides;

    if (!targetStageId || targetStageId === 'all') {
      // Full Journey: All highlight memories from Lúc nhỏ to 2026
      state.data.stages.forEach(st => {
        const highlights = st.memories.filter(m => m.isHighlight);
        highlights.forEach(m => {
          slides.push({
            id: m.id,
            stageId: st.id,
            stageTitle: st.title,
            period: st.period,
            themeSong: st.themeSong,
            title: m.title,
            time: m.time || st.period,
            description: m.description || '',
            isQuote: (!m.image || m.image.length === 0),
            image: (m.image && m.image.length > 0) ? m.image[0] : null
          });
        });
      });
    } else {
      // Single Stage: Memories of this specific stage
      const stage = state.data.stages.find(s => s.id === targetStageId);
      if (stage) {
        let mems = stage.memories.filter(m => m.isHighlight);
        if (mems.length < 4) {
          const additional = stage.memories.filter(m => !m.isHighlight).slice(0, 6 - mems.length);
          mems = [...mems, ...additional];
        }
        mems.forEach(m => {
          slides.push({
            id: m.id,
            stageId: stage.id,
            stageTitle: stage.title,
            period: stage.period,
            themeSong: stage.themeSong,
            title: m.title,
            time: m.time || stage.period,
            description: m.description || '',
            isQuote: (!m.image || m.image.length === 0),
            image: (m.image && m.image.length > 0) ? m.image[0] : null
          });
        });
      }
    }

    return slides;
  }

  function startCinemaReel(targetStageId) {
    // 0. Pause background playlist
    pauseBgMusic(true);

    // 1. Pause any background audio from vinyl players
    if (state.currentAudio && !state.currentAudio.paused) {
      state.currentAudio.pause();
      if (state.currentAudioBtn) state.currentAudioBtn.innerHTML = '<span class="play-icon">▶</span>';
      if (state.currentVinyl) state.currentVinyl.classList.remove('spinning');
      if (state.currentDot) state.currentDot.classList.remove('active');
      const globalAudioToggle = document.getElementById('global-audio-toggle');
      if (globalAudioToggle) globalAudioToggle.classList.remove('playing');
    }

    // 2. Prepare Slides
    const slides = buildCinemaSlides(targetStageId);
    if (slides.length === 0) {
      alert('Không có kỷ niệm nào để trình chiếu.');
      return;
    }

    state.cinema.slides = slides;
    state.cinema.currentIndex = 0;
    state.cinema.isPlaying = true;
    state.cinema.elapsedMs = 0;
    state.cinema.currentTrackSrc = null;

    // 3. Update Mode Badge
    const badgeEl = document.getElementById('cinema-badge-mode');
    if (!targetStageId || targetStageId === 'all') {
      badgeEl.textContent = 'CHIẾU PHIM TOÀN HÀNH TRÌNH (2007 - 2026)';
    } else {
      const stage = state.data.stages.find(s => s.id === targetStageId);
      badgeEl.textContent = `PHIM KỶ NIỆM • ${stage ? stage.period.toUpperCase() : ''}`;
    }

    // 4. Render Progress Segment Bars (Stories style)
    const progRow = document.getElementById('cinema-progress-row');
    progRow.innerHTML = '';
    slides.forEach((_, idx) => {
      const seg = document.createElement('div');
      seg.className = 'cinema-seg';
      seg.dataset.index = idx;
      seg.innerHTML = '<div class="cinema-seg-fill"></div>';
      progRow.appendChild(seg);
    });

    // 5. Open Cinema Modal
    const modal = document.getElementById('cinema-modal');
    modal.classList.add('active');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';

    // 6. Reset Controls UI
    document.getElementById('cinema-pause-icon').textContent = '⏸';
    const audioIcon = document.getElementById('cinema-audio-icon');
    audioIcon.textContent = state.cinema.isMuted ? '🔇' : '🔊';

    // 7. Show Slide 0 and start timer
    showCinemaSlide(0);
    startCinemaTimer();
  }

  function showCinemaSlide(index) {
    const { slides } = state.cinema;
    if (index < 0 || index >= slides.length) return;

    state.cinema.currentIndex = index;
    state.cinema.elapsedMs = 0;
    const slide = slides[index];

    // Update Progress Bars
    const segs = document.querySelectorAll('#cinema-progress-row .cinema-seg');
    segs.forEach((seg, sIdx) => {
      const fill = seg.querySelector('.cinema-seg-fill');
      if (sIdx < index) {
        seg.classList.add('completed');
        fill.style.width = '100%';
      } else if (sIdx === index) {
        seg.classList.remove('completed');
        fill.style.width = '0%';
      } else {
        seg.classList.remove('completed');
        fill.style.width = '0%';
      }
    });

    // Update Subtitles
    document.getElementById('cinema-sub-stage').textContent = slide.period;
    document.getElementById('cinema-sub-time').textContent = slide.time;
    document.getElementById('cinema-sub-title').textContent = slide.title;
    document.getElementById('cinema-sub-desc').textContent = slide.description || '';

    // Render Slide in Viewport
    const viewport = document.getElementById('cinema-slides-viewport');
    viewport.innerHTML = '';

    const slideEl = document.createElement('div');
    if (slide.isQuote) {
      slideEl.className = 'cinema-slide cinema-slide-quote active';
      slideEl.innerHTML = `
        <div class="cinema-quote-box">
          <div class="cinema-quote-mark">“</div>
          <h3 class="cinema-quote-title">${slide.title}</h3>
          <p class="cinema-quote-text">"${slide.description}"</p>
          <div class="cinema-quote-time">${slide.time}</div>
        </div>
      `;
    } else {
      slideEl.className = 'cinema-slide cinema-slide-photo active';
      slideEl.innerHTML = `
        <img class="cinema-img" src="${slide.image}" alt="${slide.title}">
      `;
    }
    viewport.appendChild(slideEl);

    // Audio Synchronization
    const cinemaAudio = document.getElementById('cinema-audio');
    if (slide.themeSong && slide.themeSong.src) {
      if (state.cinema.currentTrackSrc !== slide.themeSong.src) {
        cinemaAudio.src = encodeURI(slide.themeSong.src);
        state.cinema.currentTrackSrc = slide.themeSong.src;
        cinemaAudio.muted = state.cinema.isMuted;
        if (state.cinema.isPlaying) {
          cinemaAudio.play().catch(e => console.warn('Cinema audio play error:', e));
        }
      }
    }
  }

  function startCinemaTimer() {
    clearInterval(state.cinema.timer);
    const intervalMs = 50;

    state.cinema.timer = setInterval(() => {
      if (!state.cinema.isPlaying) return;

      state.cinema.elapsedMs += intervalMs;
      const pct = Math.min(100, (state.cinema.elapsedMs / state.cinema.slideDurationMs) * 100);

      const currentSeg = document.querySelector(`#cinema-progress-row .cinema-seg[data-index="${state.cinema.currentIndex}"] .cinema-seg-fill`);
      if (currentSeg) {
        currentSeg.style.width = `${pct}%`;
      }

      if (state.cinema.elapsedMs >= state.cinema.slideDurationMs) {
        nextCinemaSlide();
      }
    }, intervalMs);
  }

  function nextCinemaSlide() {
    const { slides, currentIndex } = state.cinema;
    if (currentIndex < slides.length - 1) {
      showCinemaSlide(currentIndex + 1);
    } else {
      closeCinemaReel();
    }
  }

  function prevCinemaSlide() {
    const { currentIndex } = state.cinema;
    if (currentIndex > 0) {
      showCinemaSlide(currentIndex - 1);
    } else {
      showCinemaSlide(0);
    }
  }

  function toggleCinemaPause() {
    state.cinema.isPlaying = !state.cinema.isPlaying;
    const icon = document.getElementById('cinema-pause-icon');
    icon.textContent = state.cinema.isPlaying ? '⏸' : '▶';

    const cinemaAudio = document.getElementById('cinema-audio');
    if (state.cinema.isPlaying) {
      cinemaAudio.play().catch(e => console.warn(e));
    } else {
      cinemaAudio.pause();
    }
  }

  function toggleCinemaAudio() {
    state.cinema.isMuted = !state.cinema.isMuted;
    const cinemaAudio = document.getElementById('cinema-audio');
    cinemaAudio.muted = state.cinema.isMuted;
    const icon = document.getElementById('cinema-audio-icon');
    icon.textContent = state.cinema.isMuted ? '🔇' : '🔊';
  }

  function closeCinemaReel() {
    clearInterval(state.cinema.timer);
    state.cinema.isPlaying = false;

    const cinemaAudio = document.getElementById('cinema-audio');
    if (cinemaAudio) {
      cinemaAudio.pause();
      cinemaAudio.currentTime = 0;
      state.cinema.currentTrackSrc = null;
    }

    const modal = document.getElementById('cinema-modal');
    modal.classList.remove('active');
    modal.setAttribute('aria-hidden', 'true');

    const filmModal = document.getElementById('filmstrip-modal');
    const lightboxModal = document.getElementById('lightbox-modal');
    const gameModal = document.getElementById('game-modal');
    if (!filmModal.classList.contains('active') && !lightboxModal.classList.contains('active') && (!gameModal || !gameModal.classList.contains('active'))) {
      document.body.style.overflow = '';
    }

    // Resume background music if user has not muted
    if (state.bgMusic && !state.bgMusic.isUserMuted) {
      playBgMusic();
    }
  }

  // ========================================================
  // 13. GLOBAL EVENTS BINDING
  // ========================================================
  function bindGlobalEvents() {
    // Filter Tabs Click
    const filterTabs = document.querySelectorAll('.filter-tab');
    filterTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        applyFilter(tab.dataset.filter);
      });
    });

    // Close Filmstrip Modal Events
    document.getElementById('btn-close-filmstrip').addEventListener('click', closeFilmstripModal);
    document.getElementById('modal-filmstrip-backdrop').addEventListener('click', closeFilmstripModal);

    // Lightbox Controls Events
    document.getElementById('lightbox-btn-close').addEventListener('click', closeLightbox);
    document.getElementById('lightbox-backdrop').addEventListener('click', closeLightbox);
    document.getElementById('lightbox-btn-prev').addEventListener('click', prevLightboxImage);
    document.getElementById('lightbox-btn-next').addEventListener('click', nextLightboxImage);

    // Zoom Toggle in Lightbox
    const zoomBtn = document.getElementById('lightbox-btn-zoom');
    zoomBtn.addEventListener('click', () => {
      const wrapper = document.getElementById('lightbox-img-wrapper');
      state.lightbox.isZoomed = !state.lightbox.isZoomed;
      wrapper.classList.toggle('zoomed', state.lightbox.isZoomed);
    });

    // Global Audio Toggle Button (Sticky Nav)
    const globalAudioToggle = document.getElementById('global-audio-toggle');
    if (globalAudioToggle) {
      globalAudioToggle.addEventListener('click', () => {
        if (state.currentAudio) {
          if (!state.currentAudio.paused) {
            state.currentAudio.pause();
            if (state.currentAudioBtn) state.currentAudioBtn.innerHTML = '<span class="play-icon">▶</span>';
            if (state.currentVinyl) state.currentVinyl.classList.remove('spinning');
            if (state.currentDot) state.currentDot.classList.remove('active');
            state.currentAudio = null;
            globalAudioToggle.classList.remove('playing');
            if (state.bgMusic && !state.bgMusic.isUserMuted) {
              playBgMusic();
            }
          }
        } else {
          toggleBgMusic();
        }
      });
    }

    // Game Trigger & Control Events
    const btnHeroGame = document.getElementById('btn-hero-game');
    if (btnHeroGame) btnHeroGame.addEventListener('click', startNewGame);

    const btnNavGame = document.getElementById('btn-nav-game');
    if (btnNavGame) btnNavGame.addEventListener('click', startNewGame);

    const btnCloseGame = document.getElementById('btn-close-game');
    if (btnCloseGame) btnCloseGame.addEventListener('click', closeGameModal);

    const modalGameBackdrop = document.getElementById('modal-game-backdrop');
    if (modalGameBackdrop) modalGameBackdrop.addEventListener('click', closeGameModal);

    const btnGameNext = document.getElementById('btn-game-next');
    if (btnGameNext) {
      btnGameNext.addEventListener('click', () => {
        state.game.currentIndex += 1;
        if (state.game.currentIndex < state.game.questions.length) {
          renderGameQuestion(state.game.currentIndex);
        } else {
          showGameResult();
        }
      });
    }

    const btnGameReplay = document.getElementById('btn-game-replay');
    if (btnGameReplay) btnGameReplay.addEventListener('click', startNewGame);

    const btnGameExit = document.getElementById('btn-game-exit');
    if (btnGameExit) btnGameExit.addEventListener('click', closeGameModal);

    // Cinema Reel Trigger & Control Events
    const btnHeroCinema = document.getElementById('btn-hero-cinema');
    if (btnHeroCinema) {
      btnHeroCinema.addEventListener('click', () => {
        startCinemaReel('all');
      });
    }

    const cinemaBtnPause = document.getElementById('cinema-btn-pause');
    if (cinemaBtnPause) cinemaBtnPause.addEventListener('click', toggleCinemaPause);

    const cinemaBtnAudio = document.getElementById('cinema-btn-audio');
    if (cinemaBtnAudio) cinemaBtnAudio.addEventListener('click', toggleCinemaAudio);

    const cinemaBtnClose = document.getElementById('cinema-btn-close');
    if (cinemaBtnClose) cinemaBtnClose.addEventListener('click', closeCinemaReel);

    const zonePrev = document.getElementById('cinema-zone-prev');
    if (zonePrev) zonePrev.addEventListener('click', prevCinemaSlide);

    const zoneNext = document.getElementById('cinema-zone-next');
    if (zoneNext) zoneNext.addEventListener('click', nextCinemaSlide);

    const arrowPrev = document.getElementById('cinema-arrow-prev');
    if (arrowPrev) arrowPrev.addEventListener('click', prevCinemaSlide);

    const arrowNext = document.getElementById('cinema-arrow-next');
    if (arrowNext) arrowNext.addEventListener('click', nextCinemaSlide);

    // Keyboard Shortcuts (Esc to close modals, Arrow keys for Lightbox/Cinema)
    window.addEventListener('keydown', (e) => {
      const lightboxModal = document.getElementById('lightbox-modal');
      const filmModal = document.getElementById('filmstrip-modal');
      const gameModal = document.getElementById('game-modal');
      const cinemaModal = document.getElementById('cinema-modal');

      if (e.key === 'Escape') {
        if (cinemaModal && cinemaModal.classList.contains('active')) {
          closeCinemaReel();
        } else if (lightboxModal && lightboxModal.classList.contains('active')) {
          closeLightbox();
        } else if (filmModal && filmModal.classList.contains('active')) {
          closeFilmstripModal();
        } else if (gameModal && gameModal.classList.contains('active')) {
          closeGameModal();
        }
      } else if (cinemaModal && cinemaModal.classList.contains('active')) {
        if (e.key === 'ArrowLeft') {
          prevCinemaSlide();
        } else if (e.key === 'ArrowRight') {
          nextCinemaSlide();
        } else if (e.key === ' ') {
          e.preventDefault();
          toggleCinemaPause();
        }
      } else if (lightboxModal && lightboxModal.classList.contains('active')) {
        if (e.key === 'ArrowLeft') {
          prevLightboxImage();
        } else if (e.key === 'ArrowRight') {
          nextLightboxImage();
        }
      }
    });

    // Mobile Swipe Support for Lightbox
    let touchStartX = 0;
    let touchEndX = 0;
    const lightboxStage = document.querySelector('.lightbox-stage');

    lightboxStage.addEventListener('touchstart', (e) => {
      touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });

    lightboxStage.addEventListener('touchend', (e) => {
      touchEndX = e.changedTouches[0].screenX;
      handleSwipe();
    }, { passive: true });

    function handleSwipe() {
      const diff = touchEndX - touchStartX;
      if (Math.abs(diff) > 50) {
        if (diff > 0) {
          prevLightboxImage(); // Swiped right -> previous
        } else {
          nextLightboxImage(); // Swiped left -> next
        }
      }
    }
  }

  // ========================================================
  // 14. BƯỚC 4: QUẦY IN VÉ THAM QUAN LƯU NIỆM (SOUVENIR TICKET)
  // ========================================================
  function initTicketStation() {
    const stageSelect = document.getElementById('ticket-stage-select');
    const visitorInput = document.getElementById('ticket-visitor-name');
    const btnPrint = document.getElementById('btn-print-ticket');
    const btnDownload = document.getElementById('btn-download-ticket');
    const ticketEl = document.getElementById('souvenir-ticket');

    if (!ticketEl) return;

    // 1. Populate Stage Dropdown
    if (stageSelect && state.data && state.data.stages) {
      stageSelect.innerHTML = '';
      state.data.stages.forEach(stage => {
        const option = document.createElement('option');
        option.value = stage.id;
        option.textContent = `${stage.title} (${stage.yearRange || ''})`;
        stageSelect.appendChild(option);
      });
    }

    // 2. Extract pool of memorable quotes from memories.js
    const quotesPool = [];
    if (state.data && state.data.stages) {
      state.data.stages.forEach(stage => {
        if (stage.rpgProfile && stage.rpgProfile.quote) {
          quotesPool.push({
            text: stage.rpgProfile.quote,
            source: `${stage.title} • Nhật ký RPG`
          });
        }
        stage.memories.forEach(mem => {
          const desc = (mem.description || '').trim();
          if (desc && desc.length >= 25 && desc.length <= 260) {
            quotesPool.push({
              text: desc,
              source: `${mem.title} • ${mem.time || stage.title}`
            });
          } else if (mem.title && mem.title.length >= 25 && !mem.title.startsWith('IMG_') && !mem.title.startsWith('PXL_')) {
            quotesPool.push({
              text: mem.title,
              source: `${stage.title} • ${mem.time || ''}`
            });
          }
        });
      });
    }

    // Fallback quotes if pool is small
    if (quotesPool.length === 0) {
      quotesPool.push(
        { text: "Mỗi bức ảnh, mỗi dòng ghi chú ở đây đều là một mảnh ký ức thật trên hành trình lớn lên từ thuở nhỏ đến năm 2026.", source: "Lịch Sử Tiến Hóa Của Hải Thành" },
        { text: "Nơi lưu giữ những mảnh ghép thời gian, những cột mốc trưởng thành và cả những ngày bình yên không cần chụp ảnh.", source: "Lời tựa Khởi nguyên" },
        { text: "Thời gian trôi đi không lấy lại được, nhưng ký ức sẽ mãi ở lại trong tim người trân trọng nó.", source: "Góc tâm sự Tiến hóa" },
        { text: "Dù đi thật xa, hãy luôn nhớ về những ngày đầu tiên non nớt và ngây thơ nhất.", source: "Hành trình Tuổi thơ" },
        { text: "Cảm ơn bạn đã ghé thăm chuyến tàu thời gian và đồng hành cùng những ký ức tuyệt đẹp này.", source: "Lưu Niệm Tiến Hóa" }
      );
    }

    // 3. Helper to update ticket display
    function updateTicket(isInteractive = false) {
      // Visitor Name
      const rawName = visitorInput ? visitorInput.value.trim() : '';
      const visitorName = rawName || 'Khách tham quan ẩn danh';
      const stubVisitorName = visitorName.length > 14 ? visitorName.substring(0, 14) + '...' : visitorName;

      // Stage Title
      let stageTitle = 'Tuổi thơ hoài niệm';
      if (stageSelect) {
        const selectedOpt = stageSelect.options[stageSelect.selectedIndex];
        if (selectedOpt) {
          stageTitle = selectedOpt.textContent.split(' (')[0];
        }
      }

      // Real-time Visit Clock
      const now = new Date();
      const pad = (n) => String(n).padStart(2, '0');
      const d = pad(now.getDate());
      const m = pad(now.getMonth() + 1);
      const y = now.getFullYear();
      const h = pad(now.getHours());
      const min = pad(now.getMinutes());
      const sec = pad(now.getSeconds());
      const fullTimeStr = `${d}/${m}/${y} • ${h}:${min}:${sec}`;
      const shortDateStr = `${d}/${m}/${y}`;

      // Random Serial
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      const serialCode = `#MEM-2026-${randomSuffix}`;
      const barcodeDigits = `2 0 2 6  ${randomSuffix}  ${Math.floor(100 + Math.random() * 900)}`;

      // Random Quote
      const randomQuote = quotesPool[Math.floor(Math.random() * quotesPool.length)];

      // DOM Updates
      const dispVisitor = document.getElementById('ticket-disp-visitor');
      const dispStubVisitor = document.getElementById('ticket-disp-stub-visitor');
      const dispStage = document.getElementById('ticket-disp-stage');
      const dispTime = document.getElementById('ticket-disp-time');
      const dispStubDate = document.getElementById('ticket-disp-stub-date');
      const dispSerial = document.getElementById('ticket-disp-serial');
      const dispStubSerial = document.getElementById('ticket-disp-stub-serial');
      const dispBarcode = document.getElementById('ticket-disp-barcode-num');
      const dispQuote = document.getElementById('ticket-disp-quote');
      const dispQuoteSource = document.getElementById('ticket-disp-quote-source');
      const stampYear = document.getElementById('ticket-stamp-year');

      if (dispVisitor) dispVisitor.textContent = visitorName;
      if (dispStubVisitor) dispStubVisitor.textContent = stubVisitorName;
      if (dispStage) dispStage.textContent = stageTitle;
      if (dispTime) dispTime.textContent = fullTimeStr;
      if (dispStubDate) dispStubDate.textContent = shortDateStr;
      if (dispSerial) dispSerial.textContent = serialCode;
      if (dispStubSerial) dispStubSerial.textContent = serialCode;
      if (dispBarcode) dispBarcode.textContent = barcodeDigits;
      if (dispQuote) dispQuote.textContent = `"${randomQuote.text}"`;
      if (dispQuoteSource) dispQuoteSource.textContent = `— ${randomQuote.source}`;
      if (stampYear) stampYear.textContent = y.toString();

      if (isInteractive) {
        ticketEl.classList.remove('print-pulse');
        void ticketEl.offsetWidth; // Force reflow
        ticketEl.classList.add('print-pulse');
      }
    }

    // Initial render of ticket with live time
    updateTicket(false);

    // 4. Print Button Click Event
    if (btnPrint) {
      btnPrint.addEventListener('click', () => {
        updateTicket(true);
      });
    }

    // 5. Download Ticket as PNG Event (html2canvas)
    if (btnDownload) {
      btnDownload.addEventListener('click', () => {
        if (typeof html2canvas === 'undefined') {
          alert('Thư viện chụp ảnh html2canvas đang được tải hoặc bị chặn kết nối. Vui lòng tải lại trang hoặc kiểm tra kết nối mạng!');
          return;
        }

        const dlText = document.getElementById('btn-dl-text');
        const originalText = dlText ? dlText.textContent : 'Tải vé về máy (.PNG)';
        
        btnDownload.disabled = true;
        if (dlText) dlText.textContent = '⏳ Đang kết xuất ảnh vé...';

        const dispSerial = document.getElementById('ticket-disp-serial');
        const serialNum = dispSerial ? dispSerial.textContent.replace(/[^a-zA-Z0-9-]/g, '') : 'MEM-2026';

        // Options for sharp, high-DPI output with zero canvas taint
        html2canvas(ticketEl, {
          scale: 2, // 2x high resolution Retina canvas
          useCORS: true,
          logging: false,
          backgroundColor: null,
          onclone: (clonedDoc) => {
            const clonedTicket = clonedDoc.getElementById('souvenir-ticket');
            if (clonedTicket) {
              clonedTicket.style.width = '780px';
              clonedTicket.style.maxWidth = '780px';
              clonedTicket.style.minWidth = '780px';
              clonedTicket.style.transform = 'none';
            }
          }
        }).then(canvas => {
          const imageURL = canvas.toDataURL('image/png');
          const downloadLink = document.createElement('a');
          downloadLink.download = `ve-luu-niem-${serialNum}.png`;
          downloadLink.href = imageURL;
          document.body.appendChild(downloadLink);
          downloadLink.click();
          document.body.removeChild(downloadLink);

          if (dlText) dlText.textContent = '✅ Đã tải vé thành công!';
          setTimeout(() => {
            if (dlText) dlText.textContent = originalText;
            btnDownload.disabled = false;
          }, 2400);
        }).catch(err => {
          console.error('Lỗi khi xuất ảnh vé bằng html2canvas:', err);
          alert('Có lỗi xảy ra khi tạo ảnh vé. Vui lòng thử lại!');
          if (dlText) dlText.textContent = originalText;
          btnDownload.disabled = false;
        });
      });
    }
  }

  // ========================================================
  // 15. PHÁT NHẠC GIAI ĐOẠN ĐỒNG BỘ (NÂNG CẤP 3)
  // ========================================================
  function playStageAudio(stageId) {
    const audio = document.getElementById(`audio-${stageId}`);
    const playBtn = document.getElementById(`play-btn-${stageId}`);
    const vinyl = document.getElementById(`vinyl-${stageId}`);
    const dot = document.getElementById(`dot-${stageId}`);

    if (!audio || !playBtn) return;

    // 1. Tạm dừng nhạc nền tổng
    pauseBgMusic(true);

    // 2. Tạm dừng các giai đoạn khác đang phát
    if (state.currentAudio && state.currentAudio !== audio) {
      state.currentAudio.pause();
      if (state.currentAudioBtn) state.currentAudioBtn.innerHTML = '<span class="play-icon">▶</span>';
      if (state.currentVinyl) state.currentVinyl.classList.remove('spinning');
      if (state.currentDot) state.currentDot.classList.remove('active');
    }

    // 3. Kích hoạt phát nhạc giai đoạn này
    audio.play().then(() => {
      playBtn.innerHTML = '<span class="pause-icon">⏸</span>';
      if (vinyl) vinyl.classList.add('spinning');
      if (dot) dot.classList.add('active');

      state.currentAudio = audio;
      state.currentAudioBtn = playBtn;
      state.currentVinyl = vinyl;
      state.currentDot = dot;

      const globalAudioBtn = document.getElementById('global-audio-toggle');
      if (globalAudioBtn) globalAudioBtn.classList.add('playing');
    }).catch(err => {
      console.warn(`Không thể phát nhạc cho giai đoạn ${stageId}:`, err);
    });
  }

  // ========================================================
  // 16. NHẠC NỀN TỰ ĐỘNG PHÁT & TRÁO NGẪU NHIÊN (NÂNG CẤP 2)
  // ========================================================
  function initBackgroundMusic() {
    const rawList = window.BACKGROUND_PLAYLIST || [];
    if (rawList.length === 0) return;

    // Tráo ngẫu nhiên thứ tự danh sách (Fisher-Yates shuffle)
    const shuffled = [...rawList];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    state.bgMusic.playlist = shuffled;
    state.bgMusic.currentIndex = 0;
    state.bgMusic.audio.volume = 0.5;
    state.bgMusic.isUserMuted = false;
    state.bgMusic.isPlaying = true;

    // Hết bài tự chuyển ngẫu nhiên sang bài kế tiếp
    state.bgMusic.audio.addEventListener('ended', () => {
      nextBgMusicTrack();
    });

    state.bgMusic.audio.addEventListener('play', () => {
      state.bgMusic.isPlaying = true;
      state.bgMusic.isUserMuted = false;
      updateBgMusicUI();
    });

    state.bgMusic.audio.addEventListener('pause', () => {
      if (state.bgMusic.isUserMuted) {
        state.bgMusic.isPlaying = false;
        updateBgMusicUI();
      }
    });

    // Nạp bài đầu tiên
    loadBgMusicTrack(0);
    state.bgMusic.audio.autoplay = true;

    // Tự động phát nhạc nền mặc định ngay khi tải trang
    function startDefaultBgMusic() {
      if (state.bgMusic.isUserMuted) return;
      if (state.currentAudio && !state.currentAudio.paused) return;
      if (state.cinema && state.cinema.isPlaying) return;

      const playPromise = state.bgMusic.audio.play();
      if (playPromise !== undefined) {
        playPromise.then(() => {
          state.bgMusic.isPlaying = true;
          updateBgMusicUI();
        }).catch(() => {
          // Trình duyệt chặn autoplay khi chưa có tương tác người dùng
          // Giữ trạng thái giao diện là Bật (🎵) và tự động kích hoạt ngay ở tương tác đầu tiên
          updateBgMusicUI();
          const unlockAutoplay = () => {
            if (!state.bgMusic.isUserMuted && !state.currentAudio && (!state.cinema || !state.cinema.isPlaying)) {
              state.bgMusic.audio.play().then(() => {
                state.bgMusic.isPlaying = true;
                updateBgMusicUI();
              }).catch(() => {});
            }
            ['pointerdown', 'click', 'touchstart', 'scroll', 'wheel', 'keydown'].forEach(ev => {
              window.removeEventListener(ev, unlockAutoplay, true);
            });
          };

          ['pointerdown', 'click', 'touchstart', 'scroll', 'wheel', 'keydown'].forEach(ev => {
            window.addEventListener(ev, unlockAutoplay, { once: true, passive: true, capture: true });
          });
        });
      }
    }

    startDefaultBgMusic();
    updateBgMusicUI();

    // Nút Bật/Tắt nhạc nền nổi
    const toggleBtn = document.getElementById('bg-music-toggle-btn');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', toggleBgMusic);
    }

    // Nút Chuyển ngẫu nhiên bài kế tiếp
    const nextBtn = document.getElementById('bg-music-next-btn');
    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        nextBgMusicTrack();
      });
    }
  }

  function loadBgMusicTrack(index) {
    if (!state.bgMusic.playlist || state.bgMusic.playlist.length === 0) return;
    state.bgMusic.currentIndex = index % state.bgMusic.playlist.length;
    const track = state.bgMusic.playlist[state.bgMusic.currentIndex];
    state.bgMusic.audio.src = track.src;

    const titleEl = document.getElementById('bg-music-current-title');
    if (titleEl) {
      titleEl.textContent = track.title;
      titleEl.title = track.title;
    }
  }

  function playBgMusic() {
    // Quy tắc chống đè nhạc: Chỉ 1 nguồn phát tại một thời điểm
    if (state.currentAudio && !state.currentAudio.paused) return;
    if (state.cinema && state.cinema.isPlaying) return;

    if (!state.bgMusic.audio.src && state.bgMusic.playlist.length > 0) {
      loadBgMusicTrack(state.bgMusic.currentIndex || 0);
    }

    state.bgMusic.audio.play().then(() => {
      state.bgMusic.isPlaying = true;
      updateBgMusicUI();
    }).catch(err => {
      console.warn('Không thể tự phát nhạc nền:', err);
    });
  }

  function pauseBgMusic(temporary = false) {
    if (!state.bgMusic.audio) return;
    state.bgMusic.audio.pause();
    state.bgMusic.isPlaying = false;
    if (!temporary) {
      state.bgMusic.isUserMuted = true;
    }
    updateBgMusicUI();
  }

  function toggleBgMusic() {
    if (state.bgMusic.isPlaying || !state.bgMusic.isUserMuted) {
      pauseBgMusic(false);
    } else {
      state.bgMusic.isUserMuted = false;
      // Dừng nhạc giai đoạn nếu có
      if (state.currentAudio) {
        state.currentAudio.pause();
        if (state.currentAudioBtn) state.currentAudioBtn.innerHTML = '<span class="play-icon">▶</span>';
        if (state.currentVinyl) state.currentVinyl.classList.remove('spinning');
        if (state.currentDot) state.currentDot.classList.remove('active');
        state.currentAudio = null;
      }
      playBgMusic();
    }
  }

  function nextBgMusicTrack() {
    const nextIdx = (state.bgMusic.currentIndex + 1) % state.bgMusic.playlist.length;
    loadBgMusicTrack(nextIdx);
    if (!state.bgMusic.isUserMuted && !state.currentAudio && (!state.cinema || !state.cinema.isPlaying)) {
      playBgMusic();
    }
  }

  function updateBgMusicUI() {
    const playerWidget = document.getElementById('floating-bg-player');
    const diskIcon = document.getElementById('bg-disk-icon');
    const toggleBtn = document.getElementById('bg-music-toggle-btn');
    const globalAudioToggle = document.getElementById('global-audio-toggle');

    const isActive = !state.bgMusic.isUserMuted;

    if (isActive && !state.currentAudio) {
      if (playerWidget) playerWidget.classList.add('playing');
      if (diskIcon) diskIcon.textContent = '🎵';
      if (toggleBtn) toggleBtn.title = 'Tạm dừng nhạc nền';
      if (globalAudioToggle) globalAudioToggle.classList.add('playing');
    } else {
      if (playerWidget) playerWidget.classList.remove('playing');
      if (diskIcon) diskIcon.textContent = '🔇';
      if (toggleBtn) toggleBtn.title = 'Bật nhạc nền tổng';
      if (globalAudioToggle && !state.currentAudio) globalAudioToggle.classList.remove('playing');
    }
  }

  // ========================================================
  // THEME SWITCHER
  // ========================================================
  function initThemeSwitcher() {
    const dropdown = document.getElementById('theme-selector-dropdown');
    const toggleBtn = document.getElementById('theme-toggle-btn');
    const optionBtns = document.querySelectorAll('.theme-option-btn');
    const btnIcon = document.getElementById('theme-btn-icon');
    const btnText = document.getElementById('theme-btn-text');

    if (!dropdown || !toggleBtn) return;

    const themeIcons = {
      obsidian: '🌑',
      sepia: '📜',
      midnight: '🌌',
      daylight: '☁️'
    };

    const themeNames = {
      obsidian: 'Đêm Obsidian',
      sepia: 'Giấy Cũ',
      midnight: 'Xanh Đêm',
      daylight: 'Sáng Tối Giản'
    };

    function applyTheme(theme, save = true) {
      if (!themeIcons[theme]) theme = 'obsidian';
      document.documentElement.setAttribute('data-theme', theme);

      optionBtns.forEach(btn => {
        const isMatch = btn.dataset.theme === theme;
        btn.classList.toggle('active', isMatch);
        btn.setAttribute('aria-selected', isMatch ? 'true' : 'false');
      });

      if (btnIcon) btnIcon.textContent = themeIcons[theme];
      if (btnText) btnText.textContent = themeNames[theme];

      if (save) {
        try {
          localStorage.setItem('haithanh_theme', theme);
        } catch (e) {
          console.warn('LocalStorage không khả dụng:', e);
        }
      }
    }

    // Load saved theme or default
    let initialTheme = 'obsidian';
    try {
      const saved = localStorage.getItem('haithanh_theme');
      if (saved && themeIcons[saved]) {
        initialTheme = saved;
      }
    } catch (e) {
      console.warn('LocalStorage error:', e);
    }
    applyTheme(initialTheme, false);

    // Toggle dropdown
    toggleBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = dropdown.classList.toggle('open');
      toggleBtn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });

    // Option click
    optionBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const theme = btn.dataset.theme;
        applyTheme(theme, true);
        dropdown.classList.remove('open');
        toggleBtn.setAttribute('aria-expanded', 'false');
      });
    });

    // Close on outside click
    document.addEventListener('click', (e) => {
      if (!dropdown.contains(e.target)) {
        dropdown.classList.remove('open');
        toggleBtn.setAttribute('aria-expanded', 'false');
      }
    });

    // Close on Escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && dropdown.classList.contains('open')) {
        dropdown.classList.remove('open');
        toggleBtn.setAttribute('aria-expanded', 'false');
      }
    });
  }

  // ========================================================
  // MỤC 1: RPG ACHIEVEMENTS
  // ========================================================
  function initAchievements() {
    const cards = document.querySelectorAll('.achievement-card');
    if (!cards.length) return;

    // Toast helper for locked achievements or messages
    let toastEl = document.getElementById('rpg-achievement-toast');
    if (!toastEl) {
      toastEl = document.createElement('div');
      toastEl.id = 'rpg-achievement-toast';
      toastEl.className = 'rpg-toast';
      toastEl.setAttribute('role', 'alert');
      document.body.appendChild(toastEl);
    }

    let toastTimer = null;
    function showToast(message, icon = '🔒') {
      if (toastTimer) clearTimeout(toastTimer);
      toastEl.innerHTML = `<span style="font-size: 1.25rem;">${icon}</span><span>${message}</span>`;
      toastEl.classList.add('show');
      toastTimer = setTimeout(() => {
        toastEl.classList.remove('show');
      }, 3500);
    }

    function handleCardActivation(card) {
      const isLocked = card.dataset.locked === 'true';
      if (isLocked) {
        showToast('Cần đạt Level 22 (năm 2027) để mở khóa thành tựu này!', '🔒');
        return;
      }

      const targetId = card.dataset.targetStage;
      if (!targetId) return;

      const targetElement = document.getElementById(targetId);
      if (!targetElement) {
        console.warn('Không tìm thấy mục tiêu giai đoạn:', targetId);
        return;
      }

      // Smooth scroll to target stage
      targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });

      // Trigger 2-second border highlight pulse
      targetElement.classList.remove('achievement-highlight-pulse');
      void targetElement.offsetWidth; // Force reflow
      targetElement.classList.add('achievement-highlight-pulse');

      setTimeout(() => {
        targetElement.classList.remove('achievement-highlight-pulse');
      }, 2000);
    }

    cards.forEach(card => {
      card.addEventListener('click', () => handleCardActivation(card));
      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleCardActivation(card);
        }
      });
    });
  }

  // ========================================================
  // MỤC 2: HỘP THỜI GIAN GỬI TUỔI 22 (TIME CAPSULE)
  // ========================================================
  function initTimeCapsule() {
    const section = document.getElementById('time-capsule');
    if (!section) return;

    // Toast helper
    let toastEl = document.getElementById('rpg-achievement-toast');
    if (!toastEl) {
      toastEl = document.createElement('div');
      toastEl.id = 'rpg-achievement-toast';
      toastEl.className = 'rpg-toast';
      toastEl.setAttribute('role', 'alert');
      document.body.appendChild(toastEl);
    }

    let toastTimer = null;
    function showToast(message, icon = '🔒') {
      if (toastTimer) clearTimeout(toastTimer);
      toastEl.innerHTML = `<span style="font-size: 1.25rem;">${icon}</span><span>${message}</span>`;
      toastEl.classList.add('show');
      toastTimer = setTimeout(() => {
        toastEl.classList.remove('show');
      }, 3500);
    }

    // 1. Countdown Logic
    const daysEl = document.getElementById('countdown-days');
    const hoursEl = document.getElementById('countdown-hours');
    const minsEl = document.getElementById('countdown-mins');
    const secsEl = document.getElementById('countdown-secs');
    const targetDate = new Date('2027-01-01T00:00:00');

    function updateCountdown() {
      const now = new Date();
      const diff = targetDate - now;

      if (diff <= 0) {
        if (daysEl) daysEl.textContent = '000';
        if (hoursEl) hoursEl.textContent = '00';
        if (minsEl) minsEl.textContent = '00';
        if (secsEl) secsEl.textContent = '00';
        return;
      }

      const d = Math.floor(diff / (1000 * 60 * 60 * 24));
      const h = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const m = Math.floor((diff / (1000 * 60)) % 60);
      const s = Math.floor((diff / 1000) % 60);

      if (daysEl) daysEl.textContent = d.toString().padStart(3, '0');
      if (hoursEl) hoursEl.textContent = h.toString().padStart(2, '0');
      if (minsEl) minsEl.textContent = m.toString().padStart(2, '0');
      if (secsEl) secsEl.textContent = s.toString().padStart(2, '0');
    }

    updateCountdown();
    setInterval(updateCountdown, 1000);

    // 2. Storage & Default Data
    const STORAGE_KEY = 'haithanh_time_capsules';
    const DEFAULT_CAPSULES = [
      {
        id: 'capsule-default-1',
        sender: 'Hải Thành (Bản thể 2026)',
        tag: 'goal',
        tagLabel: '🎯 Mục tiêu tuổi 22',
        date: '20/11/2026, 12:00',
        message: 'Tốt nghiệp đúng hạn, master thêm một framework mới, tự tin làm chủ các dự án lớn và có một chuyến đi xa khám phá thế giới!',
        isDefault: true
      },
      {
        id: 'capsule-default-2',
        sender: 'Hải Thành',
        tag: 'wish',
        tagLabel: '💌 Lời nhắn nhủ',
        date: '20/11/2026, 14:30',
        message: 'Dù sau này cuộc sống có bận rộn hay deadline dồn dập đến đâu, nhớ giữ gìn sức khỏe, ngủ đủ giấc và đừng quên lý do mình đã bắt đầu hành trình này!',
        isDefault: true
      },
      {
        id: 'capsule-default-3',
        sender: 'Chiến hữu phòng code',
        tag: 'prophecy',
        tagLabel: '😂 Lời tiên tri hài hước',
        date: '20/11/2026, 18:15',
        message: 'Tiên tri tuổi 22: Hải Thành vẫn chưa chịu hết bug ngay từ lần đầu compile, nhưng tài khoản ngân hàng sẽ nhảy số nhiều hơn năm nay và skill fix bug thì lên tầm thượng thừa :))',
        isDefault: true
      }
    ];

    function loadCapsules() {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } catch (e) {
        console.warn('Lỗi đọc time capsules:', e);
      }
      return [...DEFAULT_CAPSULES];
    }

    function saveCapsules(list) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
      } catch (e) {
        console.warn('Lỗi lưu time capsules:', e);
      }
    }

    let capsules = loadCapsules();

    function escapeHtml(text) {
      const div = document.createElement('div');
      div.textContent = text;
      return div.innerHTML;
    }

    // 3. Render Capsules List
    const listContainer = document.getElementById('capsule-items-container');
    const badgeCount = document.getElementById('capsule-total-badge');

    function renderCapsules() {
      if (!listContainer) return;
      listContainer.innerHTML = '';

      if (badgeCount) {
        badgeCount.textContent = `${capsules.length} viên nang`;
      }

      if (capsules.length === 0) {
        listContainer.innerHTML = `
          <div class="capsule-empty-state">
            <div class="capsule-empty-icon">⏳</div>
            <p>Hộp thời gian đang trống. Hãy là người đầu tiên niêm phong một thông điệp ý nghĩa!</p>
          </div>
        `;
        return;
      }

      capsules.forEach(c => {
        const card = document.createElement('div');
        card.className = 'capsule-card';
        card.id = `card-${c.id}`;

        card.innerHTML = `
          <div class="capsule-card-top">
            <div class="capsule-sender-info">
              <span class="capsule-sender-icon">${c.isDefault ? '💎' : '👤'}</span>
              <span class="capsule-sender-name">${escapeHtml(c.sender)}</span>
            </div>
            <span class="capsule-tag-pill tag-${c.tag}">${escapeHtml(c.tagLabel)}</span>
          </div>
          <div class="capsule-meta-date">
            <span>🕒 Niêm phong: ${escapeHtml(c.date)}</span>
          </div>
          <div class="capsule-sealed-banner">
            <div class="capsule-sealed-status">
              <span class="status-icon">🔒</span>
              <span class="status-text">Nội dung đã niêm phong</span>
            </div>
            <button type="button" class="capsule-btn-toggle" data-id="${c.id}" aria-label="Mở niêm phong thông điệp">
              <span class="toggle-text">👁️ Mở niêm phong</span>
            </button>
          </div>
          <div class="capsule-message-body">
            <p>${escapeHtml(c.message)}</p>
          </div>
          ${!c.isDefault ? `
          <div class="capsule-card-footer">
            <button type="button" class="capsule-btn-delete" data-id="${c.id}" title="Xóa viên nang này" aria-label="Xóa">
              <span>🗑️ Xóa</span>
            </button>
          </div>` : ''}
        `;

        // Toggle Open/Close Event
        const toggleBtn = card.querySelector('.capsule-btn-toggle');
        const toggleText = card.querySelector('.toggle-text');
        const statusIcon = card.querySelector('.status-icon');
        const statusText = card.querySelector('.status-text');

        toggleBtn.addEventListener('click', () => {
          const isRevealed = card.classList.toggle('revealed');
          if (isRevealed) {
            toggleText.textContent = '🔒 Thu gọn';
            statusIcon.textContent = '🔓';
            statusText.textContent = 'Đã mở khóa xem';
          } else {
            toggleText.textContent = '👁️ Mở niêm phong';
            statusIcon.textContent = '🔒';
            statusText.textContent = 'Nội dung đã niêm phong';
          }
        });

        // Delete Event (User created only)
        const deleteBtn = card.querySelector('.capsule-btn-delete');
        if (deleteBtn) {
          deleteBtn.addEventListener('click', () => {
            if (confirm('Bạn có chắc chắn muốn xóa viên nang này khỏi Hộp Thời Gian không?')) {
              capsules = capsules.filter(item => item.id !== c.id);
              saveCapsules(capsules);
              renderCapsules();
              showToast('Đã xóa viên nang thành công!', '🗑️');
            }
          });
        }

        listContainer.appendChild(card);
      });
    }

    renderCapsules();

    // 4. Form Character Counter
    const senderInput = document.getElementById('capsule-sender');
    const tagSelect = document.getElementById('capsule-tag');
    const messageInput = document.getElementById('capsule-message');
    const charCountEl = document.getElementById('capsule-char-count');
    const sealBtn = document.getElementById('btn-seal-capsule');

    if (messageInput && charCountEl) {
      messageInput.addEventListener('input', () => {
        charCountEl.textContent = messageInput.value.length;
      });
    }

    // 5. Seal Submission Handler
    if (sealBtn) {
      sealBtn.addEventListener('click', () => {
        const sender = senderInput.value.trim() || 'Người bạn bí ẩn';
        const tagVal = tagSelect.value;
        const tagText = tagSelect.options[tagSelect.selectedIndex].text;
        const message = messageInput.value.trim();

        if (!message) {
          showToast('Vui lòng nhập nội dung trước khi niêm phong!', '⚠️');
          messageInput.focus();
          return;
        }

        const now = new Date();
        const formattedDate = `${now.getDate().toString().padStart(2, '0')}/${(now.getMonth() + 1).toString().padStart(2, '0')}/${now.getFullYear()}, ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

        const newCapsule = {
          id: 'capsule-' + Date.now(),
          sender: sender,
          tag: tagVal,
          tagLabel: tagText,
          date: formattedDate,
          message: message,
          isDefault: false
        };

        capsules.unshift(newCapsule);
        saveCapsules(capsules);

        // Reset form
        messageInput.value = '';
        senderInput.value = '';
        if (charCountEl) charCountEl.textContent = '0';

        renderCapsules();

        // Highlight newly added card
        const newCard = document.getElementById(`card-${newCapsule.id}`);
        if (newCard) {
          newCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          newCard.style.borderColor = 'var(--primary-gold)';
          setTimeout(() => {
            newCard.style.borderColor = '';
          }, 2000);
        }

        showToast('Đã niêm phong thành công viên nang vào Hộp Thời Gian!', '🎉');
      });
    }
  }

  // DOM Content Loaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
