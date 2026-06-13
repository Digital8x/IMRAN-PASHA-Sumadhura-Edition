let ytPlayer;
let videoUnlocked = localStorage.getItem('leads_submitted') === 'true';
let timeChecker;
const VIDEO_START_TIME = 16;
const VIDEO_PLAY_DURATION = 5;

function onYouTubeIframeAPIReady() {
    const playerEl = document.getElementById('youtube-player');
    if (!playerEl) return;
    ytPlayer = new YT.Player('youtube-player', {
        videoId: 'D_Ik9uj-FHE',
        playerVars: {
            'start': VIDEO_START_TIME,
            'rel': 0,
            'modestbranding': 1,
            'playsinline': 1
        },
        events: {
            'onStateChange': onPlayerStateChange
        }
    });
}

function onPlayerStateChange(event) {
    if (event.data == YT.PlayerState.PLAYING && !videoUnlocked) {
        if (timeChecker) clearInterval(timeChecker);
        timeChecker = setInterval(() => {
            if (ytPlayer && ytPlayer.getCurrentTime() >= (VIDEO_START_TIME + VIDEO_PLAY_DURATION) && !videoUnlocked) {
                ytPlayer.pauseVideo();
                clearInterval(timeChecker);
                
                const leadModal = document.getElementById('leadModal');
                const modalSource = document.getElementById('modal-source');
                if (leadModal && modalSource) {
                    leadModal.classList.add('active');
                    modalSource.value = "Walkthrough Video Unlock";
                }
            }
        }, 500);
    } else {
        if (timeChecker) clearInterval(timeChecker);
    }
}

