// main.js - Simplified 2D Gallery with Virtual Scrolling
const viewerElement = document.getElementById('viewer');
const galleryOverlay = document.getElementById('gallery-overlay');
const galleryContent = document.getElementById('gallery-content');
const panoramaSky = document.getElementById('panorama-sky');
const galleryToggle = document.getElementById('gallery-toggle');
const toggleText = document.querySelector('.toggle-text');
const toggleIcon = document.querySelector('.toggle-icon');
const keyboardHint = document.getElementById('keyboard-hint');

// Gallery state
let currentView = 'galleries'; // 'galleries' or 'images'
let currentSubdirectory = null;
let galleryVisible = true;
let currentImages = [];
let currentgalleries = [];

// Virtual scrolling state
let visibleStartIndex = 0;
let visibleEndIndex = 0;
let thumbnailsPerRow = 10;
let thumbnailSize = 120;
let gapSize = 10;
let maxVisibleRows = 3;

// Initialize gallery
function initGallery() {
    setupEventListeners();
    loadgalleries();
    
    // Show keyboard hint for a few seconds, then fade out
    setTimeout(() => {
        if (keyboardHint) {
            keyboardHint.classList.add('hidden');
        }
    }, 5000);
}

// Event listeners
function setupEventListeners() {
    galleryToggle.addEventListener('click', toggleGallery);
    
    // Show hint on hover over gallery toggle
    galleryToggle.addEventListener('mouseenter', () => {
        if (keyboardHint) {
            keyboardHint.classList.remove('hidden');
        }
    });
    
    // Hide hint when mouse leaves gallery toggle after delay
    galleryToggle.addEventListener('mouseleave', () => {
        setTimeout(() => {
            if (keyboardHint) {
                keyboardHint.classList.add('hidden');
            }
        }, 2000);
    });
    
    // Gallery overlay scroll for virtual scrolling
    galleryOverlay.addEventListener('scroll', handleGalleryScroll);
    
    // Window resize handler
    window.addEventListener('resize', handleResize);
}

// Handle window resize
function handleResize() {
    calculateLayout();
    if (currentView === 'images' && currentImages.length > 0) {
        renderImages();
    }
}

// Calculate layout based on window size
function calculateLayout() {
    const overlayWidth = galleryOverlay.clientWidth - 40; // Account for padding
    thumbnailsPerRow = Math.max(1, Math.floor(overlayWidth / (thumbnailSize + gapSize)));
}

// Virtual scrolling handler
function handleGalleryScroll() {
    if (currentView !== 'images') return;
    
    const scrollTop = galleryOverlay.scrollTop;
    const rowHeight = thumbnailSize + gapSize;
    const totalItems = currentImages.length + 1; // +1 for back button
    const newStartIndex = Math.max(0, Math.floor(scrollTop / rowHeight) * thumbnailsPerRow - thumbnailsPerRow);
    const newEndIndex = Math.min(totalItems, newStartIndex + (maxVisibleRows + 2) * thumbnailsPerRow);
    
    if (newStartIndex !== visibleStartIndex || newEndIndex !== visibleEndIndex) {
        visibleStartIndex = newStartIndex;
        visibleEndIndex = newEndIndex;
        renderVisibleThumbnails();
    }
}

// Initialize A-Frame viewer
function initAFrameViewer(imagePath) {
    panoramaSky.setAttribute('src', imagePath);
    console.log('Loaded panorama:', imagePath);
    
    // Add visual feedback for loading
    panoramaSky.addEventListener('materialtextureloaded', () => {
        console.log('360° image loaded successfully');
    });
}

// Check if image is 360-degree
function is360Image(imageName) {
    // If imageName is an object with is_360 property, use it
    if (typeof imageName === 'object' && imageName !== null) {
        if ('is_360' in imageName) {
            return imageName.is_360;
        }
        if ('filename' in imageName && typeof imageName.filename === 'string') {
            imageName = imageName.filename;
        } else {
            return false;
        }
    }
    // Fallback for legacy string usage
    if (typeof imageName === 'string') {
        const name = imageName.toLowerCase();
        return name.includes('360') || 
               name.includes('panorama') || 
               name.includes('equirectangular') ||
               name.includes('spherical');
    }
    return false;
}

