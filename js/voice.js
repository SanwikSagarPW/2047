window.G = window.G || {};

G.Voice = (function () {
  let recognition = null;
  let listening = false;
  let onResult = null;
  let onEnd = null;

  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;

  function available() {
    return !!SR;
  }

  function start(resultCb, endCb) {
    if (!SR) return false;
    if (listening) stop();
    onResult = resultCb;
    onEnd = endCb;
    try {
      recognition = new SR();
      recognition.lang = 'en-US';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;
      recognition.continuous = false;
      recognition.onresult = function (e) {
        const transcript = e.results[0][0].transcript;
        if (onResult) onResult(transcript);
      };
      recognition.onerror = function () {
        listening = false;
        if (onEnd) onEnd();
      };
      recognition.onend = function () {
        listening = false;
        if (onEnd) onEnd();
      };
      recognition.start();
      listening = true;
      return true;
    } catch (err) {
      listening = false;
      return false;
    }
  }

  function stop() {
    if (recognition && listening) {
      try { recognition.stop(); } catch (e) { }
    }
    listening = false;
  }

  return { available: available, start: start, stop: stop, isListening: function () { return listening; } };
})();
