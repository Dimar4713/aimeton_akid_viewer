# AGENTS.md — AIMETON AKID Viewer

## Scope

Эти правила обязательны для всего `aimeton_akid_viewer`. Более узкий `AGENTS.md` MAY усиливать, но не ослаблять их.

Каноническое AIMETON-wide governance-ядро: `Dimar4713/aimeton-architecture/AGENTS.md`.

## Repository mission

AKID Viewer — автономный offline-first инженерный viewer для локальных рабочих XLSX/CSV. Критические инварианты: отсутствие сетевой зависимости runtime, защита локальных рабочих/персональных данных, воспроизводимые portable Windows releases и отдельная честная поддержка Windows 7 legacy.

## Before work

1. Прочитать `README.md`, `docs/README.md`, user/legacy/release docs, workflow сборки, активные Issues/PR/CI и exact current SHA.
2. При межрепозиторной работе до первой mutation прочитать root `AGENTS.md` всех затрагиваемых AIMETON-репозиториев.
3. Для normative AIMETON решений читать `aimeton-architecture`; для runner/release infrastructure reality — `aimeton-infrastructure`.
4. Не считать современную Windows-сборку доказательством Windows 7 compatibility и наоборот.

## 3×3 Reality Check

Перед blocker, root-cause, offline/privacy claim, compatibility/release conclusion, security decision или consequential write первое объяснение считается гипотезой.

Проверить architecture/lifecycle, alternatives/control paths, history/live; source/contract, runtime/live, independent evidence; выполнить falsification attempt.

`работает без Интернета`, `Windows 7 поддержан`, `release готов`, `нет доступа`, `единственный путь` без этого gate являются provisional claims.

## GitHub / execution fallback

До просьбы о ручном действии владельца проверить:

`GitHub connector/API → AIMETON GitHub MCP/router → REST/GraphQL/gh через trusted AIMETON server → owner`.

Ограничение одного runner/token/workflow не является ограничением AIMETON как системы. Secret values и реальные рабочие файлы не публикуются.

## Continuous Mission / Motor State

```text
READ → DECIDE → ACTION → READ-BACK → EVIDENCE → NEXT SAFE ACTION
```

После каждого material action проверить фактический результат и выполнить следующий безопасный шаг при отсутствии objective authority blocker. Отсутствие нового сообщения владельца не является blocker.

Держать очередь current → next → following. Перед завершением tool-сессии обязательны MOTOR-CHECK и STOP-CHECK. GREEN build/CI, созданный Release или один успешный запуск не завершают release/compatibility mission без нужного read-back.

## Offline / data safety invariants

1. Runtime должен оставаться автономным и не зависеть от внешнего backend/CDN/network services.
2. Рабочие XLSX/CSV не коммитятся и не отправляются наружу; fixtures должны быть synthetic/sanitized.
3. Пути последних файлов и настройки хранятся локально; приложение не должно копировать рабочие файлы без явного действия пользователя.
4. Renderer сохраняет `contextIsolation`, `sandbox`, `webSecurity`; Node integration не включается ради удобства.
5. File access выполняется через узкий preload/IPC contract; расширение IPC surface требует security evidence.
6. Автозагрузка отсутствующего/перемещённого файла должна деградировать безопасно, без падения и без поиска по произвольной файловой системе.

## Windows / release truth gate

- Основная Windows 10/11 и Windows 7 Legacy сборки являются разными compatibility lanes.
- Windows 7 build использует legacy Electron и требует отдельного acceptance на реальной/репрезентативной Windows 7 среде; современный CI не заменяет этот evidence.
- Version/tag/generated EXE/user guide/unblock helper должны соответствовать release contract и быть проверены read-back после публикации.
- Не ослаблять SmartScreen/system security глобально; helper может только безопасно снимать zone marker в заявленной области.

## Cross-repository source-of-truth

Runner/release infrastructure state принадлежит `aimeton-infrastructure`. Generated projections MUST pin canonical repository, exact source SHA, source path, immutable blob/object id и/или digest; drift проверяется fail-closed.

## Authority boundary

Без owner authorization запрещены новые сетевые/платные зависимости, необратимые user-data operations, ослабление sandbox/security, изменение legal/license/release boundary и публикация private/internal рабочих данных.

## Definition of Done

Применимые пункты обязательны:

- source/build/tests updated;
- offline behavior verified;
- sensitive/local data boundary checked;
- Windows 10/11 and Windows 7 claims verified separately when affected;
- release assets/version read-back completed when releasing;
- docs synchronized;
- next safe action выполнен либо exact blocker зафиксирован;
- strong conclusions прошли 3×3.
