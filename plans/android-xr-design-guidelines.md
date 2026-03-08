# Android XR Design Guidelines for VR360Gallery

## Overview

This document synthesizes key principles from Google's Android XR design guidelines and applies them to the VR360Gallery upgrade project. Android XR represents Google's vision for spatial computing, and these guidelines provide valuable insights for creating immersive, comfortable, and accessible XR experiences.

**Source:** https://developer.android.com/design/ui/xr/guides/get-started

---

## Core Design Principles

### 1. Spatial Design Fundamentals

**Key Concept: The User is the Center**

Android XR emphasizes that the user should always be the center of the experience. Content should be arranged around the user in a way that feels natural and comfortable.

**Application to VR360Gallery:**
- Position gallery panels and UI elements relative to user's head position
- Avoid placing critical UI directly behind the user
- Use the "comfort zone" (approximately 1-3 meters from user) for interactive elements

```
Comfort Zones (from Android XR guidelines):
- Near field: 0.5m - 1m (intimate, detailed viewing)
- Optimal: 1m - 3m (comfortable interaction)
- Far field: 3m - 10m (overview, ambient content)
- Distant: 10m+ (environmental, skybox)
```

### 2. Spatial Panels and Windows

**Android XR Panel Concepts:**

Android XR introduces the concept of "spatial panels" - 2D surfaces that exist in 3D space. These are ideal for displaying traditional UI content in XR.

**Panel Types:**
- **Home Space Panels:** Fixed panels in the user's environment
- **Full Space Panels:** Immersive panels that take over the view
- **Orbiting Panels:** Panels that follow the user's gaze

**Application to VR360Gallery:**

```javascript
// Implement orbiting panel for gallery controls
AFRAME.registerComponent('orbiting-panel', {
  schema: {
    distance: { type: 'number', default: 2 },
    height: { type: 'number', default: 0 },
    followSpeed: { type: 'number', default: 0.05 },
    deadZone: { type: 'number', default: 30 } // degrees
  },
  
  init: function() {
    this.camera = document.getElementById('main-camera');
    this.targetRotation = 0;
  },
  
  tick: function() {
    var cameraRotation = this.camera.object3D.rotation.y * (180 / Math.PI);
    var panelRotation = this.el.object3D.rotation.y * (180 / Math.PI);
    var diff = cameraRotation - panelRotation;
    
    // Normalize to -180 to 180
    while (diff > 180) diff -= 360;
    while (diff < -180) diff += 360;
    
    // Only move if outside dead zone
    if (Math.abs(diff) > this.data.deadZone) {
      var targetAngle = cameraRotation - (diff > 0 ? this.data.deadZone : -this.data.deadZone);
      var radians = targetAngle * (Math.PI / 180);
      
      var targetX = Math.sin(radians) * this.data.distance;
      var targetZ = -Math.cos(radians) * this.data.distance;
      
      // Smooth interpolation
      var currentPos = this.el.object3D.position;
      currentPos.x += (targetX - currentPos.x) * this.data.followSpeed;
      currentPos.z += (targetZ - currentPos.z) * this.data.followSpeed;
      
      // Face user
      this.el.object3D.rotation.y += (radians - this.el.object3D.rotation.y) * this.data.followSpeed;
    }
  }
});
```

### 3. Spatial UI Layout

**Android XR Layout Guidelines:**

| Element | Recommended Distance | Size | Notes |
|---------|---------------------|------|-------|
| Primary UI | 1.5m - 2m | 0.5m - 1m wide | Main interaction panels |
| Secondary UI | 2m - 3m | 0.3m - 0.5m wide | Supporting information |
| Tooltips | 0.5m - 1m | 0.1m - 0.2m wide | Contextual help |
| Environment | 5m+ | Variable | Background elements |

**Curved Surfaces:**

Android XR recommends curved surfaces for wide content to maintain consistent viewing distance:

```javascript
// Create curved panel for gallery grid
function createCurvedPanel(width, height, radius, segments) {
  var geometry = new THREE.CylinderGeometry(
    radius, radius, height, segments, 1, true,
    -width / (2 * radius), width / radius
  );
  
  // Flip normals to face inward
  geometry.scale(-1, 1, 1);
  
  return geometry;
}
```

### 4. Input and Interaction

**Android XR Input Hierarchy:**

1. **Eye Gaze + Pinch:** Primary selection method
2. **Hand Tracking:** Direct manipulation
3. **Controller:** Precision pointing
4. **Voice:** Hands-free commands

**Gaze Interaction Best Practices:**