// Create thumbnail element
function createThumbnail(imageName, imagePath, subdirectoryName) {
    const container = document.createElement('div');
    container.className = 'thumbnail-container';
    container.style.width = thumbnailSize + 'px';
    container.style.height = thumbnailSize + 'px';
    
    let filename = imageName;
    if (typeof imageName === 'object' && imageName !== null) {
        if ('filename' in imageName) {
            filename = imageName.filename;
        }
    }
    const img = document.createElement('img');
    img.src = `images/${subdirectoryName}/thumb_${filename}`;
    img.className = 'thumbnail';
    img.loading = 'lazy'; // Enable lazy loading
    img.setAttribute('data-raycastable', '');

    if (is360Image(imageName)) {
        img.classList.add('is-360');
    }

    img.dataset.imagePath = imagePath;
    img.dataset.imageName = filename;

    // Click handler
    img.addEventListener('click', () => {
        initAFrameViewer(imagePath);

        // Update current image index
        const thumbnails = document.querySelectorAll('.thumbnail');
        currentImageIndex = Array.from(thumbnails).indexOf(img);

        // Remove active class from all thumbnails
        document.querySelectorAll('.thumbnail').forEach(thumb => {
            thumb.classList.remove('active');
        });

        // Add active class to clicked thumbnail
        img.classList.add('active');
    });

    // Add hover title
    img.addEventListener('mouseenter', () => {
        img.title = is360Image(imageName) ? `360° Image: ${filename}` : `Image: ${filename}`;
    });

    container.appendChild(img);
    return container;
}

// Create subdirectory item
function createSubdirectoryItem(subdirName) {
    const container = document.createElement('div');
    container.className = 'subdirectory-container';
    container.style.width = thumbnailSize + 'px';
    container.style.height = thumbnailSize + 'px';
    
    const div = document.createElement('div');
    div.className = 'subdirectory-item';
    div.textContent = subdirName;
    div.dataset.subdirectory = subdirName;
    div.setAttribute('data-raycastable', '');

    div.addEventListener('click', () => {
        loadImagesFromSubdirectory(subdirName);
    });

    container.appendChild(div);
    return container;
}

// Create back button
function createBackButton() {
    const container = document.createElement('div');
    container.className = 'back-button-container';
    container.style.width = thumbnailSize + 'px';
    container.style.height = thumbnailSize + 'px';
    
    const button = document.createElement('div');
    button.className = 'back-button';
    button.innerHTML = '←';
    button.title = 'Back to directories';
    button.setAttribute('data-raycastable', '');

    button.addEventListener('click', () => {
        // Only show gallery selection, do not auto-load first gallery or image
        galleryContent.innerHTML = '';
        currentView = 'galleries';
        calculateLayout();
        const container = document.createElement('div');
        container.className = 'galleries-grid';
        currentgalleries.forEach(subdirName => {
            const subdirItem = createSubdirectoryItem(subdirName);
            container.appendChild(subdirItem);
        });
        galleryContent.appendChild(container);
        console.log('Returned to gallery selection');
    });

    container.appendChild(button);
    return container;
}

