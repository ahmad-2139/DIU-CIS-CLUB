// --- FIREBASE CONFIGURATION ---
const firebaseConfig = {
    apiKey: "YOUR_API_KEY_HERE",
    authDomain: "your-project.firebaseapp.com",
    projectId: "your-project-id",
    storageBucket: "your-project.appspot.com",
    messagingSenderId: "123456789",
    appId: "1:123456789:web:abc123def456"
};

// --- GLOBAL VARIABLES ---
let currentUser = null;
let userData = null;
let auth = null;
let db = null;
let sliderInterval = null;
let currentSlide = 0;
const totalSlides = 5;

// Gallery Variables
let currentGalleryImages = [];
let currentImageIndex = 0;

// --- EVENT DATA ---
const eventData = {
    1: {
        title: "National Language fest 2025",
        date: "5-6 December",
        imageCount: 1,
        images: [
            "fest 1.jpg"
        ]
    },
    2: {
        title: "AI fest 2025",
        date: "25 November",
        imageCount: 7,
        images: [
            "ai 1.jpg",
            "ai 2.jpg",
            "ai 3.jpg"
        ]
    },
    3: {
        title: "CIS Premier League Season 5",
        date: "Ongoing Tournament",
        imageCount: 10,
        images: [
            "cricket1.jpg",
            "cricket2.jpg",
            "cricket3.jpg",
            "cricket4.jpg",
            "cricket5.jpg",
            "cricket6.jpg",
            "cricket7.jpg",
            "cricket8.jpg"
        ]
    },
    4: {
        title: "CIS Department Tour 2025",
        date: "Coming Soon",
        imageCount: 0,
        images: []
    },
    5: {
        title: "CIS Futsal Tournament 2025",
        date: "11-13 February",
        imageCount: 3,
        images: [
            "futsal1.jpg",
            "futsal2.jpg",
            "futsal3.jpg"
        ]
    }
};

// --- GALLERY DATA ---
const galleryData = {
    1: {
        title: "DIU Club Enrollment Campaign",
        date: "18-19 October",
        imageCount: 4,
        images: [
            "club1.jpg",
            "club2.jpg",
            "club3.jpg",
            "club4.jpg"
        ]
    },
    2: {
        title: "Orientation Fall 2025",
        date: "Fall 2025",
        imageCount: 2,
        images: [
            "fall1.jpg",
            "fall2.jpg"
        ]
    },
    3: {
        title: "DIU Club Enrollment Campaign",
        date: "25 March",
        imageCount: 6,
        images: [
            "clb1.jpg",
            "clb2.jpg",
            "clb3.jpg",
            "clb4.jpg",
            "clb5.jpg",
            "clb6.jpg"
        ]
    },
    4: {
        title: "Orientation Summer 2025",
        date: "Summer 2025",
        imageCount: 5,
        images: [
            "sum1.jpg",
            "sum2.jpg",
            "sum3.jpg",
            "sum4.jpg",
            "sum5.jpg"
        ]
    },
    5: {
        title: "Meet The Alumni with Ifter",
        date: "15 March",
        imageCount: 7,
        images: [
            "ifter1.jpg",
            "ifter2.jpg",
            "ifter3.jpg",
            "ifter4.jpg",
            "ifter5.jpg",
            "ifter6.jpg",
            "ifter7.jpg"
        ]
    }
};

// --- FIREBASE INITIALIZATION ---
function initializeFirebase() {
    try {
        if (!firebase.apps.length) {
            firebase.initializeApp(firebaseConfig);
        }
        auth = firebase.auth();
        db = firebase.firestore();
        
        auth.onAuthStateChanged(handleAuthStateChanged);
        
        console.log("Firebase initialized successfully");
        return true;
    } catch (error) {
        console.error("Firebase initialization error:", error);
        showToast("Firebase initialization failed. Please check your configuration.");
        return false;
    }
}

// --- SLIDER FUNCTIONS ---
function initSlider() {
    const slides = document.querySelectorAll('.slide');
    const dots = document.querySelectorAll('.slider-dot');
    
    function updateSlider() {
        slides.forEach((slide, index) => {
            slide.classList.remove('active');
            dots[index].classList.remove('active');
            if (index === currentSlide) {
                slide.classList.add('active');
                dots[index].classList.add('active');
            }
        });
    }
    
    function nextSlide() {
        currentSlide = (currentSlide + 1) % totalSlides;
        updateSlider();
        resetSliderInterval();
    }
    
    function prevSlide() {
        currentSlide = (currentSlide - 1 + totalSlides) % totalSlides;
        updateSlider();
        resetSliderInterval();
    }
    
    function goToSlide(index) {
        currentSlide = index;
        updateSlider();
        resetSliderInterval();
    }
    
    function resetSliderInterval() {
        if (sliderInterval) {
            clearInterval(sliderInterval);
        }
        sliderInterval = setInterval(nextSlide, 5000);
    }
    
    // Set up event listeners
    document.querySelector('.slider-arrow.next').addEventListener('click', nextSlide);
    document.querySelector('.slider-arrow.prev').addEventListener('click', prevSlide);
    
    dots.forEach((dot, index) => {
        dot.addEventListener('click', () => goToSlide(index));
    });
    
    // Start the slider
    updateSlider();
    resetSliderInterval();
    
    // Pause on hover
    const sliderContainer = document.querySelector('.slider-container');
    sliderContainer.addEventListener('mouseenter', () => {
        if (sliderInterval) {
            clearInterval(sliderInterval);
        }
    });
    
    sliderContainer.addEventListener('mouseleave', () => {
        resetSliderInterval();
    });
    
    // Make slider functions globally accessible
    window.nextSlide = nextSlide;
    window.prevSlide = prevSlide;
}

