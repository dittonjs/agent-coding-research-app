const statusEl = document.getElementById("status");
const arrayEl = document.getElementById("array");

const ALGORITHMS = [
  "bubble_sort",
  "selection_sort",
  "insertion_sort",
  "merge_sort",
  "quick_sort",
  "heap_sort",
];

let currentAlgorithm = null;
let currentArray = [];

function randomArray(n) {
  const arr = [];
  for (let i = 0; i < n; i++) {
    arr.push(Math.floor(Math.random() * 99) + 1);
  }
  return arr;
}

function renderArray() {
  arrayEl.textContent = "[" + currentArray.join(", ") + "]";
}

function pickAlgorithm(algorithm) {
  currentAlgorithm = algorithm || ALGORITHMS[Math.floor(Math.random() * ALGORITHMS.length)];
}

function showCurrent() {
  statusEl.textContent = currentAlgorithm.replace(/_/g, " ");
  renderArray();

  window.parent.postMessage(
    {
      type: "SHOW_ALGORITHM",
      payload: { algorithm: currentAlgorithm, array: currentArray },
    },
    "*"
  );
}

function showNext() {
  pickAlgorithm();
  currentArray = randomArray(10);
  showCurrent();
}

window.addEventListener("message", (event) => {
  const { type, payload } = event.data || {};

  if (type === "START") {
    // START can optionally specify an algorithm
    pickAlgorithm(payload?.algorithm);
    currentArray = randomArray(10);
    showCurrent();
  } else if (type === "STOP") {
    statusEl.textContent = "Stopped.";
    arrayEl.textContent = "";
  } else if (type === "NEXT") {
    showNext();
  } else if (type === "REPLAY") {
    // Re-show the same algorithm and same array
    if (currentAlgorithm) {
      statusEl.textContent = currentAlgorithm.replace(/_/g, " ") + " (replay)";
      renderArray();
      window.parent.postMessage(
        {
          type: "SHOW_ALGORITHM",
          payload: { algorithm: currentAlgorithm, array: currentArray },
        },
        "*"
      );
    }
  } else if (type === "RESTART") {
    // Restart with the same algorithm and same array
    if (currentAlgorithm) {
      showCurrent();
    }
  } else if (type === "RANDOMIZE") {
    // New random array, same algorithm, restart
    if (currentAlgorithm) {
      currentArray = randomArray(10);
      showCurrent();
    }
  }
});

// Let parent know we're ready
window.parent.postMessage({ type: "READY" }, "*");
statusEl.textContent = "Waiting for START...";