// Render visible thumbnails (virtual scrolling)
function renderVisibleThumbnails() {
    const container = document.getElementById('thumbnails-container');
    if (!container) return;
    
    // Clear existing thumbnails
    container.innerHTML = '';
    
    // Calculate total items including back button
    const totalItems = currentImages.length + 1; // +1 for back button
    const totalRows = Math.ceil(totalItems / thumbnailsPerRow);
    const totalHeight = totalRows * (thumbnailSize + gapSize);
    container.style.height = totalHeight + 'px';
    
    // Create visible thumbnails
    const visibleContainer = document.createElement('div');
    visibleContainer.className = 'visible-thumbnails';
    visibleContainer.style.transform = `translateY(${Math.floor(visibleStartIndex / thumbnailsPerRow) * (thumbnailSize + gapSize)}px)`;
    
    // Add back button as first item if visible
    if (visibleStartIndex === 0) {
        const backButton = createBackButton();
        visibleContainer.appendChild(backButton);
    }
    
    // Add thumbnails, adjusting for back button offset
    for (let i = visibleStartIndex; i < visibleEndIndex; i++) {
        const imageIndex = i - 1; // Offset by 1 for back button
        if (imageIndex >= 0 && imageIndex < currentImages.length) {
            const imageObj = currentImages[imageIndex];
            let filename = imageObj;
            if (typeof imageObj === 'object' && imageObj !== null && 'filename' in imageObj) {
                filename = imageObj.filename;
            }
            const imagePath = `images/${currentSubdirectory}/${filename}`;
            const thumbnail = createThumbnail(imageObj, imagePath, currentSubdirectory);
            visibleContainer.appendChild(thumbnail);
        }
    }
    
    container.appendChild(visibleContainer);
}

// Render all images with virtual scrolling setup
function renderImages() {
    galleryContent.innerHTML = '';
    currentView = 'images';
    
    // Calculate layout
    calculateLayout();
    
    // Reset virtual scrolling
    visibleStartIndex = 0;
    visibleEndIndex = 0;
    
    // Create container for virtual scrolling
    const container = document.createElement('div');
    container.id = 'thumbnails-container';
    container.className = 'virtual-scroll-container';
    
    galleryContent.appendChild(container);
    
    // Initial render
    handleGalleryScroll();
}

// Load images from subdirectory
async function loadImagesFromSubdirectory(subdirectoryName) {
    currentSubdirectory = subdirectoryName;
    
    try {
        const response = await fetch(`images/${subdirectoryName}/index.json`);
        const data = await response.json();
        currentImages = data.images;

        renderImages();

        // Load the first image by default
        if (data.images.length > 0) {
            currentImageIndex = 0;
            let firstImageObj = data.images[0];
            let firstFilename = firstImageObj;
            if (typeof firstImageObj === 'object' && firstImageObj !== null && 'filename' in firstImageObj) {
                firstFilename = firstImageObj.filename;
            }
            const firstImagePath = `images/${subdirectoryName}/${firstFilename}`;
            initAFrameViewer(firstImagePath);

            // Mark first thumbnail as active
            setTimeout(() => {
                const firstThumbnail = document.querySelector('.thumbnail');
                if (firstThumbnail) {
                    firstThumbnail.classList.add('active');
                }
            }, 100);
        }

        console.log(`Loaded ${data.images.length} images from ${subdirectoryName}`);
    } catch (error) {
        console.error(`Error loading images from ${subdirectoryName}:`, error);
    }
}

// Load galleries
async function loadgalleries() {
    galleryContent.innerHTML = '';
    currentView = 'galleries';
    
    try {
        const response = await fetch('images/index.json');
        const data = await response.json();
        currentgalleries = data.galleries;
        
        // Calculate layout
        calculateLayout();
        
        // Create grid container
        const container = document.createElement('div');
        container.className = 'galleries-grid';
        
        data.galleries.forEach(subdirName => {
            const subdirItem = createSubdirectoryItem(subdirName);
            container.appendChild(subdirItem);
        });
        
        galleryContent.appendChild(container);
        
        // Do not auto-load the first gallery when showing gallery selection
        
        console.log(`Loaded ${data.galleries.length} galleries`);
    } catch (error) {
        console.error('Error loading galleries:', error);
    }
}

// Toggle gallery visibility
function toggleGallery() {
    galleryVisible = !galleryVisible;
    
    if (galleryVisible) {
        galleryOverlay.classList.remove('hidden');
        toggleText.textContent = 'Hide Gallery';
        toggleIcon.textContent = '🙈';
        console.log('Gallery shown');
    } else {
        galleryOverlay.classList.add('hidden');
        toggleText.textContent = 'Show Gallery';
        toggleIcon.textContent = '📷';
        console.log('Gallery hidden');
    }
}

// VR Gallery state
let vrGalleryVisible = false;
let vrGalleryInitialized = false;
let isVRMode = false;
let currentImageIndex = 0;

