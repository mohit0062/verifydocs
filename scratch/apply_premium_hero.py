with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

import re

# Extract the Quick Validator Widget before replacing
quick_val_match = re.search(r'<!-- Quick Validator Widget -->.*?<!-- Result panel -->.*?</div>\s*</div>', content, re.DOTALL)
quick_validator_html = quick_val_match.group(0) if quick_val_match else ""

# 1. Update the Navigation to a floating pill
nav_pattern = r'<nav class="home-nav.*?</nav>'
new_nav = """<nav class="fixed top-6 left-1/2 -translate-x-1/2 w-[92%] max-w-5xl bg-white/80 backdrop-blur-2xl rounded-full shadow-[0_8px_30px_rgba(0,0,0,0.06)] border border-white/60 z-50 px-6 py-4 flex items-center justify-between">
  <!-- Logo -->
  <a href="/" class="flex items-center gap-2 font-bold text-xl text-slate-800 no-underline shrink-0">
    <svg width="28" height="28" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="32" height="32" rx="16" fill="#3b82f6"/>
      <path d="M16 7l7 4.5v7C23 23.5 16 27 16 27s-7-3.5-7-8.5v-7z" fill="white"/>
      <path d="M13 16l2.5 2.5 4-4" stroke="#3b82f6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
    <span class="tracking-tight">VerifyDocs<span class="text-blue-500">.online</span></span>
  </a>

  <!-- Center Links -->
  <div class="hidden md:flex items-center gap-8 text-[0.9rem] font-bold text-slate-600">
    <a href="/" class="hover:text-slate-900 transition-colors">Home</a>
    <a href="/about" class="hover:text-slate-900 transition-colors">About</a>
    <a href="#tools" class="hover:text-slate-900 transition-colors">Services</a>
    <a href="/contact" class="hover:text-slate-900 transition-colors">Contact</a>
  </div>

  <!-- Right Button -->
  <a href="#tools" class="hidden sm:flex px-6 py-2.5 bg-blue-500 text-white text-[0.9rem] font-bold rounded-full shadow-[0_8px_20px_-6px_rgba(59,130,246,0.6)] hover:bg-blue-600 hover:-translate-y-0.5 transition-all">
    Explore Tools
  </a>
</nav>"""
content = re.sub(nav_pattern, new_nav, content, flags=re.DOTALL)

