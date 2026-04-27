#!/usr/bin/env python3

import argparse
import json
from dataclasses import dataclass, field
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


@dataclass
class Stats:
    created_directories: list[str] = field(default_factory=list)
    existing_directories: list[str] = field(default_factory=list)
    created_readmes: list[str] = field(default_factory=list)
    existing_readmes: list[str] = field(default_factory=list)
    skipped_nodes: list[str] = field(default_factory=list)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Cria uma estrutura declarativa de dataroom com READMEs por pasta."
    )
    parser.add_argument(
        "--structure-file",
        default="structure.json",
        help="Arquivo JSON com a estrutura declarativa. Padrao: structure.json",
    )
    parser.add_argument(
        "--target-dir",
        default=".",
        help="Diretorio base onde a raiz do dataroom sera criada. Padrao: diretorio atual",
    )
    parser.add_argument(
        "--report-file",
        default="",
        help="Caminho opcional para salvar o relatorio final em JSON.",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Mostra o que seria feito sem criar ou alterar arquivos.",
    )
    return parser.parse_args()


def load_structure(structure_file: Path) -> dict[str, Any]:
    with structure_file.open("r", encoding="utf-8") as handle:
        data = json.load(handle)
    if not isinstance(data, dict):
        raise ValueError("structure.json deve conter um objeto JSON na raiz.")
    return data


def validate_node(node: dict[str, Any], path_hint: str = "root") -> None:
    if not isinstance(node, dict):
        raise ValueError(f"No invalido em {path_hint}: esperado objeto JSON.")

    name = node.get("name")
    if not isinstance(name, str) or not name.strip():
        raise ValueError(f"No invalido em {path_hint}: campo 'name' obrigatorio.")
    if "/" in name or "\\" in name:
        raise ValueError(f"No invalido em {path_hint}: 'name' nao pode conter separadores de pasta.")

    children = node.get("children", [])
    if children is None:
        children = []
    if not isinstance(children, list):
        raise ValueError(f"No invalido em {path_hint}: 'children' deve ser uma lista.")

    seen_names: set[str] = set()
    for child in children:
        child_name = child.get("name") if isinstance(child, dict) else None
        if child_name in seen_names:
            raise ValueError(f"Nomes duplicados em {path_hint}: '{child_name}'.")
        if child_name is not None:
            seen_names.add(child_name)
        validate_node(child, f"{path_hint}/{child_name or '?'}")


def ensure_directory(path: Path, stats: Stats, dry_run: bool) -> None:
    if path.exists():
        stats.existing_directories.append(str(path))
        return
    stats.created_directories.append(str(path))
    if not dry_run:
        path.mkdir(parents=True, exist_ok=True)


def render_readme(node: dict[str, Any], current_path: Path, relative_path: Path) -> str:
    title = node.get("title") or node["name"].replace("-", " ").replace("_", " ").title()
    description = node.get("description") or "Sem descricao registrada."
    children = node.get("children", []) or []

    lines = [
        f"# {title}",
        "",
        f"- Pasta: `{current_path.name}`",
        f"- Caminho relativo: `{relative_path.as_posix()}`",
        "",
        description,
        "",
    ]

    if children:
        lines.append("## Subpastas")
        lines.append("")
        for child in children:
            child_title = child.get("title") or child["name"]
            child_description = child.get("description") or "Sem descricao registrada."
            lines.append(f"- `{child['name']}`: {child_title} — {child_description}")
        lines.append("")
    else:
        lines.append("## Subpastas")
        lines.append("")
        lines.append("- Nenhuma subpasta declarada.")
        lines.append("")

    lines.append("## Observacoes")
    lines.append("")
    lines.append("- Esta pasta foi criada a partir de `structure.json`.")
    lines.append("- Ajustes manuais de conteudo podem ser feitos sem alterar a hierarquia declarativa.")
    lines.append("")

    return "\n".join(lines)


def ensure_readme(
    path: Path,
    node: dict[str, Any],
    relative_path: Path,
    stats: Stats,
    dry_run: bool,
) -> None:
    readme_path = path / "README.md"
    if readme_path.exists():
        stats.existing_readmes.append(str(readme_path))
        return

    stats.created_readmes.append(str(readme_path))
    if not dry_run:
        readme_path.write_text(render_readme(node, path, relative_path), encoding="utf-8")


def build_tree(
    node: dict[str, Any],
    base_dir: Path,
    relative_parent: Path,
    stats: Stats,
    dry_run: bool,
) -> None:
    current_path = base_dir / node["name"]
    relative_path = relative_parent / node["name"]
    ensure_directory(current_path, stats, dry_run)
    ensure_readme(current_path, node, relative_path, stats, dry_run)

    for child in node.get("children", []) or []:
        build_tree(child, current_path, relative_path, stats, dry_run)


def make_report(structure_file: Path, target_dir: Path, dry_run: bool, stats: Stats) -> dict[str, Any]:
    root_name = target_dir.name
    return {
        "timestamp_utc": datetime.now(timezone.utc).isoformat(),
        "dry_run": dry_run,
        "structure_file": str(structure_file),
        "target_root": str(target_dir),
        "root_name": root_name,
        "summary": {
            "created_directories": len(stats.created_directories),
            "existing_directories": len(stats.existing_directories),
            "created_readmes": len(stats.created_readmes),
            "existing_readmes": len(stats.existing_readmes),
            "skipped_nodes": len(stats.skipped_nodes),
        },
        "details": {
            "created_directories": stats.created_directories,
            "existing_directories": stats.existing_directories,
            "created_readmes": stats.created_readmes,
            "existing_readmes": stats.existing_readmes,
            "skipped_nodes": stats.skipped_nodes,
        },
    }


def maybe_write_report(report_file: Path, report: dict[str, Any], dry_run: bool) -> None:
    if not report_file:
        return
    if dry_run:
        return
    report_file.parent.mkdir(parents=True, exist_ok=True)
    report_file.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")


def main() -> int:
    args = parse_args()
    script_dir = Path(__file__).resolve().parent

    structure_file_arg = Path(args.structure_file)
    if structure_file_arg.is_absolute():
        structure_file = structure_file_arg
    elif structure_file_arg.exists():
        structure_file = structure_file_arg.resolve()
    else:
        structure_file = (script_dir / structure_file_arg).resolve()
    target_dir = Path(args.target_dir).resolve()
    report_file = Path(args.report_file).resolve() if args.report_file else None

    structure = load_structure(structure_file)
    validate_node(structure)

    stats = Stats()
    build_tree(
        structure,
        target_dir.parent if target_dir.name == structure["name"] else target_dir,
        Path("."),
        stats,
        args.dry_run,
    )

    target_root = (
        target_dir
        if target_dir.name == structure["name"]
        else target_dir / structure["name"]
    )
    report = make_report(structure_file, target_root, args.dry_run, stats)
    maybe_write_report(report_file, report, args.dry_run)
    print(json.dumps(report, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
