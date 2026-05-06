import re

def process_file():
    with open('index.html', 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. HTML tag
    content = content.replace('<html lang="en">', '<html lang="en" class="dark" style="background-color: #020617; color: #f8fafc;">')

    # 2. Fonts
    content = content.replace('family=Inter:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;600', 'family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800;900')
    content = content.replace("'Inter', system-ui, sans-serif", "'Plus Jakarta Sans', sans-serif")

    # 3. Tailwind config
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
            'text-main': '#f8fafc',
            'text-muted': '#94a3b8',
            'bg-main': '#020617',
            'card': 'rgba(15, 23, 42, 0.6)',
            'border-col': 'rgba(255, 255, 255, 0.08)'
          },"""
    content = content.replace(tailwind_old, tailwind_new)

    # 4. Extract style block
    style_match = re.search(r'<style>(.*?)</style>', content, re.DOTALL)
    if style_match:
        style_css = style_match.group(1)
        
        # Color swaps
        style_css = style_css.replace('--home-ink: #101624;', '--home-ink: #f8fafc;')
        style_css = style_css.replace('--home-muted: #5d687a;', '--home-muted: #94a3b8;')
        style_css = style_css.replace('--home-paper: #f7fafc;', '--home-paper: rgba(15, 23, 42, 0.45);')
        style_css = style_css.replace('--home-line: #dce5ef;', '--home-line: rgba(255, 255, 255, 0.08);')
        style_css = style_css.replace('--home-blue: #0b63f6;', '--home-blue: #22c55e;')
        style_css = style_css.replace('--home-green: #14905f;', '--home-green: #10b981;')
        
        # Replace specific background layers
        style_css = style_css.replace('rgba(255,255,255,0.72)', 'rgba(255,255,255,0.03)')
        style_css = style_css.replace('linear-gradient(180deg, #f7fafc 0%, #eef5f1 48%, #fbf8f0 100%)', 'linear-gradient(180deg, #020617 0%, #0f172a 100%)')
        style_css = style_css.replace('rgba(255,255,255,0.9)', 'rgba(15, 23, 42, 0.6)')
        style_css = style_css.replace('rgba(255,255,255,0.98)', 'rgba(30, 41, 59, 0.8)')
        style_css = style_css.replace('rgba(255,255,255,0.96)', 'rgba(30, 41, 59, 0.8)')
        style_css = style_css.replace('rgba(255,255,255,0.94)', 'rgba(30, 41, 59, 0.7)')
        style_css = style_css.replace('rgba(255,255,255,0.92)', 'rgba(30, 41, 59, 0.6)')
        style_css = style_css.replace('rgba(255,255,255,0.86)', 'rgba(30, 41, 59, 0.5)')
        style_css = style_css.replace('rgba(255,255,255,0.76)', 'rgba(30, 41, 59, 0.4)')
        style_css = style_css.replace('rgba(255,255,255,0.74)', 'rgba(30, 41, 59, 0.4)')
        
        style_css = style_css.replace('#ffffff', '#0f172a')
        style_css = style_css.replace('#f8fafc', '#020617')
        style_css = style_css.replace('#f7fafc', '#020617')
        style_css = style_css.replace('#0066cc', '#22c55e') # Primary blue to brand green
        style_css = style_css.replace('rgba(0,102,204,', 'rgba(34,197,94,')
        style_css = style_css.replace('rgba(11,99,246,', 'rgba(34,197,94,')
        
        # Text colors
        style_css = style_css.replace('#30323a', '#f8fafc')
        style_css = style_css.replace('#7b8190', '#94a3b8')
        style_css = style_css.replace('#14201d', '#f8fafc')
        style_css = style_css.replace('#64748b', '#94a3b8')
        style_css = style_css.replace('#0f172a', '#f8fafc')

        # Borders
        style_css = style_css.replace('rgba(203,213,225,0.85)', 'rgba(255,255,255,0.08)')
        style_css = style_css.replace('rgba(203,213,225,0.9)', 'rgba(255,255,255,0.08)')
        style_css = style_css.replace('rgba(226,232,240,0.62)', 'rgba(255,255,255,0.05)')
        style_css = style_css.replace('rgba(220,229,239,0.96)', 'rgba(255,255,255,0.08)')
        style_css = style_css.replace('rgba(220,229,239,0.92)', 'rgba(255,255,255,0.08)')
        
        # Set background colors for sections
        style_css = style_css.replace('rgba(248,250,252,0.98)', 'rgba(2, 6, 23, 0.98)')
        style_css = style_css.replace('rgba(244,247,251,0.98)', 'rgba(15, 23, 42, 0.98)')
        style_css = style_css.replace('rgba(246,249,250,0.98)', 'rgba(15, 23, 42, 0.98)')
        style_css = style_css.replace('rgba(247,245,251,0.98)', 'rgba(15, 23, 42, 0.98)')
        style_css = style_css.replace('rgba(241,245,249,0.99)', 'rgba(2, 6, 23, 0.99)')
        
        # specific hardcoded light colors
        style_css = style_css.replace('#e9f4fb', 'rgba(34,197,94,0.15)') # badge bg
        style_css = style_css.replace('#6b8292', '#86efac') # badge text
        
        content = content[:style_match.start(1)] + style_css + content[style_match.end(1):]

    with open('index.html', 'w', encoding='utf-8') as f:
        f.write(content)

process_file()
