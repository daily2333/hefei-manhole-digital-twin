#!/usr/bin/env python3
"""Generate browser viewing URLs for all .drawio files in the diagrams directory."""

import base64
import glob
import os
import sys
import urllib.parse
import zlib


def encode(xml: str) -> str:
    """Encode XML to diagrams.net viewer URL."""
    c = zlib.compressobj(9, zlib.DEFLATED, -zlib.MAX_WBITS)
    compressed = c.compress(xml.encode("utf-8")) + c.flush()
    encoded = base64.b64encode(compressed).decode("utf-8").replace("\n", "")
    return (
        "https://viewer.diagrams.net/?tags=%7B%7D&lightbox=1&edit=_blank#R"
        + urllib.parse.quote(encoded, safe="")
    )


def main():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    drawio_files = sorted(glob.glob(os.path.join(script_dir, "*.drawio")))
    
    if not drawio_files:
        print("No .drawio files found in", script_dir)
        return 1
    
    print("=" * 60)
    print("Browser Viewing URLs for Draw.io Diagrams")
    print("=" * 60)
    print()
    print("Open these URLs in your browser to view/edit diagrams.")
    print("No installation required - works entirely client-side.")
    print()
    
    # Create output file
    output_file = os.path.join(script_dir, "browser-urls.md")
    with open(output_file, "w", encoding="utf-8") as f:
        f.write("# Browser Viewing URLs for Draw.io Diagrams\n\n")
        f.write("Open these URLs in your browser to view/edit diagrams.\n")
        f.write("No installation required - works entirely client-side.\n\n")
        
        for i, filepath in enumerate(drawio_files, 1):
            filename = os.path.basename(filepath)
            name = os.path.splitext(filename)[0]
            
            with open(filepath, "r", encoding="utf-8") as df:
                xml_content = df.read()
            
            url = encode(xml_content)
            
            print(f"[{i:02d}] {filename}")
            print(f"     URL: {url[:80]}...")
            print()
            
            f.write(f"## {i:02d}. {name}\n\n")
            f.write(f"**File:** `{filename}`\n\n")
            f.write(f"**URL:** [{name}]({url})\n\n")
            f.write("---\n\n")
    
    print("=" * 60)
    print(f"URLs saved to: {output_file}")
    print("=" * 60)
    
    return 0


if __name__ == "__main__":
    sys.exit(main())
