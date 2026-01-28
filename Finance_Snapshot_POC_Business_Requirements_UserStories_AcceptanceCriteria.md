Finance Snapshot POC – Business Requirements (User Stories + Acceptance Criteria)

This document captures the business-oriented user stories and acceptance criteria for the Finance Snapshot POC. It is designed for product, business, and compliance stakeholders. The application is insight-first and non-advisory.

Scope Summary

In scope:

• Expense categorisation and share of spend

• Financial flow (income vs expenses vs savings) over 6M / 1Y / 3Y / 5Y

• Resilience and liquidity indicators

• Insight summary (current-state, explanatory, non-advisory)

• Optional scenario simulations (illustrative) such as retirement age or holiday budget

Out of scope (explicit):

• Transaction execution or payments

• Personalised financial advice or suitability

• Regulatory recommendations

• Use of real customer-identifiable production data

• Binding decisions or commitments based on simulation output

1. Expense Visibility

User Story

As a retail banking customer, I want to see my expenses grouped into clear categories, so that I understand where my money is being spent.

Acceptance Criteria

• Expenses are grouped into understandable categories (e.g., housing, groceries, education, healthcare, transport).

• Each category shows its relative contribution to total spending.

• The view reflects a typical monthly perspective for the selected period.

• No transaction-level detail is required for this POC.

2. Financial Flow Overview

User Story

As a customer, I want to see my income, expenses, and savings together, so that I can understand my overall financial flow.

Acceptance Criteria

• Income, expenses, and savings are shown together in a single view.

• Savings are derived transparently from income minus expenses.

• Values are shown in a consistent time unit for the selected period.

• The view is explanatory and does not provide advice.

3. Time-Based Trend Analysis

User Story

As a customer, I want to view my financial flow over different time horizons, so that I can understand trends over time rather than isolated figures.

Acceptance Criteria

• The customer can switch between 6 months, 1 year, 3 years, and 5 years.

• Shorter periods display month-wise trends.

• Longer periods display year-wise trends.

• All periods use consistent definitions for income, expenses, and savings.

4. Spending and Saving Momentum

User Story

As a customer, I want to understand whether my spending and saving patterns are improving or worsening over time.

Acceptance Criteria

• Trends indicate direction (increasing, decreasing, stable) using neutral language.

• The focus is on movement over time, not precision forecasting.

• No judgemental phrasing is used.

• No recommendations are provided.

5. Wealth Progression Awareness

User Story

As a customer, I want a simplified indication of my wealth progression, so that I can understand whether I am broadly moving forward financially.

Acceptance Criteria

• Wealth progression is shown as a relative trend rather than an exact prediction.

• The indicator is easy to interpret at a glance.

• It is clearly labelled as illustrative.

• It does not imply advice or guaranteed outcomes.

6. Financial Resilience

User Story

As a customer, I want to see an indication of my financial resilience, so that I understand my ability to cope with unexpected expenses or income disruption.

Acceptance Criteria

• Resilience is presented as a simple indicator or score.

• The indicator is calculated consistently for the selected period.

• A plain-language explanation is available for what “resilience” means.

• The indicator does not imply suitability or advice.

7. Liquidity Position

User Story

As a customer, I want to see an indication of my liquidity position, so that I understand how easily I can access funds in the short term.

Acceptance Criteria

• Liquidity is presented separately from resilience.

• The indicator reflects short-term accessibility (not long-term wealth).

• A plain-language explanation is available for what “liquidity” means.

• The indicator does not imply advice.

8. Insight Summary (Current-State, Non‑Advisory)

User Story

As a customer, I want a concise, plain-language summary of my current financial situation, so that I do not have to interpret raw data myself.

Acceptance Criteria

• The summary describes the current state only (no future scenario content).

• It uses non-technical and neutral language.

• It does not include recommendations or calls to action.

• It is clearly labelled as an insight summary, not financial advice.

9. Scenario Exploration (Optional)

User Story

As a customer, I want to explore high-level future scenarios, so that I can understand how my current trajectory compares with potential goals.

Acceptance Criteria

• The customer can enter a high-level scenario question (e.g., retirement age, discretionary spend).

• Scenario outputs clearly distinguish current state from simulated outcomes.

• Scenarios are assumption-based and clearly labelled as illustrative.

• Scenarios do not result in binding decisions or commitments.

10. Retirement Scenario

User Story

As a customer, I want to explore a retirement scenario, so that I can understand whether my current financial trajectory broadly supports retiring at a chosen age.

Acceptance Criteria

• The scenario output states key assumptions (e.g., inflation, income replacement).

• The output highlights any projected gap or shortfall.

• Results are explanatory rather than prescriptive.

• The output is clearly labelled as non-advisory and illustrative.

11. Discretionary Spending Scenario

User Story

As a customer, I want to explore discretionary spending scenarios, such as a holiday, so that I understand the potential impact on my finances.

Acceptance Criteria

• The scenario considers short-term affordability at a high level.

• The impact is explained relative to liquidity and resilience.

• No encouragement or discouragement is implied.

• The output is clearly labelled as illustrative.

12. Trust and Boundaries

User Story

As a customer, I want clarity on what the application does and does not do, so that I can trust its outputs.

Acceptance Criteria

• The application clearly states it does not provide financial advice.

• All simulations are marked as illustrative and assumption-based.

• The application continues to function even if simulations are unavailable.

• Key limitations are communicated in plain language.

13. Operational Continuity Without Optional Features

User Story

As a customer, I want the application to provide value even without optional simulation features, so that I am not dependent on advanced capabilities.

Acceptance Criteria

• Core financial views work without AI or simulation features.

• If simulations are unavailable, the application shows a clear explanation rather than an error.

• The user experience remains consistent and usable.

• No sensitive keys are required to access core features.

Compliance & Messaging Notes

• All insights and scenarios are explanatory and illustrative only.

• No personalised advice, product recommendations, or suitability statements are provided.

• Assumptions (e.g., inflation) must be stated explicitly when presenting scenario outputs.

• If AI is used, the system must avoid inventing numbers beyond provided facts and assumptions.
