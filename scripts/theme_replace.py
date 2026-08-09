import os
import re

src_dir = os.path.join(os.path.dirname(__file__), '..', 'src')

replacements = {
    r'bg-\[\#121212\]': 'bg-theme-card',
    r'bg-\[\#1A1A1A\]': 'bg-theme-surface',
    r'border-\[\#262626\]': 'border-theme-border',
    r'border-\[\#404040\]': 'border-theme-borderLight',
    r'hover:bg-\[\#1A1A1A\]': 'hover:bg-theme-surface',
    r'hover:bg-\[\#262626\]': 'hover:bg-theme-border',
    r'hover:border-\[\#404040\]': 'hover:border-theme-borderLight',
    r'text-\[\#FF0033\]': 'text-theme-primary',
    r'bg-\[\#FF0033\]': 'bg-theme-primary',
}

def walk_and_replace(directory):
    for root, _, files in os.walk(directory):
        for file in files:
            if file.endswith('.tsx') or file.endswith('.ts'):
                filepath = os.path.join(root, file)
                with open(filepath, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                original_content = content
                for pattern, replacement in replacements.items():
                    content = re.sub(pattern, replacement, content)
                
                # Special replacement for bg-black to bg-theme-bg
                # Exclude if it's bg-black/50 or something
                content = re.sub(r'bg-black(?!/)', 'bg-theme-bg', content)
                
                # Special replacement for text-white
                content = re.sub(r'text-white', 'text-theme-text', content)
                
                if content != original_content:
                    with open(filepath, 'w', encoding='utf-8') as f:
                        f.write(content)
                    print(f"Updated {filepath}")

walk_and_replace(src_dir)
print("Done replacing theme colors.")
