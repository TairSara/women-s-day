// Wait for DOM to load
document.addEventListener('DOMContentLoaded', async () => {
    let pageFlip;
    let totalPages = 6;
    let pagesData = [];
    let audioContext = null;

    // Initialize audio context on first user interaction
    function initAudio() {
        if (!audioContext) {
            try {
                audioContext = new (window.AudioContext || window.webkitAudioContext)();
            } catch (e) {
                console.log('Audio not supported');
            }
        }
    }

    // Create realistic newspaper flip sound effect using Web Audio API
    function createFlipSound() {
        if (!audioContext) return;

        try {
            const now = audioContext.currentTime;

            // Create white noise for realistic paper sound
            const bufferSize = audioContext.sampleRate * 0.2; // 0.2 seconds
            const buffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
            const data = buffer.getChannelData(0);

            // Generate noise with envelope
            for (let i = 0; i < bufferSize; i++) {
                const envelope = Math.exp(-i / (bufferSize / 8)); // Quick decay
                data[i] = (Math.random() * 2 - 1) * envelope * 0.3;
            }

            const noise = audioContext.createBufferSource();
            noise.buffer = buffer;

            // High-pass filter for crisp paper sound
            const highpass = audioContext.createBiquadFilter();
            highpass.type = 'highpass';
            highpass.frequency.value = 2000;

            // Band-pass filter for mid-range crinkle
            const bandpass = audioContext.createBiquadFilter();
            bandpass.type = 'bandpass';
            bandpass.frequency.value = 800;
            bandpass.Q.value = 1;

            const masterGain = audioContext.createGain();
            masterGain.gain.setValueAtTime(0.15, now);
            masterGain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

            // Connect: noise -> filters -> gain -> destination
            noise.connect(highpass);
            highpass.connect(bandpass);
            bandpass.connect(masterGain);
            masterGain.connect(audioContext.destination);

            noise.start(now);
            noise.stop(now + 0.2);
        } catch (e) {
            console.log('Error playing sound:', e);
        }
    }

    // Load pages data directly from static files
    async function loadPages() {
        // Define the pages directly - 5 content pages + 1 back page
        const pages = [
            { page: 1, image: '/static/pages/001.webp', exists: true },
            { page: 2, image: '/static/pages/002.webp', exists: true },
            { page: 3, image: '/static/pages/003.webp', exists: true },
            { page: 4, image: '/static/pages/004.webp', exists: true },
            { page: 5, image: '/static/pages/005.webp', exists: true },
            { page: 6, image: null, exists: false } // Back page (empty)
        ];

        pagesData = pages;
        totalPages = pages.length;
        return pagesData;
    }

    // Create page element
    function createPage(pageNum, imageUrl = null) {
        const pageDiv = document.createElement('div');
        pageDiv.className = 'page';
        pageDiv.setAttribute('data-density', 'hard');

        const contentDiv = document.createElement('div');
        contentDiv.className = 'page-content';

        if (imageUrl) {
            // If image exists, display it
            const img = document.createElement('img');
            img.src = imageUrl;
            img.alt = `עמוד ${pageNum}`;
            img.onerror = () => {
                // If image fails to load, show placeholder
                contentDiv.innerHTML = `<div class="page-placeholder">${pageNum}</div>`;
            };
            contentDiv.appendChild(img);
        } else {
            // For last page (back cover), leave it empty with catalog background
            if (pageNum === 6) {
                // Empty back page - same color as catalog
                contentDiv.style.background = '#f1faf7';
            } else {
                // Show placeholder with page number for other missing pages
                const placeholder = document.createElement('div');
                placeholder.className = 'page-placeholder';
                placeholder.textContent = pageNum;
                contentDiv.appendChild(placeholder);
            }
        }

        pageDiv.appendChild(contentDiv);
        return pageDiv;
    }

    // Check if mobile device
    function isMobile() {
        return window.innerWidth <= 768;
    }

    // Initialize the flipbook
    async function initFlipbook() {
        const pages = await loadPages();
        const flipbookElement = document.getElementById('flipbook');

        // Clear existing content
        flipbookElement.innerHTML = '';

        // Create all pages
        pages.forEach(pageData => {
            const page = createPage(pageData.page, pageData.image);
            flipbookElement.appendChild(page);
        });

        // Calculate page dimensions to fit screen perfectly
        const mobile = isMobile();
        const viewportHeight = window.innerHeight;
        const viewportWidth = window.innerWidth;

        // Calculate optimal size
        let pageHeight, pageWidth;

        if (mobile) {
            // Mobile: single page, fit within viewport
            pageHeight = viewportHeight * 0.7;
            pageWidth = pageHeight / 1.414; // A4 ratio

            // Make sure width also fits
            if (pageWidth > viewportWidth * 0.9) {
                pageWidth = viewportWidth * 0.9;
                pageHeight = pageWidth * 1.414;
            }
        } else {
            // Desktop: spread (two pages), fit to screen
            pageHeight = viewportHeight * 0.95;
            pageWidth = pageHeight / 1.414;
        }

        // Initialize PageFlip - Natural newspaper-style flipping
        pageFlip = new St.PageFlip(flipbookElement, {
            width: pageWidth,
            height: pageHeight,
            size: 'fixed',
            minWidth: pageWidth,
            maxWidth: pageWidth,
            minHeight: pageHeight,
            maxHeight: pageHeight,
            showCover: true, // First page centered alone
            mobileScrollSupport: false,
            swipeDistance: 30,
            disableFlipByClick: false, // Enable click and drag behavior
            autoSize: false,
            maxShadowOpacity: 0.5,
            drawShadow: true,
            flippingTime: 1000, // Smoother, more natural flip speed
            usePortrait: mobile,
            startPage: 0,
            useMouseEvents: true,
            startZIndex: 0,
            renderOnlyVisible: false
        });

        pageFlip.loadFromHTML(document.querySelectorAll('.page'));

        // Add special class to first page for styling
        const firstPageElement = document.querySelector('.page:first-child');
        if (firstPageElement) {
            firstPageElement.classList.add('cover-page');

            // Add touch handler for mobile ONLY - page curl interaction
            if (isMobile()) {
                firstPageElement.addEventListener('touchend', (e) => {
                    const rect = firstPageElement.getBoundingClientRect();
                    const touch = e.changedTouches[0];
                    const touchX = touch.clientX - rect.left;
                    const touchY = touch.clientY - rect.top;

                    // Check if touch is in bottom-left corner (curl area)
                    const isInCurlArea = touchX < 120 && touchY > rect.height - 120;

                    if (isInCurlArea && pageFlip.getCurrentPageIndex() === 0) {
                        console.log('Page curl touched, advancing to next page');
                        e.preventDefault();
                        e.stopPropagation();
                        initAudio();
                        pageFlip.turnToPage(1);
                    }
                });
            }
        }

        // Initialize audio on first user interaction with the flipbook
        const flipbookContainer = document.getElementById('flipbook');
        flipbookContainer.addEventListener('click', () => initAudio(), { once: true });
        flipbookContainer.addEventListener('touchstart', () => initAudio(), { once: true });

        // Update page counter on flip
        pageFlip.on('flip', (e) => {
            // Play flip sound
            createFlipSound();

            updatePageCounter();
            updateNavigationButtons();

            // Page curl stays visible - removed flipped class logic
        });

        // Change page event
        pageFlip.on('changeState', (e) => {
            updatePageCounter();
            updateNavigationButtons();
        });

        // Initial update
        updatePageCounter();
        updateNavigationButtons();
    }

    // Auto-hide timer for page counter
    let counterTimeout;

    // Update page counter display with auto-hide
    function updatePageCounter() {
        if (pageFlip) {
            const currentPage = pageFlip.getCurrentPageIndex() + 1;
            const currentPageElement = document.getElementById('current-page');
            const totalPagesElement = document.getElementById('total-pages');
            const counterElement = document.querySelector('.page-counter');

            if (currentPageElement) {
                // Show actual page number, but cap at 5 (hide the empty 6th page from counter)
                currentPageElement.textContent = Math.min(currentPage, 5);
            }
            if (totalPagesElement) {
                // Show 5 pages to user (hiding the technical 6th empty page)
                totalPagesElement.textContent = 5;
            }

            // Show counter
            if (counterElement) {
                counterElement.classList.add('show');

                // Clear previous timeout
                clearTimeout(counterTimeout);

                // Hide after 2 seconds
                counterTimeout = setTimeout(() => {
                    counterElement.classList.remove('show');
                }, 2000);
            }
        }
    }

    // Update navigation button states
    function updateNavigationButtons() {
        if (pageFlip) {
            const prevBtn = document.getElementById('prev-btn');
            const nextBtn = document.getElementById('next-btn');
            const currentPage = pageFlip.getCurrentPageIndex();

            const shouldDisablePrev = currentPage === 0;
            const shouldDisableNext = currentPage >= totalPages - 1;

            prevBtn.disabled = shouldDisablePrev;
            nextBtn.disabled = shouldDisableNext;

            console.log('Navigation buttons updated. Current page:', currentPage, 'Prev disabled:', shouldDisablePrev, 'Next disabled:', shouldDisableNext);
        }
    }

    // Navigation button handlers
    // Right button (next-btn) = go forward
    // Left button (prev-btn) = go backward
    const nextBtn = document.getElementById('next-btn');
    const prevBtn = document.getElementById('prev-btn');

    const handleNext = (e) => {
        // Check if button is disabled
        if (nextBtn.disabled || nextBtn.classList.contains('disabled')) {
            console.log('Next button is disabled, ignoring click');
            return;
        }

        e.preventDefault();
        e.stopPropagation();
        initAudio();
        if (pageFlip) {
            const currentPage = pageFlip.getCurrentPageIndex();

            if (!pageFlip.isFlipping) {
                // Use turnToPage for consistent navigation - move forward 1 page
                const targetPage = Math.min(totalPages - 1, currentPage + 1);
                pageFlip.turnToPage(targetPage);
            }
        }
    };

    const handlePrev = (e) => {
        // Check if button is disabled
        if (prevBtn.disabled || prevBtn.classList.contains('disabled')) {
            console.log('Prev button is disabled, ignoring click');
            return;
        }

        e.preventDefault();
        e.stopPropagation();
        console.log('Prev button clicked/touched');
        initAudio();
        if (pageFlip) {
            const currentPage = pageFlip.getCurrentPageIndex();
            console.log('PageFlip exists, going prev. Current page:', currentPage);

            if (!pageFlip.isFlipping) {
                // Use turnToPage for more reliable navigation
                const targetPage = Math.max(0, currentPage - 1);
                console.log('Turning to page:', targetPage);
                pageFlip.turnToPage(targetPage);
            } else {
                console.log('PageFlip is currently flipping, skipping');
            }
        } else {
            console.log('PageFlip not initialized');
        }
    };

    // Prevent default touch behavior to avoid double triggering
    const preventDefaultTouch = (e) => {
        e.preventDefault();
    };

    nextBtn.addEventListener('click', handleNext);
    nextBtn.addEventListener('touchstart', preventDefaultTouch, { passive: false });
    nextBtn.addEventListener('touchend', handleNext, { passive: false });

    prevBtn.addEventListener('click', handlePrev);
    prevBtn.addEventListener('touchstart', preventDefaultTouch, { passive: false });
    prevBtn.addEventListener('touchend', handlePrev, { passive: false });

    // Keyboard navigation
    // Right arrow = next (forward)
    // Left arrow = previous (backward)
    let lastKeyPressTime = 0;
    const keyPressDelay = 500; // Minimum delay between key presses in ms

    document.addEventListener('keydown', (e) => {
        if (!pageFlip) {
            console.log('PageFlip not initialized');
            return;
        }

        const now = Date.now();
        console.log('Key pressed:', e.key, 'Time since last press:', now - lastKeyPressTime, 'currentPage:', pageFlip.getCurrentPageIndex());

        // Prevent rapid key presses
        if (now - lastKeyPressTime < keyPressDelay) {
            console.log('Key press too soon, ignoring');
            return;
        }

        if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
            e.preventDefault();
            lastKeyPressTime = now;
            const currentPage = pageFlip.getCurrentPageIndex();
            const targetPage = Math.min(totalPages - 1, currentPage + 1);
            console.log('Keyboard RIGHT: moving from', currentPage, 'to', targetPage);
            pageFlip.turnToPage(targetPage);
        } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
            e.preventDefault();
            lastKeyPressTime = now;
            const currentPage = pageFlip.getCurrentPageIndex();
            const targetPage = Math.max(0, currentPage - 1);
            console.log('Keyboard LEFT: moving from', currentPage, 'to', targetPage);
            pageFlip.turnToPage(targetPage);
        }
    });

    // Handle window resize
    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            if (pageFlip) {
                const currentPage = pageFlip.getCurrentPageIndex();
                initFlipbook().then(() => {
                    pageFlip.turnToPage(currentPage);
                });
            }
        }, 250);
    });

    // Initialize the flipbook
    await initFlipbook();
});
