import os
import re

src_dir = os.path.join(os.path.dirname(__file__), '..', 'src', 'components')

replacements = {
    # Grays to theme text
    r'text-gray-200': 'text-theme-text',
    r'text-gray-300': 'text-theme-text',
    r'text-gray-400': 'text-theme-textMuted',
    r'text-gray-500': 'text-theme-textMuted',
    
    # Specific colors to theme primary
    r'text-indigo-400': 'text-theme-primary',
    r'text-blue-500': 'text-theme-primary',
    r'text-amber-400': 'text-theme-primary',
    r'text-yellow-500': 'text-theme-primary',
    
    # Active states
    r"'bg-white text-black border-white shadow'": "'bg-theme-primary text-white border-theme-primary shadow'",
    
    # The green sample sentences text
    r'text-emerald-400': 'text-theme-primary',
    r'text-green-400': 'text-theme-primary',
}

def walk_and_replace(directory):
    for root, _, files in os.walk(directory):
        for file in files:
            if file.endswith('.tsx'):
                filepath = os.path.join(root, file)
                with open(filepath, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                original_content = content
                for pattern, replacement in replacements.items():
                    content = re.sub(pattern, replacement, content)
                
                if content != original_content:
                    with open(filepath, 'w', encoding='utf-8') as f:
                        f.write(content)
                    print(f"Updated {filepath}")

walk_and_replace(src_dir)
print("Done replacing text colors.")
