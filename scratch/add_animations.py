with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Add CSS animation
css_animation = """
    @keyframes float-3d-gif {
      0%, 100% { transform: translateY(0) scale(1) rotate(0deg); }
      50% { transform: translateY(-6px) scale(1.02) rotate(2deg); }
    }
    .animate-3d-gif {
      animation: float-3d-gif 3.5s ease-in-out infinite;
    }
"""

if '.animate-3d-gif' not in content:
    content = content.replace('  <style>', '  <style>\n' + css_animation)

# Add the class to the img tags in the bento grid
# The bento grid images have class="w-14 h-14 object-contain drop-shadow-md" and "w-10 h-10 object-contain drop-shadow-md"
content = content.replace('class="w-14 h-14 object-contain drop-shadow-md"', 'class="w-14 h-14 object-contain drop-shadow-md animate-3d-gif"')
content = content.replace('class="w-10 h-10 object-contain drop-shadow-md"', 'class="w-10 h-10 object-contain drop-shadow-md animate-3d-gif"')

# Wait, if they already have the class, it will add it twice. Let's fix that.
content = content.replace('animate-3d-gif animate-3d-gif', 'animate-3d-gif')

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated index.html with 3D gif animations")
