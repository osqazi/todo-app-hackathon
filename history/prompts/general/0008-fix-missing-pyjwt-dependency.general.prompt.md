---
id: 0008
title: Fix missing PyJWT dependency
stage: general
date: 2026-01-01
surface: agent
model: claude-sonnet-4-5-20250929
feature: none
branch: main
user: osqazi
command: (user reported deployment error)
labels: ["deployment", "render-com", "dependencies", "jwt", "pyjwt", "error-handling"]
links:
  spec: null
  ticket: null
  adr: null
  pr: null
files:
 - backend/requirements.txt
tests:
 - none
---

## Prompt

this error occured while deployment on render:
ModuleNotFoundError: No module named 'jwt'
==> Exited with status 1
==> Common ways to troubleshoot your deploy: https://render.com/docs/troubleshooting-deploys
Traceback (most recent call last):
  File "/usr/local/bin/uvicorn", line 8, in <module>
    sys.exit(main())
             ^^^^^^
  File "/usr/local/lib/python3.11/site-packages/click/core.py", line 1485, in __call__
    return self.main(*args, **kwargs)
  ^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "/usr/local/lib/python3.11/site-packages/click/core.py", line 1406, in main
    rv = self.invoke(ctx)
  ^^^^^^^^^^^^^^^^
  File "/usr/local/lib/python3.11/site-packages/click/core.py", line 1269, in invoke
    return ctx.invoke(self.callback, **ctx.params)
  ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "/usr/local/lib/python3.11/site-packages/click/core.py", line 824, in invoke
    return callback(*args, **kwargs)
  ^^^^^^^^^^^^^^^^^^^^^^^^^
  File "/usr/local/lib/python3.11/site-packages/uvicorn/main.py", line 424, in main
    run(
  File "/usr/local/lib/python3.11/site-packages/uvicorn/main.py", line 594, in run
    server.run()
  File "/usr/local/lib/python3.11/site-packages/uvicorn/server.py", line 67, in run
    return asyncio_run(self.serve(sockets=sockets), loop_factory=self.config.get_loop_factory())
  ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "/usr/local/lib/python3.11/site-packages/uvicorn/_compat.py", line 30, in asyncio_run
    return runner.run(main)
  ^^^^^^^^^^^^^^^^
  File "/usr/local/lib/python3.11/asyncio/runners.py", line 118, in run
    return self._loop.run_until_complete(task)
  ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "uvloop/loop.pyx", line 1518, in uvloop.loop.Loop.run_until_complete
  File "/usr/local/lib/python3.11/site-packages/uvicorn/server.py", line 71, in serve
    await self._serve(sockets)
  File "/usr/local/lib/python3.11/site-packages/uvicorn/server.py", line 78, in _serve
    config.load()
  File "/usr/local/lib/python3.11/site-packages/uvicorn/config.py", line 439, in load
    self.loaded_app = import_from_string(self.app)
  ^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "/usr/local/lib/python3.11/site-packages/uvicorn/importer.py", line 22, in import_from_string
    raise exc from None
  File "/usr/local/lib/python3.11/site-packages/uvicorn/importer.py", line 19, in import_from_string
    module = importlib.import_module(module_str)
  ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "/usr/local/lib/python3.11/importlib/__init__.py", line 126, in import_module
    return _bootstrap._gcd_import(name[level:], package, level)
  ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "<frozen importlib._bootstrap>", line 1204, in _gcd_import
  File "<frozen importlib._bootstrap>", line 1176, in _find_and_load
  File "<frozen importlib._bootstrap>", line 1147, in _find_and_load_unlocked
  File "<frozen importlib._bootstrap>", line 690, in _load_unlocked
  File "<frozen importlib._bootstrap_external>",

## Response snapshot

Identified that backend/src/auth/dependencies.py imports `jwt` directly and `PyJWKClient` from `jwt`, which requires PyJWT package. Added PyJWT>=2.8.0 to requirements.txt to resolve the ModuleNotFoundError during Render.com deployment.

## Outcome

- ✅ Impact: Fixed missing jwt module error that was preventing Render.com deployment from starting
- 🧪 Tests: none
- 📁 Files: Modified backend/requirements.txt to add PyJWT>=2.8.0
- 🔁 Next prompts: Push changes and redeploy to Render.com
- 🧠 Reflection: Different JWT libraries (python-jose vs PyJWT) provide different import paths; PyJWT provides 'jwt' module while python-jose uses 'jose'

## Evaluation notes (flywheel)

- Failure modes observed: Stack trace was incomplete (truncated) but had enough info to identify the missing module
- Graders run and results (PASS/FAIL): PASS
- Prompt variant (if applicable): none
- Next experiment (smallest change to try): Add dependency validation check in CI to catch missing modules before deployment
