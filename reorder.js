const fs = require('fs');

const html = fs.readFileSync('index.html', 'utf8');

// The exact IDs of existing sections in order of their appearance
const sectionIds = [
    'home',
    'about',
    'pricing',
    'masterplan',
    'floorplan',
    'amenities',
    'gallery',
    'enquiry'
];

const sections = {};

sectionIds.forEach(id => {
    // Match the section tag and all its content up to the next <section> or <footer
    const regex = new RegExp(`<section id="${id}"[\\s\\S]*?(?=\\n*<section|\\n*<footer)`, 'i');
    const match = html.match(regex);
    if (match) {
        sections[id] = match[0];
    } else {
        console.error(`Could not find section ${id}`);
        process.exit(1);
    }
});

// Create new walkthrough section
const walkthrough = `
    <!-- SECTION: Walkthrough -->
    <section id="walkthrough" class="walkthrough section-padding">
        <div class="container fade-in-up">
            <div class="section-label">Virtual Tour</div>
            <h2 class="section-title">Experience the Luxury</h2>
            <div class="video-wrapper" style="position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden; max-width: 100%; border-radius: var(--border-radius); box-shadow: var(--shadow-subtle);">
                <iframe src="https://www.youtube.com/embed/D_Ik9uj-FHE?start=16" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: 0;" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
            </div>
        </div>
    </section>
`;

// Location placeholder
const location = `
    <!-- SECTION: Location -->
    <section id="location" class="location-map section-padding bg-cream">
        <div class="container fade-in-up">
            <div class="section-label">Connectivity</div>
            <h2 class="section-title">Prime Location in Whitefield</h2>
            <div class="map-embed-wrapper" style="width: 100%; height: 400px; border-radius: var(--border-radius); overflow: hidden;">
                <iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3887.8926941198544!2d77.7265147!3d12.9787383!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3bae11f35d0dfc83%3A0x30cfa512d80115f9!2sWhitefield%2C%20Bengaluru%2C%20Karnataka!5e0!3m2!1sen!2sin!4v1700000000000!5m2!1sen!2sin" width="100%" height="100%" style="border:0;" allowfullscreen="" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>
            </div>
        </div>
    </section>
`;

// Desired order:
// About -> Gallery -> Prices -> Master Plan -> Floor Plan -> Walk Through -> Location -> Amenities
// Home and Enquiry stay at ends.
const newOrder = [
    sections.home,
    sections.about,
    sections.gallery,
    sections.pricing,
    sections.masterplan,
    sections.floorplan,
    walkthrough,
    location,
    sections.amenities,
    sections.enquiry
];

const newSectionsHtml = newOrder.join('\\n');

// Replace everything between the start of the first section and the footer
const startIndex = html.indexOf(sections.home);
const endIndex = html.indexOf('<footer');

if(startIndex === -1 || endIndex === -1) {
    console.error("Could not find boundaries");
    process.exit(1);
}

let newHtml = html.substring(0, startIndex) + newSectionsHtml + '\\n    ' + html.substring(endIndex);

// Also we need to update the navigation links to match this order!
// ABOUT | GALLERY | PRICES | MASTER PLAN | FLOOR PLAN | WALK THROUGH | LOCATION | AMENITIES | (Contact)

const newNavLinks = `
                    <li><a href="#about">About</a></li>
                    <li><a href="#gallery">Gallery</a></li>
                    <li><a href="#pricing">Prices</a></li>
                    <li><a href="#masterplan">Master Plan</a></li>
                    <li><a href="#floorplan">Floor Plan</a></li>
                    <li><a href="#walkthrough">Walk Through</a></li>
                    <li><a href="#location">Location</a></li>
                    <li><a href="#amenities">Amenities</a></li>
                    <li><a href="#enquiry" class="btn btn-primary" style="margin-left: 1rem;">Contact</a></li>
`;

// Replace desktop nav
newHtml = newHtml.replace(/<ul class="nav-links">\s*<li>[\s\S]*?<\/ul>/, `<ul class="nav-links">\n${newNavLinks}                </ul>`);

// Replace mobile nav
const mobileNavLinks = newNavLinks.replace('class="btn btn-primary" style="margin-left: 1rem;"', 'class="btn btn-primary"');
newHtml = newHtml.replace(/<ul class="mobile-nav-links">\s*<li>[\s\S]*?<\/ul>/, `<ul class="mobile-nav-links">\n${mobileNavLinks}            </ul>`);

// Replace footer nav
const footerNavLinks = `
                    <a href="#about">About</a>
                    <a href="#gallery">Gallery</a>
                    <a href="#pricing">Prices</a>
                    <a href="#masterplan">Master Plan</a>
                    <a href="#floorplan">Floor Plan</a>
                    <a href="#walkthrough">Walk Through</a>
                    <a href="#location">Location</a>
                    <a href="#amenities">Amenities</a>
                    <a href="#enquiry">Contact</a>
`;
newHtml = newHtml.replace(/<div class="footer-nav">\s*<a[\s\S]*?<\/div>/, `<div class="footer-nav">\n${footerNavLinks}                </div>`);

fs.writeFileSync('index.html', newHtml);
console.log('Successfully reordered sections and updated nav menus.');