// --- AUTHENTICATION FUNCTIONS ---
async function handleAuthStateChanged(user) {
    currentUser = user;
    
    if (user) {
        document.getElementById('logged-out-view').classList.add('hidden');
        document.getElementById('logged-in-view').classList.remove('hidden');
        document.getElementById('mobile-auth-btn').classList.add('hidden');
        document.getElementById('mobile-logout-btn').classList.remove('hidden');
        
        const displayName = user.displayName || user.email.split('@')[0];
        document.getElementById('nav-user-name').innerText = displayName;
        document.getElementById('profile-display-name').innerText = displayName;
        
        await getUserData(user.uid);
        
        if (window.location.hash === '#auth' || document.getElementById('auth').classList.contains('active')) {
            navigateTo('home');
        }
        
    } else {
        document.getElementById('logged-out-view').classList.remove('hidden');
        document.getElementById('logged-in-view').classList.add('hidden');
        document.getElementById('mobile-auth-btn').classList.remove('hidden');
        document.getElementById('mobile-logout-btn').classList.add('hidden');
        
        userData = null;
    }
}

async function getUserData(userId) {
    try {
        const doc = await db.collection('users').doc(userId).get();
        if (doc.exists) {
            userData = doc.data();
            console.log("User data loaded:", userData);
            
            if (document.getElementById('profile').classList.contains('active')) {
                loadProfileData();
            }
        }
    } catch (error) {
        console.error("Error getting user data:", error);
    }
}

async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPass').value;
    const errorElement = document.getElementById('login-error');
    const loginBtn = document.getElementById('loginBtn');
    const loginBtnText = document.getElementById('loginBtnText');
    const loginSpinner = document.getElementById('loginSpinner');

    try {
        errorElement.classList.add('hidden');
        loginBtn.disabled = true;
        loginBtnText.innerText = "Logging in...";
        loginSpinner.classList.remove('hidden');
        
        const userCredential = await auth.signInWithEmailAndPassword(email, password);
        
        showToast('Login successful! Welcome back!');
        navigateTo('home');
        
    } catch (error) {
        console.error("Login error:", error);
        errorElement.textContent = getErrorMessage(error.code);
        errorElement.classList.remove('hidden');
    } finally {
        loginBtn.disabled = false;
        loginBtnText.innerText = "LOGIN";
        loginSpinner.classList.add('hidden');
    }
}

