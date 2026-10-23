# Banker's Algorithm Visual Simulator & Deadlock Avoidance Suite
### Operating Systems Laboratory Mini-Project

An interactive, visual simulator and deadlock avoidance laboratory tool implementing **Edsger W. Dijkstra's Banker's Algorithm (1965)** for multi-resource allocation in operating systems.

Designed specifically for **Computer Science & Engineering (CSE / IT) University Lab Assessments, Mini-Projects, and Viva Voce Examinations**.

---

## 🌟 Key Features

1. **Interactive Dynamic Matrix Configuration**
   - Editable matrices for **Allocation** ($n \times m$) and **Max Demand** ($n \times m$).
   - Real-time calculation of **Need Matrix**: $\text{Need}[i][j] = \text{Max}[i][j] - \text{Allocation}[i][j]$.
   - Dynamic process ($n$) and resource ($m$) addition and removal with error guards.
   - Live **Available** vector and total system instance validation.

2. **Fine-Grained Step-by-Step Safety Visualizer**
   - Step forward / backward, Auto-play, pause, and speed adjustment (0.5x to 3.0x).
   - Real-time mathematical proof displayed at each step:
     $$\text{Need}_i \le \text{Work} \implies \text{Work} = \text{Work} + \text{Allocation}_i$$
   - Color-coded process states: **Waiting**, **Evaluating**, **Allocated/Finished**, **Blocked/Starved**.
   - Dynamic **Safe Sequence Track** showing the safe path progression: e.g. $\langle P_1 \to P_3 \to P_4 \to P_0 \to P_2 \rangle$.

3. **Resource-Request Algorithm Mode (What-If Analysis)**
   - Select any process $P_i$ and test an incoming resource request vector:
     - **Rule 1:** $\text{Request}_i \le \text{Need}_i$ (Maximum claim constraint).
     - **Rule 2:** $\text{Request}_i \le \text{Available}$ (System availability constraint).
     - **Rule 3:** Pretend allocation test running the Safety Algorithm on a simulated state:
       $$\text{Available}' = \text{Available} - \text{Request}$$
       $$\text{Allocation}_i' = \text{Allocation}_i + \text{Request}$$
       $$\text{Need}_i' = \text{Need}_i - \text{Request}$$
   - Instantly reports whether the request can be safely granted or if the process must wait to avoid deadlock.
   - Option to apply the simulated state permanently into the active matrices.

4. **Interactive Resource Allocation Graph (RAG)**
   - Canvas-based graph rendering processes (circles) and multi-instance resources (rectangles).
   - Directed assignment edges ($\text{Resource} \to \text{Process}$) and request/claim edges ($\text{Process} \to \text{Resource}$).
   - Highlights live state transitions as steps progress.

5. **Formal Lab Report Generator (Print & PDF)**
   - Editable student credentials (Student Name, Roll Number, Branch/Semester, Course Code).
   - Automatically compiles problem statement, input matrices, step-by-step safety trace table, and final safe sequence conclusion.
   - One-click print or save to PDF with print-optimized IEEE/academic lab styling.

6. **University Viva Voce Reference Guide**
   - Built-in collapsible accordion covering the top 10 frequently asked exam/viva questions with model answers.

7. **Sound Feedback (Web Audio API)**
   - Gentle, futuristic synthetic chimes for step transitions, safe sequence completion, and deadlock alerts (toggleable).

---

## 🚀 How to Run the Project

### Method 1: Direct Browser Launch (Easiest & Instant)
Simply double-click the **`index.html`** file in your file explorer, or right-click and open with any modern browser (Chrome, Edge, Firefox, Brave, Safari). No installation or build step is required!

### Method 2: Local Python Server
Open a terminal in the project directory and run:
```bash
python -m http.server 8000
```
Then visit:
```
http://localhost:8000
```

---

## 📚 Mathematical Model & Theory

### 1. Data Structures
Let $n$ be the number of processes and $m$ be the number of resource types:
- **$\text{Available}[m]$:** A vector of length $m$. If $\text{Available}[j] = k$, there are $k$ instances of resource type $R_j$ available.
- **$\text{Max}[n][m]$:** An $n \times m$ matrix defining the maximum demand of each process.
- **$\text{Allocation}[n][m]$:** An $n \times m$ matrix defining the number of resources currently allocated to each process.
- **$\text{Need}[n][m]$:** An $n \times m$ matrix indicating the remaining resource need:
  $$\text{Need}[i][j] = \text{Max}[i][j] - \text{Allocation}[i][j]$$

### 2. Safety Algorithm
1. Let $\text{Work} = \text{Available}$ and $\text{Finish}[i] = \text{false}$ for $i = 0, 1, \dots, n-1$.
2. Find an index $i$ such that:
   - $\text{Finish}[i] == \text{false}$
   - $\text{Need}_i \le \text{Work}$
   If no such $i$ exists, proceed to Step 4.
3. $\text{Work} = \text{Work} + \text{Allocation}_i$  
   $\text{Finish}[i] = \text{true}$  
   Go back to Step 2.
4. If $\text{Finish}[i] == \text{true}$ for all $i$, the system is in a **Safe State**.

### 3. Time Complexity
- In the worst case, finding an eligible process takes $O(m \times n)$ operations.
- Doing this for all $n$ processes yields a time complexity of **$O(m \cdot n^2)$**.

---

## 📋 Preset Scenarios Included

- **Classic Safe State:** Silberschatz textbook benchmark (5 Processes, 3 Resources: A, B, C).
- **Unsafe State / Deadlock Trap:** Demonstrates a situation where available resources cannot satisfy any pending process, triggering a deadlock warning.
- **High Contention:** 6 processes competing across 4 resource types (A, B, C, D).
- **Edge Case (Single Resource):** 3 processes with a single resource type (the classic banking loan analogy).
- **Random Generator:** Generates a randomized balanced system state for spontaneous testing and lab practice.

---

## 🎓 University Viva Voce Cheat Sheet

| Question | Short Answer |
| :--- | :--- |
| **Why is it called Banker's Algorithm?** | Because it operates like a conservative small-town banker who never allocates cash such that he cannot satisfy the maximum credit claims of at least one client. |
| **Deadlock Prevention vs Avoidance?** | Prevention eliminates one of the 4 Coffman conditions statically (low resource utilization). Avoidance dynamically inspects requests and tests if granting them keeps the system safe. |
| **Is an Unsafe state always a Deadlock?** | **No.** An unsafe state is not necessarily deadlocked; it only means the OS cannot *guarantee* avoiding deadlock if every process simultaneously requests maximum claims. |
| **What is the Time Complexity?** | $O(m \cdot n^2)$ where $n$ = processes and $m$ = resource types. |
| **What are the 4 Coffman conditions?** | 1. Mutual Exclusion 2. Hold and Wait 3. No Preemption 4. Circular Wait. |

---

## 🛠️ Technology Stack
- **Frontend Core:** Pure HTML5 & Semantic Elements
- **Styling:** Vanilla CSS3 with Modern Cybernetic Glassmorphism, CSS Custom Properties, and `@media print`
- **Logic & Algorithms:** Vanilla JavaScript (ES6+), Canvas API, Web Audio API
- **Dependencies:** Zero external dependencies (runs 100% offline).
