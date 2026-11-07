"""Verificações estáticas locais: segredos, código perigoso e dependências.

Ferramenta complementar, NÃO substitui scanners especializados ou revisão humana.
"""
import ast
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CANDIDATE_SUFFIXES = {".py", ".js", ".html", ".css", ".sql", ".md", ".yml", ".yaml", ".json", ".txt"}
RUNTIME_DEPENDENCIES = ROOT / "requirements.txt"
KNOWN_EXTERNAL_IMPORTS = set()
# Prefixos fragmentados para não sinalizar o próprio scanner como uma credencial.
SENSITIVE_PREFIXES = ("gh" + "p_", "gh" + "o_", "sk" + "-", "glpat" + "-")
ASSIGNMENT = re.compile(
    r"(?im)^\\s*(?:password|api[_-]?key|access[_-]?token|client[_-]?secret)\\s*[:=]\\s*['\\\"]?([A-Za-z0-9_./+=\\-]{16,})"
)
PRIVATE_KEY = "BEGIN " + "PRIVATE KEY"
ALLOWED_IMPORTS = {
    "__future__", "argparse", "ast", "contextlib", "datetime", "json", "os",
    "pathlib", "re", "sqlite3", "subprocess", "sys", "unittest", "urllib",
    "zoneinfo", "typing", "collections", "hashlib", "math", "statistics",
}
INTERNAL_IMPORTS = {"build_data", "novos_cases", "test_portfolio", "security_checks"}


def tracked_paths():
    try:
        proc = subprocess.run(
            ["git", "ls-files", "-z"], cwd=ROOT, check=True,
            capture_output=True, text=True,
        )
        return [
            ROOT / path for path in proc.stdout.split("\\x00")
            if path and Path(path).suffix.lower() in CANDIDATE_SUFFIXES
        ]
    except (OSError, subprocess.CalledProcessError):
        # Usável localmente até antes do primeiro commit.
        return [
            path for path in ROOT.rglob("*") if path.is_file()
            and ".git" not in path.parts and path.suffix.lower() in CANDIDATE_SUFFIXES
        ]


def validate():
    errors = []
    if RUNTIME_DEPENDENCIES.exists():
        lines = [
            line.strip() for line in RUNTIME_DEPENDENCIES.read_text(encoding="utf-8").splitlines()
            if line.strip() and not line.lstrip().startswith("#")
        ]
        if lines:
            errors.append("Dependências externas declaradas exigem auditoria antes do merge: "
                          + ", ".join(lines))

    for file in tracked_paths():
        # Ignorar conteúdo de assets gerados; verificar apenas arquivos-fonte textuais.
        content = file.read_text(encoding="utf-8")
        if PRIVATE_KEY in content:
            errors.append(f"{file.relative_to(ROOT)}: possível chave privada em texto.")
        if any(prefix in content for prefix in SENSITIVE_PREFIXES):
            errors.append(f"{file.relative_to(ROOT)}: possível credencial hardcoded.")
        if ASSIGNMENT.search(content):
            errors.append(f"{file.relative_to(ROOT)}: possível segredo atribuído em claro.")
        if file.suffix != ".py":
            continue
        try:
            tree = ast.parse(content, filename=str(file))
        except SyntaxError:
            errors.append(f"{file.relative_to(ROOT)}: erro de sintaxe Python.")
            continue
        for node in ast.walk(tree):
            if isinstance(node, ast.Import):
                imports = [alias.name.split(".")[0] for alias in node.names]
            elif isinstance(node, ast.ImportFrom):
                imports = [(node.module or "").split(".")[0]]
            else:
                imports = []
            for name in imports:
                if name not in ALLOWED_IMPORTS | INTERNAL_IMPORTS:
                    errors.append(f"{file.relative_to(ROOT)}: import externo/não aprovado: {name}")
            if isinstance(node, ast.Call) and isinstance(node.func, ast.Name):
                if node.func.id in {"eval", "exec"}:
                    errors.append(f"{file.relative_to(ROOT)}: execução dinâmica não permitida: {node.func.id}")

    if errors:
        raise SystemExit("\\n".join(errors))
    print("Verificação estática concluída: nenhuma dependência externa de runtime; "
          "nenhuma credencial óbvia ou import não aprovado detectado.")


if __name__ == "__main__":
    validate()
