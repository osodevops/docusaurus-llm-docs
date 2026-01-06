import { promises as fs } from 'fs';
import { glob } from 'glob';
import type { Config } from '../types/index.js';
import { log, logWarning } from '../utils/logger.js';

/**
 * Generate the HTML for the LLM Resources sidebar section
 */
function generateLlmResourcesHtml(baseUrl: string): string {
  return `<li class="theme-doc-sidebar-item-category theme-doc-sidebar-item-category-level-1 menu__list-item"><div class="menu__list-item-collapsible"><a class="menu__link menu__link--sublist menu__link--sublist-caret" role="button" aria-expanded="true" href="#"><span title="LLM Resources" class="categoryLinkLabel_W154">LLM Resources</span></a></div><ul class="menu__list"><li class="theme-doc-sidebar-item-link theme-doc-sidebar-item-link-level-2 menu__list-item"><a class="menu__link" href="${baseUrl}/llms.txt" target="_blank" rel="noopener noreferrer"><span title="llms.txt">llms.txt</span><svg width="12" height="12" aria-hidden="true" viewBox="0 0 24 24" class="iconExternalLink_nPIU" style="margin-left:4px"><path fill="currentColor" d="M21 13v10h-21v-19h12v2h-10v15h17v-8h2zm3-12h-10.988l4.035 4-6.977 7.07 2.828 2.828 6.977-7.07 4.125 4.172v-11z"></path></svg></a></li><li class="theme-doc-sidebar-item-link theme-doc-sidebar-item-link-level-2 menu__list-item"><a class="menu__link" href="${baseUrl}/markdown.zip" target="_blank" rel="noopener noreferrer"><span title="markdown.zip">markdown.zip</span><svg width="12" height="12" aria-hidden="true" viewBox="0 0 24 24" class="iconExternalLink_nPIU" style="margin-left:4px"><path fill="currentColor" d="M21 13v10h-21v-19h12v2h-10v15h17v-8h2zm3-12h-10.988l4.035 4-6.977 7.07 2.828 2.828 6.977-7.07 4.125 4.172v-11z"></path></svg></a></li></ul></li>`;
}

/**
 * Inject LLM Resources links into a single HTML file's sidebar
 */
async function injectIntoHtmlFile(filePath: string, llmResourcesHtml: string): Promise<boolean> {
  try {
    let content = await fs.readFile(filePath, 'utf-8');

    // Find the main sidebar menu list
    const sidebarPattern = /<ul class="theme-doc-sidebar-menu menu__list">/g;

    if (!sidebarPattern.test(content)) {
      return false; // No sidebar in this file
    }

    // Reset the regex
    sidebarPattern.lastIndex = 0;

    // Find the position after the sidebar opening tag
    const match = sidebarPattern.exec(content);
    if (!match) {
      return false;
    }

    const startPos = match.index + match[0].length;

    // Find the matching closing </ul> tag
    // We need to count nested <ul> tags to find the right closing tag
    let depth = 1;
    let pos = startPos;
    let closingPos = -1;

    while (pos < content.length && depth > 0) {
      const nextOpen = content.indexOf('<ul', pos);
      const nextClose = content.indexOf('</ul>', pos);

      if (nextClose === -1) {
        break;
      }

      if (nextOpen !== -1 && nextOpen < nextClose) {
        depth++;
        pos = nextOpen + 3;
      } else {
        depth--;
        if (depth === 0) {
          closingPos = nextClose;
        }
        pos = nextClose + 5;
      }
    }

    if (closingPos === -1) {
      return false;
    }

    // Check if LLM Resources already exists
    if (content.includes('LLM Resources')) {
      return false; // Already injected
    }

    // Insert the LLM Resources section before the closing </ul>
    const newContent =
      content.slice(0, closingPos) +
      llmResourcesHtml +
      content.slice(closingPos);

    await fs.writeFile(filePath, newContent, 'utf-8');
    return true;
  } catch (error) {
    logWarning(`Failed to inject sidebar into ${filePath}: ${error}`);
    return false;
  }
}

/**
 * Inject LLM Resources links into all HTML files in the build directory
 */
export async function injectSidebarLinks(config: Config): Promise<number> {
  const htmlFiles = await glob('**/*.html', {
    cwd: config.buildDir,
    absolute: true,
  });

  const llmResourcesHtml = generateLlmResourcesHtml(config.baseUrl);
  let injectedCount = 0;

  for (const htmlFile of htmlFiles) {
    const injected = await injectIntoHtmlFile(htmlFile, llmResourcesHtml);
    if (injected) {
      injectedCount++;
    }
  }

  log(`Injected LLM Resources sidebar into ${injectedCount} HTML files`);
  return injectedCount;
}
