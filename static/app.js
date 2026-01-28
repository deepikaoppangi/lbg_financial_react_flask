// ============================================
// Lloyds Wealth Insight - Dashboard JavaScript
// Enhanced Interactivity & Customer-Focused Visualizations
// ============================================

let period = "6M";
let currentProfile = "james_thompson";
let profiles = [];
let flowChart = null;
let wealthChart = null;
let expensePieChart = null;
let satisfactionChart = null;
let modalSatisfactionChart = null;
let currentSnap = null;

// ============================================
// UTILITY FUNCTIONS
// ============================================

function gbp(n) {
  try {
    return "£" + Number(n).toLocaleString(undefined, { maximumFractionDigits: 0 });
  } catch (e) {
    return "£" + n;
  }
}

// Lloyds Banking Group Official Color Palette
const LBG_COLORS = {
  primary: "#087038",
  primaryDark: "#065a2d",
  primaryLight: "#0a8a4a",
  primaryBright: "#0da85a",
  primaryPale: "#e8f5ed",
  primarySubtle: "#c8e6d5",
  gray900: "#1a1a1a",
  gray800: "#2d2d2d",
  gray700: "#404040",
  gray600: "#666666",
  gray400: "#999999",
  gray200: "#e0e0e0",
  gray100: "#f5f5f5",
  white: "#ffffff",
};

const CHART_COLORS = {
  income: LBG_COLORS.primary,
  expense: LBG_COLORS.primaryDark,
  savings: LBG_COLORS.primaryBright,
  grid: "rgba(0, 0, 0, 0.05)",
  text: LBG_COLORS.gray700,
  muted: LBG_COLORS.gray600,
  background: LBG_COLORS.white,
};

const NO_ANIM = { animation: false, responsiveAnimationDuration: 0 };

// ============================================
// TEXT FORMATTING FUNCTIONS
// ============================================

