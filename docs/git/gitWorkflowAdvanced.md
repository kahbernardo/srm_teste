# Git Workflow Avançado

Demonstração de práticas de nível Especialista para gestão de versão e crise.

## Estratégia: GitHub Flow

Escolhemos **GitHub Flow** porque:

- Time pequeno com entregas contínuas
- Branch `main` sempre deployável
- PRs obrigatórios para revisão
- Menor overhead que Git Flow (sem branches release/hotfix permanentes)

Ver justificativa completa no [README](../../README.md#-git-workflow).

## Interactive Rebase

Antes de mergear uma feature branch, organizar commits:

```bash
git checkout feature/operator-dashboard
git rebase -i main
```

No editor interativo:

- `pick` — manter commit
- `squash` — combinar com anterior (ex: fixes de typo)
- `reword` — melhorar mensagem

Resultado: histórico linear e legível na `main`.

## Demonstração gravada: branch `demo/git-crisis-revert`

A branch `demo/git-crisis-revert` contém uma simulação real de crise:

1. Commit com bug intencional na fórmula de deságio (`BUG_DEMO`)
2. Commit de `git revert` desfazendo o bug com histórico auditável

Para inspecionar:

```bash
git fetch origin demo/git-crisis-revert
git log --oneline demo/git-crisis-revert -5
```

Commits na branch `demo/git-crisis-revert` (após push):

| SHA | Mensagem |
|-----|----------|
| `cf8c089` | `fix(pricing): bug demo desagio incorreto em compound pricing` |
| `4584449` | `Revert "fix(pricing): bug demo desagio incorreto em compound pricing"` |

## Simulação de Gestão de Crise

### Cenário: Bug crítico em produção

1. **Bug introduzido na main** (ex: cálculo de deságio incorreto)
2. **Detectado em produção** — transações com valores errados
3. **Rollback seguro com revert**:

```bash
git log --oneline -5
git revert <sha-do-commit-bugado> --no-edit
git push origin main
```

O `git revert` cria um novo commit que desfaz as alterações, preservando histórico (auditoria).

### Hotfix via Cherry-pick

Quando o fix já existe em outra branch:

```bash
git checkout main
git cherry-pick <sha-do-fix>
git push origin main
```

### Branch protection (recomendado)

- Require PR reviews
- Require status checks (CI)
- No direct push to main

## Tags Semânticas

| Tag | Significado |
|-----|-------------|
| v1.0.0 | MVP completo (backend + frontend + docs) |
| v1.1.0 | Nova feature (minor) |
| v1.0.1 | Bugfix (patch) |

Convenção: [Semantic Versioning](https://semver.org/)
