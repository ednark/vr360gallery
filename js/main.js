// main.js - Enhanced 3D-aware gallery with VR support
const viewerElement = document.getElementById('viewer');
const galleryOverlay = document.getElementById('gallery-overlay');
const panoramaSky = document.getElementById('panorama-sky');
const galleryToggle = document.getElementById('gallery-toggle');

// VR Gallery Elements
let vrGallery, gallerySphere, sphereGrid, thumbnailContainer, galleryTitle, backBtn, toggleGalleryBtn, toggleGalleryText;
let scene;

let currentView = 'subdirectories'; // 'subdirectories' or 'images'
let currentSubdirectory = null;
let galleryVisible = true;
let vrMode = false;
let currentImages = [];
let currentSubdirectories = [];

// Initialize VR gallery elements
function initVRGallery() {
    scene = document.querySelector('a-scene');
    vrGallery = document.getElementById('vr-gallery');
    gallerySphere = document.getElementById('gallery-sphere');
    sphereGrid = document.getElementById('sphere-grid');
    thumbnailContainer = document.getElementById('thumbnail-container');
    galleryTitle = document.getElementById('gallery-title');
    backBtn = document.getElementById('back-btn');
    toggleGalleryBtn = document.getElementById('toggle-gallery-btn');
    toggleGalleryText = document.getElementById('toggle-gallery-text');
    
    // Setup VR event listeners
    setupVREventListeners();
    
    // Detect VR mode changes
    scene.addEventListener('enter-vr', () => {
        vrMode = true;
        console.log('Entered VR mode');
        syncGalleryState();
    });
    
    scene.addEventListener('exit-vr', () => {
        vrMode = false;
        console.log('Exited VR mode');
        syncGalleryState();
    });
    
    // Set initial gallery visibility based on VR mode
    syncGalleryState();
}

// Setup VR event listeners
function setupVREventListeners() {
    // Back button
    backBtn.addEventListener('click', () => {
        if (currentView === 'images') {
            loadSubdirectories();
        }
    });
    
    // Toggle gallery button
    toggleGalleryBtn.addEventListener('click', () => {
        toggleGallery();
    });
    
    // Add hover effects for VR buttons
    [backBtn, toggleGalleryBtn].forEach(btn => {
        btn.addEventListener('mouseenter', () => {
            btn.setAttribute('scale', '1.1 1.1 1.1');
        });
        
        btn.addEventListener('mouseleave', () => {
            btn.setAttribute('scale', '1 1 1');
        });
    });
}

// Sync gallery state between 2D and VR modes
function syncGalleryState() {
    if (vrMode) {
        // In VR mode, use 3D gallery
        if (vrGallery) {
            vrGallery.setAttribute('visible', galleryVisible);
        }
        if (sphereGrid) {
            sphereGrid.setAttribute('visible', galleryVisible);
        }
        galleryOverlay.style.display = 'none';
        galleryToggle.style.display = 'none';
    } else {
        // In 2D mode, use traditional overlay
        if (vrGallery) {
            vrGallery.setAttribute('visible', false);
        }
        if (sphereGrid) {
            sphereGrid.setAttribute('visible', false);
        }
        galleryOverlay.style.display = galleryVisible ? 'flex' : 'none';
        galleryToggle.style.display = 'block';
    }
}

// Gallery state management
function toggleGallery() {
    galleryVisible = !galleryVisible;
    
    if (vrMode) {
        vrGallery.setAttribute('visible', galleryVisible);
        if (sphereGrid) {
            sphereGrid.setAttribute('visible', galleryVisible);
        }
        toggleGalleryText.setAttribute('value', galleryVisible ? 'Hide Gallery' : 'Show Gallery');
    } else {
        if (galleryVisible) {
            galleryOverlay.classList.remove('hidden');
            galleryToggle.textContent = 'Hide Gallery';
        } else {
            galleryOverlay.classList.add('hidden');
            galleryToggle.textContent = 'Show Gallery';
        }
    }
    
    syncGalleryState();
}

// Enhanced A-Frame viewer initialization
function initAFrameViewer(imagePath) {
    panoramaSky.setAttribute('src', imagePath);
    console.log('Loaded panorama:', imagePath);
    
    // Add visual feedback for loading
    panoramaSky.addEventListener('materialtextureloaded', () => {
        console.log('360° image loaded successfully');
    });
}

// Check if image is 360-degree based on filename or metadata
function is360Image(imageName) {
    const name = imageName.toLowerCase();
    return name.includes('360') || 
           name.includes('panorama') || 
           name.includes('equirectangular') ||
           name.includes('spherical');
}

