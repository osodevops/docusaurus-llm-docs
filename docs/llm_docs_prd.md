# PRD: GitHub Action for Docusaurus LLM Documentation Generation

## Overview

Create a GitHub Action that automatically generates downloadable LLM-optimized documentation from a Docusaurus site using the `docusaurus-plugin-llms` (rachfop) plugin, structured similarly to Cloudflare's LLM resources format.

## Goals

1. **Automated Generation**: Use GitHub Actions to trigger on pushes to main branch, building the site and generating LLM docs
2. **Structured Format**: Organize LLM documentation with hierarchical navigation (sections, subsections, links)
3. **Downloadable Markdown**: Generate a `markdown.zip` archive containing all documentation in markdown format
4. **Accessible Delivery**: Host both `llms.txt` and the markdown archive for easy LLM consumption
5. **Production Ready**: Support deployment to GitHub Pages, custom domains, or cloud storage

## Output Structure

### Primary Outputs

#### 1. `llms.txt` (Index/Navigation File)
- **Format**: Plain text with markdown-style links
- **Structure**:
  ```
  # [Product Name] Developer Documentation
  
  [Introductory tagline describing the product]
  
  > [!TIP]
  > An archive of Markdown files is available at [your-domain]/markdown.zip
  
  ## Section Name
  - [Page Title](https://your-domain/path/to/page.md)
    - [Subsection](https://your-domain/path/to/subsection.md)
    - [Subsection](https://your-domain/path/to/subsection.md)
  
  ## Another Section
  - [Page with Description](https://your-domain/path.md): Brief description of what this page covers
    - [Sub-item](https://your-domain/path.md)
  ```
- **Content**: Links to all documentation pages organized hierarchically
- **Purpose**: Provides LLMs with a complete navigation structure and index

#### 2. Individual Markdown Files
- **Format**: One file per Docusaurus page
- **Naming**: Mirror Docusaurus sidebar structure (e.g., `agents/getting-started/index.md`)
- **Content**: 
  - Full page content extracted from Docusaurus
  - No HTML/JSX
  - Markdown formatting preserved
  - Internal links converted to relative paths

#### 3. `markdown.zip` Archive
- **Contents**: All markdown files organized by directory structure
- **Compression**: ZIP format for easy download
- **Structure**:
  ```
  markdown/
  ├── index.md (or root-level pages)
  ├── agents/
  │   ├── index.md
  │   ├── getting-started/
  │   │   ├── index.md
  │   │   ├── build-a-chat-agent.md
  │   │   └── testing.md
  │   ├── concepts/
  │   │   ├── index.md
  │   │   └── what-are-agents.md
  │   └── api-reference/
  │       ├── index.md
  │       └── agents-api.md
  └── ai-gateway/
      ├── index.md
      └── getting-started/
          └── index.md
  ```

### File Accessibility

Both files should be publicly accessible at:
- `https://your-domain/llms.txt`
- `https://your-domain/markdown.zip`

## Implementation Details

### GitHub Action Workflow

**Trigger**: Push to `main` branch (or configurable)

**Steps**:

1. **Checkout Code**
   - Actions/checkout@v4

2. **Setup Node.js**
   - Setup Node.js with caching for package managers

3. **Install Dependencies**
   - `yarn install` or `npm install`

4. **Build Docusaurus**
   - `yarn build` command
   - Generates site in `./build` directory

5. **Extract Markdown & Generate llms.txt**
   - Run custom script (Node.js) to:
     - Parse Docusaurus sidebar configuration
     - Extract all markdown content from build output
     - Generate `llms.txt` index with proper structure
     - Output files to `./build/llms-output/`

6. **Create markdown.zip**
   - Archive all markdown files from step 5
   - Place in `./build/` directory

7. **Deploy to GitHub Pages** (Option A)
   - Use actions/upload-pages-artifact@v3
   - Deploy with actions/deploy-pages@v4
   - Files served at `gh-pages` branch

8. **Deploy to Custom Storage** (Option B)
   - Upload to AWS S3, CloudFlare R2, etc.
   - Or commit to specific branch (`llm-docs`)

### Docusaurus Configuration

**Required Plugin Installation**:

```bash
npm install docusaurus-plugin-llms
# or
yarn add docusaurus-plugin-llms
```

**docusaurus.config.js**:

```javascript
module.exports = {
  // ... other config
  plugins: [
    [
      'docusaurus-plugin-llms',
      {
        // Generate llms.txt during build
        output: './llms-output/llms.txt',
        
        // Configure sidebar structure
        sidebar: 'sidebars.js',
        
        // Optional: customize content transformation
        stripImports: true,
        stripCodeBlocks: false,
        
        // Optional: path prefix for links
        baseUrl: 'https://your-domain.com',
      }
    ]
  ]
};
```

### Custom Script: Extract & Format Markdown

Create `scripts/generate-llm-docs.js`:

