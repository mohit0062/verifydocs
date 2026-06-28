import os
import glob
import re
import xml.etree.ElementTree as ET

def set_noindex_for_tools():
    tools_dir = r"e:\aadar webside\tools"
    html_files = glob.glob(os.path.join(tools_dir, "*.html"))
    
    count_updated = 0
    count_inserted = 0
    
    for file_path in html_files:
        try:
            with open(file_path, "rb") as f:
                content = f.read()
            
            # 1. Try to find and replace existing robots meta tags
            # We match any <meta name="robots" content="..."> tag
            robots_regex = re.compile(br'<meta\s+name=["\']robots["\']\s+content=["\'][^"\']+["\']\s*/?>', re.IGNORECASE)
            
            if robots_regex.search(content):
                # Replace it with noindex, follow
                new_content = robots_regex.sub(br'<meta name="robots" content="noindex, follow">', content)
                if new_content != content:
                    with open(file_path, "wb") as f:
                        f.write(new_content)
                    print(f"Updated existing robots tag to noindex in: {os.path.basename(file_path)}")
                    count_updated += 1
            else:
                # 2. Insert new robots tag after <head>
                head_regex = re.compile(br'<head\b[^>]*>', re.IGNORECASE)
                match = head_regex.search(content)
                if match:
                    pos = match.end()
                    new_content = content[:pos] + b'\n  <meta name="robots" content="noindex, follow">' + content[pos:]
                    with open(file_path, "wb") as f:
                        f.write(new_content)
                    print(f"Inserted new noindex robots tag in: {os.path.basename(file_path)}")
                    count_inserted += 1
                else:
                    print(f"Warning: No <head> tag found in: {os.path.basename(file_path)}")
        except Exception as e:
            print(f"Error processing {os.path.basename(file_path)}: {e}")
            
    print(f"Total tools pages updated: {count_updated}")
    print(f"Total tools pages inserted: {count_inserted}")

def filter_sitemap():
    sitemap_path = r"e:\aadar webside\sitemap.xml"
    if not os.path.exists(sitemap_path):
        print("Sitemap file not found!")
        return
        
    try:
        # Register namespaces to prevent namespace prefixes (ns0:) in output
        ET.register_namespace('', "http://www.sitemaps.org/schemas/sitemap/0.9")
        
        tree = ET.parse(sitemap_path)
        root = tree.getroot()
        
        # Namespace handling
        ns = {"ns": "http://www.sitemaps.org/schemas/sitemap/0.9"}
        
        urls_to_remove = []
        for url in root.findall("ns:url", ns):
            loc = url.find("ns:loc", ns)
            if loc is not None and loc.text and "/tools/" in loc.text:
                urls_to_remove.append(url)
                
        for url in urls_to_remove:
            root.remove(url)
            
        tree.write(sitemap_path, encoding="UTF-8", xml_declaration=True)
        print(f"Filtered sitemap.xml. Removed {len(urls_to_remove)} tools URLs.")
    except Exception as e:
        print(f"Error filtering sitemap: {e}")

if __name__ == "__main__":
    print("Preparing verifydocs.online for Google AdSense Review...")
    set_noindex_for_tools()
    filter_sitemap()
    print("Preparation complete!")