async function handleSignup(e) {
    e.preventDefault();
    const errorElement = document.getElementById('pass-error');
    const signupBtn = document.getElementById('signupBtn');
    const signupBtnText = document.getElementById('signupBtnText');
    const signupSpinner = document.getElementById('signupSpinner');
    
    const p1 = document.getElementById('regPass').value;
    const p2 = document.getElementById('regConfirmPass').value;
    const terms = document.getElementById('termsAgreement').checked;
    
    if (!terms) {
        showToast("Please agree to the Terms & Conditions");
        return;
    }
    
    if (p1 !== p2) {
        errorElement.textContent = "Passwords do not match!";
        errorElement.style.display = 'block';
        return;
    }
    
    if (p1.length < 6) {
        errorElement.textContent = "Password must be at least 6 characters!";
        errorElement.style.display = 'block';
        return;
    }
    
    errorElement.style.display = 'none';
    
    const name = document.getElementById('regName').value;
    const email = document.getElementById('regEmail').value;
    const password = p1;
    const phone = document.getElementById('regPhone').value;
    const userType = document.querySelector('input[name="userType"]:checked').value;
    
    let additionalData = {};
    
    if (userType === 'cis') {
        const studentId = document.querySelector('#dynamic-fields input[placeholder*="Student ID"]')?.value;
        const batch = document.querySelector('#dynamic-fields select')?.value;
        additionalData = { studentId, batch, department: 'CIS' };
    } else if (userType === 'diu_other') {
        const department = document.querySelector('#dynamic-fields input[placeholder*="Department Name"]')?.value;
        const studentId = document.querySelector('#dynamic-fields input[placeholder*="DIU ID"]')?.value;
        const semester = document.querySelector('#dynamic-fields select')?.value;
        additionalData = { studentId, department, semester };
    } else {
        const institution = document.querySelector('#dynamic-fields input[placeholder*="Institution"]')?.value;
        const department = document.querySelector('#dynamic-fields input[placeholder*="Department"]')?.value;
        additionalData = { institution, department };
    }
    
    try {
        signupBtn.disabled = true;
        signupBtnText.innerText = "Creating Account...";
        signupSpinner.classList.remove('hidden');
        
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        const user = userCredential.user;
        
        await user.updateProfile({
            displayName: name
        });
        
        const userData = {
            uid: user.uid,
            name: name,
            email: email,
            phone: phone || '',
            userType: userType,
            ...additionalData,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
            isActive: true,
            role: 'member',
            membershipStatus: 'active',
            membershipDate: new Date().toISOString().split('T')[0],
            emailVerified: false,
            lastLogin: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        await db.collection('users').doc(user.uid).set(userData);
        
        await user.sendEmailVerification({
            url: window.location.origin,
            handleCodeInApp: true
        });
        
        await sendWelcomeEmail(email, name);
        
        document.getElementById('email-verification-modal').classList.remove('hidden');
        
        document.getElementById('signupForm').reset();
        switchAuthTab('login');
        
    } catch (error) {
        console.error("Signup error:", error);
        errorElement.textContent = getErrorMessage(error.code);
        errorElement.style.display = 'block';
        showToast("Error creating account: " + getErrorMessage(error.code));
    } finally {
        signupBtn.disabled = false;
        signupBtnText.innerText = "REGISTER NOW";
        signupSpinner.classList.add('hidden');
    }
}

async function sendWelcomeEmail(email, name) {
    try {
        console.log(`Welcome email sent to ${email} for user ${name}`);
        return true;
    } catch (error) {
        console.error("Error sending welcome email:", error);
        return false;
    }
}

async function logout() {
    try {
        await auth.signOut();
        showToast('Logged out successfully');
        navigateTo('home');
    } catch (error) {
        console.error("Logout error:", error);
        showToast('Error during logout');
    }
}

async function sendPasswordReset() {
    const email = document.getElementById('resetEmail').value;
    const errorElement = document.getElementById('reset-error');
    
    if (!email) {
        errorElement.textContent = "Please enter your email address";
        errorElement.classList.remove('hidden');
        return;
    }
    
    try {
        await auth.sendPasswordResetEmail(email);
        showToast("Password reset email sent! Check your inbox.");
        closePasswordResetModal();
    } catch (error) {
        errorElement.textContent = getErrorMessage(error.code);
        errorElement.classList.remove('hidden');
    }
}

function showPasswordReset() {
    document.getElementById('password-reset-modal').classList.remove('hidden');
}

function closePasswordResetModal() {
    document.getElementById('password-reset-modal').classList.add('hidden');
    document.getElementById('resetEmail').value = '';
    document.getElementById('reset-error').classList.add('hidden');
}

function closeVerificationModal() {
    document.getElementById('email-verification-modal').classList.add('hidden');
}

// --- PROFILE FUNCTIONS ---
async function loadProfileData() {
    const loading = document.getElementById('profile-loading');
    const content = document.getElementById('profile-content');
    
    if (!currentUser) {
        navigateTo('auth');
        return;
    }
    
    loading.classList.remove('hidden');
    content.classList.add('hidden');
    
    try {
        const userDoc = await db.collection('users').doc(currentUser.uid).get();
        
        if (userDoc.exists) {
            const data = userDoc.data();
            userData = data;
            
            document.getElementById('profile-name').textContent = data.name || 'Not set';
            document.getElementById('profile-email').textContent = currentUser.email;
            document.getElementById('profile-email-short').textContent = currentUser.email;
            document.getElementById('profile-phone').textContent = data.phone || 'Not provided';
            document.getElementById('profile-phone-short').textContent = data.phone || 'Not provided';
            document.getElementById('profile-join-date').textContent = 
                data.membershipDate ? new Date(data.membershipDate).toLocaleDateString() : 'Not set';
            document.getElementById('profile-join-date-short').textContent = 
                data.membershipDate ? new Date(data.membershipDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'Not set';
            document.getElementById('profile-member-type').textContent = 
                data.userType ? data.userType.toUpperCase().replace('_', ' ') : 'MEMBER';
            document.getElementById('profile-role').textContent = data.role || 'Member';
            document.getElementById('profile-membership-id').textContent = 
                data.uid ? 'CIS-' + data.uid.substring(0, 8).toUpperCase() : 'N/A';
            document.getElementById('profile-display-name').textContent = data.name || currentUser.email.split('@')[0];
            document.getElementById('profile-user-type').textContent = 
                data.userType === 'cis' ? 'CIS Department Member' : 
                data.userType === 'diu_other' ? 'DIU Member' : 'External Member';
            
            const statusBadge = document.getElementById('profile-status-badge');
            if (data.membershipStatus === 'active') {
                statusBadge.innerHTML = '<span class="status-badge status-active">Active</span>';
                document.getElementById('profile-status').textContent = 'Active';
                document.getElementById('profile-status').className = 'status-badge status-active';
            } else if (data.membershipStatus === 'pending') {
                statusBadge.innerHTML = '<span class="status-badge status-pending">Pending</span>';
                document.getElementById('profile-status').textContent = 'Pending';
                document.getElementById('profile-status').className = 'status-badge status-pending';
            }
            
            const emailBadge = document.getElementById('email-verified-badge');
            if (currentUser.emailVerified) {
                emailBadge.innerHTML = '<span class="status-badge status-active">Verified</span>';
            } else {
                emailBadge.innerHTML = '<span class="status-badge status-pending">Not Verified</span>';
            }
            
            const eduSection = document.getElementById('profile-education');
            if (data.userType === 'cis') {
                eduSection.innerHTML = `
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-semibold text-gray-500 mb-1">Department</label>
                            <p class="text-gray-800 font-medium">Computing & Information System (CIS)</p>
                        </div>
                        <div>
                            <label class="block text-sm font-semibold text-gray-500 mb-1">Student ID</label>
                            <p class="text-gray-800 font-medium">${data.studentId || 'Not provided'}</p>
                        </div>
                        <div>
                            <label class="block text-sm font-semibold text-gray-500 mb-1">Batch</label>
                            <p class="text-gray-800 font-medium">${data.batch || 'Not specified'}</p>
                        </div>
                        <div>
                            <label class="block text-sm font-semibold text-gray-500 mb-1">Semester</label>
                            <p class="text-gray-800 font-medium">Current</p>
                        </div>
                    </div>
                `;
            } else if (data.userType === 'diu_other') {
                eduSection.innerHTML = `
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-semibold text-gray-500 mb-1">Department</label>
                            <p class="text-gray-800 font-medium">${data.department || 'Not specified'}</p>
                        </div>
                        <div>
                            <label class="block text-sm font-semibold text-gray-500 mb-1">Student ID</label>
                            <p class="text-gray-800 font-medium">${data.studentId || 'Not provided'}</p>
                        </div>
                        <div>
                            <label class="block text-sm font-semibold text-gray-500 mb-1">Semester</label>
                            <p class="text-gray-800 font-medium">${data.semester || 'Not specified'}</p>
                        </div>
                        <div>
                            <label class="block text-sm font-semibold text-gray-500 mb-1">University</label>
                            <p class="text-gray-800 font-medium">Daffodil International University</p>
                        </div>
                    </div>
                `;
            } else {
                eduSection.innerHTML = `
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-semibold text-gray-500 mb-1">Institution</label>
                            <p class="text-gray-800 font-medium">${data.institution || 'Not specified'}</p>
                        </div>
                        <div>
                            <label class="block text-sm font-semibold text-gray-500 mb-1">Department</label>
                            <p class="text-gray-800 font-medium">${data.department || 'Not specified'}</p>
                        </div>
                    </div>
                `;
            }
            
            try {
                const eventsQuery = await db.collection('event_registrations')
                    .where('userId', '==', currentUser.uid)
                    .get();
                document.getElementById('profile-events-count').textContent = eventsQuery.size;
                
                const projectsQuery = await db.collection('user_projects')
                    .where('userId', '==', currentUser.uid)
                    .get();
                document.getElementById('profile-projects-count').textContent = projectsQuery.size;
                
                const resourcesQuery = await db.collection('cis_club_resources')
                    .where('email', '==', currentUser.email)
                    .get();
                document.getElementById('profile-resources-count').textContent = resourcesQuery.size;
                
                const certificatesQuery = await db.collection('certificates')
                    .where('userId', '==', currentUser.uid)
                    .get();
                document.getElementById('profile-certificates-count').textContent = certificatesQuery.size;
            } catch (statsError) {
                console.error("Error loading stats:", statsError);
            }
            
            loading.classList.add('hidden');
            content.classList.remove('hidden');
        } else {
            loading.innerHTML = '<p class="text-red-500">No user data found. Please contact support.</p>';
        }
    } catch (error) {
        console.error("Error loading profile:", error);
        loading.innerHTML = '<p class="text-red-500">Error loading profile. Please try again.</p>';
    }
}

function editProfile() {
    showToast('Edit profile feature coming soon!');
}

// --- NAVIGATION FUNCTIONS ---
function navigateTo(id) {
    document.querySelectorAll('.page-section').forEach(el => {
        el.classList.remove('active');
        el.classList.add('hidden');
    });
    
    const target = document.getElementById(id);
    if (target) {
        target.classList.remove('hidden');
        target.classList.add('active');
        
        if (id === 'profile' && currentUser) {
            loadProfileData();
        }
        
        if (id === 'auth' && currentUser) {
            navigateTo('profile');
            return;
        }
        
        if (id === 'home') {
            initSlider();
            animateCounters();
        }
        
        if (id === 'gallery') {
            initGallery();
        }
    }
    
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
        if (link.textContent.toLowerCase().includes(id) || 
            (link.getAttribute('onclick') && link.getAttribute('onclick').includes(id))) {
            link.classList.add('active');
        }
    });
    
    document.getElementById('mobile-menu').classList.add('hidden');
    window.scrollTo(0, 0);
}