// Initialize VR Gallery
function initVRGallery() {
    if (vrGalleryInitialized) return;
    
    // Set up VR gallery toggle button
    const vrToggleButton = document.getElementById('vr-gallery-toggle');
    const vrGalleryPanel = document.getElementById('vr-gallery-panel');
    const vrCloseButton = document.getElementById('vr-gallery-close');
    
    if (vrToggleButton && vrGalleryPanel && vrCloseButton) {
        // Toggle button click handler
        vrToggleButton.addEventListener('click', toggleVRGallery);
        
        // Close button click handler
        vrCloseButton.addEventListener('click', hideVRGallery);
        
        // Load galleries into VR panel
        loadVRGalleries();
        
        vrGalleryInitialized = true;
        console.log('VR Gallery initialized');
    }
    
    // Set up VR mode detection
    setupVRModeDetection();
}

// Setup VR mode detection
function setupVRModeDetection() {
    const scene = document.getElementById('viewer');
    if (scene) {
        scene.addEventListener('enter-vr', () => {
            isVRMode = true;
            updateUIForMode();
            console.log('Entered VR mode');
        });
        
        scene.addEventListener('exit-vr', () => {
            isVRMode = false;
            updateUIForMode();
            console.log('Exited VR mode');
        });
    }
}

// Update UI based on current mode (VR or 2D)
function updateUIForMode() {
    const galleryControls = document.getElementById('gallery-controls');
    const keyboardHint = document.getElementById('keyboard-hint');
    const galleryOverlay = document.getElementById('gallery-overlay');
    const vrGalleryToggle = document.getElementById('vr-gallery-toggle');
    
    if (isVRMode) {
        // Hide 2D UI elements
        if (galleryControls) galleryControls.style.display = 'none';
        if (keyboardHint) keyboardHint.style.display = 'none';
        if (galleryOverlay) galleryOverlay.style.display = 'none';
        
        // Show VR UI elements
        if (vrGalleryToggle) vrGalleryToggle.setAttribute('visible', 'true');
    } else {
        // Show 2D UI elements
        if (galleryControls) galleryControls.style.display = 'block';
        if (keyboardHint) keyboardHint.style.display = 'block';
        if (galleryOverlay) galleryOverlay.style.display = 'block';
        
        // Hide VR UI elements
        if (vrGalleryToggle) vrGalleryToggle.setAttribute('visible', 'false');
        if (vrGalleryVisible) hideVRGallery();
    }
}

// Toggle VR Gallery visibility
function toggleVRGallery() {
    if (vrGalleryVisible) {
        hideVRGallery();
    } else {
        showVRGallery();
    }
}

// Show VR Gallery
function showVRGallery() {
    const vrGalleryPanel = document.getElementById('vr-gallery-panel');
    const vrToggleText = document.getElementById('vr-toggle-text');
    
    if (vrGalleryPanel && vrToggleText) {
        vrGalleryPanel.setAttribute('visible', 'true');
        vrToggleText.setAttribute('value', '📷 Hide');
        vrGalleryVisible = true;
        
        // Position panel in front of camera
        const camera = document.getElementById('main-camera');
        if (camera) {
            const cameraRotation = camera.getAttribute('rotation');
            const cameraPosition = camera.getAttribute('position') || {x: 0, y: 0, z: 0};
            
            // Calculate position in front of camera
            const distance = 6;
            const radY = (cameraRotation.y || 0) * Math.PI / 180;
            const newX = cameraPosition.x + Math.sin(radY) * distance;
            const newZ = cameraPosition.z - Math.cos(radY) * distance;
            
            vrGalleryPanel.setAttribute('position', `${newX} ${cameraPosition.y} ${newZ}`);
            vrGalleryPanel.setAttribute('rotation', `0 ${cameraRotation.y || 0} 0`);
        }
        
        console.log('VR Gallery shown');
    }
}