function formatText(text) {
  if (!text) return "";
  
  // Remove hashtags
  text = text.replace(/#\w+/g, "");
  
  // Convert markdown-style headings to HTML
  text = text.replace(/^###\s+(.+)$/gm, '<strong class="formatted-heading">$1</strong>');
  text = text.replace(/^##\s+(.+)$/gm, '<strong class="formatted-heading">$1</strong>');
  text = text.replace(/^#\s+(.+)$/gm, '<strong class="formatted-heading">$1</strong>');
  
  // Convert bullet points
  text = text.replace(/^[-*•]\s+(.+)$/gm, '<li>$1</li>');
  text = text.replace(/^\d+\.\s+(.+)$/gm, '<li>$1</li>');
  
  // Wrap consecutive <li> tags in <ul>
  text = text.replace(/(<li>.*<\/li>\n?)+/g, '<ul class="formatted-list">$&</ul>');
  
  // Convert line breaks to <br>
  text = text.replace(/\n/g, '<br>');
  
  // Clean up extra spaces
  text = text.replace(/\s+/g, ' ').trim();
  
  return text;
}

function formatBulletPoints(lines) {
  if (!lines || !Array.isArray(lines)) return "";
  
  let html = "";
  let inList = false;
  
  lines.forEach((line, index) => {
    if (!line || !line.trim()) {
      if (inList) {
        html += "</ul>";
        inList = false;
      }
      return;
    }
    
    let processedLine = line.trim();
    
    // Remove hashtags (but keep markdown headings)
    processedLine = processedLine.replace(/#(\w+)/g, ""); // Remove hashtags like #word
    
    // Handle markdown headings (###, ##, #)
    if (processedLine.match(/^#{1,6}\s+/)) {
      if (inList) {
        html += "</ul>";
        inList = false;
      }
      const headingText = processedLine.replace(/^#{1,6}\s+/, "").trim();
      const level = processedLine.match(/^#+/)[0].length;
      const headingTag = level === 1 ? "h3" : level === 2 ? "h4" : "h5";
      html += `<${headingTag} class="formatted-heading">${formatInlineMarkdown(headingText)}</${headingTag}>`;
      return;
    }
    
    // Check if it's a heading with #### (before processing inline markdown)
    if (processedLine.match(/^####\s+/)) {
      if (inList) {
        html += "</ul>";
        inList = false;
      }
      const headingText = processedLine.replace(/^####\s+/, "").trim();
      html += `<strong class="formatted-heading">${formatInlineMarkdown(headingText)}</strong>`;
      return;
    }
    
    // Handle bold markdown (**text** or __text__)
    processedLine = formatInlineMarkdown(processedLine);
    
    // Check if it's a heading (contains ":" at end)
    if (processedLine.match(/^[A-Z][^.!?]*:$/)) {
      if (inList) {
        html += "</ul>";
        inList = false;
      }
      const headingText = processedLine.replace(':', '').trim();
      html += `<strong class="formatted-heading">${headingText}</strong>`;
      return;
    }
    
    // Handle bullet points (check original line before markdown processing)
    const originalLine = line.trim();
    if (originalLine.match(/^[-*•]\s/) || originalLine.match(/^\d+\.\s/)) {
      if (!inList) {
        html += "<ul class=\"formatted-list\">";
        inList = true;
      }
      // Process markdown in the bullet content
      const bulletContent = originalLine.replace(/^[-*•]\s+/, "").replace(/^\d+\.\s+/, "");
      html += `<li>${formatInlineMarkdown(bulletContent)}</li>`;
    } else {
      if (inList) {
        html += "</ul>";
        inList = false;
      }
      // Regular paragraph
      html += `<div class="formatted-bullet">• ${processedLine}</div>`;
    }
  });
  
  if (inList) {
    html += "</ul>";
  }
  
  return html;
}

function formatInlineMarkdown(text) {
  if (!text) return "";
  
  // Replace bold **text** first (process multiple times to handle all instances)
  let result = text;
  let iterations = 0;
  let changed = true;
  
  // Process bold markers
  while (changed && iterations < 10) {
    const before = result;
    result = result.replace(/\*\*([^*\n]+?)\*\*/g, '<strong>$1</strong>');
    result = result.replace(/__([^_\n]+?)__/g, '<strong>$1</strong>');
    changed = (before !== result);
    iterations++;
  }
  
  // For italic, use a simpler approach - replace single asterisks/underscores
  // that are not adjacent to another asterisk/underscore
  // Split by ** to avoid processing already-bold text
  const parts = result.split(/(<strong>.*?<\/strong>)/g);
  result = parts.map(part => {
    if (part.startsWith('<strong>')) {
      return part; // Already processed
    }
    // Process italic in remaining parts
    return part.replace(/\*([^*\n]+?)\*/g, '<em>$1</em>')
               .replace(/_([^_\n]+?)_/g, '<em>$1</em>');
  }).join('');
  
  return result;
}

// ============================================
// ENHANCED INTERACTIVITY FUNCTIONS
// ============================================

function addCardInteractivity() {
  document.querySelectorAll('.dashboard-card').forEach(card => {
    card.addEventListener('mouseenter', function() {
      this.style.transform = 'translateY(-2px)';
    });
    card.addEventListener('mouseleave', function() {
      this.style.transform = 'translateY(0)';
    });
  });
}

function animateValue(element, start, end, duration) {
  if (!element) return;
  let startTimestamp = null;
  const step = (timestamp) => {
    if (!startTimestamp) startTimestamp = timestamp;
    const progress = Math.min((timestamp - startTimestamp) / duration, 1);
    const current = Math.floor(progress * (end - start) + start);
    if (element.textContent.includes('£')) {
      element.textContent = gbp(current);
    } else if (element.textContent.includes('%')) {
      element.textContent = `${current}%`;
    } else {
      element.textContent = current;
    }
    if (progress < 1) {
      window.requestAnimationFrame(step);
    }
  };
  window.requestAnimationFrame(step);
}

// ============================================
// MODAL FUNCTIONS
// ============================================

function openFinancialMetricsModal(snap) {
  const modal = document.getElementById("financialMetricsModal");
  if (!modal) return;
  
  // Update modal values
  const salary = snap.salary_monthly || 0;
  const expenses = snap.monthly_expense_total || 0;
  const savings = snap.savings_est_monthly || 0;
  
  const savingsRate = salary > 0 ? Math.round((savings / salary) * 100) : 0;
  const expenseRatio = salary > 0 ? (expenses / salary) : 1;
  const efficiency = Math.max(0, Math.min(100, Math.round((1 - expenseRatio) * 100)));
  const goalProgress = Math.round((snap.resilience + snap.liquidity) / 2);
  
  // Update modal engagement metrics
  const modalSavingsRate = document.getElementById("modalSavingsRate");
  const modalSavingsRateBar = document.getElementById("modalSavingsRateBar");
  if (modalSavingsRate) modalSavingsRate.textContent = `${savingsRate}%`;
  if (modalSavingsRateBar) {
    modalSavingsRateBar.style.width = `${Math.min(savingsRate, 100)}%`;
    modalSavingsRateBar.style.background = `linear-gradient(90deg, ${LBG_COLORS.primary} 0%, ${LBG_COLORS.primaryBright} 100%)`;
  }
  
  const modalEfficiency = document.getElementById("modalEfficiency");
  const modalEfficiencyBar = document.getElementById("modalEfficiencyBar");
  if (modalEfficiency) modalEfficiency.textContent = `${efficiency}%`;
  if (modalEfficiencyBar) {
    modalEfficiencyBar.style.width = `${efficiency}%`;
    modalEfficiencyBar.style.background = `linear-gradient(90deg, ${LBG_COLORS.primary} 0%, ${LBG_COLORS.primaryBright} 100%)`;
  }
  
  const modalGoalProgress = document.getElementById("modalGoalProgress");
  const modalGoalProgressBar = document.getElementById("modalGoalProgressBar");
  if (modalGoalProgress) modalGoalProgress.textContent = `${goalProgress}%`;
  if (modalGoalProgressBar) {
    modalGoalProgressBar.style.width = `${goalProgress}%`;
    modalGoalProgressBar.style.background = `linear-gradient(90deg, ${LBG_COLORS.primary} 0%, ${LBG_COLORS.primaryBright} 100%)`;
  }
  
  // Update modal health metrics
  const modalRes = document.getElementById("modalRes");
  const modalResBar = document.getElementById("modalResBar");
  if (modalRes) modalRes.textContent = `${snap.resilience}%`;
  if (modalResBar) {
    modalResBar.style.width = `${snap.resilience}%`;
    modalResBar.style.background = `linear-gradient(90deg, ${LBG_COLORS.primary} 0%, ${LBG_COLORS.primaryBright} 100%)`;
  }
  
  const modalLiq = document.getElementById("modalLiq");
  const modalLiqBar = document.getElementById("modalLiqBar");
  if (modalLiq) modalLiq.textContent = `${snap.liquidity}%`;
  if (modalLiqBar) {
    modalLiqBar.style.width = `${snap.liquidity}%`;
    modalLiqBar.style.background = `linear-gradient(90deg, ${LBG_COLORS.primary} 0%, ${LBG_COLORS.primaryBright} 100%)`;
  }
  
  // Draw satisfaction chart in modal
  setTimeout(() => {
    drawModalSatisfaction(snap);
  }, 100);
  
  modal.classList.add("active");
}

function closeFinancialMetricsModal() {
  const modal = document.getElementById("financialMetricsModal");
  if (modal) {
    modal.classList.remove("active");
  }
}

function drawModalSatisfaction(snap) {
  const ctx = document.getElementById("modalSatisfactionChart");
  if (!ctx) return;
  
  if (modalSatisfactionChart) modalSatisfactionChart.destroy();

  const resilience = snap.resilience || 0;
  const liquidity = snap.liquidity || 0;
  const savingsRate = snap.salary_monthly > 0
    ? Math.round((snap.savings_est_monthly / snap.salary_monthly) * 100)
    : 0;
  const expenseControl = snap.salary_monthly > 0
    ? Math.max(0, Math.min(100, Math.round((1 - snap.monthly_expense_total / snap.salary_monthly) * 100)))
    : 0;

  const metrics = [
    { label: "Resilience", value: resilience },
    { label: "Liquidity", value: liquidity },
    { label: "Savings Rate", value: savingsRate },
    { label: "Expense Control", value: expenseControl },
  ];

  modalSatisfactionChart = new Chart(ctx, {
    type: "radar",
    data: {
      labels: metrics.map((m) => m.label),
      datasets: [
        {
          label: "Financial Satisfaction",
          data: metrics.map((m) => m.value),
          backgroundColor: `rgba(8, 112, 56, 0.2)`,
          borderColor: LBG_COLORS.primary,
          pointBackgroundColor: LBG_COLORS.primary,
          pointBorderColor: LBG_COLORS.white,
          pointHoverBackgroundColor: LBG_COLORS.primaryBright,
          pointHoverBorderColor: LBG_COLORS.white,
          borderWidth: 3,
          pointRadius: 5,
          pointHoverRadius: 7,
        },
      ],
    },
    options: {
      ...NO_ANIM,
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: LBG_COLORS.gray800,
          padding: 12,
          titleFont: { size: 14, weight: "600" },
          bodyFont: { size: 13 },
          borderColor: LBG_COLORS.primary,
          borderWidth: 2,
          cornerRadius: 8,
          callbacks: {
            label: function (context) {
              return `${context.label}: ${context.parsed.r}%`;
            },
          },
        },
      },
      scales: {
        r: {
          beginAtZero: true,
          max: 100,
          ticks: {
            stepSize: 20,
            color: CHART_COLORS.muted,
            font: { size: 10 },
            backdropColor: "transparent",
          },
          grid: { color: CHART_COLORS.grid },
          pointLabels: {
            color: CHART_COLORS.text,
            font: { size: 11, weight: "600" },
          },
        },
      },
    },
  });
}

// ============================================
// RENDER FUNCTIONS
// ============================================

function setBars(res, liq) {
  const resEl = document.getElementById("res");
  const liqEl = document.getElementById("liq");
  const resBar = document.getElementById("resBar");
  const liqBar = document.getElementById("liqBar");
  
  if (resEl) resEl.textContent = `${res}%`;
  if (liqEl) liqEl.textContent = `${liq}%`;
  if (resBar) {
    resBar.style.width = `${res}%`;
    resBar.style.background = `linear-gradient(90deg, ${LBG_COLORS.primary} 0%, ${LBG_COLORS.primaryBright} 100%)`;
  }
  if (liqBar) {
    liqBar.style.width = `${liq}%`;
    liqBar.style.background = `linear-gradient(90deg, ${LBG_COLORS.primary} 0%, ${LBG_COLORS.primaryBright} 100%)`;
  }
  
  // Update preview values
  const previewRes = document.getElementById("previewRes");
  const previewLiq = document.getElementById("previewLiq");
  if (previewRes) previewRes.textContent = `${res}%`;
  if (previewLiq) previewLiq.textContent = `${liq}%`;
}

function renderExpenses(expenses, total) {
  const expTotalEl = document.getElementById("expTotal");
  if (expTotalEl) {
    animateValue(expTotalEl, 0, total, 800);
  }
  
  const expTotalSubtitle = document.getElementById("expTotalSubtitle");
  if (expTotalSubtitle) {
    expTotalSubtitle.textContent = `Total: ${gbp(total)}`;
  }
  
  // Draw pie chart instead of list
  drawExpensePieChart(expenses, total);
}

function drawExpensePieChart(expenses, total) {
  const ctx = document.getElementById("expensePieChart");
  if (!ctx) return;
  
  if (expensePieChart) expensePieChart.destroy();

  const sortedExpenses = [...expenses].sort((a, b) => b.monthly - a.monthly);
  const labels = sortedExpenses.map((e) => e.label);
  const data = sortedExpenses.map((e) => e.monthly);
  const percentages = sortedExpenses.map((e) => e.pct);

  // Use grey shades with light green shades in the middle
  const expenseColors = [
    "#666666", // Medium grey
    "#999999", // Light grey
    "#c8e6d5", // Light green (LBG subtle)
    "#e8f5ed", // Very light green (LBG pale)
    "#0a8a4a", // Light green (LBG primaryLight)
    "#808080", // Medium-light grey
    "#b3b3b3", // Lighter grey
    "#404040", // Dark grey
    "#d0d0d0", // Very light grey
    "#2d2d2d", // Darker grey
  ];
  
  const backgroundColors = data.map((_, index) => {
    return expenseColors[index % expenseColors.length];
  });

  expensePieChart = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: labels,
      datasets: [
        {
          data: data,
          backgroundColor: backgroundColors,
          borderColor: LBG_COLORS.white,
          borderWidth: 2,
        },
      ],
    },
    options: {
      ...NO_ANIM,
      responsive: true,
      maintainAspectRatio: false,
      onClick: (event, elements) => {
        if (elements.length > 0) {
          const index = elements[0].index;
          const expense = sortedExpenses[index];
          openExpenseDetailModal(expense, total);
        }
      },
      plugins: {
        legend: {
          display: true,
          position: "right",
          labels: {
            color: CHART_COLORS.text,
            font: { size: 10, weight: "500" },
            padding: 8,
            generateLabels: function (chart) {
              const data = chart.data;
              if (data.labels.length && data.datasets.length) {
                return data.labels.map((label, i) => {
                  const value = data.datasets[0].data[i];
                  const pct = percentages[i];
                  return {
                    text: `${label}: ${gbp(value)} (${pct}%)`,
                    fillStyle: data.datasets[0].backgroundColor[i],
                    strokeStyle: data.datasets[0].borderColor,
                    lineWidth: data.datasets[0].borderWidth,
                    hidden: false,
                    index: i,
                  };
                });
              }
              return [];
            },
          },
        },
        tooltip: {
          backgroundColor: LBG_COLORS.gray800,
          padding: 10,
          titleFont: { size: 13, weight: "600" },
          bodyFont: { size: 12 },
          borderColor: LBG_COLORS.primary,
          borderWidth: 2,
          cornerRadius: 8,
          callbacks: {
            label: function (context) {
              const label = context.label || "";
              const value = context.parsed || 0;
              const pct = percentages[context.dataIndex] || 0;
              return `${label}: ${gbp(value)} (${pct}% of total)`;
            },
          },
        },
      },
    },
  });
}

function openExpenseDetailModal(expense, total) {
  const modal = document.getElementById("expenseDetailModal");
  if (!modal) return;
  
  document.getElementById("expenseDetailLabel").textContent = expense.label;
  document.getElementById("expenseDetailAmount").textContent = gbp(expense.monthly);
  document.getElementById("expenseDetailPct").textContent = `${expense.pct}%`;
  document.getElementById("expenseDetailMonthly").textContent = gbp(expense.monthly);
  document.getElementById("expenseDetailShare").textContent = `${expense.pct}% of total`;
  
  modal.classList.add("active");
}

function closeExpenseDetailModal() {
  const modal = document.getElementById("expenseDetailModal");
  if (modal) {
    modal.classList.remove("active");
  }
}

function renderSummary(summary) {
  // Render to modal
  const headlineEl = document.getElementById("modalSumHeadline");
  const bulletsEl = document.getElementById("modalSumBullets");
  const noteEl = document.getElementById("modalSumNote");
  
  if (headlineEl) {
    let headline = summary.headline || "";
    headline = headline.replace(/#\w+/g, "").trim();
    headlineEl.textContent = headline;
  }
  
  if (bulletsEl) {
    bulletsEl.innerHTML = "";
    if (summary.bullets && summary.bullets.length > 0) {
      const formatted = formatBulletPoints(summary.bullets);
      bulletsEl.innerHTML = formatted;
    }
  }
  
  if (noteEl) {
    let note = summary.note || "";
    note = note.replace(/#\w+/g, "").trim();
    noteEl.textContent = note;
  }
  
  // Also render collapsed preview on card
  const previewEl = document.getElementById("insightPreview");
  const collapsedEl = document.getElementById("insightResultCollapsed");
  const collapsedHeadline = document.getElementById("insightHeadlineCollapsed");
  const collapsedContent = document.getElementById("insightContentCollapsed");
  
  if (previewEl) previewEl.style.display = "none";
  if (collapsedEl) {
    collapsedEl.style.display = "block";
    if (collapsedHeadline) {
      let headline = summary.headline || "";
      headline = headline.replace(/#\w+/g, "").trim();
      collapsedHeadline.textContent = headline;
    }
    if (collapsedContent && summary.bullets && summary.bullets.length > 0) {
      // Show only first 1-2 lines as preview for compact one-page layout
      const previewLines = summary.bullets.slice(0, 2);
      const formatted = formatBulletPoints(previewLines);
      collapsedContent.innerHTML = formatted;
    }
  }
  
  // Open modal
  openInsightModal();
}

function openInsightModal() {
  const modal = document.getElementById("insightModal");
  if (modal) {
    modal.classList.add("active");
  }
}

function closeInsightModal() {
  const modal = document.getElementById("insightModal");
  if (modal) {
    modal.classList.remove("active");
  }
}

function renderSimulation(payload) {
  // Render to modal
  const headingEl = document.getElementById("modalSimHeading");
  const bodyEl = document.getElementById("modalSimBody");

  if (headingEl) {
    let heading = payload.heading || "";
    heading = heading.replace(/#\w+/g, "").trim();
    headingEl.textContent = heading;
  }
  
  const lines = payload.lines || [];

  if (bodyEl) {
    bodyEl.innerHTML = "";
    if (lines.length > 0) {
      const formatted = formatBulletPoints(lines);
      bodyEl.innerHTML = formatted;
    } else {
      bodyEl.innerHTML = '<p class="simulation-placeholder">Type a scenario question and click Plan Your Future to see personalized insights.</p>';
    }
  }

  // Also render collapsed preview on card
  const previewEl = document.getElementById("simulationPreview");
  const collapsedEl = document.getElementById("simulationResultCollapsed");
  const collapsedHeading = document.getElementById("simulationHeadingCollapsed");
  const collapsedContent = document.getElementById("simulationContentCollapsed");
  
  if (previewEl) previewEl.style.display = "none";
  if (collapsedEl) {
    collapsedEl.style.display = "block";
    if (collapsedHeading) {
      let heading = payload.heading || "";
      heading = heading.replace(/#\w+/g, "").trim();
      collapsedHeading.textContent = heading;
    }
    if (collapsedContent && lines.length > 0) {
      // Show only first 1-2 lines as preview for compact one-page layout
      const previewLines = lines.slice(0, 2);
      const formatted = formatBulletPoints(previewLines);
      collapsedContent.innerHTML = formatted;
    }
  }

  // Open modal
  openSimulationModal();
}

function openSimulationModal() {
  const modal = document.getElementById("simulationModal");
  if (modal) {
    modal.classList.add("active");
  }
}

function closeSimulationModal() {
  const modal = document.getElementById("simulationModal");
  if (modal) {
    modal.classList.remove("active");
  }
}

function calculateEngagementMetrics(snap) {
  const salary = snap.salary_monthly || 0;
  const expenses = snap.monthly_expense_total || 0;
  const savings = snap.savings_est_monthly || 0;
  
  const savingsRate = salary > 0 ? Math.round((savings / salary) * 100) : 0;
  const savingsRateEl = document.getElementById("savingsRate");
  const savingsRateBar = document.getElementById("savingsRateBar");
  if (savingsRateEl) savingsRateEl.textContent = `${savingsRate}%`;
  if (savingsRateBar) {
    savingsRateBar.style.width = `${Math.min(savingsRate, 100)}%`;
    savingsRateBar.style.background = `linear-gradient(90deg, ${LBG_COLORS.primary} 0%, ${LBG_COLORS.primaryBright} 100%)`;
  }
  
  const expenseRatio = salary > 0 ? (expenses / salary) : 1;
  const efficiency = Math.max(0, Math.min(100, Math.round((1 - expenseRatio) * 100)));
  const efficiencyEl = document.getElementById("efficiency");
  const efficiencyBar = document.getElementById("efficiencyBar");
  if (efficiencyEl) efficiencyEl.textContent = `${efficiency}%`;
  if (efficiencyBar) {
    efficiencyBar.style.width = `${efficiency}%`;
    efficiencyBar.style.background = `linear-gradient(90deg, ${LBG_COLORS.primary} 0%, ${LBG_COLORS.primaryBright} 100%)`;
  }
  
  const goalProgress = Math.round((snap.resilience + snap.liquidity) / 2);
  const goalProgressEl = document.getElementById("goalProgress");
  const goalProgressBar = document.getElementById("goalProgressBar");
  if (goalProgressEl) goalProgressEl.textContent = `${goalProgress}%`;
  if (goalProgressBar) {
    goalProgressBar.style.width = `${goalProgress}%`;
    goalProgressBar.style.background = `linear-gradient(90deg, ${LBG_COLORS.primary} 0%, ${LBG_COLORS.primaryBright} 100%)`;
  }
  
  const wellnessScore = Math.round((savingsRate * 0.3 + efficiency * 0.3 + goalProgress * 0.4));
  const wellnessEl = document.getElementById("wellnessScore");
  if (wellnessEl) {
    animateValue(wellnessEl, 0, wellnessScore, 1000);
  }
  
  // Update preview
  const previewSavingsRate = document.getElementById("previewSavingsRate");
  if (previewSavingsRate) previewSavingsRate.textContent = `${savingsRate}%`;
}

function minMaxPad(values) {
  const nums = (values || []).map(Number).filter((v) => Number.isFinite(v));
  if (!nums.length) return { min: 0, max: 100 };
  const min = Math.min(...nums);
  const max = Math.max(...nums);
  const range = max - min || 1;
  return { min: min - range * 0.15, max: max + range * 0.15 };
}

// ============================================
// CHART FUNCTIONS
// ============================================

function drawFlow(flow) {
  const titleEl = document.getElementById("flowTitle");
  if (titleEl) {
    titleEl.textContent = flow.grain === "monthly"
      ? "Flow (month-wise): Income vs Expense vs Savings"
      : "Flow (year-wise): Income vs Expense vs Savings";
  }

  const ctx = document.getElementById("flowChart");
  if (!ctx) return;
  
  if (flowChart) flowChart.destroy();

  const all = [...(flow.income || []), ...(flow.expense || []), ...(flow.savings || [])];
  const mm = minMaxPad(all);
  const yMin = 0;
  const yMax = Math.max(mm.max, 1);

  flowChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: flow.labels,
      datasets: [
        {
          label: "Income",
          data: flow.income,
          backgroundColor: LBG_COLORS.primary, // Dark green
          borderRadius: 8,
          borderSkipped: false,
        },
        {
          label: "Expense",
          data: flow.expense,
          backgroundColor: LBG_COLORS.primaryLight, // Light green
          borderRadius: 8,
          borderSkipped: false,
        },
        {
          label: "Savings",
          data: flow.savings,
          backgroundColor: "#0d9488", // Teal shade of green
          borderRadius: 8,
          borderSkipped: false,
        },
      ],
    },
    options: {
      ...NO_ANIM,
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: "top",
          labels: {
            color: CHART_COLORS.text,
            font: { size: 11, weight: "600" },
            padding: 12,
            usePointStyle: true,
          },
        },
        tooltip: {
          backgroundColor: LBG_COLORS.gray800,
          padding: 10,
          titleFont: { size: 13, weight: "600" },
          bodyFont: { size: 12 },
          borderColor: LBG_COLORS.primary,
          borderWidth: 2,
          cornerRadius: 8,
        },
      },
      scales: {
        x: {
          ticks: { color: CHART_COLORS.muted, font: { size: 10 } },
          grid: { color: CHART_COLORS.grid, drawBorder: false },
        },
        y: {
          min: yMin,
          max: yMax,
          ticks: {
            color: CHART_COLORS.muted,
            font: { size: 10 },
            callback: function (value) {
              return "£" + value.toLocaleString();
            },
          },
          grid: { color: CHART_COLORS.grid, drawBorder: false },
        },
      },
    },
  });
}

function drawWealth(labels, points) {
  const ctx = document.getElementById("wealthChart");
  if (!ctx) return;
  
  if (wealthChart) wealthChart.destroy();

  const mm = minMaxPad(points);

  wealthChart = new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: "Wealth Index",
          data: points,
          tension: 0.4,
          borderColor: LBG_COLORS.primary,
          backgroundColor: `rgba(8, 112, 56, 0.1)`,
          pointRadius: 3,
          pointHoverRadius: 6,
          pointBackgroundColor: LBG_COLORS.primary,
          pointBorderColor: LBG_COLORS.white,
          pointBorderWidth: 2,
          borderWidth: 2,
          fill: true,
        },
      ],
    },
    options: {
      ...NO_ANIM,
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: LBG_COLORS.gray800,
          padding: 10,
          titleFont: { size: 13, weight: "600" },
          bodyFont: { size: 12 },
          borderColor: LBG_COLORS.primary,
          borderWidth: 2,
          cornerRadius: 8,
        },
      },
      scales: {
        x: {
          ticks: { color: CHART_COLORS.muted, font: { size: 10 } },
          grid: { color: CHART_COLORS.grid, drawBorder: false },
        },
        y: {
          min: mm.min,
          max: mm.max,
          ticks: {
            color: CHART_COLORS.muted,
            font: { size: 10 },
          },
          grid: { color: CHART_COLORS.grid, drawBorder: false },
        },
      },
    },
  });
}


