// ── Config fallback (works with both module import and global window) ──────────
function _getSchoolConfig(passed) {
  if (passed && passed.school) return passed;
  if (typeof SCHOOL_CONFIG !== "undefined") return SCHOOL_CONFIG;
  return { backendUrl: "", school: { name: "Army Public School for International Studies", campus: "Cambridge Campus Sargodha", session: "2025-26" } };
}

// resultCard.js — Pixel-faithful replica of the Excel Progress Report
// Matches screenshots exactly: layout, columns, summary, grading key

const SUBJECTS_BIO      = ["English","Urdu","Mathematics","Physics","Chemistry","Bio","Pakistan Studies (History & Geography)","Islamiyat"];
const SUBJECTS_COMPUTER = ["English","Urdu","Mathematics","Physics","Chemistry","Computer","Pakistan Studies (History & Geography)","Islamiyat"];

// Exam totals verified against school Excel formulas (e.g. Chemistry uses /100 not /120)
const EXAM_MAX_BIO = {
  "English":100,"Urdu":100,"Mathematics":200,"Physics":100,
  "Chemistry":100,"Bio":100,"Pakistan Studies (History & Geography)":150,"Islamiyat":100
};
const EXAM_MAX_COMPUTER = {
  "English":100,"Urdu":100,"Mathematics":200,"Physics":100,
  "Chemistry":100,"Computer":60,"Pakistan Studies (History & Geography)":150,"Islamiyat":100
};

// T1 Assessment max = 40 (A1/20 + A2/20)
// T2 Sessional max = 70 for all groups (A3/20 + A4/20 + CW1/10 + CW2/10 + CW3/10)
const T1_ASS_MAX = 40;
const T2_SES_MAX_BIO      = 70;
const T2_SES_MAX_COMPUTER = 70;

const GRADE_TABLE = [[90,"A+"],[80,"A"],[70,"B"],[60,"C"],[50,"D"],[45,"E"],[0,"U"]];
function getGrade(pct){ for(const [m,g] of GRADE_TABLE) if(pct>=m) return g; return "U"; }

function calcSubject(data, examMax, t2SesMax) {
  // Term 1: Weightage = ((A1+A2)/40)*20,  80%Wtg = (ExamMarks/Max)*80
  const t1AssObt = (data.t1_a1||0) + (data.t1_a2||0);
  const t1ExObt  = data.t1_marks || 0;
  const t1Wt20   = T1_ASS_MAX > 0 ? +((t1AssObt / T1_ASS_MAX) * 20).toFixed(2) : 0;
  const t1Wt80   = examMax > 0    ? +((t1ExObt  / examMax   ) * 80).toFixed(2) : 0;
  const t1Pct    = +(t1Wt20 + t1Wt80).toFixed(2);

  // Term 2: Sessional = A3+A4+CW1+CW2+CW3, Weightage = (Ses/70)*20
  const t2SesObt = (data.t2_a1||0)+(data.t2_a2||0)+(data.t2_cw1||0)+(data.t2_cw2||0)+(data.t2_cw3||0);
  const t2ExObt  = data.t2_marks || 0;
  const t2Wt20   = t2SesMax > 0  ? +((t2SesObt / t2SesMax ) * 20).toFixed(2) : 0;
  const t2Wt80   = examMax > 0   ? +((t2ExObt  / examMax  ) * 80).toFixed(2) : 0;
  const t2Pct    = +(t2Wt20 + t2Wt80).toFixed(2);

  // Combined: (T1+T2)/2  matches Excel BH=BF/2
  const combinedPct = +((t1Pct + t2Pct) / 2).toFixed(2);

  return { t1AssObt, t1ExObt, t1Wt20, t1Wt80, t1Pct,
           t2SesObt, t2ExObt, t2Wt20, t2Wt80, t2Pct, combinedPct };
}

function fmtNum(n) {
  // Display numbers like the Excel: integers as integers, decimals with 2dp
  if (n === 0) return "0";
  if (Number.isInteger(n)) return String(n);
  return n.toFixed(2);
}