```javascript
// Implement gaze-aware UI highlighting
AFRAME.registerComponent('gaze-highlight', {
  schema: {
    hoverColor: { type: 'color', default: '#4488ff' },
    defaultColor: { type: 'color', default: '#333333' },
    hoverScale: { type: 'number', default: 1.1 }
  },
  
  init: function() {
    var self = this;
    var el = this.el;
    
    this.originalScale = el.getAttribute('scale') || { x: 1, y: 1, z: 1 };
    
    el.addEventListener('mouseenter', function() {
      el.setAttribute('material', 'color', self.data.hoverColor);
      el.setAttribute('scale', {
        x: self.originalScale.x * self.data.hoverScale,
        y: self.originalScale.y * self.data.hoverScale,
        z: self.originalScale.z * self.data.hoverScale
      });
    });
    
    el.addEventListener('mouseleave', function() {
      el.setAttribute('material', 'color', self.data.defaultColor);
      el.setAttribute('scale', self.originalScale);
    });
  }
});
```

**Dwell Time Recommendations:**

| Action | Dwell Time | Use Case |
|--------|-----------|----------|
| Quick select | 500ms | Frequent actions |
| Standard select | 1000ms | Normal navigation |
| Confirm action | 1500ms | Destructive/important actions |
| Cancel | Look away | Abort selection |

### 5. Motion and Animation

**Android XR Motion Principles:**

- **Smooth transitions:** Use easing functions, avoid abrupt changes
- **Predictable motion:** Users should anticipate where elements will move
- **Comfortable speed:** Avoid fast movements that cause discomfort
- **Grounded motion:** Elements should feel like they have physical presence

**Recommended Animation Durations:**

| Animation Type | Duration | Easing |
|---------------|----------|--------|
| Hover feedback | 100-200ms | ease-out |
| Panel open/close | 300-400ms | ease-in-out |
| Scene transition | 500-800ms | ease-in-out |
| Teleportation | 200-300ms | ease-out |

**Implementation:**

```javascript
// Smooth panel animation
function animatePanel(panel, targetPosition, duration) {
  panel.setAttribute('animation', {
    property: 'position',
    to: targetPosition,
    dur: duration || 400,
    easing: 'easeInOutQuad'
  });
}

// Fade transition for scene changes
function fadeTransition(callback, duration) {
  duration = duration || 600;
  var fadeSphere = document.getElementById('fade-sphere');
  
  // Fade out
  fadeSphere.setAttribute('animation', {
    property: 'material.opacity',
    to: 1,
    dur: duration / 2,
    easing: 'easeInQuad'
  });
  
  setTimeout(function() {
    callback();
    
    // Fade in
    fadeSphere.setAttribute('animation', {
      property: 'material.opacity',
      to: 0,
      dur: duration / 2,
      easing: 'easeOutQuad'
    });
  }, duration / 2);
}
```

---

## Spatial Environments

### Environment Design

**Android XR Environment Types:**

1. **Passthrough:** Real world visible, virtual content overlaid
2. **Home Space:** Shared environment with other apps
3. **Full Space:** Immersive, app-controlled environment

**For VR360Gallery (Full Space):**

The 360 panorama viewer is inherently a "Full Space" experience. Key considerations:

- Provide clear exit/home button
- Maintain orientation cues
- Allow user to control immersion level

```html
<!-- Home/Exit button always visible -->
<a-entity id="home-button"
          position="0 -0.8 -1.5"
          visible="true">
  <a-circle radius="0.08"
            color="#ffffff"
            opacity="0.3">
  </a-circle>
  <a-text value="⌂"
          align="center"
          color="white"
          width="1">
  </a-text>
</a-entity>
```

### Grounding and Spatial Anchors

**Android XR Grounding Principles:**

- UI should feel "grounded" in space, not floating arbitrarily
- Use subtle shadows or connection lines to show spatial relationship
- Maintain consistent height relative to user

```javascript
// Ground shadow for floating panels
function addGroundShadow(panel) {
  var shadow = document.createElement('a-circle');
  shadow.setAttribute('radius', '0.5');
  shadow.setAttribute('color', '#000000');
  shadow.setAttribute('opacity', '0.2');
  shadow.setAttribute('rotation', '-90 0 0');
  shadow.setAttribute('position', '0 -1.5 0'); // Below panel
  
  panel.appendChild(shadow);
}
```

---

## Accessibility in XR

### Android XR Accessibility Guidelines

**Visual Accessibility:**

- Minimum text size: 0.02m at 1m distance (approximately 1.15 degrees visual angle)
- High contrast ratios (4.5:1 minimum for text)
- Avoid relying solely on color to convey information

**Motor Accessibility:**

- Large hit targets (minimum 0.05m at interaction distance)
- Support multiple input methods
- Provide dwell-based alternatives to gestures

**Cognitive Accessibility:**

- Clear, consistent navigation patterns
- Minimize cognitive load
- Provide orientation cues

**Implementation for VR360Gallery:**

