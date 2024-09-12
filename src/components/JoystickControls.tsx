import { onCleanup, onMount } from 'solid-js';
import nipplejs from 'nipplejs';
import { Entity } from 'aframe';

// WASD Joystick for movement
export const JoystickWASD = () => {
  let joystickZone: HTMLDivElement | null;

  onMount(() => {
    joystickZone = document.getElementById('zone_joystick') as HTMLDivElement;

    if (!joystickZone) return;

    // Create the joystick in the movement zone
    const joystick = nipplejs.create({
      zone: joystickZone,
      mode: 'static',
      position: { left: '50%', top: '50%' },
      color: 'blue',
    });

    const playerEl = document.getElementById('player') as Entity;
    if (!playerEl) return;

    let f: number, ang: number, xVec: number, yVec: number;

    // Handle movement when the joystick moves
    joystick.on('move', (evt, data) => {
      f = data.force;
      ang = data.angle.radian;

      xVec = Math.cos(ang + (3.14 / 180) * playerEl.getAttribute('rotation').y);
      yVec = Math.sin(ang + (3.14 / 180) * playerEl.getAttribute('rotation').y);

      const x = playerEl.getAttribute('position').x + (f / 15) * xVec;
      const y = playerEl.getAttribute('position').y;
      const z = playerEl.getAttribute('position').z - (f / 15) * yVec;

      playerEl.setAttribute('position', `${x} ${y} ${z}`);
    });

    // Cleanup when the component is unmounted
    onCleanup(() => {
      joystick.destroy();
    });
  });

  return <div id="zone_joystick" class="joystick"></div>;
};

// Look Joystick for controlling the camera/look
export const LookJoystick = () => {
  let joystickZone: HTMLDivElement | null;

  onMount(() => {
    joystickZone = document.getElementById('joystick_look') as HTMLDivElement;

    if (!joystickZone) return;

    // Create the joystick in the look zone
    const joystick = nipplejs.create({
      zone: joystickZone,
      mode: 'static',
      position: { right: '50%', top: '50%' },
      color: 'red',
    });

    const playerEl = document.getElementById('player') as Entity;
    if (!playerEl) return;

    joystick.on('move', (evt, data) => {
      const rotation = playerEl.getAttribute('rotation');
      const deltaX = data.vector.x * 2; // Adjust sensitivity if needed
      const deltaY = data.vector.y * 2;

      const newRotationY = rotation.y - deltaX;
      const newRotationX = Math.max(-90, Math.min(90, rotation.x + deltaY)); // Limit pitch rotation

      playerEl.setAttribute('rotation', `${newRotationX} ${newRotationY} 0`);
    });

    // Cleanup when the component is unmounted
    onCleanup(() => {
      joystick.destroy();
    });
  });

  return <div id="joystick_look" class="joystick"></div>;
};