function drawSatisfaction(snap) {
  const ctx = document.getElementById("satisfactionChart");
  if (!ctx) return;
  
  if (satisfactionChart) satisfactionChart.destroy();

  const resilience = snap.resilience || 0;
  const liquidity = snap.liquidity || 0;
  const savingsRate = snap.salary_monthly > 0
    ? Math.round((snap.savings_est_monthly / snap.salary_monthly) * 100)
    : 0;
  const expenseControl = snap.salary_monthly > 0
    ? Math.max(0, Math.min(100, Math.round((1 - snap.monthly_expense_total / snap.salary_monthly) * 100)))
    : 0;

  const metrics = [
    { label: "Resilience", value: resilience },
    { label: "Liquidity", value: liquidity },
    { label: "Savings Rate", value: savingsRate },
    { label: "Expense Control", value: expenseControl },
  ];

  satisfactionChart = new Chart(ctx, {
    type: "radar",
    data: {
      labels: metrics.map((m) => m.label),
      datasets: [
        {
          label: "Financial Satisfaction",
          data: metrics.map((m) => m.value),
          backgroundColor: `rgba(8, 112, 56, 0.2)`,
          borderColor: LBG_COLORS.primary,
          pointBackgroundColor: LBG_COLORS.primary,
          pointBorderColor: LBG_COLORS.white,
          pointHoverBackgroundColor: LBG_COLORS.primaryBright,
          pointHoverBorderColor: LBG_COLORS.white,
          borderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6,
        },
      ],
    },
    options: {
      ...NO_ANIM,
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: LBG_COLORS.gray800,
          padding: 10,
          titleFont: { size: 13, weight: "600" },
          bodyFont: { size: 12 },
          borderColor: LBG_COLORS.primary,
          borderWidth: 2,
          cornerRadius: 8,
          callbacks: {
            label: function (context) {
              return `${context.label}: ${context.parsed.r}%`;
            },
          },
        },
      },
      scales: {
        r: {
          beginAtZero: true,
          max: 100,
          ticks: {
            stepSize: 20,
            color: CHART_COLORS.muted,
            font: { size: 9 },
            backdropColor: "transparent",
          },
          grid: { color: CHART_COLORS.grid },
          pointLabels: {
            color: CHART_COLORS.text,
            font: { size: 10, weight: "600" },
          },
        },
      },
    },
  });
}

