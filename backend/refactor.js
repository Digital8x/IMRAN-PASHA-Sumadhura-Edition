const fs = require('fs');

const filepath = "d:\\Sumadhura\\index.html";
const content = fs.readFileSync(filepath, 'utf8');

const stats_html = `    <!-- Key Highlights Stats -->
    <section class="key-highlights section-padding" style="padding-top: 4rem; padding-bottom: 2rem;">
        <div class="container fade-in-up">
            <div class="amenities-stats" style="margin-top:0; border-top:none; padding-top:0; justify-content:space-around; text-align:center;">
                <div class="a-stat"><strong>1,650+</strong> Homes</div>
                <div class="a-stat"><strong>150+</strong> Amenities</div>
                <div class="a-stat"><strong>20</strong> Acres</div>
            </div>
        </div>
    </section>\n\n`;

const start_str = "    <!-- SECTION 5: Amenities (Celebrate Leisure) -->";
const end_str = "    <!-- SECTION 4: About -->";

const start_idx = content.indexOf(start_str);
const end_idx = content.indexOf(end_str);

if (start_idx === -1 || end_idx === -1) {
    console.error("Could not find start or end of amenities section.");
    process.exit(1);
}

const amenities_block = content.substring(start_idx, end_idx);

const stats_block_to_remove = `                    <div class="amenities-stats">
                        <div class="a-stat"><strong>1,650+</strong> Homes</div>
                        <div class="a-stat"><strong>150+</strong> Amenities</div>
                        <div class="a-stat"><strong>20</strong> Acres</div>
                    </div>`;

const amenities_block_cleaned = amenities_block.replace(stats_block_to_remove, "");

const content_without_amenities = content.substring(0, start_idx) + content.substring(end_idx);

const content_with_stats = content_without_amenities.substring(0, start_idx) + stats_html + content_without_amenities.substring(start_idx);

const floorplan_end_str = "    <!-- SECTION 7: Gallery -->";
const fp_end_idx = content_with_stats.indexOf(floorplan_end_str);

if (fp_end_idx === -1) {
    console.error("Could not find end of floorplan section.");
    process.exit(1);
}

const final_content = content_with_stats.substring(0, fp_end_idx) + amenities_block_cleaned + content_with_stats.substring(fp_end_idx);

fs.writeFileSync(filepath, final_content, 'utf8');
console.log("Done");