function navigateToAccount() {
    if (currentUser) {
        navigateTo('profile');
    } else {
        navigateTo('auth');
    }
}

// --- GALLERY FUNCTIONS ---
function initGallery() {
    // Initialize gallery filter buttons
    document.querySelectorAll('.gallery-filter-btn').forEach(button => {
        button.addEventListener('click', function() {
            // Remove active class from all buttons
            document.querySelectorAll('.gallery-filter-btn').forEach(btn => {
                btn.classList.remove('active');
            });
            
            // Add active class to clicked button
            this.classList.add('active');
            
            // Get filter value
            const filter = this.getAttribute('data-filter');
            
            // Filter gallery items
            const galleryItems = document.querySelectorAll('.gallery-item');
            
            galleryItems.forEach(item => {
                if (filter === 'all') {
                    item.style.display = 'block';
                } else {
                    if (item.getAttribute('data-category') === filter) {
                        item.style.display = 'block';
                    } else {
                        item.style.display = 'none';
                    }
                }
            });
        });
    });
    
    // Initialize gallery image click events
    document.querySelectorAll('.gallery-item').forEach((item, index) => {
        item.addEventListener('click', function() {
            openLightbox(index);
        });
    });
    
    // Initialize upload area hover effect
    const uploadArea = document.getElementById('uploadArea');
    if (uploadArea) {
        uploadArea.addEventListener('dragover', function(e) {
            e.preventDefault();
            this.style.borderColor = '#006a4e';
            this.style.backgroundColor = '#f8fafc';
        });
        
        uploadArea.addEventListener('dragleave', function() {
            this.style.borderColor = '#ddd';
            this.style.backgroundColor = 'white';
        });
        
        uploadArea.addEventListener('drop', function(e) {
            e.preventDefault();
            this.style.borderColor = '#ddd';
            this.style.backgroundColor = 'white';
            
            const files = e.dataTransfer.files;
            handlePhotoUpload({ target: { files } });
        });
    }
}