// ============================================
// DATA LOADING
// ============================================

async function loadSnapshot() {
  // Load snapshot without any question - just update charts based on period
  try {
    const res = await fetch("/api/snapshot", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ period, question: "", profile: currentProfile }),
    });

    const data = await res.json();
    const snap = data.snapshot;
    currentSnap = snap;

    const salaryEl = document.getElementById("salary");
    if (salaryEl) animateValue(salaryEl, 0, snap.salary_monthly, 800);
    
    const savingsEl = document.getElementById("savings");
    if (savingsEl) animateValue(savingsEl, 0, snap.savings_est_monthly, 800);

    renderExpenses(snap.expenses, snap.monthly_expense_total);
    setBars(snap.resilience, snap.liquidity);
    calculateEngagementMetrics(snap);
    drawFlow(snap.flow);
    drawWealth(snap.labels, snap.wealth);
    drawSatisfaction(snap);
  } catch (error) {
    console.error("Error loading snapshot:", error);
  }
}

async function generateInsight() {
  const q = (document.getElementById("insightQuestion")?.value || "").trim();

  const headlineEl = document.getElementById("modalSumHeadline");
  const bulletsEl = document.getElementById("modalSumBullets");
  const noteEl = document.getElementById("modalSumNote");
  
  // Open modal immediately with loading state
  openInsightModal();
  
  if (headlineEl) {
    headlineEl.textContent = "Generating insight…";
  }
  
  if (bulletsEl) {
    bulletsEl.innerHTML = "";
  }
  
  if (noteEl) {
    noteEl.textContent = "";
  }

  try {
    const res = await fetch("/api/snapshot", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ period, question: q, profile: currentProfile }),
    });

    const data = await res.json();
    renderSummary(data.summary);
  } catch (error) {
    console.error("Error generating insight:", error);
    if (headlineEl) headlineEl.textContent = "Error generating insight";
    if (bulletsEl) bulletsEl.innerHTML = '<div class="formatted-bullet">• Failed to generate insight. Please try again.</div>';
  }
}

