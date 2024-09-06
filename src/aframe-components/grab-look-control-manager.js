/* global AFRAME */
/*
This component is intended to work with the super-hands component
to disable look-controls when an object is grabbed.
Originally, when you try to grab a grabbable object, the camera would also move
while draggin the object.
*/
AFRAME.registerComponent('grab-look-control-manager', {
  init: function () {
    this.el.addEventListener('grab-start', function () {
      const cameraEl = document.querySelector('[camera]');
      const lookControls = cameraEl && cameraEl.components['look-controls'];

      if (lookControls) {
        lookControls.pause(); // Disable look-controls on grab start
        console.log('look-controls paused');
      }
    });

    this.el.addEventListener('grab-end', function () {
      const cameraEl = document.querySelector('[camera]');
      const lookControls = cameraEl && cameraEl.components['look-controls'];

      if (lookControls) {
        lookControls.play(); // Re-enable look-controls on grab end
        console.log('look-controls re-enabled');
      }
    });
  }
});