// Calculate spherical position for thumbnails
function calculateSpherePosition(index, total, radius = 4, centerY = 0, centerZ = -2.5) {
    // Distribute items around the sphere using spherical coordinates
    const phi = (index / total) * 2 * Math.PI; // Azimuthal angle (around Y axis)
    const theta = Math.PI / 3; // Polar angle (fixed at 60 degrees from top)
    
    const x = radius * Math.sin(theta) * Math.cos(phi);
    const y = centerY + radius * Math.cos(theta) * 0.5; // Slightly lower on sphere
    const z = centerZ + radius * Math.sin(theta) * Math.sin(phi);
    
    return { x, y, z, phi, theta };
}

// Create VR thumbnail with spherical positioning
function createVRThumbnail(imageName, imagePath, subdirectoryName, index, total) {
    const thumbnail = document.createElement('a-plane');
    const spherePos = calculateSpherePosition(index, total);
    
    thumbnail.setAttribute('mixin', 'thumbnail-mixin');
    thumbnail.setAttribute('position', `${spherePos.x} ${spherePos.y} ${spherePos.z}`);
    thumbnail.setAttribute('material', `src: images/${subdirectoryName}/thumb_${imageName}; transparent: true`);
    thumbnail.setAttribute('data-raycastable', '');
    thumbnail.setAttribute('class', 'vr-thumbnail clickable');
    thumbnail.setAttribute('data-image-path', imagePath);
    thumbnail.setAttribute('data-image-name', imageName);
    
    // Rotate thumbnail to face the center (camera) and align with sphere surface
    const rotationY = Math.atan2(spherePos.x, spherePos.z) * 180 / Math.PI + 180;
    const rotationX = -Math.atan2(spherePos.y, Math.sqrt(spherePos.x * spherePos.x + spherePos.z * spherePos.z)) * 180 / Math.PI;
    thumbnail.setAttribute('rotation', `${rotationX} ${rotationY} 0`);
    
    // Add 360° indicator for VR
    if (is360Image(imageName)) {
        const indicator = document.createElement('a-text');
        indicator.setAttribute('value', '360°');
        indicator.setAttribute('position', '0.4 0.3 0.01');
        indicator.setAttribute('scale', '0.5 0.5 0.5');
        indicator.setAttribute('color', '#00ff88');
        indicator.setAttribute('align', 'center');
        thumbnail.appendChild(indicator);
        
        // Add green border
        thumbnail.setAttribute('material', 
            `src: images/${subdirectoryName}/thumb_${imageName}; transparent: true; color: #00ff88`);
    }
    
    // Add click handler
    thumbnail.addEventListener('click', () => {
        initAFrameViewer(imagePath);
        
        // Update active state
        document.querySelectorAll('.vr-thumbnail').forEach(thumb => {
            thumb.removeAttribute('animation');
        });
        
        thumbnail.setAttribute('animation', 'property: scale; to: 1.2 1.2 1.2; dur: 200');
        
        // Update 2D gallery active state too
        document.querySelectorAll('.thumbnail').forEach(thumb => {
            thumb.classList.remove('active');
        });
        
        const matching2DThumbnail = document.querySelector(`[data-image-path="${imagePath}"]`);
        if (matching2DThumbnail) {
            matching2DThumbnail.classList.add('active');
        }
    });
    
    // Add hover effects
    thumbnail.addEventListener('mouseenter', () => {
        thumbnail.setAttribute('animation', 'property: scale; to: 1.1 1.1 1.1; dur: 200');
    });
    
    thumbnail.addEventListener('mouseleave', () => {
        thumbnail.setAttribute('animation', 'property: scale; to: 1 1 1; dur: 200');
    });
    
    return thumbnail;
}