async function runSimulation() {
  const q = (document.getElementById("question")?.value || "").trim();

  const headingEl = document.getElementById("modalSimHeading");
  const bodyEl = document.getElementById("modalSimBody");
  
  // Open modal immediately with loading state
  openSimulationModal();
  
  if (headingEl) headingEl.textContent = "Simulation running…";
  if (bodyEl) bodyEl.innerHTML = '<div class="formatted-bullet">• Please wait</div>';

  try {
    const res = await fetch("/api/simulate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ period, question: q, profile: currentProfile }),
    });

    const payload = await res.json();
    renderSimulation(payload);
  } catch (error) {
    console.error("Error running simulation:", error);
    renderSimulation({
      heading: "Error",
      lines: ["Failed to run simulation. Please try again."],
      enabled: false,
    });
  }
}

// ============================================
// EVENT LISTENERS
// ============================================

function setupPeriodSelector() {
  document.querySelectorAll(".period-btn").forEach((btn) => {
    btn.addEventListener("click", async () => {
      document.querySelectorAll(".period-btn").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      period = btn.dataset.period;
      await loadSnapshot();
    });
  });
}

const simulateBtn = document.getElementById("simulateBtn");
if (simulateBtn) {
  simulateBtn.addEventListener("click", async () => {
    await runSimulation();
  });
}