# 2. Replace Hero Section
hero_pattern = r'<section class="hero-section.*?</section>'
new_hero = f"""<section class="relative pt-44 pb-20 md:pt-56 md:pb-32 px-4 text-center overflow-hidden" style="background: radial-gradient(100% 120% at 50% 0%, #e0f0ff 0%, #f4f8ff 45%, #ffffff 100%); min-height: 100svh;">
  
  <!-- Decorative Rain/Lines -->
  <div class="absolute inset-0 pointer-events-none opacity-[0.15]" style="background-image: repeating-linear-gradient(90deg, transparent, transparent 100px, rgba(255,255,255,1) 100px, rgba(255,255,255,1) 101px);"></div>
  <div class="absolute inset-0 pointer-events-none" style="background: radial-gradient(circle at center, transparent 0%, #ffffff 90%);"></div>

  <div class="max-w-6xl mx-auto relative z-10 flex flex-col items-center">
    
    <h1 class="text-5xl md:text-[5.5rem] font-extrabold text-[#0f172a] leading-[1.08] tracking-tight mb-8 max-w-4xl" style="text-shadow: 0 10px 30px rgba(0,0,0,0.03);">
      Turn Your <span class="text-blue-600 bg-blue-100/50 px-3 rounded-2xl border border-blue-200/50">Files</span> Into a<br/>Privacy Machine
    </h1>
    
    <p class="text-lg md:text-[1.3rem] text-slate-500 max-w-2xl leading-relaxed mb-10 font-medium">
      We help users stay secure by making their document validation, compression, and editing fast and 100% serverless.
    </p>
    
    <a href="#tools" class="inline-flex items-center gap-2 px-8 py-4 bg-blue-500 text-white text-base font-bold rounded-full shadow-[0_12px_30px_-8px_rgba(59,130,246,0.8)] hover:shadow-[0_20px_40px_-10px_rgba(59,130,246,1)] hover:bg-blue-600 hover:-translate-y-1 transition-all">
      Start Free Validation <span class="font-normal opacity-80 text-xl leading-none">&rarr;</span>
    </a>

    <!-- Floating Cards Section to mimic the design -->
    <div class="mt-28 md:mt-40 relative w-full max-w-5xl mx-auto h-[480px]">
      
      <!-- Left Card (Aadhaar/PAN) -->
      <div class="absolute left-0 md:left-10 top-16 w-80 bg-white rounded-3xl p-7 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.08)] border border-slate-100 transform -rotate-3 hover:rotate-0 hover:-translate-y-4 transition-all duration-500 z-10 flex flex-col items-center">
        <div class="absolute -top-4 -left-4 bg-white px-4 py-2 rounded-xl shadow-lg border border-slate-100 flex flex-col items-center gap-1 text-xs font-bold transform -rotate-6">
          <span class="text-slate-400 font-medium">Security</span>
          <span class="text-red-500 text-base flex items-center gap-1"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M20 6L9 17l-5-5"/></svg> 100%</span>
        </div>
        <div class="w-24 h-24 bg-blue-50/50 rounded-full flex items-center justify-center mb-6 shadow-inner">
          <img src="./assets/docs_3d.png" class="w-16 h-16 object-contain" alt="Docs">
        </div>
        <h3 class="text-2xl font-bold text-slate-800">Document Checks</h3>
        <p class="text-[0.95rem] text-slate-500 text-center mt-3 font-medium">Verify Aadhaar, PAN, GST and more instantly without servers.</p>
        <div class="w-full bg-slate-100 h-2 rounded-full mt-6 overflow-hidden"><div class="bg-blue-400 w-full h-full"></div></div>
        <a href="/tools/document-tools" class="w-full mt-5 py-3 bg-blue-50/80 text-blue-500 text-[0.95rem] font-bold rounded-xl hover:bg-blue-100 transition text-center block">Open Docs</a>
      </div>

      <!-- Arrow joining them -->
      <div class="hidden md:block absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-blue-300/80">
        <svg width="180" height="60" viewBox="0 0 180 60" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M0 30C60 30 120 -15 170 30" stroke="currentColor" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
          <path d="M150 5L175 32L145 42" stroke="currentColor" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>

      <!-- Right Card (PDF/Image) -->
      <div class="absolute right-0 md:right-10 top-0 w-80 bg-white rounded-3xl p-7 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.08)] border border-slate-100 transform rotate-3 hover:rotate-0 hover:-translate-y-4 transition-all duration-500 z-20 flex flex-col items-center">
        <div class="absolute -top-6 -right-6 bg-white px-4 py-2 rounded-xl shadow-lg border border-slate-100 flex flex-col items-center gap-1 text-xs font-bold transform rotate-6 z-30">
          <span class="text-slate-400 font-medium">Processing Speed</span>
          <span class="text-green-500 text-base flex items-center gap-1"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M20 6L9 17l-5-5"/></svg> Ultra Fast</span>
        </div>
        <div class="w-24 h-24 bg-green-50/50 rounded-full flex items-center justify-center mb-6 shadow-inner">
          <img src="./assets/pdf_3d.png" class="w-16 h-16 object-contain" alt="PDF">
        </div>
        <h3 class="text-2xl font-bold text-slate-800">PDF Suite</h3>
        <p class="text-[0.95rem] text-slate-500 text-center mt-3 font-medium">Merge, split, compress, and convert PDFs directly in your browser.</p>
        <div class="w-full flex justify-between text-xs font-bold text-slate-400 mt-6 px-1">
          <span>Zero Server Uploads</span>
          <span>Instant</span>
        </div>
        <a href="/tools/pdf-tools" class="w-full mt-4 py-3 bg-blue-500 text-white text-[0.95rem] font-bold rounded-xl hover:bg-blue-600 hover:shadow-[0_8px_20px_-6px_rgba(59,130,246,0.6)] transition block text-center">Open PDF Tools</a>
      </div>

    </div>

    <!-- Quick Validator Widget restored -->
    <div class="mt-16 relative z-30">
{quick_validator_html}
    </div>
  </div>
</section>"""
content = re.sub(hero_pattern, new_hero, content, flags=re.DOTALL)

# Clean up CSS styles
css_to_remove = [
    r'\.hero-section\s*{[^}]*}',
    r'\.hero-section\s*h1,\s*\.hero-section\s*p\s*{[^}]*}',
    r'\.hero-section::before\s*{[^}]*}',
    r'\.hero-floating-icon\s*{[^}]*}',
    r'\.hero-kicker\s*{[^}]*}',
    r'\.hero-kicker::before\s*{[^}]*}',
    r'\.hero-title\s*{[^}]*}',
    r'\.hero-title-gradient\s*{[^}]*}',
    r'@keyframes hue-shift\s*{[^}]*}',
    r'\.hero-primary-panel\s*{[^}]*}',
    r'\.hero-link-card\s*{[^}]*}',
    r'@keyframes heroFloat\s*{[^}]*}',
    r'\.home-nav\s*{[^}]*}'
]

for pattern in css_to_remove:
    content = re.sub(pattern, '', content)

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(content)
print("Applied Premium Hero UI successfully")
