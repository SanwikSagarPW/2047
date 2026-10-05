window.G = window.G || {};

G.Ship = (function () {
  const U = G.utils;
  const keys = {};
  let touchStates = { w: false, up: false, s: false, down: false, a: false, left: false, d: false, right: false, space: false, r: false, q: false, e: false };
  let yaw = 0, pitch = 0, roll = 0;
  let dragging = false, lastX = 0, lastY = 0;
  let active = false;
  let thrustSndTimer = 0;
  let onFirstMove = null;
  let moved = false;
  let throttle = 0, boosting = false, cruise = 0, jump = false;
  const JUMP_SPEED = 600, JUMP_MIN_R = 700;

  function setJump(on) {
    if (on === jump) return;
    if (on) {
      const p = G.World.ship.group.position, st = G.Save.get();
      if (!active) return;
      if (Math.hypot(p.x, p.z) < JUMP_MIN_R) { G.UI.notify('Jump drive works beyond Neptune, away from planets', 'info'); G.Audio.play('error'); return; }
      if (st.fuel < 10) { G.UI.notify('Jump drive needs at least 10% fuel', 'bad'); G.Audio.play('error'); return; }
      G.Audio.play('warp');
      G.UI.notify('Jump drive engaged', 'good');
    } else if (jump) {
      G.World.ship.velocity.multiplyScalar(0.05);
    }
    jump = on;
    ['hud', 'btn-jump', 'm-jump'].forEach(function (id) { const e = U.el(id); if (e) e.classList.toggle(id === 'hud' ? 'jumping' : 'on', on); });
  }

  function jumpStep(dt, pos) {
    const st = G.Save.get();
    st.fuel = Math.max(0, st.fuel - dt * 0.7);
    const dn = G.DeepSpace.nearest(pos, 260);
    const nb = G.World.nearestBody(pos, 1e9);
    let why = null;
    if (st.fuel <= 2) why = 'Out of fuel';
    else if (Math.hypot(pos.x, pos.z) < JUMP_MIN_R - 40) why = 'Entering the Solar System';
    else if (dn) why = 'Arrived near ' + dn.a.name;
    else if (nb && nb.dist < nb.body.def.radius + 150) why = 'Planet ahead';
    if (why) { setJump(false); G.UI.notify('Jump drive off: ' + why, 'info'); }
  }
  const analog = { x: 0, y: 0 };
  const euler = new THREE.Euler(0, 0, 0, 'YXZ');
  const tmp = new THREE.Vector3();

  function bind(canvas) {
    window.addEventListener('keydown', function (e) {
      if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return;
      keys[e.code] = true;
      if (['KeyW', 'KeyA', 'KeyS', 'KeyD', 'Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].indexOf(e.code) >= 0) {
        if (active) e.preventDefault();
      }
    });
    window.addEventListener('keyup', function (e) { keys[e.code] = false; });
    window.addEventListener('blur', function () { for (const k in keys) keys[k] = false; });
    canvas.addEventListener('pointerdown', function (e) {
      if (!active || e.button > 0) return;
      dragging = true;
      lastX = e.clientX; lastY = e.clientY;
      try { canvas.setPointerCapture(e.pointerId); } catch (err) { }
    });
    function endLook() { dragging = false; }
    canvas.addEventListener('pointerup', endLook);
    canvas.addEventListener('pointercancel', endLook);
    canvas.addEventListener('pointermove', function (e) {
      if (!active || !dragging) return;
      const touch = e.pointerType === 'touch';
      yaw -= (e.clientX - lastX) * (touch ? 0.0052 : 0.0038);
      pitch = U.clamp(pitch - (e.clientY - lastY) * (touch ? 0.0042 : 0.0032), -1.35, 1.35);
      lastX = e.clientX; lastY = e.clientY;
    });
  }

  function activate() {
    active = true;
    if (G.World.ship) G.World.ship.group.visible = false;
    G.World.mode = 'ship';
  }
  function deactivate() {
    setJump(false);
    active = false;
    if (G.World.ship) G.World.ship.group.visible = true;
  }
  function setTouchStates(states) { Object.assign(touchStates, states); }

  function collide(pos, vel) {
    const bodies = G.World.bodies;
    for (const id in bodies) {
      const b = bodies[id];
      const min = b.def.radius + (b.def.type === 'star' ? 25 : 2.5);
      tmp.subVectors(pos, b.worldPos);
      const d = tmp.length();
      if (d < min && d > 0.0001) {
        tmp.multiplyScalar(1 / d);
        pos.copy(b.worldPos).addScaledVector(tmp, min);
        const inward = vel.dot(tmp);
        if (inward < 0) vel.addScaledVector(tmp, -inward * 1.3);
        if (b.def.type === 'star' && Math.random() < 0.05) G.UI.notify('Heat shields critical! Pull away from the Sun', 'bad');
      }
    }
    const an = G.Sectors.anomalies();
    for (let i = 0; i < an.length; i++) {
      if (!an[i].solid) continue;
      tmp.subVectors(pos, an[i].obj.position);
      const d = tmp.length();
      if (d < an[i].solid && d > 0.0001) {
        tmp.multiplyScalar(1 / d);
        pos.copy(an[i].obj.position).addScaledVector(tmp, an[i].solid);
        const inward = vel.dot(tmp);
        if (inward < 0) vel.addScaledVector(tmp, -inward * 1.3);
      }
    }
  }

  function update(dt) {
    const ship = G.World.ship;
    if (!ship) return null;
    const group = ship.group;
    let thrusting = false, yawIn = 0, pitchIn = 0;
    boosting = false;
    let target = 0;

    if (active) {
      const k = function (c) { return !!keys[c]; };
      boosting = k('ShiftLeft') || k('ShiftRight') || !!touchStates.boost;
      if (k('KeyW') || touchStates.w || touchStates.up) target = 1;
      if (k('KeyS') || touchStates.s || touchStates.down) target = -0.6;
      if (!target && cruise > 0.02) target = cruise;
      if (k('KeyA') || k('ArrowLeft') || touchStates.a || touchStates.left) yawIn += 1;
      if (k('KeyD') || k('ArrowRight') || touchStates.d || touchStates.right) yawIn -= 1;
      if (Math.abs(analog.x) > 0.08 || Math.abs(analog.y) > 0.08) {
        yawIn -= analog.x;
        target = analog.y < 0 ? -analog.y : analog.y * 0.6 * -1;
      }
      if (k('ArrowUp')) pitchIn += 1;
      if (k('ArrowDown')) pitchIn -= 1;
      yaw += yawIn * dt * 1.75;
      pitch = U.clamp(pitch + pitchIn * dt * 1.2, -1.35, 1.35);
    }
    if (jump && active) { target = 1; boosting = true; }
    throttle = U.lerp(throttle, target * (boosting && target > 0 ? 1 : 0.72), Math.min(1, dt * 8));
    roll = U.lerp(roll, yawIn * 0.1, Math.min(1, dt * 5));
    euler.set(pitch, yaw, roll);
    group.quaternion.setFromEuler(euler);

    const fwd = tmp.set(0, 0, -1).applyQuaternion(group.quaternion).clone();
    const upv = new THREE.Vector3(0, 1, 0).applyQuaternion(group.quaternion);
    const accel = boosting ? 70 : 30;
    if (Math.abs(throttle) > 0.02) { ship.velocity.addScaledVector(fwd, accel * throttle * dt); thrusting = true; }
    if (active && (keys['KeyR'] || touchStates.r)) { ship.velocity.addScaledVector(upv, 16 * dt); thrusting = true; }
    if (active && (keys['KeyF'] || touchStates.f)) { ship.velocity.addScaledVector(upv, -16 * dt); thrusting = true; }
    if (active && (keys['Space'] || touchStates.space)) ship.velocity.multiplyScalar(Math.max(0, 1 - dt * 3));

    ship.velocity.multiplyScalar(Math.max(0, 1 - dt * 0.28));
    const maxSpeed = jump ? JUMP_SPEED + 50 : (boosting ? 120 : 48);
    if (ship.velocity.length() > maxSpeed) ship.velocity.setLength(U.lerp(ship.velocity.length(), maxSpeed, Math.min(1, dt * 2)));
    if (jump) {
      if (!active) setJump(false);
      else {
        ship.velocity.lerp(fwd.clone().multiplyScalar(JUMP_SPEED), Math.min(1, dt * 1.2));
        thrusting = true;
        jumpStep(dt, group.position);
      }
    }
    group.position.addScaledVector(ship.velocity, dt);
    collide(group.position, ship.velocity);

    const speed = ship.velocity.length();
    const flickT = performance.now() * 0.001;
    for (let i = 0; i < ship.flames.length; i++) {
      const flick = 0.94 + 0.06 * Math.sin(flickT * 17 + i * 2.2);
      ship.flames[i].scale.set(1, 1, (0.55 + Math.abs(throttle) * 1.45) * flick);
      ship.flames[i].visible = Math.abs(throttle) > 0.05;
    }

    thrustSndTimer -= dt;
    if (thrusting && thrustSndTimer <= 0) {
      thrustSndTimer = boosting ? 0.18 : 0.3;
    }
    if (thrusting && !moved) {
      moved = true;
      if (onFirstMove) onFirstMove();
    }

    if (active) {
      const cam = G.World.camera;
      cam.position.copy(group.position).addScaledVector(upv, 0.55);
      if (boosting && speed > 8) {
        const s = performance.now() * 0.001, mag = Math.min(0.015, speed * 0.00012);
        cam.position.x += Math.sin(s * 23) * mag;
        cam.position.y += Math.sin(s * 17 + 1.4) * mag * 0.65;
      }
      cam.quaternion.copy(group.quaternion);
      const fov = 68 + U.clamp(speed / 120, 0, 1) * 16 + (jump ? 14 : 0);
      if (Math.abs(cam.fov - fov) > 0.05) { cam.fov = U.lerp(cam.fov, fov, Math.min(1, dt * 3)); cam.updateProjectionMatrix(); }
    }

    const near = G.World.nearestBody(group.position, 90);
    return { speed: speed, nearBody: near, throttle: throttle, boost: boosting };
  }

  function position() {
    return G.World.ship.group.position;
  }

  function teleport(x, y, z, lookAt) {
    G.World.ship.group.position.set(x, y, z);
    G.World.ship.velocity.set(0, 0, 0);
    if (lookAt) face(lookAt);
  }

  function face(target) {
    const p = G.World.ship.group.position;
    const d = new THREE.Vector3().subVectors(target, p);
    yaw = Math.atan2(-d.x, -d.z);
    pitch = U.clamp(Math.atan2(d.y, Math.hypot(d.x, d.z)), -1.2, 1.2);
  }

  function heading() { return yaw; }
  function setFirstMoveCb(cb) { onFirstMove = cb; }

  return {
    bind: bind, activate: activate, deactivate: deactivate, setTouchStates: setTouchStates,
    setCruise: function (v) { cruise = v; },
    setJump: setJump, toggleJump: function () { setJump(!jump); }, isJump: function () { return jump; },
    update: update, position: position, teleport: teleport, face: face, heading: heading,
    setFirstMoveCb: setFirstMoveCb,
    throttle: function () { return throttle; },
    setAnalog: function (x, y) { analog.x = x; analog.y = y; },
    isActive: function () { return active; }
  };
})();