const questionInput = document.getElementById("question");
if (questionInput) {
  questionInput.addEventListener("keypress", async (e) => {
    if (e.key === "Enter") {
      await runSimulation();
    }
  });
}

const generateInsightBtn = document.getElementById("generateInsightBtn");
if (generateInsightBtn) {
  generateInsightBtn.addEventListener("click", async () => {
    await generateInsight();
  });
}

const insightQuestionInput = document.getElementById("insightQuestion");
if (insightQuestionInput) {
  insightQuestionInput.addEventListener("keypress", async (e) => {
    if (e.key === "Enter") {
      await generateInsight();
    }
  });
}

const financialMetricsCard = document.getElementById("financialMetricsCard");
if (financialMetricsCard) {
  financialMetricsCard.addEventListener("click", () => {
    if (currentSnap) {
      openFinancialMetricsModal(currentSnap);
    }
  });
}

const closeFinancialModal = document.getElementById("closeFinancialModal");
if (closeFinancialModal) {
  closeFinancialModal.addEventListener("click", () => {
    closeFinancialMetricsModal();
  });
}

const financialMetricsModal = document.getElementById("financialMetricsModal");
if (financialMetricsModal) {
  financialMetricsModal.addEventListener("click", (e) => {
    if (e.target === financialMetricsModal) {
      closeFinancialMetricsModal();
    }
  });
}