// Create VR subdirectory item with spherical positioning
function createVRSubdirectoryItem(subdirName, index, total) {
    const item = document.createElement('a-plane');
    const spherePos = calculateSpherePosition(index, total);
    
    item.setAttribute('position', `${spherePos.x} ${spherePos.y} ${spherePos.z}`);
    item.setAttribute('width', '1.5');
    item.setAttribute('height', '0.8');
    item.setAttribute('color', '#333');
    item.setAttribute('data-raycastable', '');
    item.setAttribute('class', 'vr-subdir clickable');
    
    // Rotate item to face the center (camera) and align with sphere surface
    const rotationY = Math.atan2(spherePos.x, spherePos.z) * 180 / Math.PI + 180;
    const rotationX = -Math.atan2(spherePos.y, Math.sqrt(spherePos.x * spherePos.x + spherePos.z * spherePos.z)) * 180 / Math.PI;
    item.setAttribute('rotation', `${rotationX} ${rotationY} 0`);
    
    // Add text
    const text = document.createElement('a-text');
    text.setAttribute('value', subdirName);
    text.setAttribute('align', 'center');
    text.setAttribute('position', '0 0 0.01');
    text.setAttribute('color', 'white');
    text.setAttribute('width', '6');
    item.appendChild(text);
    
    // Add click handler
    item.addEventListener('click', () => {
        loadImagesFromSubdirectory(subdirName);
    });
    
    // Add hover effects
    item.addEventListener('mouseenter', () => {
        item.setAttribute('animation', 'property: scale; to: 1.1 1.1 1.1; dur: 200');
        item.setAttribute('color', '#555');
    });
    
    item.addEventListener('mouseleave', () => {
        item.setAttribute('animation', 'property: scale; to: 1 1 1; dur: 200');
        item.setAttribute('color', '#333');
    });
    
    return item;
}

// Update VR gallery content
function updateVRGallery() {
    if (!thumbnailContainer) return;
    
    // Clear existing content
    while (thumbnailContainer.firstChild) {
        thumbnailContainer.removeChild(thumbnailContainer.firstChild);
    }
    
    if (currentView === 'subdirectories') {
        galleryTitle.setAttribute('value', '360° Gallery - Select Directory');
        backBtn.setAttribute('visible', false);
        
        const total = currentSubdirectories.length;
        currentSubdirectories.forEach((subdirName, index) => {
            const item = createVRSubdirectoryItem(subdirName, index, total);
            thumbnailContainer.appendChild(item);
        });
    } else if (currentView === 'images') {
        galleryTitle.setAttribute('value', `360° Gallery - ${currentSubdirectory}`);
        backBtn.setAttribute('visible', true);
        
        const total = currentImages.length;
        currentImages.forEach((imageName, index) => {
            const imagePath = `images/${currentSubdirectory}/${imageName}`;
            const thumbnail = createVRThumbnail(imageName, imagePath, currentSubdirectory, index, total);
            thumbnailContainer.appendChild(thumbnail);
        });
    }
}

// Create 2D thumbnail element with 360-degree awareness
function createThumbnail(imageName, imagePath, subdirectoryName) {
    const img = document.createElement('img');
    img.src = `images/${subdirectoryName}/thumb_${imageName}`;
    img.classList.add('thumbnail');
    
    // Add 360-degree indicator
    if (is360Image(imageName)) {
        img.classList.add('is-360');
    }
    
    img.dataset.imagePath = imagePath;
    img.dataset.imageName = imageName;
    
    // Enhanced click handler with smooth transitions
    img.addEventListener('click', () => {
        initAFrameViewer(imagePath);
        
        // Remove active class from all thumbnails
        document.querySelectorAll('.thumbnail').forEach(thumb => {
            thumb.classList.remove('active');
        });
        
        // Add active class to clicked thumbnail
        img.classList.add('active');
        
        // Update VR gallery active state too
        document.querySelectorAll('.vr-thumbnail').forEach(thumb => {
            thumb.removeAttribute('animation');
        });
        
        const matchingVRThumbnail = document.querySelector(`[data-image-path="${imagePath}"].vr-thumbnail`);
        if (matchingVRThumbnail) {
            matchingVRThumbnail.setAttribute('animation', 'property: scale; to: 1.2 1.2 1.2; dur: 200');
        }
    });
    
    // Add hover effects for better UX
    img.addEventListener('mouseenter', () => {
        if (is360Image(imageName)) {
            img.title = `360° Image: ${imageName}`;
        } else {
            img.title = `Image: ${imageName}`;
        }
    });
    
    return img;
}

// Create 2D subdirectory item
function createSubdirectoryItem(subdirName) {
    const div = document.createElement('div');
    div.classList.add('subdirectory-item');
    div.textContent = subdirName;
    div.dataset.subdirectory = subdirName;
    
    div.addEventListener('click', () => {
        loadImagesFromSubdirectory(subdirName);
    });
    
    return div;
}

// Create 2D back button
function createBackButton() {
    const button = document.createElement('div');
    button.classList.add('back-button');
    button.innerHTML = '←';
    button.title = 'Back to directories';
    
    button.addEventListener('click', () => {
        loadSubdirectories();
    });
    
    return button;
}

