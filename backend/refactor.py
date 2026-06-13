import os

filepath = r"d:\Sumadhura\index.html"
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

stats_html = """    <!-- Key Highlights Stats -->
    <section class="key-highlights section-padding bg-cream" style="padding-top: 4rem; padding-bottom: 2rem;">
        <div class="container fade-in-up">
            <div class="amenities-stats" style="margin-top:0; border-top:none; padding-top:0; justify-content:space-around; text-align:center;">
                <div class="a-stat"><strong>1,650+</strong> Homes</div>
                <div class="a-stat"><strong>150+</strong> Amenities</div>
                <div class="a-stat"><strong>20</strong> Acres</div>
            </div>
        </div>
    </section>

"""

start_str = "    <!-- SECTION 5: Amenities (Celebrate Leisure) -->"
end_str = "    <!-- SECTION 4: About -->"

start_idx = content.find(start_str)
end_idx = content.find(end_str)

amenities_block = content[start_idx:end_idx]

stats_block_to_remove = """                    <div class="amenities-stats">
                        <div class="a-stat"><strong>1,650+</strong> Homes</div>
                        <div class="a-stat"><strong>150+</strong> Amenities</div>
                        <div class="a-stat"><strong>20</strong> Acres</div>
                    </div>"""

amenities_block_cleaned = amenities_block.replace(stats_block_to_remove, "")

content_without_amenities = content[:start_idx] + content[end_idx:]

# Insert stats exactly where amenities used to be (after ticker, before about)
content_with_stats = content_without_amenities[:start_idx] + stats_html + content_without_amenities[start_idx:]

floorplan_end_str = "    <!-- SECTION 7: Gallery -->"
fp_end_idx = content_with_stats.find(floorplan_end_str)

final_content = content_with_stats[:fp_end_idx] + amenities_block_cleaned + content_with_stats[fp_end_idx:]

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(final_content)
print("Done")
