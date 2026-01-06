import path from 'path';
import { pathToFileURL } from 'url';
import { docIdToTitle } from '../utils/sanitize.js';
import { logDebug, logWarning } from '../utils/logger.js';
/**
 * Parse a Docusaurus sidebars.js file and return structured sections
 */
export async function parseSidebar(sidebarPath) {
    const absolutePath = path.resolve(sidebarPath);
    const fileUrl = pathToFileURL(absolutePath).href;
    let sidebarModule;
    try {
        sidebarModule = await import(fileUrl);
    }
    catch (error) {
        throw new Error(`Failed to load sidebar file at ${sidebarPath}: ${error}`);
    }
    // Handle both default export and named exports
    const sidebar = 'default' in sidebarModule ? sidebarModule.default : sidebarModule;
    const sections = [];
    let order = 0;
    for (const [key, items] of Object.entries(sidebar)) {
        if (Array.isArray(items)) {
            const section = parseSidebarSection(key, items, 0, order++);
            sections.push(section);
        }
    }
    return sections;
}
/**
 * Parse a sidebar section and its items recursively
 */
function parseSidebarSection(name, items, depth, order) {
    const section = {
        name,
        label: formatSectionLabel(name),
        pages: [],
        subsections: [],
        depth,
        order,
    };
    let pageOrder = 0;
    let subsectionOrder = 0;
    for (const item of items) {
        const parsed = parseSidebarItem(item, name, depth, pageOrder, subsectionOrder);
        if (parsed.type === 'page') {
            section.pages.push(parsed.page);
            pageOrder++;
        }
        else if (parsed.type === 'section') {
            section.subsections.push(parsed.section);
            subsectionOrder++;
        }
    }
    return section;
}
/**
 * Parse a single sidebar item
 */
function parseSidebarItem(item, sectionName, depth, pageOrder, subsectionOrder) {
    // String shorthand: just a doc ID
    if (typeof item === 'string') {
        return {
            type: 'page',
            page: createDocPage(item, undefined, sectionName, depth, pageOrder),
        };
    }
    // Doc item
    if (item.type === 'doc') {
        return {
            type: 'page',
            page: createDocPage(item.id, item.label, sectionName, depth, pageOrder),
        };
    }
    // Category item (becomes a subsection)
    if (item.type === 'category') {
        const section = parseSidebarSection(item.label, item.items, depth + 1, subsectionOrder);
        // If category has a linked doc, add it as the index page
        if (item.link?.type === 'doc' && item.link.id) {
            section.indexPage = createDocPage(item.link.id, item.label, item.label, depth + 1, -1);
        }
        return {
            type: 'section',
            section,
        };
    }
    // Link item (external links) - skip for LLM docs
    if (item.type === 'link') {
        logDebug(`Skipping external link: ${item.label} -> ${item.href}`);
        return { type: 'skip' };
    }
    // For any other item types, skip them
    logWarning(`Unknown sidebar item type: ${JSON.stringify(item)}`);
    return { type: 'skip' };
}
/**
 * Create a DocPage from a doc ID
 */
function createDocPage(docId, label, sectionName, depth, order) {
    const title = label || docIdToTitle(docId);
    // Convert doc ID to URL path
    // e.g., "getting-started/installation" -> "/getting-started/installation"
    const urlPath = '/' + docId.replace(/^\//, '');
    // Convert to file path
    // e.g., "getting-started/installation" -> "getting-started/installation.md"
    const filePath = docId.replace(/^\//, '') + '.md';
    return {
        id: docId,
        title,
        urlPath,
        filePath,
        content: '', // Will be populated later
        section: sectionName,
        depth,
        order,
    };
}
/**
 * Format a section name into a human-readable label
 */
function formatSectionLabel(name) {
    return name
        .replace(/[-_]/g, ' ')
        .replace(/([a-z])([A-Z])/g, '$1 $2')
        .replace(/\b\w/g, (char) => char.toUpperCase());
}
/**
 * Flatten all pages from sections into a single array
 */
export function flattenSections(sections) {
    const pages = [];
    function traverse(section) {
        // Add index page if present
        if (section.indexPage) {
            pages.push(section.indexPage);
        }
        // Add all pages in this section
        pages.push(...section.pages);
        // Recursively process subsections
        for (const subsection of section.subsections) {
            traverse(subsection);
        }
    }
    for (const section of sections) {
        traverse(section);
    }
    return pages;
}
/**
 * Count total pages in sections
 */
export function countPages(sections) {
    return flattenSections(sections).length;
}
//# sourceMappingURL=sidebar-parser.js.map