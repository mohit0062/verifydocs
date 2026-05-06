import re
import os

def create_bento():
    with open('index.html', 'r', encoding='utf-8') as f:
        content = f.read()

    # Define sections
    sections = [
        'tools', 'pdf-tools', 'image-tools', 'design-tools', 
        'developer-tools', 'utility-tools', 'media-tools'
    ]
    
    # Extract the header and footer
    # Header is everything up to <!-- 3D Category Tabbing Section -->
    # Footer is everything from <section class="why-use-section" onwards
    header_match = re.search(r'(.*?)<!-- 3D Category Tabbing Section -->', content, re.DOTALL)
    footer_match = re.search(r'(<section[^>]*class=["\'][^"\']*why-use-section.*)', content, re.DOTALL)
    
    if not header_match or not footer_match:
        print("Could not find header or footer anchors.")
        return
        
    header = header_match.group(1)
    # Remove Hero from header for the subpages
    header_no_hero = re.sub(r'<!-- Hero Section -->.*?</section>', '', header, flags=re.DOTALL)
    
    footer = footer_match.group(1)
    
    # Create the subpages for categories that don't have dedicated pages yet
    pages_to_create = {
        'document-tools.html': ['tools'],
        'design-tools.html': ['design-tools'],
        'developer-tools.html': ['developer-tools'],
        'utility-tools.html': ['utility-tools'],
        'media-tools.html': ['media-tools']
    }
    
    for page_name, target_sections in pages_to_create.items():
        page_path = os.path.join('tools', page_name)
        if not os.path.exists(page_path):
            page_content = header_no_hero
            # Add a wrapper for spacing
            page_content += '<main class="max-w-7xl mx-auto pt-10">\n'
            for sec_id in target_sections:
                sec_match = re.search(rf'(<section id="{sec_id}".*?</section>)', content, re.DOTALL)
                if sec_match:
                    page_content += sec_match.group(1) + '\n'
            page_content += '</main>\n'
            page_content += footer
            
            # Fix relative links since we moved into /tools/
            page_content = page_content.replace('href="./assets/', 'href="../assets/')
            page_content = page_content.replace('src="./assets/', 'src="../assets/')
            page_content = page_content.replace('href="./tools/', 'href="./')
            
            with open(page_path, 'w', encoding='utf-8') as f:
                f.write(page_content)
            print(f"Created {page_path}")

    # Now create the Bento grid to replace everything in index.html between header and footer
    bento_grid = """
<!-- Bento Grid Categories -->
<section class="max-w-7xl mx-auto px-4 sm:px-6 py-16">
  <div class="text-center mb-12">
    <h2 class="text-3xl md:text-4xl font-extrabold text-text-main">Built for Users Who Want More</h2>
    <p class="text-text-muted mt-3 text-lg">Select a category to explore our privacy-first tools.</p>
  </div>
  
  <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
    <!-- Document Checks -->
    <a href="./tools/document-tools.html" class="block bg-white rounded-2xl border border-border-col p-8 shadow-sm hover:shadow-[0_20px_50px_-12px_rgba(34,197,94,0.25)] hover:-translate-y-1 hover:border-primary transition-all duration-300">
       <div class="bg-green-50 w-20 h-20 rounded-2xl flex items-center justify-center mb-6">
         <img src="./assets/docs_3d.png" class="w-14 h-14 object-contain drop-shadow-md">
       </div>
       <h3 class="text-xl font-extrabold text-text-main mb-2">Document Checks</h3>
       <p class="text-sm font-semibold text-text-muted">Fast, private, and easy to explain. Verify Aadhaar, PAN, GST and more instantly.</p>
    </a>
    
    <!-- PDF Tools -->
    <a href="./tools/pdf-tools" class="block bg-white rounded-2xl border border-border-col p-8 shadow-sm hover:shadow-[0_20px_50px_-12px_rgba(59,130,246,0.25)] hover:-translate-y-1 hover:border-blue-500 transition-all duration-300">
       <div class="bg-blue-50 w-20 h-20 rounded-2xl flex items-center justify-center mb-6">
         <img src="./assets/pdf_3d.png" class="w-14 h-14 object-contain drop-shadow-md">
       </div>
       <h3 class="text-xl font-extrabold text-text-main mb-2">PDF Suite</h3>
       <p class="text-sm font-semibold text-text-muted">Merge, split, compress, and convert PDFs without uploading to servers.</p>
    </a>
    
    <!-- Image Tools -->
    <a href="./tools/image-tools" class="block bg-white rounded-2xl border border-border-col p-8 shadow-sm hover:shadow-[0_20px_50px_-12px_rgba(249,115,22,0.25)] hover:-translate-y-1 hover:border-orange-500 transition-all duration-300">
       <div class="bg-orange-50 w-20 h-20 rounded-2xl flex items-center justify-center mb-6">
         <img src="./assets/image_3d.png" class="w-14 h-14 object-contain drop-shadow-md">
       </div>
       <h3 class="text-xl font-extrabold text-text-main mb-2">Image Lab</h3>
       <p class="text-sm font-semibold text-text-muted">Compress, resize, and upscale images. Remove backgrounds automatically.</p>
    </a>
  </div>

  <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
    <!-- Dev & Design Tools -->
    <a href="./tools/developer-tools.html" class="block bg-white rounded-2xl border border-border-col p-8 shadow-sm hover:shadow-[0_20px_50px_-12px_rgba(139,92,246,0.25)] hover:-translate-y-1 hover:border-purple-500 transition-all duration-300 relative overflow-hidden">
       <div class="flex gap-4 mb-6">
           <div class="bg-purple-50 w-16 h-16 rounded-2xl flex items-center justify-center z-10">
             <img src="./assets/dev_3d.png" class="w-10 h-10 object-contain drop-shadow-md">
           </div>
           <div class="bg-pink-50 w-16 h-16 rounded-2xl flex items-center justify-center z-10">
             <img src="./assets/design_3d.png" class="w-10 h-10 object-contain drop-shadow-md">
           </div>
       </div>
       <h3 class="text-xl font-extrabold text-text-main mb-2 relative z-10">Developer & Design</h3>
       <p class="text-sm font-semibold text-text-muted max-w-sm relative z-10">Format JSON, minify CSS, generate shadows, and convert colors in seconds.</p>
       
       <!-- Decorative background -->
       <div class="absolute right-0 top-0 opacity-10 pointer-events-none transform translate-x-1/4 -translate-y-1/4">
           <svg width="200" height="200" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
       </div>
    </a>
    
    <!-- Media & Utility Tools -->
    <a href="./tools/media-tools.html" class="block bg-white rounded-2xl border border-border-col p-8 shadow-sm hover:shadow-[0_20px_50px_-12px_rgba(236,72,153,0.25)] hover:-translate-y-1 hover:border-pink-500 transition-all duration-300 relative overflow-hidden">
       <div class="flex gap-4 mb-6">
           <div class="bg-pink-50 w-16 h-16 rounded-2xl flex items-center justify-center z-10">
             <img src="./assets/media_3d.png" class="w-10 h-10 object-contain drop-shadow-md">
           </div>
           <div class="bg-blue-50 w-16 h-16 rounded-2xl flex items-center justify-center z-10">
             <img src="./assets/util_3d.png" class="w-10 h-10 object-contain drop-shadow-md">
           </div>
       </div>
       <h3 class="text-xl font-extrabold text-text-main mb-2 relative z-10">Media & Utilities</h3>
       <p class="text-sm font-semibold text-text-muted max-w-sm relative z-10">Compress video, convert audio, generate QR codes, and encode base64 text.</p>
       
       <!-- Decorative background -->
       <div class="absolute right-0 top-0 opacity-10 pointer-events-none transform translate-x-1/4 -translate-y-1/4">
           <svg width="200" height="200" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/></svg>
       </div>
    </a>
  </div>
</section>
"""

    new_index_content = header + bento_grid + footer
    with open('index.html', 'w', encoding='utf-8') as f:
        f.write(new_index_content)
    print("Updated index.html")

create_bento()