```javascript
// Accessible button component
AFRAME.registerComponent('accessible-button', {
  schema: {
    label: { type: 'string', default: '' },
    description: { type: 'string', default: '' },
    minSize: { type: 'number', default: 0.1 }
  },
  
  init: function() {
    var el = this.el;
    var data = this.data;
    
    // Ensure minimum hit target size
    var geometry = el.getAttribute('geometry');
    if (geometry) {
      var scale = el.getAttribute('scale') || { x: 1, y: 1, z: 1 };
      var width = (geometry.width || 1) * scale.x;
      var height = (geometry.height || 1) * scale.y;
      
      if (width < data.minSize || height < data.minSize) {
        console.warn('Button too small for accessibility:', data.label);
      }
    }
    
    // Add aria-like attributes for screen readers (future XR accessibility)
    el.setAttribute('data-label', data.label);
    el.setAttribute('data-description', data.description);
    
    // Visual label
    if (data.label) {
      var text = document.createElement('a-text');
      text.setAttribute('value', data.label);
      text.setAttribute('align', 'center');
      text.setAttribute('color', 'white');
      text.setAttribute('width', '2');
      text.setAttribute('position', '0 0 0.01');
      el.appendChild(text);
    }
  }
});
```

---

## Performance Optimization

### Android XR Performance Guidelines

**Frame Rate Targets:**

| Device Type | Target FPS | Minimum FPS |
|-------------|-----------|-------------|
| High-end | 90 fps | 72 fps |
| Mid-range | 72 fps | 60 fps |
| Entry-level | 60 fps | 45 fps |

**Optimization Strategies:**

1. **Level of Detail (LOD):**
```javascript
AFRAME.registerComponent('lod-manager', {
  schema: {
    distances: { type: 'array', default: [2, 5, 10] },
    models: { type: 'array', default: [] }
  },
  
  tick: function() {
    var camera = document.getElementById('main-camera');
    var cameraPos = camera.object3D.position;
    var myPos = this.el.object3D.position;
    var distance = cameraPos.distanceTo(myPos);
    
    // Select appropriate LOD
    var lodIndex = 0;
    for (var i = 0; i < this.data.distances.length; i++) {
      if (distance > this.data.distances[i]) {
        lodIndex = i + 1;
      }
    }
    
    // Update model if changed
    if (lodIndex !== this.currentLOD) {
      this.currentLOD = lodIndex;
      this.updateModel(lodIndex);
    }
  },
  
  updateModel: function(lodIndex) {
    // Switch to appropriate detail level
    var model = this.data.models[lodIndex] || this.data.models[this.data.models.length - 1];
    this.el.setAttribute('src', model);
  }
});
```

2. **Frustum Culling:**
```javascript
// Only render visible thumbnails
function updateVisibleThumbnails(camera, thumbnails) {
  var frustum = new THREE.Frustum();
  var projScreenMatrix = new THREE.Matrix4();
  
  camera.updateMatrixWorld();
  projScreenMatrix.multiplyMatrices(
    camera.projectionMatrix,
    camera.matrixWorldInverse
  );
  frustum.setFromProjectionMatrix(projScreenMatrix);
  
  thumbnails.forEach(function(thumb) {
    var isVisible = frustum.containsPoint(thumb.object3D.position);
    thumb.setAttribute('visible', isVisible);
  });
}
```

3. **Texture Optimization:**
- Use compressed textures (KTX2, Basis Universal)
- Implement texture atlasing for thumbnails
- Progressive texture loading

---

## Applying Android XR Guidelines to VR360Gallery

### Recommended Changes Based on Guidelines

#### 1. Panel Positioning (High Priority)

**Current:** Fixed panel at (0, 0, -6)
**Recommended:** Orbiting panel at comfortable distance (2m)

```javascript
// Update VR gallery panel to use orbiting behavior
document.getElementById('vr-gallery-panel').setAttribute('orbiting-panel', {
  distance: 2,
  height: 0,
  followSpeed: 0.03,
  deadZone: 45
});
```

#### 2. Curved Gallery Layout (High Priority)

**Current:** Flat grid
**Recommended:** Curved surface matching user's field of view

```javascript
// Replace flat panel with curved gallery
function createCurvedGallery(images, radius) {
  radius = radius || 3;
  var container = document.getElementById('vr-gallery-items');
  container.innerHTML = '';
  
  var arcAngle = Math.min(images.length * 15, 120); // Max 120 degrees
  var startAngle = -arcAngle / 2;
  var angleStep = arcAngle / (images.length - 1 || 1);
  
  images.forEach(function(image, index) {
    var angle = startAngle + (index * angleStep);
    var radians = angle * (Math.PI / 180);
    
    var x = Math.sin(radians) * radius;
    var z = -Math.cos(radians) * radius;
    
    var item = createGalleryItem(image, index);
    item.setAttribute('position', x + ' 0 ' + z);
    item.setAttribute('rotation', '0 ' + angle + ' 0');
    
    container.appendChild(item);
  });
}
```