function unlockVideo() {
    videoUnlocked = true;
    if (timeChecker) clearInterval(timeChecker);
    if (ytPlayer && typeof ytPlayer.playVideo === 'function') {
        ytPlayer.playVideo();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    
    // Video Overlay Click Handler
    const videoOverlay = document.getElementById('video-overlay');
    if (videoOverlay) {
        videoOverlay.addEventListener('click', () => {
            if (ytPlayer && typeof ytPlayer.getPlayerState === 'function') {
                const state = ytPlayer.getPlayerState();
                if (state === YT.PlayerState.PLAYING) {
                    ytPlayer.pauseVideo();
                } else {
                    ytPlayer.playVideo();
                }
            }
        });
    }
    
    // 1. Header Scroll Effect
    const header = document.querySelector('.header');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    });

    // 2. Mobile Menu Toggle
    const mobileBtn = document.querySelector('.mobile-menu-btn');
    const closeBtn = document.querySelector('.close-menu-btn');
    const mobileOverlay = document.querySelector('.mobile-nav-overlay');
    const mobileLinks = document.querySelectorAll('.mobile-nav-links a');

    if(mobileBtn && closeBtn && mobileOverlay) {
        mobileBtn.addEventListener('click', () => mobileOverlay.classList.add('active'));
        closeBtn.addEventListener('click', () => mobileOverlay.classList.remove('active'));
        mobileLinks.forEach(link => {
            link.addEventListener('click', () => mobileOverlay.classList.remove('active'));
        });
    }

    // 3. Intersection Observer for scroll animations (fade-in-up)
    const fadeElements = document.querySelectorAll('.fade-in-up');
    const fadeObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                fadeObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });

    fadeElements.forEach(el => fadeObserver.observe(el));

    // 4. Floor Plan Blur/Unlock Logic
    const unlockFloorplans = () => {
        const containers = document.querySelectorAll('.floorplan-container');
        containers.forEach(container => {
            container.classList.add('unlocked');
        });
    };

    // Check if user already submitted lead
    if (localStorage.getItem('leads_submitted') === 'true') {
        unlockFloorplans();
    }

    // 5. Floor Plan Tabs
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Remove active class from all
            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));
            
            // Add active class to clicked
            btn.classList.add('active');
            const tabId = btn.getAttribute('data-tab');
            document.getElementById(`tab-${tabId}`).classList.add('active');
        });
    });

    // 6. Amenities Tabs (Celebrate Leisure)
    const amenitiesTabs = document.querySelectorAll('.a-tab');
    const amenitiesGrids = document.querySelectorAll('.amenities-grid');

    if(amenitiesTabs.length > 0) {
        amenitiesTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                amenitiesTabs.forEach(t => t.classList.remove('active'));
                amenitiesGrids.forEach(g => g.classList.remove('active'));
                
                tab.classList.add('active');
                const target = tab.getAttribute('data-target');
                document.getElementById(`grid-${target}`).classList.add('active');
            });
        });
    }

    // 7. Lightbox Gallery
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.querySelector('.lightbox-img');
    const lightboxClose = document.querySelector('.lightbox-close');
    const lightboxPrev = document.querySelector('.lightbox-prev');
    const lightboxNext = document.querySelector('.lightbox-next');
    const galleryImages = Array.from(document.querySelectorAll('.lightbox-trigger'));
    
    let currentImageIndex = 0;

    if(galleryImages.length > 0 && lightbox) {
        galleryImages.forEach((img, index) => {
            img.addEventListener('click', () => {
                currentImageIndex = index;
                showLightboxImage();
                lightbox.classList.add('active');
            });
        });

        lightboxClose.addEventListener('click', () => lightbox.classList.remove('active'));
        
        lightboxPrev.addEventListener('click', () => {
            currentImageIndex = (currentImageIndex > 0) ? currentImageIndex - 1 : galleryImages.length - 1;
            showLightboxImage();
        });

        lightboxNext.addEventListener('click', () => {
            currentImageIndex = (currentImageIndex < galleryImages.length - 1) ? currentImageIndex + 1 : 0;
            showLightboxImage();
        });
    }

    function showLightboxImage() {
        if(galleryImages[currentImageIndex]) {
            lightboxImg.src = galleryImages[currentImageIndex].src;
        }
    }

    // 8. Universal Modal Trigger Logic
    const leadModal = document.getElementById('leadModal');
    const modalClose = document.querySelector('.modal-close');
    const modalSourceInput = document.getElementById('modal-source');
    const ctaTriggers = document.querySelectorAll('.cta-trigger');

    ctaTriggers.forEach(trigger => {
        trigger.addEventListener('click', (e) => {
            e.preventDefault();
            const source = trigger.getAttribute('data-source') || 'Universal CTA';
            if(modalSourceInput) modalSourceInput.value = source;
            
            // Auto-select BHK based on trigger button text or source
            const bhkSelect = document.getElementById('modal-bhk-select');
            if(bhkSelect) {
                bhkSelect.value = '2 BHK'; // Default
                const triggerText = trigger.textContent.toUpperCase();
                const sourceUpper = source.toUpperCase();
                
                if (sourceUpper.includes('3 BHK') || triggerText.includes('3 BHK') || sourceUpper.includes('3BHK')) {
                    bhkSelect.value = '3 BHK';
                } else if (sourceUpper.includes('4 BHK') || triggerText.includes('4 BHK') || sourceUpper.includes('4BHK')) {
                    bhkSelect.value = '4 BHK';
                }
            }

            if(leadModal) leadModal.classList.add('active');
        });
    });

    if(modalClose && leadModal) {
        modalClose.addEventListener('click', () => leadModal.classList.remove('active'));
        // Close on outside click
        leadModal.addEventListener('click', (e) => {
            if(e.target === leadModal) leadModal.classList.remove('active');
        });
    }

    // Initialize intl-tel-input for all phone fields
    const phoneInputs = document.querySelectorAll('input[type="tel"]');
    const itis = [];
    
    phoneInputs.forEach(input => {
        const iti = window.intlTelInput(input, {
            initialCountry: "auto",
            geoIpLookup: function(success, failure) {
                fetch("https://ipapi.co/json")
                    .then(res => res.json())
                    .then(data => success(data.country_code))
                    .catch(() => success("in")); // Fallback to India
            },
            utilsScript: "https://cdn.jsdelivr.net/npm/intl-tel-input@23.0.4/build/js/utils.js",
            separateDialCode: true,
        });
        itis.push({ input, iti });
    });

    // 9. Form Submission (AJAX)
    const forms = document.querySelectorAll('.main-form');
    
    forms.forEach(form => {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const submitBtn = form.querySelector('button[type="submit"]');
            const statusDiv = form.querySelector('.form-status');
            
            // Basic frontend validation
            if (!form.checkValidity()) {
                form.reportValidity();
                return;
            }

            // Find if this form has an iti instance
            const phoneInput = form.querySelector('input[type="tel"]');
            const itiObj = itis.find(i => i.input === phoneInput);

            // Validate phone format strictly
            if (itiObj && !itiObj.iti.isValidNumber()) {
                statusDiv.textContent = 'Please enter a valid phone number.';
                statusDiv.className = 'form-status text-error';
                return;
            }

            const formData = new FormData(form);
            
            // Overwrite the phone field with the formatted international number
            if (itiObj) {
                formData.set('phone', itiObj.iti.getNumber());
            }

            // Capture Advanced Lead Context (UTMs, URL, Referrer)
            const urlParams = new URLSearchParams(window.location.search);
            formData.append('utm_source', urlParams.get('utm_source') || '');
            formData.append('utm_medium', urlParams.get('utm_medium') || '');
            formData.append('utm_campaign', urlParams.get('utm_campaign') || '');
            formData.append('utm_term', urlParams.get('utm_term') || '');
            formData.append('utm_content', urlParams.get('utm_content') || '');
            formData.append('refer_url', document.referrer || '');
            formData.append('page_url', window.location.href);
            formData.append('project', 'Sumadhura Edition');
            
            submitBtn.disabled = true;
            submitBtn.textContent = 'Sending...';
            statusDiv.textContent = '';
            statusDiv.className = 'form-status';

            try {
                const response = await fetch('backend/leads.php?action=submit', {
                    method: 'POST',
                    body: formData
                });
                
                const result = await response.json();
                
                if (result.success) {
                    statusDiv.textContent = result.message;
                    statusDiv.classList.add('text-success');
                    form.reset();
                    
                    // Only unlock floorplans if submission came from Floor Plan section
                    const submittedSource = form.querySelector('[name="source"]')?.value || '';
                    const lowerSource = submittedSource.toLowerCase();
                    
                    if (lowerSource.includes('floor') || lowerSource.includes('plan')) {
                        localStorage.setItem('leads_submitted', 'true');
                        unlockFloorplans();
                    }
                    
                    // Only unlock/play video if submission came from Walkthrough
                    if (lowerSource.includes('walkthrough') && typeof unlockVideo === 'function') {
                        unlockVideo();
                    }

                    // If modal, close after 3 seconds
                    if (form.id === 'modal-form') {
                        setTimeout(() => {
                            leadModal.classList.remove('active');
                            statusDiv.textContent = '';
                        }, 3000);
                    }
                } else {
                    statusDiv.textContent = result.message || 'Something went wrong. Please try again.';
                    statusDiv.classList.add('text-error');
                }
            } catch (error) {
                statusDiv.textContent = 'Network error. Please try again.';
                statusDiv.classList.add('text-error');
            } finally {
                submitBtn.disabled = false;
                submitBtn.textContent = form.id === 'modal-form' ? 'Send Enquiry' : 'Get a Free Quote';
            }
        });
    });

    // ==========================================
    // Location Section Logic
    // ==========================================
    const locationData = {
        business: [
            { name: "ITPL Tech Park", image: "images/itpl.webp", distance: "10 mins" },
            { name: "RMZ Ecoworld", image: "images/rmz-ecoworld.webp", distance: "20 mins" },
            { name: "EPIP Zone", image: "images/epip-zone.webp", distance: "12 mins" },
            { name: "GR Tech Park", image: "images/gr-tech-park.webp", distance: "15 mins" },
            { name: "Prestige Tech Park", image: "images/prestige-tech-park.webp", distance: "18 mins" }
        ],
        hospitals: [
            { name: "Vydehi Hospital", image: "images/vydehi.webp", distance: "10 mins" },
            { name: "Columbia Asia Hospital", image: "images/columbia-asia.webp", distance: "12 mins" },
            { name: "Narayana Multispeciality Hospital", image: "images/narayana.webp", distance: "20 mins" },
            { name: "Cloudnine Hospital", image: "images/cloudnine.webp", distance: "10 mins" },
            { name: "Sri Sathya Sai Institute of Medical Sciences", image: "images/sathya-sai.webp", distance: "7 mins" }
        ],
        entertainment: [
            { name: "Phoenix Marketcity", image: "images/phoenix.webp", distance: "22 mins" },
            { name: "Nexus Shantiniketan Mall", image: "images/nexus.webp", distance: "15 mins" },
            { name: "Brookefield Mall", image: "images/brookefield-mall.webp", distance: "15 mins" },
            { name: "Park Square Mall", image: "images/park-square.webp", distance: "10 mins" },
            { name: "Forum Nexus Mall", image: "images/forum-nexus.webp", distance: "25 mins" }
        ],
        connectivity: [
            { name: "Hopefarm Metro Station", image: "images/hopefarm.webp", distance: "15 mins" },
            { name: "Pattandur Agrahara Metro Station", image: "images/pattandur.webp", distance: "10 mins" },
            { name: "Whitefield (Kadugodi) Metro Station", image: "images/m1.webp", distance: "12 mins" },
            { name: "Kadugodi Tree Park Metro Station", image: "images/m2.webp", distance: "15 mins" }
        ]
    };

    const locationBtns = document.querySelectorAll('.category-btn');
    const locationModal = document.getElementById('locationModal');
    const closeLocationModal = document.querySelector('.close-location-modal');
    const modalCategoryTitle = document.getElementById('modalCategoryTitle');
    const locationSwiperWrapper = document.getElementById('locationSwiperWrapper');
    let locationSwiperInstance = null;

    locationBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Update Active Class
            locationBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const category = btn.getAttribute('data-category');
            const categoryText = btn.textContent.trim();
            const data = locationData[category];

            // Build Slides
            locationSwiperWrapper.innerHTML = '';
            data.forEach(item => {
                const slideHTML = `
                    <div class="swiper-slide">
                        <div class="location-card">
                            <img src="${item.image}" alt="${item.name}">
                            <div class="location-card-content">
                                <h3 class="location-card-title">${item.name}</h3>
                                <span class="location-card-distance">${item.distance}</span>
                            </div>
                        </div>
                    </div>
                `;
                locationSwiperWrapper.insertAdjacentHTML('beforeend', slideHTML);
            });

            // Set Title and Open Modal
            modalCategoryTitle.textContent = categoryText;
            locationModal.classList.add('active');

            // Initialize or Update Swiper
            if (locationSwiperInstance) {
                locationSwiperInstance.destroy(true, true);
            }
            
            locationSwiperInstance = new Swiper('.location-swiper', {
                slidesPerView: 1,
                spaceBetween: 20,
                navigation: {
                    nextEl: '.location-next',
                    prevEl: '.location-prev',
                },
                breakpoints: {
                    640: { slidesPerView: 2 },
                    992: { slidesPerView: 3 }
                }
            });
        });
    });

    if (closeLocationModal) {
        closeLocationModal.addEventListener('click', () => {
            locationModal.classList.remove('active');
        });
    }
    
    if (locationModal) {
        locationModal.addEventListener('click', (e) => {
            if (e.target === locationModal) {
                locationModal.classList.remove('active');
            }
        });
    }

});

    // ==========================================
    // FAQ Accordion
    // ==========================================
    const faqQuestions = document.querySelectorAll('.faq-question');
    faqQuestions.forEach(question => {
        question.addEventListener('click', () => {
            const answer = question.nextElementSibling;
            const isActive = question.classList.contains('active');
            
            // Close all other open answers
            faqQuestions.forEach(q => {
                q.classList.remove('active');
                if(q.nextElementSibling) {
                    q.nextElementSibling.style.maxHeight = null;
                }
            });
            
            // Open clicked answer if it was not already active
            if (!isActive) {
                question.classList.add('active');
                answer.style.maxHeight = answer.scrollHeight + 'px';
            }
        });
    });

    // ==========================================
    // Content Protection (Disable Right Click, F12, Copy, etc.)
    // ==========================================
    document.addEventListener('contextmenu', event => event.preventDefault()); // Disable Right Click

    document.addEventListener('keydown', event => {
        // Disable F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U
        if (event.keyCode === 123 || 
           (event.ctrlKey && event.shiftKey && (event.keyCode === 73 || event.keyCode === 74)) || 
           (event.ctrlKey && event.keyCode === 85)) {
            event.preventDefault();
            return false;
        }
    });

    document.addEventListener('dragstart', event => {
        if (event.target.tagName && event.target.tagName.toLowerCase() === 'img') {
            event.preventDefault(); // Disable Image Dragging
        }
    });

    document.addEventListener('copy', event => {
        event.preventDefault(); // Disable Copy
    });

    document.addEventListener('selectstart', event => {
        event.preventDefault(); // Disable Text Selection
    });
