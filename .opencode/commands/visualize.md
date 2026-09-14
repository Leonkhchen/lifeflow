---
description: Generate the appropriate visual artifact for the current request
---

Analyze the user's visualization request and choose the appropriate project tool:

- architecture, workflow, deployment, sequence, ER → `visualize-diagram`
- UI, screen, layout, mockup → `visualize-ui`
- metrics, comparison, trend, percentages → `visualize-chart`

If the request contains "visualize first", "先視覺化", "先畫圖", or asks for review before implementation, do not modify production application code. Only generate or revise files under `artifacts/`.

Use a concise safe output name based on the request. If an artifact already exists, preserve it and create the next version.

After generation, report the artifact paths and briefly explain what was visualized.
