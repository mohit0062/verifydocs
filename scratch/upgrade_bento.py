with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Update card classes to be rounder and have better hover
content = content.replace('class="block bg-white rounded-2xl border border-border-col p-8 shadow-sm hover:shadow-[0_20px_50px_-12px_rgba(34,197,94,0.25)] hover:-translate-y-1 hover:border-primary transition-all duration-300"',
                          'class="block bg-white rounded-3xl border border-slate-200/80 p-8 shadow-sm hover:shadow-[0_30px_60px_-15px_rgba(34,197,94,0.25)] hover:-translate-y-2 hover:border-green-400 transition-all duration-500 relative overflow-hidden group"')

content = content.replace('class="block bg-white rounded-2xl border border-border-col p-8 shadow-sm hover:shadow-[0_20px_50px_-12px_rgba(59,130,246,0.25)] hover:-translate-y-1 hover:border-blue-500 transition-all duration-300"',
                          'class="block bg-white rounded-3xl border border-slate-200/80 p-8 shadow-sm hover:shadow-[0_30px_60px_-15px_rgba(59,130,246,0.25)] hover:-translate-y-2 hover:border-blue-400 transition-all duration-500 relative overflow-hidden group"')

content = content.replace('class="block bg-white rounded-2xl border border-border-col p-8 shadow-sm hover:shadow-[0_20px_50px_-12px_rgba(249,115,22,0.25)] hover:-translate-y-1 hover:border-orange-500 transition-all duration-300"',
                          'class="block bg-white rounded-3xl border border-slate-200/80 p-8 shadow-sm hover:shadow-[0_30px_60px_-15px_rgba(249,115,22,0.25)] hover:-translate-y-2 hover:border-orange-400 transition-all duration-500 relative overflow-hidden group"')

content = content.replace('class="block bg-white rounded-2xl border border-border-col p-8 shadow-sm hover:shadow-[0_20px_50px_-12px_rgba(139,92,246,0.25)] hover:-translate-y-1 hover:border-purple-500 transition-all duration-300 relative overflow-hidden"',
                          'class="block bg-white rounded-3xl border border-slate-200/80 p-8 shadow-sm hover:shadow-[0_30px_60px_-15px_rgba(139,92,246,0.25)] hover:-translate-y-2 hover:border-purple-400 transition-all duration-500 relative overflow-hidden group"')

content = content.replace('class="block bg-white rounded-2xl border border-border-col p-8 shadow-sm hover:shadow-[0_20px_50px_-12px_rgba(236,72,153,0.25)] hover:-translate-y-1 hover:border-pink-500 transition-all duration-300 relative overflow-hidden"',
                          'class="block bg-white rounded-3xl border border-slate-200/80 p-8 shadow-sm hover:shadow-[0_30px_60px_-15px_rgba(236,72,153,0.25)] hover:-translate-y-2 hover:border-pink-400 transition-all duration-500 relative overflow-hidden group"')

# Add glow divs
content = content.replace('       <div class="bg-green-50 w-20 h-20 rounded-2xl flex items-center justify-center mb-6">',
                          '       <div class="absolute top-0 right-0 w-64 h-64 bg-green-400/10 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none transform translate-x-1/4 -translate-y-1/4 z-0"></div>\n       <div class="bg-green-50 w-20 h-20 rounded-2xl flex items-center justify-center mb-6 relative z-10 border border-green-100">')

content = content.replace('       <div class="bg-blue-50 w-20 h-20 rounded-2xl flex items-center justify-center mb-6">',
                          '       <div class="absolute top-0 right-0 w-64 h-64 bg-blue-400/10 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none transform translate-x-1/4 -translate-y-1/4 z-0"></div>\n       <div class="bg-blue-50 w-20 h-20 rounded-2xl flex items-center justify-center mb-6 relative z-10 border border-blue-100">')

content = content.replace('       <div class="bg-orange-50 w-20 h-20 rounded-2xl flex items-center justify-center mb-6">',
                          '       <div class="absolute top-0 right-0 w-64 h-64 bg-orange-400/10 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none transform translate-x-1/4 -translate-y-1/4 z-0"></div>\n       <div class="bg-orange-50 w-20 h-20 rounded-2xl flex items-center justify-center mb-6 relative z-10 border border-orange-100">')

content = content.replace('       <div class="flex gap-4 mb-6">',
                          '       <div class="absolute top-0 right-0 w-64 h-64 bg-purple-400/10 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none transform translate-x-1/4 -translate-y-1/4 z-0"></div>\n       <div class="flex gap-4 mb-6 relative z-10">')
                          
# Need to make titles relative z-10
content = content.replace('<h3 class="text-xl font-extrabold text-text-main mb-2">', '<h3 class="text-xl font-extrabold text-text-main mb-2 relative z-10">')
content = content.replace('<p class="text-sm font-semibold text-text-muted">', '<p class="text-sm font-semibold text-text-muted relative z-10">')

# Enhance bottom banner (Zero Server) in the primary panel
content = content.replace('<div class="mt-3 rounded-lg px-4 py-3 text-sm font-extrabold text-slate-100 flex items-center justify-between" style="background:linear-gradient(135deg,#0b1220,#0f1e36);box-shadow:inset 0 1px 0 rgba(255,255,255,0.07);">',
                          '<div class="mt-3 rounded-xl px-5 py-4 text-sm font-extrabold text-slate-100 flex items-center justify-between" style="background:linear-gradient(135deg,#1e1b4b,#312e81);box-shadow:inset 0 1px 0 rgba(255,255,255,0.1), 0 10px 20px -5px rgba(30,27,75,0.3);">')

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated Bento grid and bottom banner")
