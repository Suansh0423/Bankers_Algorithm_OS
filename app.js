/**
 * Banker's Algorithm Visual Simulator & Analyzer
 * Operating Systems Mini-Project Suite
 * Dijkstra Deadlock Avoidance Model
 */

(function () {
  'use strict';

  // =========================================================================
  // State Definition & Presets
  // =========================================================================
  const PRESETS = {
    classicSafe: {
      name: "Classic Safe State (5 Processes, 3 Resources)",
      n: 5,
      m: 3,
      allocation: [
        [0, 1, 0],
        [2, 0, 0],
        [3, 0, 2],
        [2, 1, 1],
        [0, 0, 2]
      ],
      max: [
        [7, 5, 3],
        [3, 2, 2],
        [9, 0, 2],
        [2, 2, 2],
        [4, 3, 3]
      ],
      available: [3, 3, 2]
    },
    unsafeDeadlock: {
      name: "Unsafe State / Deadlock Trap",
      n: 4,
      m: 3,
      allocation: [
        [1, 2, 1],
        [2, 0, 1],
        [2, 2, 1],
        [1, 1, 0]
      ],
      max: [
        [4, 3, 2],
        [3, 2, 2],
        [5, 4, 3],
        [2, 3, 2]
      ],
      available: [1, 0, 0]
    },
    multiResource: {
      name: "High Contention (6 Processes, 4 Resources)",
      n: 6,
      m: 4,
      allocation: [
        [1, 0, 2, 1],
        [2, 1, 0, 0],
        [1, 2, 1, 1],
        [0, 1, 1, 2],
        [2, 0, 1, 0],
        [1, 1, 0, 1]
      ],
      max: [
        [3, 2, 4, 2],
        [4, 2, 1, 1],
        [3, 4, 2, 2],
        [2, 3, 3, 3],
        [5, 1, 2, 1],
        [2, 2, 1, 3]
      ],
      available: [2, 2, 1, 2]
    },
    singleResource: {
      name: "Edge Case (3 Processes, 1 Resource)",
      n: 3,
      m: 1,
      allocation: [
        [3],
        [2],
        [2]
      ],
      max: [
        [9],
        [4],
        [7]
      ],
      available: [2]
    }
  };

  let state = {
    n: 5,
    m: 3,
    allocation: [],
    max: [],
    need: [],
    available: [],
    resourceNames: ['A', 'B', 'C'],
    processNames: ['P0', 'P1', 'P2', 'P3', 'P4'],
    
    // Playback state
    steps: [],
    currentStepIdx: 0,
    isPlaying: false,
    playInterval: null,
    stepDelay: 1000,
    soundEnabled: true
  };

  // Web Audio Synth for tech sound effects
  let audioCtx = null;
  function playBeep(freq = 440, type = 'sine', duration = 0.08, gainVal = 0.05) {
    if (!state.soundEnabled) return;
    try {
      if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      }
      if (audioCtx.state === 'suspended') {
        audioCtx.resume();
      }
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
      gain.gain.setValueAtTime(gainVal, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + duration);
    } catch (e) {
      // Audio not permitted or supported
    }
  }

  function playSuccessChord() {
    if (!state.soundEnabled) return;
    playBeep(523.25, 'triangle', 0.15, 0.07); // C5
    setTimeout(() => playBeep(659.25, 'triangle', 0.15, 0.07), 80); // E5
    setTimeout(() => playBeep(783.99, 'triangle', 0.3, 0.08), 160); // G5
  }

  function playAlertChord() {
    if (!state.soundEnabled) return;
    playBeep(330, 'sawtooth', 0.18, 0.07);
    setTimeout(() => playBeep(277.18, 'sawtooth', 0.28, 0.08), 120);
  }

  // =========================================================================
  // DOM Elements Selection
  // =========================================================================
  const dom = {
    presetSelect: document.getElementById('presetSelect'),
    btnAudioToggle: document.getElementById('btnAudioToggle'),
    iconSoundOn: document.getElementById('iconSoundOn'),
    iconSoundOff: document.getElementById('iconSoundOff'),
    btnOpenReport: document.getElementById('btnOpenReport'),
    navTabs: document.querySelectorAll('.nav-tab'),
    tabPanes: document.querySelectorAll('.tab-pane'),

    // Dimensions
    btnRemoveProcess: document.getElementById('btnRemoveProcess'),
    btnAddProcess: document.getElementById('btnAddProcess'),
    processCountDisplay: document.getElementById('processCountDisplay'),
    btnRemoveResource: document.getElementById('btnRemoveResource'),
    btnAddResource: document.getElementById('btnAddResource'),
    resourceCountDisplay: document.getElementById('resourceCountDisplay'),
    btnResetData: document.getElementById('btnResetData'),

    // Matrices
    tableAllocation: document.getElementById('tableAllocation'),
    tableMax: document.getElementById('tableMax'),
    tableNeed: document.getElementById('tableNeed'),
    tableAvailable: document.getElementById('tableAvailable'),
    displayTotalResources: document.getElementById('displayTotalResources'),
    validationWarning: document.getElementById('validationWarning'),
    validationWarningText: document.getElementById('validationWarningText'),

    // Execution Controls
    btnPlayPause: document.getElementById('btnPlayPause'),
    btnNextStep: document.getElementById('btnNextStep'),
    btnPrevStep: document.getElementById('btnPrevStep'),
    btnRestart: document.getElementById('btnRestart'),
    speedSlider: document.getElementById('speedSlider'),
    speedValueText: document.getElementById('speedValueText'),
    iconPlay: document.getElementById('iconPlay'),
    iconPause: document.getElementById('iconPause'),
    playBtnText: document.getElementById('playBtnText'),

    // Execution Dashboards
    workVectorDisplay: document.getElementById('workVectorDisplay'),
    workFormulaDesc: document.getElementById('workFormulaDesc'),
    finishFlagsDisplay: document.getElementById('finishFlagsDisplay'),
    finishRatioDisplay: document.getElementById('finishRatioDisplay'),
    stepNumberBadge: document.getElementById('stepNumberBadge'),
    stepActionBadge: document.getElementById('stepActionBadge'),
    mathComparison: document.getElementById('mathComparison'),
    mathExplanation: document.getElementById('mathExplanation'),
    sequenceTrack: document.getElementById('sequenceTrack'),
    sequenceStatusText: document.getElementById('sequenceStatusText'),
    safetyVerdictBanner: document.getElementById('safetyVerdictBanner'),
    verdictIcon: document.getElementById('verdictIcon'),
    verdictTitle: document.getElementById('verdictTitle'),
    verdictDescription: document.getElementById('verdictDescription'),
    verdictSequenceBox: document.getElementById('verdictSequenceBox'),

    // Tab 2: Resource Request
    requestProcessSelect: document.getElementById('requestProcessSelect'),
    requestInputsContainer: document.getElementById('requestInputsContainer'),
    btnEvaluateRequest: document.getElementById('btnEvaluateRequest'),
    btnResetRequestForm: document.getElementById('btnResetRequestForm'),
    requestResultSection: document.getElementById('requestResultSection'),
    checkCard1: document.getElementById('checkCard1'),
    checkIcon1: document.getElementById('checkIcon1'),
    checkDesc1: document.getElementById('checkDesc1'),
    checkCard2: document.getElementById('checkCard2'),
    checkIcon2: document.getElementById('checkIcon2'),
    checkDesc2: document.getElementById('checkDesc2'),
    checkCard3: document.getElementById('checkCard3'),
    checkIcon3: document.getElementById('checkIcon3'),
    checkDesc3: document.getElementById('checkDesc3'),
    requestDecisionBanner: document.getElementById('requestDecisionBanner'),
    requestDecisionTitle: document.getElementById('requestDecisionTitle'),
    requestDecisionDetails: document.getElementById('requestDecisionDetails'),
    btnApplyRequestPermanently: document.getElementById('btnApplyRequestPermanently'),
    simulatedMatricesContainer: document.getElementById('simulatedMatricesContainer'),

    // Tab 3: RAG
    ragCanvas: document.getElementById('ragCanvas'),
    ragEntityList: document.getElementById('ragEntityList'),

    // Viva Accordion
    vivaItems: document.querySelectorAll('.viva-item'),

    // Report Modal
    reportModal: document.getElementById('reportModal'),
    btnCloseReport: document.getElementById('btnCloseReport'),
    btnCloseReportBottom: document.getElementById('btnCloseReportBottom'),
    btnPrintReport: document.getElementById('btnPrintReport'),
    btnCopyReportText: document.getElementById('btnCopyReportText'),
    reportStudentName: document.getElementById('reportStudentName'),
    reportRollNo: document.getElementById('reportRollNo'),
    reportBranch: document.getElementById('reportBranch'),
    reportCourse: document.getElementById('reportCourse'),
    printName: document.getElementById('printName'),
    printRoll: document.getElementById('printRoll'),
    printBranch: document.getElementById('printBranch'),
    printCourse: document.getElementById('printCourse'),
    printTimestamp: document.getElementById('printTimestamp'),
    reportContentDynamic: document.getElementById('reportContentDynamic')
  };

  // =========================================================================
  // Initialization & Helpers
  // =========================================================================
  function getResourceName(idx) {
    if (idx < 26) return String.fromCharCode(65 + idx);
    return 'R' + idx;
  }

  function getProcessName(idx) {
    return 'P' + idx;
  }

  function deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  function loadPreset(key) {
    pauseSimulation();
    if (key === 'random') {
      generateRandomState();
      return;
    }
    const p = PRESETS[key] || PRESETS.classicSafe;
    state.n = p.n;
    state.m = p.m;
    state.resourceNames = Array.from({ length: state.m }, (_, i) => getResourceName(i));
    state.processNames = Array.from({ length: state.n }, (_, i) => getProcessName(i));
    state.allocation = deepClone(p.allocation);
    state.max = deepClone(p.max);
    state.available = deepClone(p.available);
    recalculateNeed();
    syncUI();
  }

  function generateRandomState() {
    const n = Math.floor(Math.random() * 3) + 4; // 4 to 6
    const m = Math.floor(Math.random() * 2) + 3; // 3 to 4
    state.n = n;
    state.m = m;
    state.resourceNames = Array.from({ length: m }, (_, i) => getResourceName(i));
    state.processNames = Array.from({ length: n }, (_, i) => getProcessName(i));

    state.allocation = [];
    state.max = [];
    state.available = [];

    for (let i = 0; i < n; i++) {
      const aRow = [];
      const mRow = [];
      for (let j = 0; j < m; j++) {
        const alloc = Math.floor(Math.random() * 4);
        const extra = Math.floor(Math.random() * 4) + 1;
        aRow.push(alloc);
        mRow.push(alloc + extra);
      }
      state.allocation.push(aRow);
      state.max.push(mRow);
    }

    for (let j = 0; j < m; j++) {
      state.available.push(Math.floor(Math.random() * 4) + 2);
    }

    recalculateNeed();
    syncUI();
  }

  function recalculateNeed() {
    state.need = [];
    let hasError = false;
    let errorMsg = "";

    for (let i = 0; i < state.n; i++) {
      const row = [];
      for (let j = 0; j < state.m; j++) {
        const allocVal = state.allocation[i]?.[j] ?? 0;
        const maxVal = state.max[i]?.[j] ?? 0;
        const diff = maxVal - allocVal;
        if (diff < 0) {
          hasError = true;
          errorMsg = `Invalid state: ${state.processNames[i]} Allocation of Resource ${state.resourceNames[j]} (${allocVal}) exceeds Max (${maxVal}).`;
        }
        row.push(diff);
      }
      state.need.push(row);
    }

    if (hasError) {
      dom.validationWarning.classList.remove('hidden');
      dom.validationWarningText.textContent = errorMsg;
    } else {
      dom.validationWarning.classList.add('hidden');
    }
  }

  // =========================================================================
  // UI Rendering: Matrices and Controls
  // =========================================================================
  function syncUI() {
    dom.processCountDisplay.textContent = state.n;
    dom.resourceCountDisplay.textContent = state.m;

    renderMatrixTable(dom.tableAllocation, state.allocation, true, 'alloc');
    renderMatrixTable(dom.tableMax, state.max, true, 'max');
    renderNeedTable();
    renderAvailableTable();
    renderTotalResources();
    populateRequestForm();
    generateSafetySteps();
    goToStep(0);
    renderRAG();
  }

  function renderMatrixTable(tableElem, matrixData, editable, type) {
    let html = '<thead><tr><th>Process</th>';
    for (let j = 0; j < state.m; j++) {
      html += `<th>${state.resourceNames[j]}</th>`;
    }
    html += '</tr></thead><tbody>';

    for (let i = 0; i < state.n; i++) {
      html += `<tr data-process-idx="${i}"><td class="row-header">${state.processNames[i]}</td>`;
      for (let j = 0; j < state.m; j++) {
        const val = matrixData[i]?.[j] ?? 0;
        if (editable) {
          html += `<td>
            <input type="number" min="0" max="99" value="${val}" 
                   class="matrix-input" 
                   data-type="${type}" data-row="${i}" data-col="${j}">
          </td>`;
        } else {
          html += `<td><span class="matrix-cell-val">${val}</span></td>`;
        }
      }
      html += '</tr>';
    }
    html += '</tbody>';
    tableElem.innerHTML = html;
  }

  function renderNeedTable() {
    let html = '<thead><tr><th>Process</th>';
    for (let j = 0; j < state.m; j++) {
      html += `<th>${state.resourceNames[j]}</th>`;
    }
    html += '</tr></thead><tbody>';

    for (let i = 0; i < state.n; i++) {
      html += `<tr data-process-idx="${i}"><td class="row-header">${state.processNames[i]}</td>`;
      for (let j = 0; j < state.m; j++) {
        const val = state.need[i]?.[j] ?? 0;
        const isNegative = val < 0;
        html += `<td><span class="matrix-cell-val ${isNegative ? 'error' : ''}">${val}</span></td>`;
      }
      html += '</tr>';
    }
    html += '</tbody>';
    dom.tableNeed.innerHTML = html;
  }

  function renderAvailableTable() {
    let html = '<thead><tr>';
    for (let j = 0; j < state.m; j++) {
      html += `<th>${state.resourceNames[j]}</th>`;
    }
    html += '</tr></thead><tbody><tr>';
    for (let j = 0; j < state.m; j++) {
      const val = state.available[j] ?? 0;
      html += `<td>
        <input type="number" min="0" max="99" value="${val}" 
               class="matrix-input" 
               data-type="avail" data-col="${j}">
      </td>`;
    }
    html += '</tr></tbody>';
    dom.tableAvailable.innerHTML = html;
  }

  function renderTotalResources() {
    let html = '';
    for (let j = 0; j < state.m; j++) {
      let allocatedSum = 0;
      for (let i = 0; i < state.n; i++) {
        allocatedSum += (state.allocation[i]?.[j] ?? 0);
      }
      const total = (state.available[j] ?? 0) + allocatedSum;
      html += `
        <div class="total-chip">
          <span class="res-name">${state.resourceNames[j]}:</span>
          <span class="res-val">${total}</span>
        </div>
      `;
    }
    dom.displayTotalResources.innerHTML = html;
  }

  // =========================================================================
  // Banker's Safety Algorithm Engine (Step Generator)
  // =========================================================================
  /**
   * Generates discrete recorded steps for playback.
   * Step object structure:
   * {
   *   stepNum: number,
   *   type: 'init' | 'evaluating' | 'allocated' | 'blocked' | 'safe_end' | 'unsafe_end',
   *   processIdx: number | null,
   *   processName: string | null,
   *   work: number[],
   *   finish: boolean[],
   *   safeSequence: number[],
   *   comparisonStr: string,
   *   explanationStr: string,
   *   workFormula: string
   * }
   */
  function generateSafetySteps() {
    const steps = [];
    const n = state.n;
    const m = state.m;

    const work = [...state.available];
    const finish = new Array(n).fill(false);
    const safeSeq = [];

    // Step 0: Initialization
    steps.push({
      stepNum: 0,
      type: 'init',
      processIdx: null,
      processName: null,
      work: [...work],
      finish: [...finish],
      safeSequence: [],
      comparisonStr: `Initialization: Work = Available [${work.join(', ')}]`,
      explanationStr: `Work vector set to Available resources. All Finish[i] initialized to false. Ready to evaluate processes.`,
      workFormula: `Work = Available`
    });

    let count = 0;
    let iteration = 1;
    let madeProgress = true;

    while (count < n && madeProgress) {
      madeProgress = false;

      for (let i = 0; i < n; i++) {
        if (!finish[i]) {
          const pName = state.processNames[i];
          const needRow = state.need[i];
          const allocRow = state.allocation[i];

          // Check if Need[i] <= Work
          let canAllocate = true;
          const comparisons = [];
          for (let j = 0; j < m; j++) {
            const fits = needRow[j] <= work[j];
            comparisons.push(`${state.resourceNames[j]}: Need(${needRow[j]}) ${fits ? '≤' : '>'} Work(${work[j]})`);
            if (!fits) {
              canAllocate = false;
            }
          }

          // Step: Testing Process
          if (canAllocate) {
            // Evaluated & Passed
            const oldWork = [...work];
            for (let j = 0; j < m; j++) {
              work[j] += allocRow[j];
            }
            finish[i] = true;
            safeSeq.push(i);
            count++;
            madeProgress = true;

            const workFormulaParts = oldWork.map((w, idx) => `${w} + ${allocRow[idx]}`).join(', ');

            steps.push({
              stepNum: steps.length,
              type: 'allocated',
              processIdx: i,
              processName: pName,
              work: [...work],
              finish: [...finish],
              safeSequence: [...safeSeq],
              comparisonStr: `Checking ${pName}: Need [${needRow.join(', ')}] ≤ Work [${oldWork.join(', ')}] → SATISFIED ✅`,
              explanationStr: `${pName} can finish execution! It releases its allocated resources [${allocRow.join(', ')}]. New Work = [${work.join(', ')}]. Added ${pName} to Safe Sequence.`,
              workFormula: `Work = [${workFormulaParts}] = [${work.join(', ')}]`
            });

          } else {
            // Cannot satisfy now
            steps.push({
              stepNum: steps.length,
              type: 'blocked',
              processIdx: i,
              processName: pName,
              work: [...work],
              finish: [...finish],
              safeSequence: [...safeSeq],
              comparisonStr: `Checking ${pName}: Need [${needRow.join(', ')}] ≤ Work [${work.join(', ')}] → NOT SATISFIED ❌`,
              explanationStr: `${pName} must wait because required resources exceed current Work. (${comparisons.join('; ')}). Continuing to next process.`,
              workFormula: `Work remains [${work.join(', ')}]`
            });
          }
        }
      }
      iteration++;
    }

    // Final verdict step
    const isSafe = count === n;
    if (isSafe) {
      steps.push({
        stepNum: steps.length,
        type: 'safe_end',
        processIdx: null,
        processName: null,
        work: [...work],
        finish: [...finish],
        safeSequence: [...safeSeq],
        comparisonStr: `Safe Sequence Found: ⟨ ${safeSeq.map(idx => state.processNames[idx]).join(' ➔ ')} ⟩`,
        explanationStr: `All ${n} processes were able to finish without entering a deadlock. The system is in a guaranteed SAFE STATE.`,
        workFormula: `System All Clear`
      });
    } else {
      const stuckProcesses = [];
      for (let i = 0; i < n; i++) {
        if (!finish[i]) stuckProcesses.push(state.processNames[i]);
      }
      steps.push({
        stepNum: steps.length,
        type: 'unsafe_end',
        processIdx: null,
        processName: null,
        work: [...work],
        finish: [...finish],
        safeSequence: [...safeSeq],
        comparisonStr: `DEADLOCK RISK: System is in an UNSAFE STATE!`,
        explanationStr: `Processes { ${stuckProcesses.join(', ')} } cannot be satisfied by remaining available resources [${work.join(', ')}]. No further progress can be made.`,
        workFormula: `Stalled Work: [${work.join(', ')}]`
      });
    }

    state.steps = steps;
    state.currentStepIdx = 0;
  }

  // =========================================================================
  // Step Playback & Visualization
  // =========================================================================
  function goToStep(index) {
    if (index < 0 || index >= state.steps.length) return;
    state.currentStepIdx = index;
    const step = state.steps[index];

    // Audio feedback
    if (step.type === 'allocated') {
      playBeep(620, 'sine', 0.08, 0.06);
    } else if (step.type === 'blocked') {
      playBeep(240, 'triangle', 0.1, 0.05);
    } else if (step.type === 'safe_end') {
      playSuccessChord();
    } else if (step.type === 'unsafe_end') {
      playAlertChord();
    } else {
      playBeep(480, 'sine', 0.04, 0.03);
    }

    // Update Step Badge & Math Box
    dom.stepNumberBadge.textContent = `Step ${step.stepNum} of ${state.steps.length - 1}`;
    
    // Action Badge
    dom.stepActionBadge.className = 'action-pill ' + (
      step.type === 'allocated' ? 'allocated' :
      step.type === 'blocked' ? 'blocked' :
      step.type === 'safe_end' ? 'allocated' :
      step.type === 'unsafe_end' ? 'blocked' : 'ready'
    );
    dom.stepActionBadge.textContent = step.type.replace('_', ' ').toUpperCase();

    dom.mathComparison.innerHTML = step.comparisonStr;
    dom.mathExplanation.innerHTML = step.explanationStr;
    dom.workFormulaDesc.textContent = step.workFormula;

    // Render Work Vector Chips
    renderWorkChips(step.work, step.type === 'allocated');

    // Render Finish Flags
    renderFinishChips(step.finish, step.processIdx, step.type);

    // Render Safe Sequence Track
    renderSafeSequenceTrack(step.safeSequence);

    // Highlight Active Rows in Matrix tables
    highlightMatrixRows(step.processIdx, step.finish);

    // Safety Verdict Banner
    if (step.type === 'safe_end') {
      dom.safetyVerdictBanner.className = 'verdict-banner safe';
      dom.verdictIcon.textContent = '🛡️';
      dom.verdictTitle.textContent = 'SYSTEM IS IN A SAFE STATE';
      dom.verdictDescription.textContent = 'A valid execution sequence exists that ensures all processes can terminate without deadlock.';
      dom.verdictSequenceBox.innerHTML = `Safe Sequence: <strong>⟨ ${step.safeSequence.map(i => state.processNames[i]).join(' ➔ ')} ⟩</strong>`;
      dom.safetyVerdictBanner.classList.remove('hidden');
    } else if (step.type === 'unsafe_end') {
      dom.safetyVerdictBanner.className = 'verdict-banner unsafe';
      dom.verdictIcon.textContent = '⚠️';
      dom.verdictTitle.textContent = 'SYSTEM IS IN AN UNSAFE STATE (DEADLOCK RISK)';
      dom.verdictDescription.textContent = 'Available resources are insufficient to satisfy the maximum demand of remaining processes. Deadlock is possible.';
      const stuck = [];
      for (let i = 0; i < state.n; i++) {
        if (!step.finish[i]) stuck.push(state.processNames[i]);
      }
      dom.verdictSequenceBox.innerHTML = `Unsatisfied Processes: <strong>{ ${stuck.join(', ')} }</strong>`;
      dom.safetyVerdictBanner.classList.remove('hidden');
    } else {
      dom.safetyVerdictBanner.classList.add('hidden');
    }

    // Stepper Button states
    dom.btnPrevStep.disabled = index === 0;
    dom.btnNextStep.disabled = index === state.steps.length - 1;

    // Stop autoplay if at end
    if (index === state.steps.length - 1 && state.isPlaying) {
      pauseSimulation();
    }

    // Refresh RAG canvas with active process highlight
    renderRAG(step.processIdx, step.finish);
  }

  function renderWorkChips(workArr, isUpdated) {
    let html = '';
    for (let j = 0; j < state.m; j++) {
      html += `
        <div class="work-chip ${isUpdated ? 'updated' : ''}">
          <span class="chip-label">${state.resourceNames[j]}</span>
          <span class="chip-val">${workArr[j] ?? 0}</span>
        </div>
      `;
    }
    dom.workVectorDisplay.innerHTML = html;
  }

  function renderFinishChips(finishArr, activeIdx, stepType) {
    let completedCount = 0;
    let html = '';
    for (let i = 0; i < state.n; i++) {
      const isFin = finishArr[i];
      if (isFin) completedCount++;
      const isEvaluating = i === activeIdx;
      
      let statusClass = 'pending';
      let icon = '○';
      if (isFin) {
        statusClass = 'finished';
        icon = '✓';
      } else if (isEvaluating) {
        statusClass = stepType === 'blocked' ? 'blocked' : 'evaluating';
        icon = stepType === 'blocked' ? '✗' : '⚙';
      }

      html += `
        <div class="finish-chip ${statusClass}">
          <span>${icon}</span>
          <span>${state.processNames[i]}</span>
        </div>
      `;
    }
    dom.finishFlagsDisplay.innerHTML = html;
    dom.finishRatioDisplay.textContent = `${completedCount} / ${state.n} Completed`;
  }

  function renderSafeSequenceTrack(safeSeq) {
    if (!safeSeq || safeSeq.length === 0) {
      dom.sequenceTrack.innerHTML = '<div class="empty-sequence-msg">No processes completed yet</div>';
      dom.sequenceStatusText.textContent = 'Building sequence...';
      return;
    }

    let html = '';
    safeSeq.forEach((pIdx, idx) => {
      html += `
        <div class="sequence-node">
          <span>${state.processNames[pIdx]}</span>
        </div>
      `;
      if (idx < safeSeq.length - 1) {
        html += '<span class="sequence-arrow">➔</span>';
      }
    });

    dom.sequenceTrack.innerHTML = html;
    dom.sequenceStatusText.textContent = `${safeSeq.length} process${safeSeq.length > 1 ? 'es' : ''} sequenced`;
  }

  function highlightMatrixRows(activeIdx, finishArr) {
    const allTables = [dom.tableAllocation, dom.tableMax, dom.tableNeed];
    allTables.forEach(tbl => {
      const rows = tbl.querySelectorAll('tbody tr');
      rows.forEach((tr, i) => {
        tr.classList.remove('evaluating-row', 'finished-row');
        if (finishArr && finishArr[i]) {
          tr.classList.add('finished-row');
        } else if (i === activeIdx) {
          tr.classList.add('evaluating-row');
        }
      });
    });
  }

  // Playback Auto Controller
  function playSimulation() {
    if (state.currentStepIdx >= state.steps.length - 1) {
      goToStep(0);
    }
    state.isPlaying = true;
    dom.iconPlay.classList.add('hidden');
    dom.iconPause.classList.remove('hidden');
    dom.playBtnText.textContent = 'Pause';

    clearInterval(state.playInterval);
    state.playInterval = setInterval(() => {
      if (state.currentStepIdx < state.steps.length - 1) {
        goToStep(state.currentStepIdx + 1);
      } else {
        pauseSimulation();
      }
    }, state.stepDelay);
  }

  function pauseSimulation() {
    state.isPlaying = false;
    clearInterval(state.playInterval);
    dom.iconPlay.classList.remove('hidden');
    dom.iconPause.classList.add('hidden');
    dom.playBtnText.textContent = 'Auto Play';
  }

  function togglePlayPause() {
    if (state.isPlaying) {
      pauseSimulation();
    } else {
      playSimulation();
    }
  }

  // =========================================================================
  // Tab 2: Resource Request Algorithm (What-If Simulation)
  // =========================================================================
  function populateRequestForm() {
    // Populate Process Select
    let optHtml = '';
    for (let i = 0; i < state.n; i++) {
      optHtml += `<option value="${i}">${state.processNames[i]}</option>`;
    }
    dom.requestProcessSelect.innerHTML = optHtml;

    // Populate Request Inputs
    let inputHtml = '';
    for (let j = 0; j < state.m; j++) {
      inputHtml += `
        <div class="request-input-card">
          <span class="res-title">Resource ${state.resourceNames[j]}</span>
          <input type="number" min="0" max="99" value="0" class="matrix-input req-val-input" data-col="${j}">
        </div>
      `;
    }
    dom.requestInputsContainer.innerHTML = inputHtml;
    dom.requestResultSection.classList.add('hidden');
  }

  function evaluateResourceRequest() {
    const pIdx = parseInt(dom.requestProcessSelect.value, 10);
    const pName = state.processNames[pIdx];

    // Read requested vector
    const reqInputs = dom.requestInputsContainer.querySelectorAll('.req-val-input');
    const request = [];
    reqInputs.forEach(inp => {
      request.push(parseInt(inp.value, 10) || 0);
    });

    const isAllZero = request.every(v => v === 0);
    if (isAllZero) {
      alert("Please specify at least 1 resource to request.");
      return;
    }

    dom.requestResultSection.classList.remove('hidden');

    const needRow = state.need[pIdx];
    const avail = state.available;

    // Check 1: Request <= Need
    let passRule1 = true;
    for (let j = 0; j < state.m; j++) {
      if (request[j] > needRow[j]) {
        passRule1 = false;
        break;
      }
    }

    updateCheckCard(
      dom.checkCard1, dom.checkIcon1, dom.checkDesc1,
      passRule1,
      passRule1 
        ? `Passed: Request [${request.join(', ')}] ≤ Need [${needRow.join(', ')}]. Process did not exceed maximum claim.` 
        : `FAILED: Request [${request.join(', ')}] exceeds Need [${needRow.join(', ')}]. Error: Process exceeded maximum declared demand!`
    );

    if (!passRule1) {
      setDecisionBanner(false, `Request Denied for ${pName}`, `Rule 1 Violated: Process ${pName} cannot request more resources than its declared Need.`);
      dom.checkCard2.className = 'check-card';
      dom.checkCard3.className = 'check-card';
      playAlertChord();
      return;
    }

    // Check 2: Request <= Available
    let passRule2 = true;
    for (let j = 0; j < state.m; j++) {
      if (request[j] > avail[j]) {
        passRule2 = false;
        break;
      }
    }

    updateCheckCard(
      dom.checkCard2, dom.checkIcon2, dom.checkDesc2,
      passRule2,
      passRule2
        ? `Passed: Request [${request.join(', ')}] ≤ Available [${avail.join(', ')}]. Resources are currently free in the system.`
        : `WAIT REQUIRED: Request [${request.join(', ')}] > Available [${avail.join(', ')}]. System does not currently have enough free resources.`
    );

    if (!passRule2) {
      setDecisionBanner(false, `Process ${pName} Must Wait`, `Rule 2 Unfulfilled: Not enough free resources right now. ${pName} must wait until other processes release instances.`);
      dom.checkCard3.className = 'check-card';
      playAlertChord();
      return;
    }

    // Check 3: Pretend Allocation & Safety Run
    const simulatedAvail = [...avail];
    const simulatedAlloc = deepClone(state.allocation);
    const simulatedNeed = deepClone(state.need);

    for (let j = 0; j < state.m; j++) {
      simulatedAvail[j] -= request[j];
      simulatedAlloc[pIdx][j] += request[j];
      simulatedNeed[pIdx][j] -= request[j];
    }

    // Run Safety Algorithm on simulated state
    const safetyResult = runSafetyCheck(simulatedAlloc, simulatedNeed, simulatedAvail);

    updateCheckCard(
      dom.checkCard3, dom.checkIcon3, dom.checkDesc3,
      safetyResult.isSafe,
      safetyResult.isSafe
        ? `Passed: Simulated state is SAFE! Safe sequence found: ⟨ ${safetyResult.sequence.map(i => state.processNames[i]).join(' ➔ ')} ⟩.`
        : `FAILED: Granting this request leads to an UNSAFE STATE (deadlock risk). Process must wait!`
    );

    renderSimulatedMatrices(simulatedAlloc, simulatedNeed, simulatedAvail, pIdx);

    if (safetyResult.isSafe) {
      setDecisionBanner(
        true,
        `REQUEST GRANTED SAFELY to ${pName}`,
        `Granting Request [${request.join(', ')}] leaves the system in a safe state with sequence ⟨ ${safetyResult.sequence.map(i => state.processNames[i]).join(' ➔ ')} ⟩.`,
        () => applySimulatedState(simulatedAlloc, simulatedNeed, simulatedAvail)
      );
      playSuccessChord();
    } else {
      setDecisionBanner(
        false,
        `REQUEST BLOCKED for ${pName} (Deadlock Avoidance)`,
        `Although resources are available, granting them now would cause an unsafe state where deadlock cannot be avoided. ${pName} must wait!`
      );
      playAlertChord();
    }
  }

  function runSafetyCheck(allocMatrix, needMatrix, availVector) {
    const n = allocMatrix.length;
    const m = availVector.length;
    const work = [...availVector];
    const finish = new Array(n).fill(false);
    const seq = [];
    let count = 0;
    let madeProgress = true;

    while (count < n && madeProgress) {
      madeProgress = false;
      for (let i = 0; i < n; i++) {
        if (!finish[i]) {
          let canFit = true;
          for (let j = 0; j < m; j++) {
            if (needMatrix[i][j] > work[j]) {
              canFit = false;
              break;
            }
          }
          if (canFit) {
            for (let j = 0; j < m; j++) {
              work[j] += allocMatrix[i][j];
            }
            finish[i] = true;
            seq.push(i);
            count++;
            madeProgress = true;
          }
        }
      }
    }

    return {
      isSafe: count === n,
      sequence: seq
    };
  }

  function updateCheckCard(cardElem, iconElem, descElem, pass, text) {
    cardElem.className = 'check-card ' + (pass ? 'pass' : 'fail');
    iconElem.textContent = pass ? '✓' : '✗';
    descElem.textContent = text;
  }

  function setDecisionBanner(granted, title, details, onApply = null) {
    dom.requestDecisionBanner.className = 'request-decision-banner ' + (granted ? 'granted' : 'denied');
    dom.requestDecisionTitle.textContent = title;
    dom.requestDecisionDetails.textContent = details;

    if (granted && onApply) {
      dom.btnApplyRequestPermanently.classList.remove('hidden');
      dom.btnApplyRequestPermanently.onclick = () => {
        onApply();
        alert("Simulated request successfully applied to the system!");
        // Switch back to Simulator tab
        switchTab('simulator');
      };
    } else {
      dom.btnApplyRequestPermanently.classList.add('hidden');
    }
  }

  function applySimulatedState(newAlloc, newNeed, newAvail) {
    state.allocation = deepClone(newAlloc);
    state.need = deepClone(newNeed);
    state.available = deepClone(newAvail);
    syncUI();
  }

  function renderSimulatedMatrices(sAlloc, sNeed, sAvail, activeIdx) {
    let html = `
      <div class="matrix-card">
        <div class="matrix-card-header">
          <h4>Simulated Allocation</h4>
          <span class="matrix-badge">Temp</span>
        </div>
        <div class="table-scroll-container">
          <table class="matrix-table">
            <thead><tr><th>Process</th>${state.resourceNames.map(r => `<th>${r}</th>`).join('')}</tr></thead>
            <tbody>
              ${sAlloc.map((row, i) => `
                <tr class="${i === activeIdx ? 'evaluating-row' : ''}">
                  <td class="row-header">${state.processNames[i]}</td>
                  ${row.map(val => `<td>${val}</td>`).join('')}
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <div class="matrix-card">
        <div class="matrix-card-header">
          <h4>Simulated Need</h4>
          <span class="matrix-badge">Temp</span>
        </div>
        <div class="table-scroll-container">
          <table class="matrix-table readonly-table">
            <thead><tr><th>Process</th>${state.resourceNames.map(r => `<th>${r}</th>`).join('')}</tr></thead>
            <tbody>
              ${sNeed.map((row, i) => `
                <tr class="${i === activeIdx ? 'evaluating-row' : ''}">
                  <td class="row-header">${state.processNames[i]}</td>
                  ${row.map(val => `<td>${val}</td>`).join('')}
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <div class="matrix-card">
        <div class="matrix-card-header">
          <h4>Simulated Available</h4>
          <span class="matrix-badge">Temp</span>
        </div>
        <div class="vector-display-chips" style="margin-top: 0.5rem;">
          ${sAvail.map((val, j) => `
            <div class="work-chip">
              <span class="chip-label">${state.resourceNames[j]}</span>
              <span class="chip-val">${val}</span>
            </div>
          `).join('')}
        </div>
      </div>
    `;

    dom.simulatedMatricesContainer.innerHTML = html;
  }

  // =========================================================================
  // Tab 3: Resource Allocation Graph (RAG Canvas Visualizer)
  // =========================================================================
  function renderRAG(activeProcessIdx = null, finishArr = null) {
    const canvas = dom.ragCanvas;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    // Draw subtle grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
    ctx.lineWidth = 1;
    for (let x = 0; x < width; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Positions of Processes (Left Column) and Resources (Right Column)
    const pX = 180;
    const rX = width - 180;
    const pSpacing = height / (state.n + 1);
    const rSpacing = height / (state.m + 1);

    const pCoords = [];
    for (let i = 0; i < state.n; i++) {
      pCoords.push({ x: pX, y: (i + 1) * pSpacing });
    }

    const rCoords = [];
    for (let j = 0; j < state.m; j++) {
      rCoords.push({ x: rX, y: (j + 1) * rSpacing });
    }

    // 1. Draw Edges
    // Allocation Edges: Resource -> Process (Solid Green)
    for (let i = 0; i < state.n; i++) {
      for (let j = 0; j < state.m; j++) {
        const allocVal = state.allocation[i]?.[j] ?? 0;
        if (allocVal > 0) {
          const isFinished = finishArr && finishArr[i];
          drawDirectedArrow(
            ctx,
            rCoords[j].x - 30, rCoords[j].y,
            pCoords[i].x + 30, pCoords[i].y,
            isFinished ? 'rgba(16, 185, 129, 0.25)' : '#10b981',
            false,
            allocVal > 1 ? allocVal.toString() : ''
          );
        }
      }
    }

    // Request/Need Edges: Process -> Resource (Dashed Orange)
    for (let i = 0; i < state.n; i++) {
      const isFinished = finishArr && finishArr[i];
      if (isFinished) continue; // Released need
      for (let j = 0; j < state.m; j++) {
        const needVal = state.need[i]?.[j] ?? 0;
        if (needVal > 0) {
          const isEvaluating = i === activeProcessIdx;
          drawDirectedArrow(
            ctx,
            pCoords[i].x + 30, pCoords[i].y - 5,
            rCoords[j].x - 30, rCoords[j].y - 5,
            isEvaluating ? '#f59e0b' : 'rgba(245, 158, 11, 0.4)',
            true,
            needVal > 1 ? needVal.toString() : ''
          );
        }
      }
    }

    // 2. Draw Process Nodes (Circles)
    pCoords.forEach((coord, i) => {
      const isFinished = finishArr && finishArr[i];
      const isEvaluating = i === activeProcessIdx;

      ctx.save();
      ctx.beginPath();
      ctx.arc(coord.x, coord.y, 26, 0, Math.PI * 2);

      if (isFinished) {
        ctx.fillStyle = 'rgba(16, 185, 129, 0.2)';
        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 2.5;
      } else if (isEvaluating) {
        ctx.fillStyle = 'rgba(245, 158, 11, 0.25)';
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 3;
        ctx.shadowColor = '#f59e0b';
        ctx.shadowBlur = 15;
      } else {
        ctx.fillStyle = '#0f172a';
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 2;
      }

      ctx.fill();
      ctx.stroke();

      // Text inside
      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 13px "Outfit", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(state.processNames[i], coord.x, coord.y);
      ctx.restore();
    });

    // 3. Draw Resource Nodes (Rounded Rectangles with instance dots)
    rCoords.forEach((coord, j) => {
      const w = 68;
      const h = 54;
      const x = coord.x - w / 2;
      const y = coord.y - h / 2;

      ctx.save();
      ctx.beginPath();
      if (typeof ctx.roundRect === 'function') {
        ctx.roundRect(x, y, w, h, 8);
      } else {
        ctx.rect(x, y, w, h);
      }
      ctx.fillStyle = '#1e1b4b';
      ctx.strokeStyle = '#8b5cf6';
      ctx.lineWidth = 2;
      ctx.fill();
      ctx.stroke();

      // Title
      ctx.fillStyle = '#c4b5fd';
      ctx.font = 'bold 12px "Outfit", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`Res ${state.resourceNames[j]}`, coord.x, coord.y - 10);

      // Free / Available count
      const availCount = state.available[j] ?? 0;
      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 11px "JetBrains Mono", monospace';
      ctx.fillText(`Free: ${availCount}`, coord.x, coord.y + 12);
      ctx.restore();
    });

    // Update Sidebar Entity Chips
    let entityHtml = '';
    for (let i = 0; i < state.n; i++) {
      const isFin = finishArr && finishArr[i];
      const isEval = i === activeProcessIdx;
      entityHtml += `
        <div class="entity-chip ${isFin ? 'p-active' : ''}">
          <span>${state.processNames[i]}</span>
          <span style="color: ${isFin ? '#10b981' : isEval ? '#f59e0b' : '#94a3b8'}">
            ${isFin ? 'Finished' : isEval ? 'Evaluating' : 'Waiting'}
          </span>
        </div>
      `;
    }
    dom.ragEntityList.innerHTML = entityHtml;
  }

  function drawDirectedArrow(ctx, fromX, fromY, toX, toY, color, dashed = false, label = '') {
    const headLen = 9;
    const dx = toX - fromX;
    const dy = toY - fromY;
    const angle = Math.atan2(dy, dx);

    ctx.save();
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = 1.8;
    if (dashed) {
      ctx.setLineDash([5, 4]);
    } else {
      ctx.setLineDash([]);
    }

    ctx.beginPath();
    ctx.moveTo(fromX, fromY);
    ctx.lineTo(toX, toY);
    ctx.stroke();

    // Arrowhead
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.moveTo(toX, toY);
    ctx.lineTo(toX - headLen * Math.cos(angle - Math.PI / 6), toY - headLen * Math.sin(angle - Math.PI / 6));
    ctx.lineTo(toX - headLen * Math.cos(angle + Math.PI / 6), toY - headLen * Math.sin(angle + Math.PI / 6));
    ctx.closePath();
    ctx.fill();

    // Edge Label
    if (label) {
      const midX = (fromX + toX) / 2;
      const midY = (fromY + toY) / 2;
      ctx.font = '10px "JetBrains Mono", monospace';
      ctx.fillStyle = color;
      ctx.textAlign = 'center';
      ctx.fillText(label, midX, midY - 6);
    }
    ctx.restore();
  }

  // =========================================================================
  // Tab 4: Lab Report Generation (Print & PDF)
  // =========================================================================
  function generateLabReport() {
    // Current time
    const now = new Date();
    dom.printTimestamp.textContent = now.toLocaleString();
    dom.printName.textContent = dom.reportStudentName.value || 'Student Name';
    dom.printRoll.textContent = dom.reportRollNo.value || 'USN-001';
    dom.printBranch.textContent = dom.reportBranch.value || 'B.Tech CSE';
    dom.printCourse.textContent = dom.reportCourse.value || 'CS304 - OS';

    // Solve safety state to get final report data
    const safety = runSafetyCheck(state.allocation, state.need, state.available);

    let html = `
      <div class="report-section">
        <h4>1. PROBLEM SPECIFICATION</h4>
        <p>A multi-process system with <strong>${state.n} processes</strong> (${state.processNames.join(', ')}) and <strong>${state.m} resource types</strong> (${state.resourceNames.join(', ')}) is analyzed using Dijkstra's Banker's Algorithm to determine if the state is safe from deadlock.</p>
      </div>

      <div class="report-section">
        <h4>2. GIVEN SYSTEM MATRICES</h4>
        <table class="report-table">
          <thead>
            <tr>
              <th rowspan="2">Process</th>
              <th colspan="${state.m}">Allocation</th>
              <th colspan="${state.m}">Max Demand</th>
              <th colspan="${state.m}">Need (Max - Alloc)</th>
              <th colspan="${state.m}">Initial Available</th>
            </tr>
            <tr>
              ${state.resourceNames.map(r => `<th>${r}</th>`).join('')}
              ${state.resourceNames.map(r => `<th>${r}</th>`).join('')}
              ${state.resourceNames.map(r => `<th>${r}</th>`).join('')}
              ${state.resourceNames.map(r => `<th>${r}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${state.processNames.map((p, i) => `
              <tr>
                <td><strong>${p}</strong></td>
                ${state.allocation[i].map(v => `<td>${v}</td>`).join('')}
                ${state.max[i].map(v => `<td>${v}</td>`).join('')}
                ${state.need[i].map(v => `<td>${v}</td>`).join('')}
                ${i === 0 
                  ? `<td rowspan="${state.n}" style="vertical-align: middle; font-weight: bold;">[${state.available.join(', ')}]</td>` 
                  : ''}
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>

      <div class="report-section">
        <h4>3. STEP-BY-STEP SAFETY TRACE TABLE</h4>
        <table class="report-table">
          <thead>
            <tr>
              <th>Step</th>
              <th>Process Tested</th>
              <th>Work Vector Before</th>
              <th>Need Vector</th>
              <th>Need ≤ Work?</th>
              <th>Allocation Released</th>
              <th>Work After (Work + Alloc)</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${state.steps.filter(s => s.type === 'allocated' || s.type === 'blocked').map(s => {
              const pIdx = s.processIdx;
              const isAlloc = s.type === 'allocated';
              return `
                <tr>
                  <td>${s.stepNum}</td>
                  <td><strong>${s.processName}</strong></td>
                  <td>[${s.work.join(', ')}]</td>
                  <td>[${state.need[pIdx].join(', ')}]</td>
                  <td style="color: ${isAlloc ? '#16a34a' : '#dc2626'}; font-weight: bold;">${isAlloc ? 'YES' : 'NO'}</td>
                  <td>[${isAlloc ? state.allocation[pIdx].join(', ') : '0'}]</td>
                  <td>[${s.work.join(', ')}]</td>
                  <td>${isAlloc ? 'Completed' : 'Wait'}</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>

      <div class="report-section">
        <h4>4. FINAL CONCLUSION & RESULT</h4>
        <div class="report-result-box" style="border-color: ${safety.isSafe ? '#16a34a' : '#dc2626'}; color: ${safety.isSafe ? '#166534' : '#991b1b'};">
          ${safety.isSafe ? `
            <strong>CONCLUSION: SAFE STATE VERIFIED</strong><br>
            The system is in a guaranteed Safe State. The processes can be safely executed in the following safe sequence order without any risk of deadlock:<br>
            <strong style="font-size: 1.1rem; display: inline-block; margin-top: 0.35rem;">⟨ ${safety.sequence.map(i => state.processNames[i]).join(' ➔ ')} ⟩</strong>
          ` : `
            <strong>CONCLUSION: UNSAFE STATE DETECTED</strong><br>
            The system cannot guarantee deadlock-free execution. No complete safe sequence exists with the current resource allocation.
          `}
        </div>
      </div>
    `;

    dom.reportContentDynamic.innerHTML = html;
    dom.reportModal.classList.remove('hidden');
  }

  // =========================================================================
  // Dimension Controls (+ / - Process & Resource)
  // =========================================================================
  function addProcess() {
    if (state.n >= 9) {
      alert("Maximum limit of 9 processes reached for visual layout.");
      return;
    }
    const newIdx = state.n;
    state.n++;
    state.processNames.push(getProcessName(newIdx));

    // Initialize row with default zero
    const newAllocRow = new Array(state.m).fill(0);
    const newMaxRow = new Array(state.m).fill(1);
    state.allocation.push(newAllocRow);
    state.max.push(newMaxRow);
    recalculateNeed();
    syncUI();
  }

  function removeProcess() {
    if (state.n <= 2) {
      alert("Minimum 2 processes are required.");
      return;
    }
    state.n--;
    state.processNames.pop();
    state.allocation.pop();
    state.max.pop();
    recalculateNeed();
    syncUI();
  }

  function addResource() {
    if (state.m >= 6) {
      alert("Maximum limit of 6 resource types reached for visual clarity.");
      return;
    }
    const newIdx = state.m;
    state.m++;
    state.resourceNames.push(getResourceName(newIdx));

    for (let i = 0; i < state.n; i++) {
      state.allocation[i].push(0);
      state.max[i].push(1);
    }
    state.available.push(2);
    recalculateNeed();
    syncUI();
  }

  function removeResource() {
    if (state.m <= 1) {
      alert("Minimum 1 resource type is required.");
      return;
    }
    state.m--;
    state.resourceNames.pop();
    for (let i = 0; i < state.n; i++) {
      state.allocation[i].pop();
      state.max[i].pop();
    }
    state.available.pop();
    recalculateNeed();
    syncUI();
  }

  // =========================================================================
  // Navigation & Tabs
  // =========================================================================
  function switchTab(tabId) {
    dom.navTabs.forEach(tab => {
      if (tab.dataset.tab === tabId) {
        tab.classList.add('active');
      } else {
        tab.classList.remove('active');
      }
    });

    dom.tabPanes.forEach(pane => {
      if (pane.id === 'tab-' + tabId) {
        pane.classList.add('active');
      } else {
        pane.classList.remove('active');
      }
    });

    if (tabId === 'graph') {
      const step = state.steps[state.currentStepIdx];
      renderRAG(step?.processIdx, step?.finish);
    }
  }

  // =========================================================================
  // Event Listeners
  // =========================================================================
  function setupEventListeners() {
    // Preset change
    dom.presetSelect.addEventListener('change', (e) => {
      loadPreset(e.target.value);
    });

    // Audio Toggle
    dom.btnAudioToggle.addEventListener('click', () => {
      state.soundEnabled = !state.soundEnabled;
      dom.iconSoundOn.classList.toggle('hidden', !state.soundEnabled);
      dom.iconSoundOff.classList.toggle('hidden', state.soundEnabled);
      if (state.soundEnabled) playBeep(520, 'sine', 0.1);
    });

    // Tabs
    dom.navTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        switchTab(tab.dataset.tab);
      });
    });

    // Matrix Dimension modifications
    dom.btnAddProcess.addEventListener('click', addProcess);
    dom.btnRemoveProcess.addEventListener('click', removeProcess);
    dom.btnAddResource.addEventListener('click', addResource);
    dom.btnRemoveResource.addEventListener('click', removeResource);
    dom.btnResetData.addEventListener('click', () => loadPreset(dom.presetSelect.value));

    // Dynamic Matrix Cell Inputs delegation
    document.addEventListener('input', (e) => {
      const target = e.target;
      if (target.classList.contains('matrix-input')) {
        const type = target.dataset.type;
        const val = parseInt(target.value, 10);
        const safeVal = isNaN(val) || val < 0 ? 0 : val;

        if (type === 'alloc') {
          const r = parseInt(target.dataset.row, 10);
          const c = parseInt(target.dataset.col, 10);
          state.allocation[r][c] = safeVal;
          recalculateNeed();
          renderNeedTable();
          renderTotalResources();
          generateSafetySteps();
          goToStep(0);
        } else if (type === 'max') {
          const r = parseInt(target.dataset.row, 10);
          const c = parseInt(target.dataset.col, 10);
          state.max[r][c] = safeVal;
          recalculateNeed();
          renderNeedTable();
          generateSafetySteps();
          goToStep(0);
        } else if (type === 'avail') {
          const c = parseInt(target.dataset.col, 10);
          state.available[c] = safeVal;
          renderTotalResources();
          generateSafetySteps();
          goToStep(0);
        }
      }
    });

    // Playback Controls
    dom.btnPlayPause.addEventListener('click', togglePlayPause);
    dom.btnNextStep.addEventListener('click', () => {
      pauseSimulation();
      if (state.currentStepIdx < state.steps.length - 1) {
        goToStep(state.currentStepIdx + 1);
      }
    });
    dom.btnPrevStep.addEventListener('click', () => {
      pauseSimulation();
      if (state.currentStepIdx > 0) {
        goToStep(state.currentStepIdx - 1);
      }
    });
    dom.btnRestart.addEventListener('click', () => {
      pauseSimulation();
      goToStep(0);
    });

    // Speed Slider
    dom.speedSlider.addEventListener('input', (e) => {
      state.stepDelay = parseInt(e.target.value, 10);
      dom.speedValueText.textContent = (state.stepDelay / 1000).toFixed(1) + 's';
      if (state.isPlaying) {
        playSimulation(); // Reset interval with new speed
      }
    });

    // Resource Request Form
    dom.btnEvaluateRequest.addEventListener('click', evaluateResourceRequest);
    dom.btnResetRequestForm.addEventListener('click', () => {
      populateRequestForm();
    });

    // Viva Voce Accordion
    dom.vivaItems.forEach(item => {
      const qBtn = item.querySelector('.viva-question');
      qBtn.addEventListener('click', () => {
        item.classList.toggle('open');
      });
    });

    // Report Modal
    dom.btnOpenReport.addEventListener('click', generateLabReport);
    dom.btnCloseReport.addEventListener('click', () => dom.reportModal.classList.add('hidden'));
    dom.btnCloseReportBottom.addEventListener('click', () => dom.reportModal.classList.add('hidden'));
    dom.btnPrintReport.addEventListener('click', () => {
      window.print();
    });

    dom.btnCopyReportText.addEventListener('click', () => {
      const text = dom.printableReportArea.innerText;
      navigator.clipboard.writeText(text).then(() => {
        alert("Report summary copied to clipboard!");
      });
    });

    // Synchronize Student Meta edits in real time
    ['reportStudentName', 'reportRollNo', 'reportBranch', 'reportCourse'].forEach(id => {
      document.getElementById(id).addEventListener('input', () => {
        dom.printName.textContent = dom.reportStudentName.value;
        dom.printRoll.textContent = dom.reportRollNo.value;
        dom.printBranch.textContent = dom.reportBranch.value;
        dom.printCourse.textContent = dom.reportCourse.value;
      });
    });
  }

  // =========================================================================
  // Bootstrap Application
  // =========================================================================
  function init() {
    loadPreset('classicSafe');
    setupEventListeners();
  }

  // Start on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