function subjectBlock(subName, data, examMax, t2SesMax, showTerm) {
  const c    = calcSubject(data, examMax, t2SesMax);
  const fb   = data.feedback    || "";
  const ff   = data.feedforward || "";
  const showT1 = showTerm === "Term 1" || showTerm === "Final";
  const showT2 = showTerm === "Term 2" || showTerm === "Final";
  const showGT = showTerm === "Final";

  // T.Mks for each row
  const t1TMks = T1_ASS_MAX + examMax;
  const t2TMks = t2SesMax   + examMax;
  const gtAss  = T1_ASS_MAX + t2SesMax;
  const gtEx   = examMax * 2;
  const gtTMks = t1TMks + t2TMks;

  // Grand total obtained fields
  const gtAssObt = c.t1AssObt + c.t2SesObt;
  const gtExObt  = c.t1ExObt  + c.t2ExObt;
  const gtWt20   = +(c.t1Wt20 + c.t2Wt20).toFixed(2);
  const gtWt80   = +(c.t1Wt80 + c.t2Wt80).toFixed(2);

  let rows = "";
  if (showT1) rows += `
      <tr>
        <td class="c-term">Term 1</td>
        <td class="c-num">${fmtNum(c.t1AssObt)}</td>
        <td class="c-num c-tmarks">${T1_ASS_MAX}</td>
        <td class="c-num">${fmtNum(c.t1Wt20)}</td>
        <td class="c-num">${fmtNum(c.t1ExObt)}</td>
        <td class="c-num c-tmarks">${examMax}</td>
        <td class="c-num">${fmtNum(c.t1Wt80)}</td>
        <td class="c-num">${fmtNum(c.t1AssObt + c.t1ExObt)}</td>
        <td class="c-num c-tmarks">${t1TMks}</td>
        <td class="c-num">${fmtNum(c.t1Pct)}</td>
        <td class="c-grade">${getGrade(c.t1Pct)}</td>
      </tr>`;

  if (showT2) rows += `
      <tr>
        <td class="c-term">Term 2</td>
        <td class="c-num">${fmtNum(c.t2SesObt)}</td>
        <td class="c-num c-tmarks">${t2SesMax}</td>
        <td class="c-num">${fmtNum(c.t2Wt20)}</td>
        <td class="c-num">${fmtNum(c.t2ExObt)}</td>
        <td class="c-num c-tmarks">${examMax}</td>
        <td class="c-num">${fmtNum(c.t2Wt80)}</td>
        <td class="c-num">${fmtNum(c.t2SesObt + c.t2ExObt)}</td>
        <td class="c-num c-tmarks">${t2TMks}</td>
        <td class="c-num">${fmtNum(c.t2Pct)}</td>
        <td class="c-grade">${getGrade(c.t2Pct)}</td>
      </tr>`;

  if (showGT) rows += `
      <tr class="tr-gtotal">
        <td class="c-term c-bold">G. Total</td>
        <td class="c-num c-bold">${fmtNum(gtAssObt)}</td>
        <td class="c-num c-tmarks c-bold">${gtAss}</td>
        <td class="c-num c-bold">${fmtNum(gtWt20)}</td>
        <td class="c-num c-bold">${fmtNum(gtExObt)}</td>
        <td class="c-num c-tmarks c-bold">${gtEx}</td>
        <td class="c-num c-bold">${fmtNum(gtWt80)}</td>
        <td class="c-num c-bold">${fmtNum(gtAssObt + gtExObt)}</td>
        <td class="c-num c-tmarks c-bold">${gtTMks}</td>
        <td class="c-num c-bold">${fmtNum(c.combinedPct)}</td>
        <td class="c-grade c-bold">${getGrade(c.combinedPct)}</td>
      </tr>`;

  const pct = showGT ? c.combinedPct : showT1 ? c.t1Pct : c.t2Pct;

  return { pct, t1Pct: c.t1Pct, t2Pct: c.t2Pct, combinedPct: c.combinedPct,
    t1TMks, t2TMks, gtTMks, t1AssObt: c.t1AssObt, t2SesObt: c.t2SesObt,
    block: `
<div class="sub-block">
  <div class="sub-title">${subName}</div>
  <table class="sub-table">
    <thead>
      <tr>
        <th rowspan="2" class="th-term">Term</th>
        <th colspan="2" class="th-group">Assessments &amp; Note Books</th>
        <th rowspan="2" class="th-pct20">20 %<br>Weightage</th>
        <th colspan="2" class="th-group">Term Marks</th>
        <th rowspan="2" class="th-pct80">80 %<br>Weightage</th>
        <th colspan="2" class="th-group">Total Weightage</th>
        <th rowspan="2" class="th-wtpct">Weightage<br>%Age</th>
        <th rowspan="2" class="th-grade">Grade</th>
      </tr>
      <tr>
        <th class="th-sub">Obt. Mks</th><th class="th-sub">T.Mks</th>
        <th class="th-sub">Obt. Mks</th><th class="th-sub">T.Mks</th>
        <th class="th-sub">Obt. Mks</th><th class="th-sub">T.Mks</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>
  <div class="fb-section">
    <table class="fb-table">
      <tr><td class="fb-lbl">Feedback:</td><td class="fb-val">${fb}</td></tr>
      <tr><td class="fb-lbl">Feedforwards for improvement:</td><td class="fb-val">${ff}</td></tr>
    </table>
  </div>
</div>` };
}

