// main.js - Simplified 2D Gallery with Virtual Scrolling
const viewerElement = document.getElementById('viewer');
const galleryOverlay = document.getElementById('gallery-overlay');
const panoramaSky = document.getElementById('panorama-sky');
const galleryToggle = document.getElementById('gallery-toggle');

// Gallery state
let currentView = 'subdirectories'; // 'subdirectories' or 'images'
let currentSubdirectory = null;
let galleryVisible = true;
let currentImages = [];
let currentSubdirectories = [];

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
    loadSubdirectories();
}

// Event listeners
function setupEventListeners() {
    galleryToggle.addEventListener('click', toggleGallery);
    
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        switch(e.key) {
            case 'g':
                toggleGallery();
                break;
            case 'Escape':
                if (currentView === 'images') {
                    loadSubdirectories();
                }
                break;
        }
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
    const newStartIndex = Math.max(0, Math.floor(scrollTop / rowHeight) * thumbnailsPerRow - thumbnailsPerRow);
    const newEndIndex = Math.min(currentImages.length, newStartIndex + (maxVisibleRows + 2) * thumbnailsPerRow);
    
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
    const name = imageName.toLowerCase();
    return name.includes('360') || 
           name.includes('panorama') || 
           name.includes('equirectangular') ||
           name.includes('spherical');
}

// Create thumbnail element
function createThumbnail(imageName, imagePath, subdirectoryName) {
    const container = document.createElement('div');
    container.className = 'thumbnail-container';
    container.style.width = thumbnailSize + 'px';
    container.style.height = thumbnailSize + 'px';
    
    const img = document.createElement('img');
    img.src = `images/${subdirectoryName}/thumb_${imageName}`;
    img.className = 'thumbnail';
    img.loading = 'lazy'; // Enable lazy loading
    
    if (is360Image(imageName)) {
        img.classList.add('is-360');
    }
    
    img.dataset.imagePath = imagePath;
    img.dataset.imageName = imageName;
    
    // Click handler
    img.addEventListener('click', () => {
        initAFrameViewer(imagePath);
        
        // Remove active class from all thumbnails
        document.querySelectorAll('.thumbnail').forEach(thumb => {
            thumb.classList.remove('active');
        });
        
        // Add active class to clicked thumbnail
        img.classList.add('active');
    });
    
    // Add hover title
    img.addEventListener('mouseenter', () => {
        img.title = is360Image(imageName) ? `360° Image: ${imageName}` : `Image: ${imageName}`;
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
    
    button.addEventListener('click', () => {
        loadSubdirectories();
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
    
    // Create spacer for virtual scrolling
    const totalRows = Math.ceil(currentImages.length / thumbnailsPerRow);
    const totalHeight = totalRows * (thumbnailSize + gapSize);
    container.style.height = totalHeight + 'px';
    
    // Create visible thumbnails
    const visibleContainer = document.createElement('div');
    visibleContainer.className = 'visible-thumbnails';
    visibleContainer.style.transform = `translateY(${Math.floor(visibleStartIndex / thumbnailsPerRow) * (thumbnailSize + gapSize)}px)`;
    
    for (let i = visibleStartIndex; i < visibleEndIndex; i++) {
        if (i < currentImages.length) {
            const imageName = currentImages[i];
            const imagePath = `images/${currentSubdirectory}/${imageName}`;
            const thumbnail = createThumbnail(imageName, imagePath, currentSubdirectory);
            visibleContainer.appendChild(thumbnail);
        }
    }
    
    container.appendChild(visibleContainer);
}

// Render all images with virtual scrolling setup
function renderImages() {
    galleryOverlay.innerHTML = '';
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
    
    galleryOverlay.appendChild(createBackButton());
    galleryOverlay.appendChild(container);
    
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
            const firstImagePath = `images/${subdirectoryName}/${data.images[0]}`;
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

// Load subdirectories
async function loadSubdirectories() {
    galleryOverlay.innerHTML = '';
    currentView = 'subdirectories';
    
    try {
        const response = await fetch('images/index.json');
        const data = await response.json();
        currentSubdirectories = data.subdirectories;
        
        // Calculate layout
        calculateLayout();
        
        // Create grid container
        const container = document.createElement('div');
        container.className = 'subdirectories-grid';
        
        data.subdirectories.forEach(subdirName => {
            const subdirItem = createSubdirectoryItem(subdirName);
            container.appendChild(subdirItem);
        });
        
        galleryOverlay.appendChild(container);
        
        // Load images from the first subdirectory by default
        if (data.subdirectories.length > 0) {
            loadImagesFromSubdirectory(data.subdirectories[0]);
        }
        
        console.log(`Loaded ${data.subdirectories.length} subdirectories`);
    } catch (error) {
        console.error('Error loading subdirectories:', error);
    }
}

// Toggle gallery visibility
function toggleGallery() {
    galleryVisible = !galleryVisible;
    
    if (galleryVisible) {
        galleryOverlay.classList.remove('hidden');
        galleryToggle.textContent = 'Hide Gallery';
    } else {
        galleryOverlay.classList.add('hidden');
        galleryToggle.textContent = 'Show Gallery';
    }
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

// Keyboard shortcuts for camera movement
document.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    
    switch(e.key) {
        case 'ArrowLeft':
            rotateCameraHorizontal(-1);
            break;
        case 'ArrowRight':
            rotateCameraHorizontal(1);
            break;
        case 'ArrowUp':
            rotateCameraVertical(-1);
            break;
        case 'ArrowDown':
            rotateCameraVertical(1);
            break;
    }
});

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initGallery);