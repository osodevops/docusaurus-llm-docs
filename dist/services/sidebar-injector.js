import { promises as fs } from 'fs';
import { glob } from 'glob';
import { log, logWarning } from '../utils/logger.js';
/**
 * Generate the script that injects LLM Resources into the sidebar
 * This runs after React hydration to avoid being overwritten
 */
function generateInjectionScript(baseUrl) {
    const script = `
<script>
(function() {
  function injectLlmResources() {
    // Don't inject if already present
    if (document.querySelector('[data-llm-resources]')) return;

    // Find the sidebar menu
    var sidebar = document.querySelector('.theme-doc-sidebar-menu.menu__list');
    if (!sidebar) return;

    // Create the LLM Resources section
    var li = document.createElement('li');
    li.className = 'theme-doc-sidebar-item-category theme-doc-sidebar-item-category-level-1 menu__list-item';
    li.setAttribute('data-llm-resources', 'true');

    var externalIcon = '<svg width="12" height="12" aria-hidden="true" viewBox="0 0 24 24" class="iconExternalLink_nPIU" style="margin-left:4px"><path fill="currentColor" d="M21 13v10h-21v-19h12v2h-10v15h17v-8h2zm3-12h-10.988l4.035 4-6.977 7.07 2.828 2.828 6.977-7.07 4.125 4.172v-11z"></path></svg>';

    li.innerHTML = '<div class="menu__list-item-collapsible">' +
      '<a class="menu__link menu__link--sublist menu__link--sublist-caret" role="button" aria-expanded="true" href="#">' +
      '<span title="LLM Resources">LLM Resources</span></a></div>' +
      '<ul class="menu__list">' +
      '<li class="theme-doc-sidebar-item-link theme-doc-sidebar-item-link-level-2 menu__list-item">' +
      '<a class="menu__link" href="${baseUrl}/llms.txt" target="_blank" rel="noopener noreferrer">' +
      '<span title="llms.txt">llms.txt</span>' + externalIcon + '</a></li>' +
      '<li class="theme-doc-sidebar-item-link theme-doc-sidebar-item-link-level-2 menu__list-item">' +
      '<a class="menu__link" href="${baseUrl}/llms-full.txt" target="_blank" rel="noopener noreferrer">' +
      '<span title="llms-full.txt">llms-full.txt</span>' + externalIcon + '</a></li>' +
      '<li class="theme-doc-sidebar-item-link theme-doc-sidebar-item-link-level-2 menu__list-item">' +
      '<a class="menu__link" href="${baseUrl}/markdown.zip" target="_blank" rel="noopener noreferrer">' +
      '<span title="markdown.zip">markdown.zip</span>' + externalIcon + '</a></li>' +
      '</ul>';

    sidebar.appendChild(li);
  }

  // Run after DOM is ready and React has hydrated
  if (document.readyState === 'complete') {
    setTimeout(injectLlmResources, 100);
  } else {
    window.addEventListener('load', function() {
      setTimeout(injectLlmResources, 100);
    });
  }

  // Also observe for SPA navigation (React re-renders)
  var observer = new MutationObserver(function(mutations) {
    if (!document.querySelector('[data-llm-resources]')) {
      injectLlmResources();
    }
  });

  // Start observing once sidebar exists
  function startObserver() {
    var sidebar = document.querySelector('.theme-doc-sidebar-container');
    if (sidebar) {
      observer.observe(sidebar, { childList: true, subtree: true });
    } else {
      setTimeout(startObserver, 100);
    }
  }

  if (document.readyState === 'complete') {
    startObserver();
  } else {
    window.addEventListener('load', startObserver);
  }
})();
</script>`;
    return script;
}
/**
 * Inject the script into a single HTML file
 */
async function injectIntoHtmlFile(filePath, script) {
    try {
        let content = await fs.readFile(filePath, 'utf-8');
        // Check if already injected
        if (content.includes('data-llm-resources')) {
            return false;
        }
        // Check if this file has a sidebar (docs pages)
        if (!content.includes('theme-doc-sidebar')) {
            return false;
        }
        // Inject script before closing </body> tag
        const bodyCloseIndex = content.lastIndexOf('</body>');
        if (bodyCloseIndex === -1) {
            return false;
        }
        const newContent = content.slice(0, bodyCloseIndex) +
            script +
            content.slice(bodyCloseIndex);
        await fs.writeFile(filePath, newContent, 'utf-8');
        return true;
    }
    catch (error) {
        logWarning(`Failed to inject sidebar into ${filePath}: ${error}`);
        return false;
    }
}
/**
 * Inject LLM Resources links into all HTML files in the build directory
 */
export async function injectSidebarLinks(config) {
    const htmlFiles = await glob('**/*.html', {
        cwd: config.buildDir,
        absolute: true,
    });
    const script = generateInjectionScript(config.baseUrl);
    let injectedCount = 0;
    for (const htmlFile of htmlFiles) {
        const injected = await injectIntoHtmlFile(htmlFile, script);
        if (injected) {
            injectedCount++;
        }
    }
    log(`Injected LLM Resources sidebar into ${injectedCount} HTML files`);
    return injectedCount;
}
//# sourceMappingURL=sidebar-injector.js.map