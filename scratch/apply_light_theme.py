import re

def process_file():
    with open('index.html', 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Fonts
    content = content.replace('family=Inter:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;600', 'family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800;900')
    content = content.replace("'Inter', system-ui, sans-serif", "'Plus Jakarta Sans', sans-serif")

    # 2. Tailwind config (light theme, green accents)
    tailwind_old = """          colors: {
            primary: '#0066cc',
            accent: '#138808',
            warning: '#ff9933',
            'text-main': '#0f172a',
            'text-muted': '#64748b',
            'bg-main': '#f8fafc',
            'card': '#ffffff',
            'border-col': '#e2e8f0'
          },"""
    tailwind_new = """          colors: {
            primary: '#22c55e',
            accent: '#10b981',
            warning: '#f59e0b',
            'text-main': '#0f172a',
            'text-muted': '#64748b',
            'bg-main': '#f8fafc',
            'card': '#ffffff',
            'border-col': '#e2e8f0'
          },"""
    content = content.replace(tailwind_old, tailwind_new)

    # 3. Extract style block to change blue to green
    style_match = re.search(r'<style>(.*?)</style>', content, re.DOTALL)
    if style_match:
        style_css = style_match.group(1)
        
        # Color swaps (Blue to Green)
        style_css = style_css.replace('--home-blue: #0b63f6;', '--home-blue: #22c55e;')
        style_css = style_css.replace('--home-green: #14905f;', '--home-green: #10b981;')
        
        style_css = style_css.replace('#0066cc', '#22c55e') # Primary blue to brand green
        style_css = style_css.replace('rgba(0,102,204,', 'rgba(34,197,94,')
        style_css = style_css.replace('rgba(11,99,246,', 'rgba(34,197,94,')
        
        # update kicker and specific blues to green
        style_css = style_css.replace('#0b63f6', '#22c55e')
        style_css = style_css.replace('rgba(11,99,246,0.38)', 'rgba(34,197,94,0.38)')
        
        content = content[:style_match.start(1)] + style_css + content[style_match.end(1):]

    with open('index.html', 'w', encoding='utf-8') as f:
        f.write(content)

process_file()
