# Agentic SDLC and Spec-Driven Development

Kiro-style Spec-Driven Development on an agentic SDLC

## このリポジトリについて

本リポジトリ（`PrimeBrains/moira`）は **Moira**（仕様駆動 × チケット駆動 × EVM 管理基盤）の専用リポである。
正典は [`moira/MODEL.md`](moira/MODEL.md) ほか（詳細は [`moira/README.md`](moira/README.md) を参照）。

- **正典・確定文書の更新はゲート経由**で行う。どのゲート（`moira-model-update` / `doc-refine` /
  `kiro-scenario` / `kiro-scenario-flow` / `kiro-scenario-e2e` / `decision-conformance` 等）を
  使うかの対応関係は [`.kiro/steering/moira-model.md`](.kiro/steering/moira-model.md) が所有する。
- **変更管理フロー**（issue 受付 → 影響調査 → ルーティング → 既存ゲート起動 → 同期閉包確認 → クローズ）は
  [`.kiro/steering/moira-change-management.md`](.kiro/steering/moira-change-management.md)（規範）と
  skill `moira-change`（振り付け）が所有する。
- `.kiro/specs/` の requirements/design/tasks（R/D/T）は**使い捨て**の再生成物であり正典を持たない
  （sdd-workshop#40 裁定。詳細は [`.kiro/steering/moira-verification.md`](.kiro/steering/moira-verification.md)
  「R/D/T は使い捨ての再生成物」節）。旧 spec アーカイブ（`moira-*`）は移管対象外とし、旧リポ
  （`PrimeBrains/sdd-workshop`）側に残置している。

## Project Context

### Paths
- Steering: `.kiro/steering/`
- Specs: `.kiro/specs/`

### Steering vs Specification

**Steering** (`.kiro/steering/`) - Guide AI with project-wide rules and context
**Specs** (`.kiro/specs/`) - Formalize development process for individual features

### Active Specifications
- Check `.kiro/specs/` for active specifications
- Use `/kiro-spec-status [feature-name]` to check progress

## Development Guidelines
- Think in English, generate responses in Japanese. All Markdown content written to project files (e.g., requirements.md, design.md, tasks.md, research.md, validation reports) MUST be written in the target language configured for this specification (see spec.json.language).

## Minimal Workflow
- Phase 0 (optional): `/kiro-steering`, `/kiro-steering-custom`
- Discovery: `/kiro-discovery "idea"` — determines action path, writes brief.md + roadmap.md for multi-spec projects
- Phase 1 (Specification):
  - Single spec: `/kiro-spec-quick {feature} [--auto]` or step by step:
    - `/kiro-spec-init "description"`
    - `/kiro-spec-requirements {feature}`
    - `/kiro-validate-gap {feature}` (optional: for existing codebase)
    - `/kiro-spec-design {feature} [-y]`
    - `/kiro-validate-design {feature}` (optional: design review)
    - `/kiro-spec-tasks {feature} [-y]`
  - Multi-spec: `/kiro-spec-batch` — creates all specs from roadmap.md in parallel by dependency wave
- Phase 2 (Implementation): `/kiro-impl {feature} [tasks]`
  - Without task numbers: autonomous mode (subagent per task + independent review + final validation)
  - With task numbers: manual mode (selected tasks in main context, still reviewer-gated before completion)
  - `/kiro-validate-impl {feature}` (standalone re-validation)
- Progress check: `/kiro-spec-status {feature}` (use anytime)

## Skills Structure
Skills are located in `.claude/skills/kiro-*/SKILL.md`
- Each skill is a directory with a `SKILL.md` file
- `metadata.origin` in SKILL.md frontmatter is the canonical classifier: `"cc-sdd"` (framework-standard) vs `"custom"` (project-original). New custom skills MUST set `origin: "custom"`. Keep SKILL.ja.md frontmatter in sync
- Skills run inline with access to conversation context
- Skills may delegate parallel research to subagents for efficiency
- Additional files (templates, examples) can be added to skill directories
- `kiro-review` — task-local adversarial review protocol used by reviewer subagents
- `kiro-debug` — root-cause-first debug protocol used by debugger subagents
- `kiro-verify-completion` — fresh-evidence gate before success or completion claims
- **If there is even a 1% chance a skill applies to the current task, invoke it.** Do not skip skills because the task seems simple.

## Development Rules
- 3-phase approval workflow: Requirements → Design → Tasks → Implementation
- Human review required each phase; use `-y` only for intentional fast-track
- Keep steering current and verify alignment with `/kiro-spec-status`
- Follow the user's instructions precisely, and within that scope act autonomously: gather the necessary context and complete the requested work end-to-end in this run, asking questions only when essential information is missing or the instructions are critically ambiguous.

## Steering Configuration
- Load entire `.kiro/steering/` as project memory
- Default files: `product.md`, `tech.md`, `structure.md`
- Custom files are supported (managed via `/kiro-steering-custom`)
