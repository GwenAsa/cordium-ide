"""Cordium Python intelligence server (Jedi). Talks JSON lines over stdin/stdout."""
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)

import jedi  # noqa: E402

EXTRA = os.path.join(HERE, "extra")
_projects = {}


def project_for(root):
    if root not in _projects:
        venv = os.path.join(root, ".venv")
        env = None
        if os.path.isdir(venv):
            try:
                env = jedi.create_environment(venv, safe=False)
            except Exception:
                env = None
        kwargs = {"added_sys_path": [EXTRA, root]}
        if env is not None:
            kwargs["environment"] = env
        _projects[root] = jedi.Project(root, **kwargs)
    return _projects[root]


def handle(req):
    root = req.get("root") or os.getcwd()
    script = jedi.Script(req["code"], path=req.get("path") or None, project=project_for(root))
    line, col = req["line"], req["col"]
    op = req["op"]
    if op == "complete":
        out = []
        for c in script.complete(line, col)[:250]:
            out.append({"name": c.name, "type": c.type, "desc": c.description})
        return out
    if op == "hover":
        names = script.help(line, col)
        if not names:
            return None
        n = names[0]
        sigs = n.get_signatures()
        head = sigs[0].to_string() if sigs else (n.full_name or n.name)
        return {"head": head, "doc": (n.docstring(raw=True) or "")[:1500]}
    if op == "ping":
        return "pong"
    return None


def main():
    for raw in sys.stdin:
        raw = raw.strip()
        if not raw:
            continue
        try:
            req = json.loads(raw)
            res = {"id": req.get("id"), "ok": True, "result": handle(req)}
        except Exception as e:  # keep the server alive no matter what
            res = {"id": None, "ok": False, "error": type(e).__name__ + ": " + str(e)}
            try:
                res["id"] = json.loads(raw).get("id")
            except Exception:
                pass
        sys.stdout.write(json.dumps(res) + "\n")
        sys.stdout.flush()


if __name__ == "__main__":
    main()
