window.G = window.G || {};

G.Quiz = (function () {
  const U = G.utils;
  let queue = [];
  let index = 0;
  let correctCount = 0;
  let onDone = null;
  let answered = false;

  let title = 'Knowledge Check';

  // Accepts question ids or ready-made question objects.
  function start(questionIds, doneCb, customTitle, iconHtml) {
    queue = [];
    title = customTitle || 'Knowledge Check';
    const ic = document.querySelector('#quiz-panel .panel-header-icon');
    if (ic) ic.innerHTML = iconHtml || G.Icon('question');
    for (let i = 0; i < questionIds.length; i++) {
      const id = questionIds[i];
      const q = typeof id === 'object' ? id : G.QUESTIONS.find(function (x) { return x.id === id; });
      if (q) queue.push(q);
    }
    index = 0;
    correctCount = 0;
    onDone = doneCb;
    U.show('quiz-panel');
    renderQuestion();
  }

  function renderQuestion() {
    answered = false;
    const q = queue[index];
    U.el('quiz-title').textContent = title;
    U.el('quiz-subtitle').textContent = 'Question ' + (index + 1) + ' of ' + queue.length;
    const body = U.el('quiz-body');
    let html = '<div class="quiz-question">' + q.text + '</div>';
    for (let i = 0; i < q.options.length; i++) {
      html += '<button class="quiz-option" data-i="' + i + '">' + q.options[i] + '</button>';
    }
    html += '<div class="quiz-feedback hidden" id="quiz-feedback"></div>';
    html += '<button class="menu-btn primary quiz-next hidden" id="quiz-next">Continue</button>';
    body.innerHTML = html;
    const buttons = body.querySelectorAll('.quiz-option');
    for (let i = 0; i < buttons.length; i++) {
      buttons[i].onclick = function () { answer(parseInt(this.getAttribute('data-i'), 10)); };
    }
    U.el('quiz-next').onclick = next;
  }

  function answer(i) {
    if (answered) return;
    answered = true;
    const q = queue[index];
    const buttons = U.el('quiz-body').querySelectorAll('.quiz-option');
    for (let j = 0; j < buttons.length; j++) {
      buttons[j].disabled = true;
      if (j === q.correct) buttons[j].classList.add('correct');
      else if (j === i) buttons[j].classList.add('wrong');
    }
    const correct = i === q.correct;
    if (correct) correctCount++;
    G.Save.recordQuiz(q.id, correct);
    G.Audio.play(correct ? 'success' : 'error');
    const fb = U.el('quiz-feedback');
    fb.className = 'quiz-feedback ' + (correct ? 'good' : 'bad');
    fb.innerHTML = '<b>' + (correct ? 'Correct! ' : 'Not quite. ') + '</b>' + q.explanation;
    fb.classList.remove('hidden');
    U.el('quiz-next').classList.remove('hidden');
    if (correct) {
      G.UI.koraSay(G.Kora.quizLine(true));
    } else {
      G.UI.koraSay(G.Kora.quizLine(false, q.hint));
    }
  }

  function next() {
    index++;
    if (index >= queue.length) {
      close();
      if (onDone) onDone(correctCount, queue.length);
    } else {
      renderQuestion();
    }
  }

  function close() {
    U.hide('quiz-panel');
  }

  return { start: start, close: close };
})();