export function buildResultCardHTML(student, result, classInfo, schoolConfig) {
  const isComputer = student.subject === "computer";
  const subjects   = isComputer ? SUBJECTS_COMPUTER : SUBJECTS_BIO;
  const examMaxMap = isComputer ? EXAM_MAX_COMPUTER  : EXAM_MAX_BIO;
  const t2SesMax   = isComputer ? T2_SES_MAX_COMPUTER : T2_SES_MAX_BIO;
  const cfg        = _getSchoolConfig(schoolConfig).school;
  const term       = result?.term || "Final";
  const subjData   = result?.subjects || {};

  let allPcts = [];
  let totalTMks = 0;

  // Explicit map from display name → backend subject_key (must match backend's subject_key() fn)
  const SUBJECT_KEY_MAP = {
    "Pakistan Studies (History & Geography)": "pakistan_studies",
    "Bio": "bio",
    "Computer": "computer",
    "English": "english",
    "Urdu": "urdu",
    "Mathematics": "mathematics",
    "Physics": "physics",
    "Chemistry": "chemistry",
    "Islamiyat": "islamiyat",
  };

  const blocks = subjects.map(sub => {
    // Use explicit map first, then fall back to simple lowercase+underscore (matching backend)
    const key  = SUBJECT_KEY_MAP[sub] || sub.toLowerCase().replace(/\s+/g,"_");
    const data = subjData[key] || {};
    const examMax = examMaxMap[sub] || 100;
    const res  = subjectBlock(sub, data, examMax, t2SesMax, term);
    allPcts.push(res.pct);
    // T.Mks sum depends on term shown
    if (term === "Term 1") totalTMks += res.t1TMks;
    else if (term === "Term 2") totalTMks += res.t2TMks;
    else totalTMks += res.gtTMks;
    return res.block;
  });

  const totalPctSum   = +allPcts.reduce((a,b)=>a+b,0).toFixed(2);
  // Excel formula: overall% = sum(all subject final%) / (n_subjects × 100) × 100
  const totalWeightageMax = subjects.length * 100; // 800 for 8 subjects
  const overallAvgPct = totalWeightageMax > 0 ? +(totalPctSum / totalWeightageMax * 100).toFixed(2) : 0;
  const overallGrade  = getGrade(overallAvgPct);
  const strength      = classInfo?.strength || "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Student Progress Report — ${student.name}</title>
<style>
/* ── Reset ── */
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
html, body { background: #fff; color: #000; font-family: Calibri, "Segoe UI", Arial, sans-serif; font-size: 10pt; }
body { padding: 12px 16px; }

/* ── No-print toolbar ── */
.toolbar { display: flex; gap: 8px; margin-bottom: 12px; }
.toolbar button {
  padding: 5px 18px; border: none; border-radius: 3px; cursor: pointer;
  font-size: 10pt; font-weight: 600; font-family: inherit;
}
.btn-print { background: #17375e; color: #fff; }
.btn-pdf   { background: #1d6f42; color: #fff; }
.btn-close { background: #595959; color: #fff; }

/* ── Page header ── */
.page-header {
  display: flex;
  align-items: flex-start;
  margin-bottom: 6px;
  padding-bottom: 4px;
  border-bottom: 2px solid #000;
}
.logo-cell {
  width: 80px;
  flex-shrink: 0;
}
.logo-cell img { width: 75px; height: 75px; object-fit: contain; }
.logo-placeholder {
  width: 75px; height: 75px;
  border: 1px solid #999;
  display: flex; align-items: center; justify-content: center;
  font-size: 7pt; color: #999;
}
.header-text {
  flex: 1;
  text-align: center;
  padding-top: 4px;
}
.hdr-title   { font-size: 20pt; font-weight: bold; letter-spacing: 0.5px; }
.hdr-school  { font-size: 12pt; margin-top: 2px; }
.hdr-campus  { font-size: 11pt; margin-top: 1px; }
.hdr-session { font-size: 10pt; margin-top: 1px; }

/* ── Student info grid ── */
.info-table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 8px;
  font-size: 10pt;
}
.info-table td {
  padding: 2px 4px;
}
.info-label { font-weight: bold; white-space: nowrap; padding-right: 6px; }
.info-value {
  border-bottom: 1px solid #000;
  min-width: 120px;
  padding-bottom: 1px;
}

/* ── Subject block ── */
.sub-block {
  margin-bottom: 8px;
  border: 1px solid #000;
}
.sub-title {
  background: #bfbfbf;
  font-weight: bold;
  font-size: 11pt;
  text-align: center;
  padding: 2px 0;
  border-bottom: 1px solid #000;
}
.sub-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 9pt;
}
.sub-table th, .sub-table td {
  border: 1px solid #000;
  padding: 2px 4px;
}
/* Header rows */
.th-term  { width: 7%;  text-align: center; background: #fff; font-weight: bold; vertical-align: middle; }
.th-group { text-align: center; background: #fff; font-weight: bold; }
.th-sub   { text-align: center; background: #fff; font-weight: bold; font-size: 8.5pt; }
.th-pct20, .th-pct80 { text-align: center; background: #fff; font-weight: bold; width: 8%; vertical-align: middle; }
.th-wtpct { text-align: center; background: #fff; font-weight: bold; width: 8%; vertical-align: middle; }
.th-grade { text-align: center; background: #fff; font-weight: bold; width: 6%; vertical-align: middle; }

/* Data cells */
.c-term   { font-weight: bold; white-space: nowrap; padding: 2px 6px; }
.c-num    { text-align: right; padding: 2px 5px; }
.c-tmarks { color: #000; }
.c-grade  { text-align: center; font-weight: bold; }
.c-bold   { font-weight: bold; }
.tr-gtotal td { border-top: 2px solid #000; }

/* ── Feedback section ── */
.fb-section { border-top: 1px solid #000; }
.fb-table { width: 100%; border-collapse: collapse; font-size: 9.5pt; }
.fb-table td { padding: 3px 6px; vertical-align: top; }
.fb-lbl { font-weight: bold; white-space: nowrap; width: 230px; }
.fb-val { width: 100%; }
.fb-table tr + tr td { border-top: 1px solid #ccc; }

/* ── Bottom summary: grading key + weightage + result ── */
.summary-row {
  display: flex;
  gap: 0;
  margin-top: 8px;
  border: 1px solid #000;
}
.grade-key-box {
  border-right: 1px solid #000;
  flex: 0 0 auto;
}
.grade-key-box table {
  border-collapse: collapse;
  font-size: 9pt;
  width: 100%;
}
.grade-key-box table th {
  background: #bfbfbf;
  text-align: center;
  font-weight: bold;
  padding: 2px 10px;
  border-bottom: 1px solid #000;
}
.grade-key-box table td {
  padding: 2px 10px;
  border-bottom: 1px solid #ddd;
  text-align: center;
}
.grade-key-box table td:first-child { font-weight: bold; }

.summary-panels {
  flex: 1;
  display: flex;
}
.summary-panel {
  flex: 1;
  border-left: 1px solid #000;
}
.summary-panel:first-child { border-left: none; }
.sp-title {
  background: #bfbfbf;
  font-weight: bold;
  font-size: 10pt;
  text-align: center;
  padding: 2px 6px;
  border-bottom: 1px solid #000;
}
.sp-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 9.5pt;
}
.sp-table td {
  padding: 3px 8px;
  border-bottom: 1px solid #ddd;
}
.sp-label { font-weight: bold; }
.sp-value { text-align: right; font-weight: bold; }

/* ── Signatures ── */
.sig-row {
  display: flex;
  justify-content: space-around;
  margin-top: 36px;
  margin-bottom: 4px;
}
.sig-box { text-align: center; width: 28%; }
.sig-line { border-top: 1px solid #000; margin-bottom: 3px; }
.sig-label { font-size: 9.5pt; }
.page-note {
  text-align: center;
  font-size: 9pt;
  margin-top: 8px;
  font-style: italic;
}

/* ── Print ── */
@media print {
  .toolbar { display: none !important; }
  body { padding: 5mm 6mm; font-size: 9pt; }
  @page { size: A4 portrait; margin: 8mm; }
  .sub-block { page-break-inside: avoid; }
  .summary-row { page-break-inside: avoid; }
}
</style>
</head>
<body>

<div class="toolbar no-print">
  <button class="btn-print" onclick="window.print()">🖨 Print</button>
  <button class="btn-pdf"   onclick="(()=>{var b=this;b.textContent='Generating…';setTimeout(()=>{window.print();b.textContent='Download PDF';},200)})()">⬇ Download PDF</button>
  <button class="btn-close" onclick="window.close()">✕ Close</button>
</div>

<!-- ═══════════════ PAGE HEADER ═══════════════ -->
<div class="page-header">
  <div class="logo-cell">
    <img src="data:image/png;base64,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" alt="APSIS Logo"/>
  </div>
  <div class="header-text">
    <div class="hdr-title">Student Progress Report</div>
    <div class="hdr-school">${cfg.name}</div>
    <div class="hdr-campus">${cfg.campus}</div>
    <div class="hdr-session">${cfg.session}</div>
  </div>
  <div style="width:80px;flex-shrink:0;"></div>
</div>

<!-- ═══════════════ STUDENT INFO ═══════════════ -->
<table class="info-table">
  <tr>
    <td class="info-label">Student Information File</td>
    <td class="info-value" style="width:100px">${student.cid||""}</td>
    <td style="width:30px"></td>
    <td style="width:30px"></td>
    <td style="width:30px"></td>
    <td class="info-label">Class:</td>
    <td class="info-value">${classInfo?.name||""}</td>
  </tr>
  <tr>
    <td class="info-label">Name:</td>
    <td class="info-value" colspan="3">${student.name}</td>
    <td style="width:30px"></td>
    <td class="info-label">Class Strength:</td>
    <td class="info-value">${strength}</td>
  </tr>
  <tr>
    <td class="info-label">Term:</td>
    <td class="info-value" colspan="3">${term}</td>
    <td style="width:30px"></td>
    <td class="info-label">Subject Group:</td>
    <td class="info-value">${isComputer?"Computer":"Biology"}</td>
  </tr>
</table>

<!-- ═══════════════ SUBJECT BLOCKS ═══════════════ -->
${blocks.join("\n")}

<!-- ═══════════════ SUMMARY ROW ═══════════════ -->
<div class="summary-row">
  <!-- Grading Key -->
  <div class="grade-key-box">
    <table>
      <tr><th>Grade</th><th>Percentage</th></tr>
      <tr><td>A+</td><td>90-100%</td></tr>
      <tr><td>A</td><td>80-89</td></tr>
      <tr><td>B</td><td>70-79</td></tr>
      <tr><td>C</td><td>60-69</td></tr>
      <tr><td>D</td><td>50-59</td></tr>
      <tr><td>E</td><td>45-50</td></tr>
      <tr><td>Ungraded</td><td>&lt;45%</td></tr>
    </table>
  </div>

  <!-- Weightage Summary + Result Summary -->
  <div class="summary-panels">
    <div class="summary-panel">
      <div class="sp-title">Weightage Summary</div>
      <table class="sp-table">
        <tr><td class="sp-label">Total Weightage %</td><td class="sp-value">${totalWeightageMax}</td></tr>
        <tr><td class="sp-label">Average %age</td><td class="sp-value">${fmtNum(overallAvgPct)}</td></tr>
        <tr><td class="sp-label">Grade</td><td class="sp-value">${overallGrade}</td></tr>
      </table>
    </div>
    <div class="summary-panel">
      <div class="sp-title">Result Summary</div>
      <table class="sp-table">
        <tr><td class="sp-label">Total Marks</td><td class="sp-value">${totalTMks}</td></tr>
        <tr><td class="sp-label">Obtained</td><td class="sp-value">${fmtNum(totalPctSum)}</td></tr>
        <tr><td class="sp-label">%Age</td><td class="sp-value">${fmtNum(overallAvgPct)}%</td></tr>
        <tr><td class="sp-label">Grade</td><td class="sp-value">${overallGrade}</td></tr>
      </table>
    </div>
  </div>
</div>



</body>
</html>`;
}

export function openResultCard(student, result, classInfo, schoolConfig, existingWin) {
  const html = buildResultCardHTML(student, result, classInfo, schoolConfig);
  const win  = existingWin || window.open("", "_blank");
  win.document.write(html);
  win.document.close();
}
