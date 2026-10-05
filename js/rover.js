window.G = window.G || {};

G.Rover = (function () {
  const U = G.utils;
  const keys = {};
  let touchStates = { w: false, up: false, s: false, down: false, a: false, left: false, d: false, right: false };
  let active = false;
  let lookYaw = 0, lookPitch = -0.08;
  let dragging = false, lastX = 0, lastY = 0;
  let wheelSpin = 0, bob = 0;
  const analog = { x: 0, y: 0 };

  function bind(canvas) {
    canvas.addEventListener('mousedown', function (e) {
      if (!active) return;
      dragging = true; lastX = e.clientX; lastY = e.clientY;
    });
    window.addEventListener('mouseup', function () { dragging = false; });
    window.addEventListener('mousemove', function (e) {
      if (!active || !dragging) return;
      lookYaw = U.clamp(lookYaw - (e.clientX - lastX) * 0.004, -2.4, 2.4);
      lookPitch = U.clamp(lookPitch - (e.clientY - lastY) * 0.003, -0.9, 0.9);
      lastX = e.clientX; lastY = e.clientY;
    });
    canvas.addEventListener('touchstart', function (e) {
      if (!active) return;
      dragging = true;
      lastX = e.targetTouches[0].clientX; lastY = e.targetTouches[0].clientY;
    });
    canvas.addEventListener('touchend', function () { dragging = false; });
    canvas.addEventListener('touchmove', function (e) {
      if (!active || !dragging || !e.targetTouches.length) return;
      e.preventDefault();
      const tt = e.targetTouches[0];
      lookYaw = U.clamp(lookYaw - (tt.clientX - lastX) * 0.005, -2.4, 2.4);
      lookPitch = U.clamp(lookPitch - (tt.clientY - lastY) * 0.004, -0.9, 0.9);
      lastX = tt.clientX; lastY = tt.clientY;
    }, { passive: false });
  }

  function activate() { active = true; G.World.mode = 'rover'; lookYaw = 0; lookPitch = -0.08; }
  function deactivate() { active = false; }
  function setTouchStates(states) { Object.assign(touchStates, states); }
  let cruise = 0;

  function place(x, z) {
    const rover = G.World.rover;
    const y = G.World.groundY(x, z);
    rover.group.position.set(x, y, z);
    rover.group.visible = true;
    rover.speed = 0;
    rover.heading = 0;
  }

  function hide() {
    G.World.rover.group.visible = false;
  }

  function update(dt) {
    const rover = G.World.rover;
    if (!rover || !rover.group.visible) return null;
    const group = rover.group;
    const maxSpeed = 16;
    let accel = 0, steer = 0;

    if (active) {
      if (keys['KeyW'] || keys['ArrowUp'] || touchStates.w || touchStates.up) accel = 18;
      if (keys['KeyS'] || keys['ArrowDown'] || touchStates.s || touchStates.down) accel = -11;
      else if (!accel && cruise > 0.02) accel = 18 * cruise;
      if (keys['KeyA'] || keys['ArrowLeft'] || touchStates.a || touchStates.left) steer = 1;
      if (keys['KeyD'] || keys['ArrowRight'] || touchStates.d || touchStates.right) steer = -1;
      if (Math.abs(analog.y) > 0.08) accel = analog.y < 0 ? -analog.y * 18 : -analog.y * 11;
      if (Math.abs(analog.x) > 0.08) steer = -analog.x;
    }
    rover.heading += steer * dt * 1.6 * U.clamp(Math.abs(rover.speed) / 4 + 0.35, 0, 1) * (rover.speed < -0.1 ? -1 : 1);
    if (!dragging) lookYaw = U.lerp(lookYaw, 0, Math.min(1, dt * 0.8));

    rover.speed += accel * dt;
    rover.speed *= Math.max(0, 1 - dt * 2.0);
    rover.speed = U.clamp(rover.speed, -maxSpeed * 0.5, maxSpeed);

    const dx = Math.sin(rover.heading) * rover.speed * dt;
    const dz = Math.cos(rover.heading) * rover.speed * dt;
    const nx = group.position.x + dx;
    const nz = group.position.z + dz;
    const curY = group.position.y;
    const newY = G.World.groundY(nx, nz);
    if (Math.abs(newY - curY) < 2.5 && Math.hypot(nx, nz) < 760) {
      group.position.x = nx;
      group.position.z = nz;
      group.position.y = U.lerp(curY, newY, Math.min(1, dt * 14));
    } else {
      rover.speed *= -0.3;
    }

    const ahead = G.World.groundY(nx + Math.sin(rover.heading) * 1.5, nz + Math.cos(rover.heading) * 1.5);
    const tiltTarget = Math.atan2(ahead - newY, 1.5);
    rover.tilt = U.lerp(rover.tilt || 0, tiltTarget, Math.min(1, dt * 8));
    group.rotation.set(-rover.tilt * 0.8, rover.heading, 0, 'YXZ');
    wheelSpin += rover.speed * dt * 2;
    group.children.forEach(function (c) { if (c.name === 'wheel') c.rotation.x = wheelSpin; });

    bob += Math.abs(rover.speed) * dt * 1.6;
    const cam = G.World.camera;
    const fwdX = Math.sin(rover.heading), fwdZ = Math.cos(rover.heading);
    cam.position.set(
      group.position.x + fwdX * 0.9,
      group.position.y + 2.55 + Math.sin(bob * 3) * 0.04 * Math.min(1, Math.abs(rover.speed) / 5),
      group.position.z + fwdZ * 0.9
    );
    cam.rotation.set(lookPitch - rover.tilt * 0.6, rover.heading + Math.PI + lookYaw, 0, 'YXZ');
    if (Math.abs(cam.fov - 72) > 0.05) { cam.fov = 72; cam.updateProjectionMatrix(); }

    const near = G.World.nearestPOI(group.position, 20);
    return { speed: Math.abs(rover.speed), nearPOI: near, throttle: rover.speed / maxSpeed };
  }

  function position() {
    return G.World.rover.group.position;
  }

  function heading() { return (G.World.rover ? G.World.rover.heading + Math.PI : 0) + lookYaw; }

  function down(e) { keys[e.code] = true; }
  function up(e) { keys[e.code] = false; }

  return {
    bind: bind, activate: activate, deactivate: deactivate,
    update: update, place: place, hide: hide, position: position, heading: heading,
    down: down, up: up, setTouchStates: setTouchStates,
    setCruise: function (v) { cruise = v; },
    setAnalog: function (x, y) { analog.x = x; analog.y = y; },
    isActive: function () { return active; }
  };
})();