// Hide VR Gallery
function hideVRGallery() {
    const vrGalleryPanel = document.getElementById('vr-gallery-panel');
    const vrToggleText = document.getElementById('vr-toggle-text');
    
    if (vrGalleryPanel && vrToggleText) {
        vrGalleryPanel.setAttribute('visible', 'false');
        vrToggleText.setAttribute('value', '📷 Gallery');
        vrGalleryVisible = false;
        console.log('VR Gallery hidden');
    }
}

// Load galleries into VR panel
async function loadVRGalleries() {
    try {
        const response = await fetch('images/index.json');
        const data = await response.json();
        const vrGalleryItems = document.getElementById('vr-gallery-items');
        
        if (!vrGalleryItems) return;
        
        // Clear existing items
        vrGalleryItems.innerHTML = '';
        
        // Create gallery items in a grid layout
        const itemsPerRow = 3;
        const itemWidth = 1.5;
        const itemHeight = 0.8;
        const spacing = 0.3;
        
        data.galleries.forEach((galleryName, index) => {
            const row = Math.floor(index / itemsPerRow);
            const col = index % itemsPerRow;
            
            const x = (col - (itemsPerRow - 1) / 2) * (itemWidth + spacing);
            const y = 0.5 - row * (itemHeight + spacing);
            
            // Create gallery item container
            const galleryItem = document.createElement('a-entity');
            galleryItem.setAttribute('position', `${x} ${y} 0`);
            galleryItem.setAttribute('data-raycastable', '');
            galleryItem.setAttribute('data-gallery', galleryName);
            
            // Create background box
            const itemBox = document.createElement('a-box');
            itemBox.setAttribute('width', itemWidth);
            itemBox.setAttribute('height', itemHeight);
            itemBox.setAttribute('depth', '0.1');
            itemBox.setAttribute('color', '#444444');
            itemBox.setAttribute('opacity', '0.8');
            
            // Create text label
            const itemText = document.createElement('a-text');
            itemText.setAttribute('value', galleryName);
            itemText.setAttribute('position', '0 0 0.06');
            itemText.setAttribute('align', 'center');
            itemText.setAttribute('color', 'white');
            itemText.setAttribute('font', 'dejavu');
            itemText.setAttribute('width', '4');
            
            // Add hover effects
            galleryItem.addEventListener('mouseenter', function() {
                itemBox.setAttribute('color', '#666666');
                itemBox.setAttribute('scale', '1.05 1.05 1.05');
            });
            
            galleryItem.addEventListener('mouseleave', function() {
                itemBox.setAttribute('color', '#444444');
                itemBox.setAttribute('scale', '1 1 1');
            });
            
            // Add click handler
            galleryItem.addEventListener('click', function() {
                loadVRGalleryImages(galleryName);
                hideVRGallery();
            });
            
            galleryItem.appendChild(itemBox);
            galleryItem.appendChild(itemText);
            vrGalleryItems.appendChild(galleryItem);
        });
        
        console.log(`Loaded ${data.galleries.length} galleries into VR panel`);
    } catch (error) {
        console.error('Error loading VR galleries:', error);
    }
}

// Load images from a gallery in VR mode
async function loadVRGalleryImages(galleryName) {
    try {
        const response = await fetch(`images/${galleryName}/index.json`);
        const data = await response.json();
        
        if (data.images.length > 0) {
            // Load first image
            currentImageIndex = 0;
            let firstImageObj = data.images[0];
            let firstFilename = firstImageObj;
            if (typeof firstImageObj === 'object' && firstImageObj !== null && 'filename' in firstImageObj) {
                firstFilename = firstImageObj.filename;
            }
            const firstImagePath = `images/${galleryName}/${firstFilename}`;
            initAFrameViewer(firstImagePath);
            
            // Update 2D gallery if visible
            currentSubdirectory = galleryName;
            currentImages = data.images;
            if (galleryVisible && currentView === 'galleries') {
                loadImagesFromSubdirectory(galleryName);
            }
            
            console.log(`Loaded VR gallery: ${galleryName} with ${data.images.length} images`);
        }
    } catch (error) {
        console.error(`Error loading VR gallery ${galleryName}:`, error);
    }
}

// Navigate to next image
function nextImage() {
    if (currentImages.length === 0) return;
    
    currentImageIndex = (currentImageIndex + 1) % currentImages.length;
    loadCurrentImage();
}

