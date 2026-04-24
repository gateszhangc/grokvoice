#!/usr/bin/env python3

from __future__ import annotations

import argparse
import re
from pathlib import Path


def update_new_tag(path: Path, image_name: str, new_tag: str) -> None:
    lines = path.read_text().splitlines()
    rendered: list[str] = []
    in_images = False
    matched_name = False
    updated = False

    for line in lines:
        stripped = line.strip()
        if stripped == "images:":
            in_images = True
        elif in_images and stripped and not line.startswith((" ", "\t", "-")):
            in_images = False

        if in_images and re.match(r"^\s*-\s+name:\s*", line):
            current = re.sub(r"^\s*-\s+name:\s*", "", line).strip()
            matched_name = current == image_name
        elif in_images and matched_name and stripped.startswith("newTag:"):
            indent = line[: len(line) - len(line.lstrip())]
            rendered.append(f"{indent}newTag: {new_tag}")
            updated = True
            matched_name = False
            continue

        rendered.append(line)

    if not updated:
        raise SystemExit(f"Could not find a newTag entry for image '{image_name}' in {path}")

    path.write_text("\n".join(rendered) + "\n")


def main() -> None:
    parser = argparse.ArgumentParser(description="Update kustomization images[].newTag for a named image.")
    parser.add_argument("--file", required=True, type=Path)
    parser.add_argument("--image", required=True)
    parser.add_argument("--new-tag", required=True)
    args = parser.parse_args()

    update_new_tag(args.file, args.image, args.new_tag)


if __name__ == "__main__":
    main()