function openLightbox(index) {
    // Get all gallery images
    const galleryItems = document.querySelectorAll('.gallery-item');
    currentGalleryImages = [];
    
    galleryItems.forEach(item => {
        if (item.style.display !== 'none') {
            const img = item.querySelector('img');
            const title = item.querySelector('.gallery-overlay h4')?.textContent || 'CIS Club Photo';
            const desc = item.querySelector('.gallery-overlay p')?.textContent || 'Memorable moment';
            
            currentGalleryImages.push({
                src: img.src,
                title: title,
                desc: desc
            });
        }
    });
    
    // Adjust index for filtered view
    let actualIndex = 0;
    let count = 0;
    for (let i = 0; i < galleryItems.length; i++) {
        if (galleryItems[i].style.display !== 'none') {
            if (count === index) {
                actualIndex = i;
                break;
            }
            count++;
        }
    }
    
    // Find the correct image in currentGalleryImages
    currentImageIndex = currentGalleryImages.findIndex(img => 
        img.src === galleryItems[actualIndex].querySelector('img').src
    );
    
    if (currentImageIndex === -1) currentImageIndex = 0;
    
    // Update lightbox
    updateLightbox();
    
    // Show lightbox
    document.getElementById('lightbox').classList.add('active');
    document.body.style.overflow = 'hidden';
    
    // Add keyboard navigation
    document.addEventListener('keydown', handleLightboxKeydown);
}

function updateLightbox() {
    if (currentGalleryImages.length === 0) return;
    
    const currentImage = currentGalleryImages[currentImageIndex];
    const lightboxImg = document.getElementById('lightbox-img');
    const lightboxCaption = document.getElementById('lightbox-caption');
    const lightboxCounter = document.getElementById('lightbox-counter');
    
    lightboxImg.src = currentImage.src;
    lightboxImg.alt = currentImage.title;
    lightboxCaption.textContent = currentImage.title + ' - ' + currentImage.desc;
    lightboxCounter.textContent = `${currentImageIndex + 1} / ${currentGalleryImages.length}`;
}

function nextLightboxImage() {
    if (currentGalleryImages.length === 0) return;
    
    currentImageIndex = (currentImageIndex + 1) % currentGalleryImages.length;
    updateLightbox();
}

function prevLightboxImage() {
    if (currentGalleryImages.length === 0) return;
    
    currentImageIndex = (currentImageIndex - 1 + currentGalleryImages.length) % currentGalleryImages.length;
    updateLightbox();
}

function closeLightbox() {
    document.getElementById('lightbox').classList.remove('active');
    document.body.style.overflow = 'auto';
    document.removeEventListener('keydown', handleLightboxKeydown);
}

function handleLightboxKeydown(e) {
    if (e.key === 'Escape') {
        closeLightbox();
    } else if (e.key === 'ArrowRight') {
        nextLightboxImage();
    } else if (e.key === 'ArrowLeft') {
        prevLightboxImage();
    }
}

function handlePhotoUpload(event) {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    
    // Check file size and type
    const maxSize = 5 * 1024 * 1024; // 5MB
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Check file type
        if (!validTypes.includes(file.type)) {
            showToast(`File ${file.name} is not a valid image type. Please upload JPG, PNG, or GIF.`);
            continue;
        }
        
        // Check file size
        if (file.size > maxSize) {
            showToast(`File ${file.name} is too large. Maximum size is 5MB.`);
            continue;
        }
        
        // Create preview
        const reader = new FileReader();
        reader.onload = function(e) {
            // Create new gallery item
            const galleryGrid = document.getElementById('photo-gallery');
            const newItem = document.createElement('div');
            newItem.className = 'gallery-item';
            newItem.setAttribute('data-category', 'members');
            
            const timestamp = new Date().toLocaleDateString();
            newItem.innerHTML = `
                <img src="${e.target.result}" alt="Uploaded Photo" class="gallery-image">
                <div class="gallery-overlay">
                    <h4 class="font-bold text-lg">Your Upload</h4>
                    <p class="text-sm">Uploaded on ${timestamp}</p>
                </div>
            `;
            
            // Add click event
            newItem.addEventListener('click', function() {
                const index = Array.from(galleryGrid.children).indexOf(this);
                openLightbox(index);
            });
            
            // Add to gallery (at the beginning)
            galleryGrid.prepend(newItem);
            
            showToast(`Photo "${file.name}" uploaded successfully! It will appear in the gallery after review.`);
        };
        
        reader.readAsDataURL(file);
    }
    
    // Reset file input
    event.target.value = '';
}

