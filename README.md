# Docusaurus LLM Docs Generator

📚 **A GitHub Action to automatically generate LLM-optimized documentation from Docusaurus sites**

Perfect for teams who want to make their documentation accessible to AI assistants and LLMs. Generates a structured `llms.txt` index and a `markdown.zip` archive following the format popularized by Cloudflare.

<div align="center">

[![GitHub Release](https://img.shields.io/github/v/release/osodevops/docusaurus-llm-docs?label=version)](https://github.com/osodevops/docusaurus-llm-docs/releases)
[![GitHub Marketplace](https://img.shields.io/badge/Marketplace-Docusaurus%20LLM%20Docs-blue?logo=github)](https://github.com/marketplace/actions/docusaurus-llm-docs-generator)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![GitHub Stars](https://img.shields.io/github/stars/osodevops/docusaurus-llm-docs?style=social)](https://github.com/osodevops/docusaurus-llm-docs)

</div>

## Features

- 📄 **LLM-Ready Format**: Generates `llms.txt` index for AI navigation
- 📦 **Markdown Archive**: Creates `markdown.zip` with all docs as clean markdown
- 🔗 **Smart Link Transformation**: Converts internal links to absolute URLs
- 🧹 **Clean Conversion**: Strips HTML/JSX, preserves code blocks and formatting
- 📋 **Sidebar Aware**: Reads your `sidebars.js` for proper hierarchy
- 💡 **Admonition Support**: Converts Docusaurus admonitions to GitHub alerts
- 🚀 **Zero Config**: Works out of the box with any Docusaurus site
- ⚡ **Fast**: Processes 50+ pages in under 2 seconds

## Quick Start

### 1. Add the Workflow

Create `.github/workflows/llm-docs.yml` in your Docusaurus repository:

```yaml
name: Generate LLM Documentation

on:
  push:
    branches: [main]
    paths:
      - 'docs/**'
      - 'docusaurus.config.js'
      - 'sidebars.js'
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build Docusaurus site
        run: npm run build

      - name: Generate LLM documentation
        uses: osodevops/docusaurus-llm-docs@v1
        id: llm-docs
        with:
          build-dir: './build'
          output-dir: './build/llm-docs'
          base-url: 'https://yourusername.github.io/your-repo'
          product-name: 'Your Product Name'
          tagline: 'Your product tagline'

      - name: Copy LLM docs to build root
        run: |
          cp ${{ steps.llm-docs.outputs.llms-txt-path }} ./build/llms.txt
          cp ${{ steps.llm-docs.outputs.markdown-zip-path }} ./build/markdown.zip

      - name: Upload Pages artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: './build'

      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

### 2. Configure Your Settings

Update these values in the workflow:
- `base-url`: Your documentation site URL
- `product-name`: Your product name (appears in llms.txt header)
- `tagline`: Short description of your product

### 3. Run the Workflow

**Manual trigger:**
1. Go to **Actions** tab
2. Select **Generate LLM Documentation**
3. Click **Run workflow**

**Automatic runs:**
- Triggers on push to `main` when docs change
- Customize triggers in the workflow file

### 4. Access Your LLM Docs

After deployment, your LLM documentation is available at:
- `https://your-site.com/llms.txt` - Navigation index for LLMs
- `https://your-site.com/markdown.zip` - Complete docs archive

## Output Example

### llms.txt

```markdown
# Your Product Documentation

Your product tagline here

> [!TIP]
> A complete archive of all documentation in Markdown format is available at https://your-site.com/markdown.zip

## Getting Started
- [Installation](https://your-site.com/getting-started/installation.md): How to install
- [Quick Start](https://your-site.com/getting-started/quick-start.md): Get running in 5 minutes

## API Reference
- [Authentication](https://your-site.com/api/authentication.md): API authentication guide
- [Endpoints](https://your-site.com/api/endpoints.md): Available API endpoints
```

### markdown.zip Structure

```
markdown/
├── getting-started/
│   ├── installation.md
│   └── quick-start.md
├── api/
│   ├── authentication.md
│   └── endpoints.md
└── guides/
    ├── deployment.md
    └── troubleshooting.md
```

### Markdown File Content

Clean markdown with proper formatting:

```markdown
# Installation

This guide covers installing the SDK in your project.

## Prerequisites

- Node.js 18 or higher
- npm or yarn

## Install via npm

\`\`\`bash
npm install your-package
\`\`\`

> [!TIP]
> You can also use yarn: `yarn add your-package`
```

## Configuration Options

### Action Inputs

| Input | Required | Default | Description |
|-------|----------|---------|-------------|
| `build-dir` | No | `./build` | Path to Docusaurus build directory |
| `output-dir` | No | `./llm-docs` | Output directory for generated files |
| `base-url` | ✅ Yes | - | Base URL for documentation links |
| `product-name` | ✅ Yes | - | Product name for llms.txt header |
| `tagline` | No | `''` | Product tagline for llms.txt |
| `sidebar-path` | No | `./sidebars.js` | Path to sidebars.js file |
| `include-descriptions` | No | `true` | Include page descriptions in llms.txt |
| `strip-html` | No | `true` | Remove any remaining HTML from output |

### Action Outputs

| Output | Description |
|--------|-------------|
| `llms-txt-path` | Path to generated llms.txt file |
| `markdown-zip-path` | Path to generated markdown.zip archive |
| `files-generated` | Number of markdown files generated |
| `sections-count` | Number of documentation sections |

## Advanced Usage

### Without Sidebar

If your Docusaurus site doesn't use `sidebars.js`, the action automatically discovers pages from the build output:

```yaml
- uses: osodevops/docusaurus-llm-docs@v1
  with:
    base-url: 'https://docs.example.com'
    product-name: 'My Docs'
    # sidebar-path not needed - auto-discovery kicks in
```

### Custom Sidebar Location

```yaml
- uses: osodevops/docusaurus-llm-docs@v1
  with:
    base-url: 'https://docs.example.com'
    product-name: 'My Docs'
    sidebar-path: './config/custom-sidebar.js'
```

### Generate as Artifact Only

Don't deploy to Pages, just create an artifact:

```yaml
- name: Generate LLM documentation
  uses: osodevops/docusaurus-llm-docs@v1
  id: llm-docs
  with:
    base-url: 'https://docs.example.com'
    product-name: 'My Docs'
    output-dir: './llm-output'

- name: Upload artifact
  uses: actions/upload-artifact@v4
  with:
    name: llm-docs
    path: ./llm-output/
```

## Requirements

- ✅ Docusaurus 2.x or 3.x site
- ✅ Node.js 20+
- ✅ A built Docusaurus site (`npm run build`)
- ✅ GitHub Actions enabled

## How It Works

1. **Parse Sidebar**: Reads your `sidebars.js` to understand documentation structure
2. **Find HTML**: Locates all HTML files in the Docusaurus build output
3. **Convert to Markdown**: Uses Cheerio + Turndown to convert HTML to clean markdown
4. **Transform Links**: Converts internal links to absolute URLs with `.md` extensions
5. **Generate Index**: Creates `llms.txt` with hierarchical navigation
6. **Create Archive**: Packages all markdown files into `markdown.zip`

## Troubleshooting

### No pages processed

**Check:**
1. Docusaurus build completed successfully (`npm run build`)
2. Build directory contains HTML files
3. `build-dir` path is correct

### Missing pages in output

**Check:**
1. Pages exist in your `sidebars.js`
2. Pages have corresponding HTML in build output
3. Review action logs for warnings about skipped pages

### Links are broken

**Check:**
1. `base-url` matches your deployed site URL
2. Include trailing path if using a subdirectory (e.g., `/docs`)

## Local Development

Test the action locally before deploying:

```bash
# Clone this repo
git clone https://github.com/osodevops/docusaurus-llm-docs.git
cd docusaurus-llm-docs

# Install dependencies
npm install

# Build
npm run build

# Run against a Docusaurus build
BUILD_DIR=/path/to/docusaurus/build \
BASE_URL=https://example.com \
PRODUCT_NAME="My Docs" \
npm start
```

## Security & Privacy

- ✅ All processing happens in GitHub Actions
- ✅ No external API calls or data transmission
- ✅ Open source - audit the code yourself
- ✅ Only reads from your build directory

## Contributing

Contributions welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License - see [LICENSE](LICENSE) file for details

## Support

- 📖 [Documentation](https://github.com/osodevops/docusaurus-llm-docs#readme)
- 🐛 [Report Issues](https://github.com/osodevops/docusaurus-llm-docs/issues)
- 💬 [Discussions](https://github.com/osodevops/docusaurus-llm-docs/discussions)

## Credits

Built with ❤️ by [OSO DevOps](https://github.com/osodevops)

Inspired by:
- [Cloudflare's LLM documentation format](https://developers.cloudflare.com/llms.txt)
- [Zoom Meeting Notes Archiver](https://github.com/marketplace/actions/zoom-to-markdown)

Powered by:
- [Docusaurus](https://docusaurus.io/)
- [GitHub Actions](https://github.com/features/actions)
- [TypeScript](https://www.typescriptlang.org/)
- [Cheerio](https://cheerio.js.org/)
- [Turndown](https://github.com/mixmark-io/turndown)