#### 3. Interaction Feedback (Medium Priority)

**Current:** Basic hover effects
**Recommended:** Multi-modal feedback (visual + audio + haptic)

```javascript
// Enhanced interaction feedback
AFRAME.registerComponent('xr-interactive', {
  schema: {
    hoverSound: { type: 'string', default: '#hover-sound' },
    selectSound: { type: 'string', default: '#select-sound' },
    hapticIntensity: { type: 'number', default: 0.3 }
  },
  
  init: function() {
    var self = this;
    var el = this.el;
    
    el.addEventListener('mouseenter', function() {
      // Visual
      el.setAttribute('scale', '1.1 1.1 1.1');
      el.setAttribute('material', 'emissive', '#222244');
      
      // Audio
      var sound = document.querySelector(self.data.hoverSound);
      if (sound) {
        sound.currentTime = 0;
        sound.play();
      }
      
      // Haptic
      triggerHapticBothHands('hover');
    });
    
    el.addEventListener('mouseleave', function() {
      el.setAttribute('scale', '1 1 1');
      el.setAttribute('material', 'emissive', '#000000');
    });
    
    el.addEventListener('click', function() {
      // Audio
      var sound = document.querySelector(self.data.selectSound);
      if (sound) {
        sound.currentTime = 0;
        sound.play();
      }
      
      // Haptic
      triggerHapticBothHands('select');
    });
  }
});
```

#### 4. Transition Animations (Medium Priority)

**Current:** Instant scene changes
**Recommended:** Smooth fade transitions with appropriate timing

```javascript
// Scene transition following Android XR guidelines
function transitionToGallery(galleryId) {
  var duration = 600; // Android XR recommended: 500-800ms
  
  // Disable interaction during transition
  document.querySelector('a-scene').setAttribute('cursor', 'rayOrigin', 'none');
  
  fadeTransition(function() {
    loadGalleryContent(galleryId);
  }, duration);
  
  // Re-enable interaction after transition
  setTimeout(function() {
    document.querySelector('a-scene').setAttribute('cursor', 'rayOrigin', 'mouse');
  }, duration + 100);
}
```

#### 5. Accessibility Improvements (High Priority)

**Current:** Limited accessibility support
**Recommended:** Full accessibility implementation

```javascript
// Accessibility-first gallery item
function createAccessibleGalleryItem(gallery, index) {
  var item = document.createElement('a-entity');
  
  item.setAttribute('accessible-button', {
    label: gallery.title || 'Gallery ' + (index + 1),
    description: gallery.description || gallery.images.length + ' images',
    minSize: 0.1
  });
  
  item.setAttribute('gaze-highlight', {
    hoverColor: '#4488ff',
    defaultColor: '#333333',
    hoverScale: 1.1
  });
  
  item.setAttribute('xr-interactive', {
    hoverSound: '#hover-sound',
    selectSound: '#select-sound'
  });
  
  // Large hit target
  var hitTarget = document.createElement('a-box');
  hitTarget.setAttribute('width', '1.2');
  hitTarget.setAttribute('height', '0.8');
  hitTarget.setAttribute('depth', '0.1');
  hitTarget.setAttribute('opacity', '0');
  hitTarget.setAttribute('data-raycastable', '');
  item.appendChild(hitTarget);
  
  return item;
}
```

---

## Summary: Android XR Guidelines Checklist

### Must Have (P0)
- [ ] Curved panel layout for gallery grid
- [ ] Comfortable viewing distance (1.5-2m)
- [ ] Minimum hit target size (0.1m)
- [ ] Smooth transitions (500-800ms)
- [ ] Clear exit/home button

### Should Have (P1)
- [ ] Orbiting panel behavior
- [ ] Multi-modal feedback (visual + audio + haptic)
- [ ] Ground shadows for floating elements
- [ ] High contrast text (4.5:1 ratio)
- [ ] Dwell-based selection with visual progress

### Nice to Have (P2)
- [ ] Level of Detail (LOD) system
- [ ] Frustum culling for performance
- [ ] Voice command support
- [ ] Hand tracking gestures
- [ ] Passthrough mode option

---

## Related Resources

- [Android XR Design Guidelines](https://developer.android.com/design/ui/xr/guides/get-started)
- [Android XR Spatial UI](https://developer.android.com/design/ui/xr/guides/spatial-ui)
- [Android XR Input](https://developer.android.com/design/ui/xr/guides/input)
- [Android XR Motion](https://developer.android.com/design/ui/xr/guides/motion)
- [Android XR Accessibility](https://developer.android.com/design/ui/xr/guides/accessibility)

---

*Document Version: 1.0*
*Last Updated: 2026-03-08*
*Based on: Android XR Design Guidelines (developer.android.com)*