// --- HELPER FUNCTIONS ---
function getErrorMessage(errorCode) {
    const errors = {
        'auth/email-already-in-use': 'Email already registered',
        'auth/invalid-email': 'Invalid email address',
        'auth/operation-not-allowed': 'Email/password accounts not enabled',
        'auth/weak-password': 'Password too weak (min 6 characters)',
        'auth/user-disabled': 'Account disabled',
        'auth/user-not-found': 'No account with this email',
        'auth/wrong-password': 'Incorrect password',
        'auth/too-many-requests': 'Too many attempts. Try again later',
        'auth/network-request-failed': 'Network error. Check your connection',
        'auth/user-token-expired': 'Session expired. Please login again'
    };
    return errors[errorCode] || 'An error occurred. Please try again.';
}

function checkPasswordStrength(password, type) {
    const meter = document.getElementById(`${type}-password-strength`);
    if (!password) {
        meter.className = 'password-strength-meter';
        meter.style.width = '0%';
        return;
    }
    
    let strength = 0;
    if (password.length >= 6) strength++;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    
    const classes = ['strength-weak', 'strength-fair', 'strength-good', 'strength-strong', 'strength-strong'];
    meter.className = `password-strength-meter ${classes[Math.min(strength, 4)]}`;
}

function showToast(msg) {
    const x = document.getElementById("toast");
    x.innerText = msg;
    x.className = "show";
    setTimeout(function() { 
        x.className = x.className.replace("show", ""); 
    }, 3000);
}

// --- ANIMATED COUNTERS FOR IMPACT SECTION ---
function animateCounters() {
    const counters = document.querySelectorAll('.counter-number');
    const speed = 200;
    
    counters.forEach(counter => {
        const updateCount = () => {
            const target = +counter.getAttribute('data-target');
            const count = +counter.innerText.replace('+', '');
            const increment = target / speed;
            
            if (count < target) {
                counter.innerText = Math.ceil(count + increment) + '+';
                setTimeout(updateCount, 1);
            } else {
                counter.innerText = target + '+';
            }
        };
        
        updateCount();
    });
}

// --- YOUTUBE VIDEOS FUNCTIONALITY ---
function initYouTubeVideos() {
    document.querySelectorAll('.video-card').forEach(card => {
        card.addEventListener('click', function(e) {
            const videoId = this.getAttribute('data-video-id');
            const isPlaylist = this.getAttribute('data-is-playlist') === 'true';
            
            
        });
    });

    document.querySelectorAll('.video-thumbnail').forEach(thumbnail => {
        thumbnail.style.cursor = 'pointer';
    });
}

