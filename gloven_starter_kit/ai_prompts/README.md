# Gloven AI Growth Prompts — Production System

**Version:** 2025-11-09  
**Purpose:** Production-grade LLM prompts for growth, marketing, and venture operations.

## 🎯 Quick Start

1. **Copy the System Prompt** → Paste [`growth_os_system_prompt.md`](growth_os_system_prompt.md) into your LLM's System/Developer message field
2. **Choose a Task** → Select from [`task_prompts/`](task_prompts/) directory
3. **Run** → Paste task as User message; receive structured output
4. **Automate** → Use JSON schemas from [`output_contracts/`](output_contracts/) for CRM/tool integration

## 📁 Directory Structure

```
ai_prompts/
├── README.md (this file)
├── growth_os_system_prompt.md (master brain — always-on)
├── task_prompts/ (8 proven task templates)
│   ├── a_founder_acquisition_30_60_90.md
│   ├── b_content_editorial_calendar.md
│   ├── c_partner_mentor_sourcing.md
│   ├── d_application_scoring.md
│   ├── e_landing_page_copy.md
│   ├── f_pr_launch_kit.md
│   ├── g_demo_day_investor_targeting.md
│   └── h_growth_experiments.md
├── output_contracts/ (JSON schemas)
│   ├── outreach_email_schema.json
│   ├── application_score_schema.json
│   └── growth_plan_template.md
├── micro_prompts.md (one-liners for speed)
├── example_usage.md (copy/paste examples)
└── policy_addons.md (optional: citations, no-leak, region modes)
```

## 🚀 Supported LLMs

- ChatGPT (GPT-4, GPT-4 Turbo)
- Claude (3.5 Sonnet, 3 Opus)
- Gemini (1.5 Pro)
- Any instruction-following LLM with System/User message support

## 🎨 Use Cases

| Task | File | Output | Time |
|------|------|--------|------|
| 30/60/90 Growth Plan | [`a_founder_acquisition_30_60_90.md`](task_prompts/a_founder_acquisition_30_60_90.md) | Markdown plan | 2-3 min |
| 6-Week Content Calendar | [`b_content_editorial_calendar.md`](task_prompts/b_content_editorial_calendar.md) | Table + drafts | 2-3 min |
| Mentor/Partner Lists | [`c_partner_mentor_sourcing.md`](task_prompts/c_partner_mentor_sourcing.md) | CSV + emails | 1-2 min |
| Application Review | [`d_application_scoring.md`](task_prompts/d_application_scoring.md) | JSON score | 30 sec |
| Landing Page Copy | [`e_landing_page_copy.md`](task_prompts/e_landing_page_copy.md) | Markdown | 1-2 min |
| Press Kit | [`f_pr_launch_kit.md`](task_prompts/f_pr_launch_kit.md) | Release + list | 2-3 min |
| Investor Outreach | [`g_demo_day_investor_targeting.md`](task_prompts/g_demo_day_investor_targeting.md) | Table + emails | 2-3 min |
| Growth Experiments | [`h_growth_experiments.md`](task_prompts/h_growth_experiments.md) | ICE-scored table | 1-2 min |

## 💡 Pro Tips

- **Always** use Growth OS as System prompt for consistency
- **Fill brackets** in task prompts with your specifics (regions, dates, budget)
- **Request JSON** when integrating with automation
- **Use micro-prompts** for quick iterations (see [`micro_prompts.md`](micro_prompts.md))
- **Version outputs** by appending date to filenames

## 🔒 Safety & Brand Compliance

- No legal/financial/medical advice (disclaimers included)
- Privacy-safe (no PII generation)
- DEI-aligned language
- On-brand tone: warm, clear, evidence-driven
- Self-audits built into each prompt (quality checklist)

## 🔧 Customization

Edit these sections in `growth_os_system_prompt.md`:
- `BRAND SNAPSHOT` → Update colors, tagline, values
- `AUDIENCE & VOICE` → Adjust tone preferences
- `WHAT YOU DO` → Re-prioritize tasks
- Add `POLICY ADDONS` from [`policy_addons.md`](policy_addons.md) as needed

## 📊 Output Formats

All tasks produce **skimmable**, **actionable** outputs:
- Markdown tables (easy to copy to Notion/Airtable)
- JSON (for automation/CRM)
- CSV (for spreadsheets)
- Plain text (for email)

## 🤝 Integration Examples

**Airtable**: Use JSON schemas → Zapier/Make.com → Auto-populate records  
**Slack**: Micro-prompts via slash command → Post drafts to #growth  
**Google Sheets**: CSV outputs → Import → Track experiments  
**Email tools**: JSON email schema → Merge fields → Send campaigns

## 📞 Support

Questions? Edit prompts, test outputs, iterate. These are templates — adapt to your needs.

---

**Next:** Open [`growth_os_system_prompt.md`](growth_os_system_prompt.md) and paste it into your LLM's System field.