**Purpose**: 
- Parse Docusaurus build output
- Extract markdown from HTML (if needed)
- Create directory structure matching sidebar
- Generate formatted `llms.txt` with proper hierarchy
- Create `markdown.zip`

**Inputs**:
- Docusaurus build directory
- Sidebar configuration
- Base URL for links

**Outputs**:
- `markdown/` directory with all `.md` files
- `llms.txt` with index and links
- `markdown.zip` archive

**Key Features**:
```javascript
// Pseudo-code structure
const generateLlmDocs = async (buildDir, sidebarConfig, baseUrl) => {
  // 1. Parse sidebar structure
  const structure = parseSidebar(sidebarConfig);
  
  // 2. Extract markdown content for each page
  const markdownFiles = extractMarkdown(buildDir, structure);
  
  // 3. Create directory structure
  const outputDir = 'llms-output/markdown';
  createDirectoryStructure(outputDir, markdownFiles);
  
  // 4. Generate llms.txt index
  const index = generateIndex(structure, baseUrl);
  writeFile('llms-output/llms.txt', index);
  
  // 5. Create zip archive
  zipDirectory('llms-output/markdown', 'llms-output/markdown.zip');
};
```

## Configuration Options

### Workflow Environment Variables

```yaml
LLM_DOCS_BASE_URL: https://yourdomain.com
LLM_DOCS_PRODUCT_NAME: Your Product
LLM_DOCS_TAGLINE: Build [X] with [Y]
LLM_DOCS_DEPLOY_TO: github-pages  # or s3, r2, custom-branch
```

### Deployment Targets

| Target | Usage | Configuration |
|--------|-------|---------------|
| **GitHub Pages** | Default, free hosting | Uses `gh-pages` branch |
| **Custom Domain** | Point CNAME to gh-pages | DNS configuration |
| **AWS S3** | High performance, CDN | AWS credentials in secrets |
| **Cloudflare R2** | Global CDN, cheap | R2 API tokens in secrets |
| **Commit to Branch** | Version control in repo | Push to `llm-docs` branch |

## Example Workflow File

```yaml
name: Generate LLM Documentation

on:
  push:
    branches:
      - main
  workflow_dispatch:

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    
    permissions:
      contents: read
      pages: write
      id-token: write
    
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    
    steps:
      - name: Checkout
        uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'yarn'
      
      - name: Install dependencies
        run: yarn install --frozen-lockfile
      
      - name: Build site
        run: yarn build
      
      - name: Generate LLM docs
        run: node scripts/generate-llm-docs.js
        env:
          BASE_URL: ${{ secrets.LLM_DOCS_BASE_URL }}
          PRODUCT_NAME: ${{ env.LLM_DOCS_PRODUCT_NAME }}
      
      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: './build'
      
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

## Integration Points

### 1. Docusaurus Sidebar Integration

The plugin reads from your `sidebars.js` and automatically:
- Detects section hierarchy
- Maps to navigation structure
- Generates proper link paths
- Includes page descriptions from `docusaurus.config.js`

### 2. Link Format

All links in `llms.txt` follow pattern:
```
- [Page Title](https://your-domain.com/path/to/page.md)
```

Links should:
- Point to markdown files (`.md` extension)
- Be absolute URLs (for LLM consumption)
- Match archived file structure

### 3. Archive Structure

The `markdown.zip` contains:
```
markdown/
├── agents/
│   ├── index.md
│   ├── getting-started/
│   ├── concepts/
│   └── api-reference/
└── ai-gateway/
    └── (structure mirrors docs)
```

## Acceptance Criteria

- ✅ `llms.txt` generated during build with correct structure
- ✅ All markdown files extracted with proper formatting
- ✅ Directory structure matches documentation hierarchy
- ✅ `markdown.zip` created and ready for download
- ✅ Files deployed to public URL automatically
- ✅ GitHub Actions workflow runs on push to main
- ✅ LLMs can parse and understand the documentation index
- ✅ All links (`.md` files) are accessible and valid
- ✅ No HTML, JSX, or non-markdown content in outputs
- ✅ Markdown formatting (headings, lists, code blocks) preserved
- ✅ Optional configuration via environment variables
- ✅ Works with multiple deployment targets (GitHub Pages, S3, R2)

## Optional Enhancements

1. **Markdown TOC**: Add table of contents at top of `llms.txt`
2. **Versioning**: Support multiple doc versions in archive
3. **Search Index**: Generate searchable JSON index for LLMs
4. **Metadata**: Include frontmatter with updated timestamps
5. **Filtering**: Option to exclude certain sections from LLM docs
6. **Preview**: Generate diff/summary of changes in PR comments
7. **Analytics**: Track downloads of `markdown.zip` (if using custom hosting)

## Success Metrics

- Documentation is always in sync with published site
- LLMs have complete, structured access to all docs
- Users can easily download and integrate docs into LLM context
- Zero manual steps required after workflow setup
- Build time adds <2 minutes to deployment