// --- RESOURCE SUBMISSION FORM FUNCTIONS ---
window.handleResourceSubmit = async (e) => {
    e.preventDefault();
    const btn = document.getElementById('resourceSubmitBtn');
    const originalContent = btn.innerHTML;
    btn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Processing...`;
    btn.disabled = true;

    const formData = {
        name: document.getElementById('resourceName').value,
        email: document.getElementById('resourceEmail').value,
        type: document.getElementById('resourceType').value,
        title: document.getElementById('resourceTitle').value,
        description: document.getElementById('resourceDescription').value,
        link: document.getElementById('resourceLink').value || 'N/A',
        fileName: document.getElementById('resourceFileInput').files[0] ? 
                  document.getElementById('resourceFileInput').files[0].name : "No file",
        timestamp: new Date().toISOString(),
        status: 'pending'
    };

    try {
        if (db) {
            await db.collection('cis_club_resources').add({
                ...formData,
                timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                userId: currentUser ? currentUser.uid : null
            });
        }
        
        document.getElementById('resourceForm').reset();
        document.getElementById('fileLabel').innerText = "Click to Upload (PDF, ZIP, DOC, PPT)";
        
        showResourceModal();
        
    } catch (error) {
        console.error("Error:", error);
        showToast("Error submitting resource: " + error.message);
    } finally {
        btn.innerHTML = originalContent;
        btn.disabled = false;
    }
};

window.handleResourceFileSelect = (input) => {
    if (input.files[0]) {
        const fileName = input.files[0].name;
        const fileSize = (input.files[0].size / 1024 / 1024).toFixed(2);
        document.getElementById('fileLabel').innerText = `${fileName} (${fileSize} MB)`;
    }
};

function showResourceModal() {
    const modal = document.getElementById('resource-success-modal');
    modal.classList.remove('hidden');
    setTimeout(() => { 
        modal.classList.remove('opacity-0'); 
        modal.querySelector('div').classList.add('scale-100'); 
    }, 10);
}

function closeResourceModal() {
    const modal = document.getElementById('resource-success-modal');
    modal.classList.add('opacity-0');
    setTimeout(() => modal.classList.add('hidden'), 300);
}

// --- EVENT AND GALLERY FUNCTIONS ---
function initEventButtons() {
    document.querySelectorAll('.view-images-btn').forEach(button => {
        button.addEventListener('click', function(e) {
            const eventId = this.getAttribute('data-event-id');
            if (eventId && eventData[eventId]) {
                openEventImagesModal(eventId);
            }
        });
    });

    document.querySelectorAll('.event-card').forEach(card => {
        const eventId = card.getAttribute('data-event-id');
        if (eventId && eventData[eventId] && eventData[eventId].imageCount > 0) {
            card.style.cursor = 'pointer';
            card.addEventListener('click', function(e) {
                if (!e.target.closest('.view-images-btn')) {
                    openEventImagesModal(eventId);
                }
            });
        }
    });
}

function initGalleryButtons() {
    document.querySelectorAll('.view-gallery-btn').forEach(button => {
        button.addEventListener('click', function(e) {
            const galleryId = this.getAttribute('data-gallery-id');
            if (galleryId && galleryData[galleryId]) {
                openGalleryModal(galleryId);
            }
        });
    });

    document.querySelectorAll('.gallery-card').forEach(card => {
        const galleryId = card.getAttribute('data-gallery-id');
        if (galleryId && galleryData[galleryId] && galleryData[galleryId].imageCount > 0) {
            card.style.cursor = 'pointer';
            card.addEventListener('click', function(e) {
                if (!e.target.closest('.view-gallery-btn')) {
                    openGalleryModal(galleryId);
                }
            });
        }
    });
}

function openEventImagesModal(eventId) {
    const event = eventData[eventId];
    if (!event || event.imageCount === 0) return;

    document.getElementById('event-modal-title').textContent = event.title;
    document.getElementById('event-modal-subtitle').textContent = `${event.date} - ${event.imageCount} ${event.imageCount === 1 ? 'Image' : 'Images'}`;

    const container = document.getElementById('event-images-container');
    container.innerHTML = '';

    event.images.forEach((imgSrc, index) => {
        const imgDiv = document.createElement('div');
        imgDiv.className = 'event-image-item';
        imgDiv.innerHTML = `
            <img src="${imgSrc}" 
                 alt="${event.title} - Image ${index + 1}"
                 onclick="openImageInLightbox('${imgSrc}', '${event.title}')">
        `;
        container.appendChild(imgDiv);
    });

    document.getElementById('event-images-modal').classList.add('active');
    document.body.style.overflow = 'hidden';
}

function openGalleryModal(galleryId) {
    const gallery = galleryData[galleryId];
    if (!gallery || gallery.imageCount === 0) return;

    document.getElementById('event-modal-title').textContent = gallery.title;
    document.getElementById('event-modal-subtitle').textContent = `${gallery.date} - ${gallery.imageCount} ${gallery.imageCount === 1 ? 'Image' : 'Images'}`;

    const container = document.getElementById('event-images-container');
    container.innerHTML = '';

    gallery.images.forEach((imgSrc, index) => {
        const imgDiv = document.createElement('div');
        imgDiv.className = 'event-image-item';
        imgDiv.innerHTML = `
            <img src="${imgSrc}" 
                 alt="${gallery.title} - Image ${index + 1}"
                 onclick="openImageInLightbox('${imgSrc}', '${gallery.title}')">
        `;
        container.appendChild(imgDiv);
    });

    document.getElementById('event-images-modal').classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeEventImagesModal() {
    document.getElementById('event-images-modal').classList.remove('active');
    document.body.style.overflow = 'auto';
}

function openImageInLightbox(src, title) {
    const modal = document.getElementById('gallery-modal');
    const modalImg = document.getElementById('modal-image');
    
    modalImg.src = src;
    modalImg.alt = title;
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}

// --- FORM VALIDATION ---
function validate(formId) {
    const form = document.getElementById(formId);
    const inputs = form.querySelectorAll('input, textarea, select');
    let valid = true;
    
    inputs.forEach(input => {
        const error = input.nextElementSibling;
        if (!input.value.trim() || (input.type === 'email' && !input.value.includes('@'))) {
            input.classList.add('invalid');
            if (error) error.style.display = 'block';
            valid = false;
        } else {
            input.classList.remove('invalid');
            if (error) error.style.display = 'none';
        }
    });

    if (formId === 'joinForm') {
        const checked = form.querySelectorAll('input[name="interests"]:checked');
        const err = document.getElementById('interest-error');
        if (checked.length === 0) {
            err.style.display = 'block';
            valid = false;
        } else {
            err.style.display = 'none';
        }
    }

    return valid;
}

// Join form submission
document.getElementById('joinForm').onsubmit = (e) => {
    e.preventDefault();
    if (validate('joinForm')) showToast('Application Submitted!');
};

// Contact form submission
document.getElementById('contactForm').onsubmit = (e) => {
    e.preventDefault();
    if (validate('contactForm')) showToast('Message Sent!');
};

// --- AUTH SYSTEM UI ---
function switchAuthTab(tab) {
    const loginForm = document.getElementById('login-form-container');
    const signupForm = document.getElementById('signup-form-container');
    const tabLogin = document.getElementById('tab-login');
    const tabSignup = document.getElementById('tab-signup');

    if (tab === 'login') {
        loginForm.classList.remove('hidden');
        signupForm.classList.add('hidden');
        tabLogin.classList.add('active');
        tabSignup.classList.remove('active');
    } else {
        loginForm.classList.add('hidden');
        signupForm.classList.remove('hidden');
        tabLogin.classList.remove('active');
        tabSignup.classList.add('active');
    }
}

function updateSignupFields() {
    const container = document.getElementById('dynamic-fields');
    const userType = document.querySelector('input[name="userType"]:checked').value;

    let html = '';

    if (userType === 'cis') {
        html = `
            <div>
                <label class="block text-sm font-semibold text-gray-700 mb-1">Student ID <span class="text-red-500">*</span></label>
                <input type="text" class="form-input" placeholder="e.g. 211-15-1234" required>
            </div>
            <div>
                <label class="block text-sm font-semibold text-gray-700 mb-1">CIS Batch <span class="text-red-500">*</span></label>
                <select class="form-input" required>
                    <option value="">-- Select Batch --</option>
                    <option value="1">Batch 1</option>
                    <option value="2">Batch 2</option>
                    <option value="3">Batch 3</option>
                    <option value="4">Batch 4</option>
                    <option value="5">Batch 5</option>
                    <option value="6">Batch 6</option>
                    <option value="7">Batch 7</option>
                    <option value="8">Batch 8</option>
                    <option value="9">Batch 9</option>
                    <option value="10">Batch 10</option>
                    <option value="11">Batch 11</option>
                    <option value="12">Batch 12</option>
                    <option value="13">Batch 13</option>
                    <option value="14">Batch 14</option>
                    <option value="15">Batch 15</option>
                    <option value="16">Batch 16</option>
                    <option value="17">Batch 17</option>
                    <option value="18">Batch 18</option>
                    <option value="19">Batch 19</option>
                    <option value="20">Batch 20</option>
                    <option value="21">Batch 21</option>
                    <option value="22">Batch 22</option>
                    <option value="23">Batch 23</option>
                    <option value="24">Batch 24</option>
                </select>
            </div>
        `;
    } else if (userType === 'diu_other') {
        html = `
            <div>
                <label class="block text-sm font-semibold text-gray-700 mb-1">Department Name <span class="text-red-500">*</span></label>
                <input type="text" class="form-input" placeholder="e.g. SWE, CSE, EEE" required>
            </div>
            <div>
                <label class="block text-sm font-semibold text-gray-700 mb-1">Student ID <span class="text-red-500">*</span></label>
                <input type="text" class="form-input" placeholder="DIU ID" required>
            </div>
            <div class="md:col-span-2">
                <label class="block text-sm font-semibold text-gray-700 mb-1">Semester <span class="text-red-500">*</span></label>
                <select class="form-input" required>
                    <option value="">-- Select Semester --</option>
                    <option value="1">1st Semester</option>
                    <option value="2">2nd Semester</option>
                    <option value="3">3rd Semester</option>
                    <option value="4">4th Semester</option>
                    <option value="5">5th Semester</option>
                    <option value="6">6th Semester</option>
                    <option value="7">7th Semester</option>
                    <option value="8">8th Semester</option>
                    <option value="9">9th Semester</option>
                    <option value="10">10th Semester</option>
                    <option value="11">11th Semester</option>
                    <option value="12">12th Semester</option>
                </select>
            </div>
        `;
    } else {
        html = `
            <div>
                <label class="block text-sm font-semibold text-gray-700 mb-1">Institution / Organization <span class="text-red-500">*</span></label>
                <input type="text" class="form-input" placeholder="University or Company name" required>
            </div>
            <div>
                <label class="block text-sm font-semibold text-gray-700 mb-1">Department <span class="text-red-500">*</span></label>
                <input type="text" class="form-input" placeholder="Your Department" required>
            </div>
        `;
    }
    container.innerHTML = html;
}

// --- MOBILE MENU ---
function toggleMobileMenu() {
    const menu = document.getElementById('mobile-menu');
    menu.classList.toggle('hidden');
}

// --- SCROLL TOP BUTTON ---
const scrollBtn = document.getElementById('scrollTopBtn');
window.onscroll = () => {
    scrollBtn.style.display = (document.body.scrollTop > 200 || document.documentElement.scrollTop > 200) ? 'block' : 'none';
};
scrollBtn.onclick = () => window.scrollTo({top: 0, behavior: 'smooth'});

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
    // Initialize Firebase
    if (initializeFirebase()) {
        console.log("Firebase initialized");
    }
    
    // Initialize components
    updateSignupFields();
    navigateTo('home');
    initSlider();
    initEventButtons();
    initGalleryButtons();
    initYouTubeVideos();
    
    // Set up mobile menu button
    document.getElementById('mobile-menu-btn').onclick = () => {
        toggleMobileMenu();
    };

    // Close event images modal when clicking outside content
    document.getElementById('event-images-modal').addEventListener('click', function(e) {
        if (e.target === this) {
            closeEventImagesModal();
        }
    });

    // Close gallery modal
    document.getElementById('gallery-modal').onclick = function() {
        this.classList.add('hidden');
        document.body.style.overflow = 'auto';
    };
    
    // Close lightbox when clicking outside image
    document.getElementById('lightbox').addEventListener('click', function(e) {
        if (e.target === this || e.target.classList.contains('lightbox-close')) {
            closeLightbox();
        }
    });
    
    // Initialize animated counters
    setTimeout(animateCounters, 1000);
});

// --- IMAGE FALLBACK FUNCTION ---
function imgError(image) {
    image.onerror = "";
    image.src = "https://ui-avatars.com/api/?background=0D8ABC&color=fff&name=User&size=200";
}