// Enhanced image loading with 360-degree awareness
async function loadImagesFromSubdirectory(subdirectoryName) {
    galleryOverlay.innerHTML = '';
    currentView = 'images';
    currentSubdirectory = subdirectoryName;
    
    try {
        const response = await fetch(`images/${subdirectoryName}/index.json`);
        const data = await response.json();
        currentImages = data.images;
        
        // Update 2D gallery
        galleryOverlay.appendChild(createBackButton());
        
        data.images.forEach(imageName => {
            const imagePath = `images/${subdirectoryName}/${imageName}`;
            const thumbnail = createThumbnail(imageName, imagePath, subdirectoryName);
            galleryOverlay.appendChild(thumbnail);
        });
        
        // Update VR gallery
        updateVRGallery();
        
        // Load the first image by default
        if (data.images.length > 0) {
            const firstImagePath = `images/${subdirectoryName}/${data.images[0]}`;
            initAFrameViewer(firstImagePath);
            
            // Mark first thumbnail as active in both galleries
            const firstThumbnail = galleryOverlay.querySelector('.thumbnail');
            if (firstThumbnail) {
                firstThumbnail.classList.add('active');
            }
        }
        
        console.log(`Loaded ${data.images.length} images from ${subdirectoryName}`);
    } catch (error) {
        console.error(`Error loading images from ${subdirectoryName}:`, error);
    }
}

// Enhanced subdirectory loading
async function loadSubdirectories() {
    galleryOverlay.innerHTML = '';
    currentView = 'subdirectories';
    currentSubdirectory = null;
    
    try {
        const response = await fetch('images/index.json');
        const data = await response.json();
        currentSubdirectories = data.subdirectories;
        
        // Update 2D gallery
        data.subdirectories.forEach(subdirName => {
            const subdirItem = createSubdirectoryItem(subdirName);
            galleryOverlay.appendChild(subdirItem);
        });
        
        // Update VR gallery
        updateVRGallery();
        
        // Sync gallery state after loading content
        syncGalleryState();
        
        // Load images from the first subdirectory by default
        if (data.subdirectories.length > 0) {
            loadImagesFromSubdirectory(data.subdirectories[0]);
        }
        
        console.log(`Loaded ${data.subdirectories.length} subdirectories`);
    } catch (error) {
        console.error('Error loading subdirectories:', error);
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

// Keyboard shortcuts
function setupKeyboardShortcuts() {
    document.addEventListener('keydown', (event) => {
        switch(event.key.toLowerCase()) {
            case 'g':
                toggleGallery();
                break;
            case 'escape':
                if (currentView === 'images') {
                    loadSubdirectories();
                }
                break;
            case 'arrowleft':
                navigateImages(-1);
                event.preventDefault();
                break;
            case 'arrowright':
                navigateImages(1);
                event.preventDefault();
                break;
        }
    });
}

// Navigate between images using keyboard
function navigateImages(direction) {
    if (currentView !== 'images') return;
    
    const thumbnails = Array.from(galleryOverlay.querySelectorAll('.thumbnail'));
    const activeThumbnail = galleryOverlay.querySelector('.thumbnail.active');
    
    if (!activeThumbnail || thumbnails.length === 0) return;
    
    const currentIndex = thumbnails.indexOf(activeThumbnail);
    let newIndex = currentIndex + direction;
    
    // Wrap around
    if (newIndex < 0) newIndex = thumbnails.length - 1;
    if (newIndex >= thumbnails.length) newIndex = 0;
    
    // Click the new thumbnail
    thumbnails[newIndex].click();
}

// Initialize everything
document.addEventListener('DOMContentLoaded', () => {
    console.log('Enhanced 3D-aware gallery with VR support loaded!');
    
    // Set initial gallery states - hide both galleries by default
    galleryOverlay.style.display = 'none';
    galleryToggle.style.display = 'block';
    
    // Wait for A-Frame to be ready
    if (document.querySelector('a-scene').hasLoaded) {
        initVRGallery();
        loadSubdirectories();
    } else {
        document.querySelector('a-scene').addEventListener('loaded', () => {
            initVRGallery();
            loadSubdirectories();
        });
    }
    
    // Setup event listeners
    galleryToggle.addEventListener('click', toggleGallery);
    
    // Setup keyboard shortcuts
    setupKeyboardShortcuts();
    
    // Show helpful tips in console
    console.log('Keyboard shortcuts:');
    console.log('- G: Toggle gallery visibility');
    console.log('- Escape: Back to directories (when viewing images)');
    console.log('- Left/Right arrows: Navigate between images');
    console.log('- H/J/K/L: Camera movement (Vim-style) - H=left, L=right, J=down, K=up');
    console.log('VR Features:');
    console.log('- 3D gallery panels visible in VR mode');
    console.log('- Point and click with VR controllers');
    console.log('- Gaze-based interaction with cursor');
});