const closeExpenseModal = document.getElementById("closeExpenseModal");
if (closeExpenseModal) {
  closeExpenseModal.addEventListener("click", () => {
    closeExpenseDetailModal();
  });
}

const expenseDetailModal = document.getElementById("expenseDetailModal");
if (expenseDetailModal) {
  expenseDetailModal.addEventListener("click", (e) => {
    if (e.target === expenseDetailModal) {
      closeExpenseDetailModal();
    }
  });
}

const closeInsightModalBtn = document.getElementById("closeInsightModal");
if (closeInsightModalBtn) {
  closeInsightModalBtn.addEventListener("click", () => {
    closeInsightModal();
  });
}

const insightModal = document.getElementById("insightModal");
if (insightModal) {
  insightModal.addEventListener("click", (e) => {
    if (e.target === insightModal) {
      closeInsightModal();
    }
  });
}

const closeSimulationModalBtn = document.getElementById("closeSimulationModal");
if (closeSimulationModalBtn) {
  closeSimulationModalBtn.addEventListener("click", () => {
    closeSimulationModal();
  });
}

const simulationModal = document.getElementById("simulationModal");
if (simulationModal) {
  simulationModal.addEventListener("click", (e) => {
    if (e.target === simulationModal) {
      closeSimulationModal();
    }
  });
}