// Navigate to previous image  
function previousImage() {
    if (currentImages.length === 0) return;
    
    currentImageIndex = (currentImageIndex - 1 + currentImages.length) % currentImages.length;
    loadCurrentImage();
}

// Load current image based on index
function loadCurrentImage() {
    if (currentImages.length === 0 || currentImageIndex < 0 || currentImageIndex >= currentImages.length) return;
    
    const imageObj = currentImages[currentImageIndex];
    let filename = imageObj;
    if (typeof imageObj === 'object' && imageObj !== null && 'filename' in imageObj) {
        filename = imageObj.filename;
    }
    
    const imagePath = `images/${currentSubdirectory}/${filename}`;
    initAFrameViewer(imagePath);
    
    // Update active thumbnail in 2D gallery
    updateActiveThumbnail();
    
    console.log(`Loaded image ${currentImageIndex + 1} of ${currentImages.length}: ${filename}`);
}

// Update active thumbnail in 2D gallery
function updateActiveThumbnail() {
    const thumbnails = document.querySelectorAll('.thumbnail');
    thumbnails.forEach((thumb, index) => {
        thumb.classList.toggle('active', index === currentImageIndex);
    });
}

// Camera movement variables
let cameraRotation = { x: 0, y: 0 };
const CAMERA_SPEED = 2; // degrees per keypress

// Camera movement functions
function rotateCameraHorizontal(direction) {
    const camera = document.getElementById('main-camera');
    if (camera) {
        cameraRotation.y += direction * CAMERA_SPEED;
        camera.setAttribute('rotation', `${cameraRotation.x} ${cameraRotation.y} 0`);
    }
}

function rotateCameraVertical(direction) {
    const camera = document.getElementById('main-camera');
    if (camera) {
        cameraRotation.x += direction * CAMERA_SPEED;
        // Clamp vertical rotation to prevent over-rotation
        cameraRotation.x = Math.max(-90, Math.min(90, cameraRotation.x));
        camera.setAttribute('rotation', `${cameraRotation.x} ${cameraRotation.y} 0`);
    }
}

// Enhanced keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // Don't interfere with inputs
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    
    switch(e.key.toLowerCase()) {
        // Camera rotation (WASD)
        case 'a':
            rotateCameraHorizontal(-1);
            break;
        case 'd':
            rotateCameraHorizontal(1);
            break;
        case 'w':
            rotateCameraVertical(-1);
            break;
        case 's':
            rotateCameraVertical(1);
            break;
            
        // Image navigation
        case 'e':
            nextImage();
            break;
        case 'g':
            // In VR mode, G navigates to previous image
            // In 2D mode, G toggles gallery (existing behavior)
            if (isVRMode) {
                previousImage();
            } else {
                toggleGallery();
            }
            break;
            
        // Gallery controls (2D mode only)
        case 'v':
            if (vrGalleryInitialized && isVRMode) {
                toggleVRGallery();
            }
            break;
        case 'escape':
            if (vrGalleryVisible) {
                hideVRGallery();
            } else if (currentView === 'images') {
                loadgalleries();
            } else if (galleryVisible && !isVRMode) {
                toggleGallery();
            }
            break;
        case 'tab':
            if (!isVRMode) {
                e.preventDefault();
                toggleGallery();
            }
            break;
            
        // Arrow keys for camera rotation (alternative to WASD)
        case 'arrowleft':
            rotateCameraHorizontal(-1);
            break;
        case 'arrowright':
            rotateCameraHorizontal(1);
            break;
        case 'arrowup':
            rotateCameraVertical(-1);
            break;
        case 'arrowdown':
            rotateCameraVertical(1);
            break;
    }
});

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    initGallery();
    
    // Initialize VR gallery after A-Frame loads
    const scene = document.getElementById('viewer');
    if (scene) {
        scene.addEventListener('loaded', () => {
            setTimeout(() => {
                initVRGallery();
                updateUIForMode(); // Ensure proper initial state
            }, 1000); // Small delay to ensure all elements are ready
        });
    }
});