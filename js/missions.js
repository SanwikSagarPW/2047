window.G = window.G || {};

G.Missions = (function () {
  const U = G.utils;

  function current() {
    const st = G.Save.get();
    return G.MISSIONS[st.missionIndex] || null;
  }

  function currentStep() {
    const st = G.Save.get();
    const m = current();
    if (!m) return null;
    return m.steps[st.missionStep] || null;
  }

  function advance() {
    const st = G.Save.get();
    const m = current();
    if (!m) return;
    st.missionStep++;
    if (st.missionStep >= m.steps.length) {
      complete();
    } else {
      G.Save.save();
      G.UI.updateObjective();
      G.UI.refreshStation();
      G.UI.notify('Objective updated', 'info');
      const nextStep = m.steps[st.missionStep];
      if (nextStep && nextStep.type === 'report') {
        const openRep = function () {
          const q = document.getElementById('quiz-panel');
          if (q && !q.classList.contains('hidden')) { setTimeout(openRep, 1000); return; }
          G.Game.openReport();
        };
        setTimeout(openRep, 2000);
      }
      catchUp();
    }
  }

  function wasScanned(id) {
    if (G.Save.isPoiScanned('orbit', id)) return true;
    for (const b in G.PLANETS) if (G.Save.isPoiScanned(b, id)) return true;
    return false;
  }

  // A scan step whose target was already scanned earlier would otherwise wait forever.
  function catchUp() {
    const step = currentStep();
    if (step && step.type === 'scan' && wasScanned(step.target)) setTimeout(advance, 600);
  }

  function complete() {
    const st = G.Save.get();
    const m = current();
    if (!m) return;
    G.Save.completeMission(m.id);
    G.Audio.play('success');
    G.UI.notify('Mission Complete: ' + m.title, 'good');
    G.UI.koraSay(m.koraComplete);
    if (m.reward) {
      if (m.reward.xp) {
        const oldRank = G.Save.rank().name;
        G.Save.addXp(m.reward.xp);
        const newRank = G.Save.rank().name;
        if (newRank !== oldRank) {
          setTimeout(function () {
            G.UI.notify('Promoted to ' + newRank + '!', 'good');
            G.UI.koraSay('Congratulations, ' + ((st.profile && st.profile.name) || 'Explorer') + '. You have been promoted to ' + newRank + '.');
            G.Audio.play('badge');
          }, 2500);
        }
      }
      if (m.reward.badge) {
        setTimeout(function () { awardBadgeWithToast(m.reward.badge); }, 1500);
      }
      if (m.reward.unlock) {
        if (G.Save.unlock(m.reward.unlock)) {
          const names = m.reward.unlock.map(function (id) {
            if (G.PLANETS[id]) return G.PLANETS[id].name;
            if (G.STATIONS[id]) return G.STATIONS[id].name;
            return id;
          });
          setTimeout(function () {
            G.UI.discoveryToast('New Destination Unlocked', names.join(' \u2022 '));
            G.UI.koraSay('Navigation updated. New destination available: ' + names.join(', ') + '. Open your map with M.');
            G.Audio.play('badge');
          }, 2200);
        }
      }
      if (m.reward.knowledge) {
        for (let i = 0; i < m.reward.knowledge.length; i++) {
          G.Save.unlockKnowledge(m.reward.knowledge[i], 'scanned');
        }
        G.Journal.refresh();
      }
    }
    st.missionIndex++;
    st.missionStep = 0;
    G.Save.save();
    G.UI.updateObjective();
    if (m.questions && m.questions.length) {
      // Wait until station/scan panels are closed so the quiz never opens underneath them.
      const busy = function () {
        return ['station-panel', 'scan-panel', 'npc-panel', 'map-panel', 'journal-panel', 'report-screen'].some(function (id) {
          const e = document.getElementById(id); return e && !e.classList.contains('hidden');
        }) || (G.Coach && G.Coach.active());
      };
      const tryQuiz = function () {
        if (busy()) { setTimeout(tryQuiz, 1000); return; }
        G.Quiz.start(m.questions, function () {
          G.UI.notify('Knowledge check complete', 'good');
        });
      };
      setTimeout(tryQuiz, 4000);
    }
    // The credits screen is opened by submitReport(); a timer here would reopen it during Free Roam.
  }

  function awardBadgeWithToast(badgeId) {
    if (G.Save.awardBadge(badgeId)) {
      const badge = G.BADGES.find(function (b) { return b.id === badgeId; });
      if (badge) {
        G.UI.discoveryToast('Badge Earned', badge.name);
        G.Audio.play('badge');
        G.Journal.refresh();
      }
    }
  }

  function onScan(poi) {
    const step = currentStep();
    if (!step) return;
    if (step.type === 'scan' && (step.target === poi.kind || step.target === poi.id)) {
      advance();
    }
  }

  function onTravel(bodyId) {
    const step = currentStep();
    if (!step) return;
    if (step.type === 'travel_body' && step.target === bodyId) {
      advance();
    }
  }

  function onDock(stationId) {
    let step = currentStep();
    if (!step) return;
    if (step.type === 'travel_body' && step.target === stationId) { advance(); step = currentStep(); if (!step) return; }
    if (step.type === 'dock' && step.target === stationId) {
      advance();
    }
  }

  function onLand(bodyId) {
    let step = currentStep();
    if (!step) return;
    if (step.type === 'travel_body' && step.target === bodyId) { advance(); step = currentStep(); if (!step) return; }
    if (step.type === 'land' && step.target === bodyId) {
      advance();
    }
  }

  // Flying to a mission body by hand counts as travelling there.
  function checkArrival(pos, onBody) {
    const step = currentStep();
    if (!step || step.type !== 'travel_body') return;
    if (onBody) {
      if (onBody !== step.target) return;
      advance();
      const s = currentStep();
      if (s && s.type === 'land' && s.target === onBody) advance();
      return;
    }
    const b = G.World.bodies[step.target];
    if (b && pos.distanceTo(b.worldPos) < b.def.radius + 60) advance();
    const sp = G.World.stationPosition(step.target);
    if (sp && pos.distanceTo(sp) < 60) advance();
  }

  function onReturnShip() {
    const step = currentStep();
    if (!step) return;
    if (step.type === 'return_ship') {
      advance();
    }
  }

  function onNpc(id) {
    const step = currentStep();
    if (!step) return;
    if (step.type === 'npc' && (!id || step.target === id)) {
      advance();
    }
  }

  function onQuiz() {
    const step = currentStep();
    if (!step) return;
    if (step.type === 'quiz') {
      advance();
    }
  }

  function onRefuel() {
    const step = currentStep();
    if (!step) return;
    if (step.type === 'refuel') {
      advance();
    }
  }

  function onReport() {
    const step = currentStep();
    if (!step) return;
    if (step.type === 'report') {
      advance();
    }
  }

  function onMove() {
    const step = currentStep();
    if (!step) return;
    if (step.type === 'travel') {
      const st = G.Save.get();
      st.missionStep++;
      G.Save.save();
      G.UI.updateObjective();
    }
  }

  function start() {
    const m = current();
    if (m) {
      G.UI.koraSay(G.Kora.greet() + ' ' + m.koraIntro.split('{name}').join((G.Save.get().profile && G.Save.get().profile.name) || 'Explorer'));
    }
  }

  function status() {
    const st = G.Save.get();
    return {
      mission: current(),
      step: currentStep(),
      index: st.missionIndex,
      total: G.MISSIONS.length,
      done: st.completedMissions.length
    };
  }

  return {
    current: current, currentStep: currentStep,
    onScan: onScan, onTravel: onTravel, onDock: onDock, onLand: onLand, checkArrival: checkArrival,
    onReturnShip: onReturnShip, onNpc: onNpc, onQuiz: onQuiz,
    onRefuel: onRefuel, onReport: onReport, onMove: onMove,
    start: start, status: status
  };
})();