// Read More buttons
const insightReadMoreBtn = document.getElementById("insightReadMoreBtn");
if (insightReadMoreBtn) {
  insightReadMoreBtn.addEventListener("click", () => {
    openInsightModal();
  });
}

const simulationReadMoreBtn = document.getElementById("simulationReadMoreBtn");
if (simulationReadMoreBtn) {
  simulationReadMoreBtn.addEventListener("click", () => {
    openSimulationModal();
  });
}

// ============================================
// PROFILE MANAGEMENT
// ============================================

async function loadProfiles() {
  try {
    const res = await fetch("/api/profiles");
    const data = await res.json();
    profiles = data.profiles || [];
    setupProfileSelector();
  } catch (error) {
    console.error("Error loading profiles:", error);
    profiles = [];
  }
}

function updateTitle(profileName) {
  const titleEl = document.getElementById("appTitle");
  if (!titleEl) return;
  
  // Extract first name from full name (e.g., "David Williams" -> "David")
  const firstName = profileName ? profileName.split(" ")[0] : "";
  if (firstName) {
    titleEl.textContent = `${firstName} Financial Wellbeing`;
  } else {
    titleEl.textContent = "Financial Wellbeing";
  }
}

function setupProfileSelector() {
  const selector = document.getElementById("profileSelector");
  if (!selector) return;
  
  // Clear existing options
  selector.innerHTML = "";
  
  // Add profile options
  profiles.forEach(profile => {
    const option = document.createElement("option");
    option.value = profile.id;
    option.textContent = profile.name;
    if (profile.id === currentProfile) {
      option.selected = true;
      // Update title for initial profile
      updateTitle(profile.name);
    }
    selector.appendChild(option);
  });
  
  // Add event listener
  selector.addEventListener("change", async (e) => {
    currentProfile = e.target.value;
    // Find the selected profile and update title
    const selectedProfile = profiles.find(p => p.id === currentProfile);
    if (selectedProfile) {
      updateTitle(selectedProfile.name);
    }
    await loadSnapshot();
  });
}

// ============================================
// INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', function() {
  addCardInteractivity();
  setupPeriodSelector();
  loadProfiles().then(() => {
    loadSnapshot();
  });
});
