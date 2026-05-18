interface Faq {
  q: string;
  a: string;
}

export interface ToolSeo {
  searchTitle: string;
  longDescription: string;
  useCases: string[];
  features: string[];
  faqs: Faq[];
}

export const TOOL_SEO: Record<string, ToolSeo> = {
  resize: {
    searchTitle: "Resize Images Online Free",
    longDescription:
      "Resize images by exact pixels, percentage, or ready-made social media presets for Instagram, Twitter, Facebook, YouTube, and more. Supports batch processing so you can resize hundreds of files at once without leaving your network.",
    useCases: [
      "Prepare product images for your e-commerce store in exact pixel dimensions",
      "Batch resize photos for social media posts across multiple platforms",
      "Downscale high-resolution images for faster website load times",
      "Generate multiple sizes from a single source image for responsive design",
    ],
    features: [
      "Resize by pixels, percentage, or exact dimensions",
      "23 social media presets (Instagram, Twitter, Facebook, YouTube, LinkedIn, TikTok)",
      "Batch processing for hundreds of files at once",
      "Maintains aspect ratio with lock toggle",
      "Supports JPEG, PNG, WebP, AVIF, TIFF, HEIC, and RAW input",
    ],
    faqs: [
      {
        q: "How do I resize an image without losing quality?",
        a: "Use the percentage mode to scale down proportionally, or set exact pixel dimensions with the aspect ratio lock enabled. Downscaling preserves quality well. For upscaling without blur, use the AI Upscaling tool instead.",
      },
      {
        q: "Can I resize multiple images at once?",
        a: "Yes. Drop multiple files into SnapOtter and they will all be resized with the same settings. You can also use the REST API to automate batch resizing in your pipeline.",
      },
      {
        q: "What image formats are supported for resizing?",
        a: "SnapOtter accepts JPEG, PNG, WebP, AVIF, TIFF, GIF, HEIC, PSD, and RAW camera files. Output can be any of these formats. HEIC from iPhones is auto-converted on upload.",
      },
    ],
  },
  crop: {
    searchTitle: "Crop Image Online Free",
    longDescription:
      "Crop images with freeform selection, locked aspect ratios, or preset dimensions. Supports shape-based cropping for circles, rounded rectangles, and custom masks. Everything runs locally with zero data leaving your server.",
    useCases: [
      "Crop product photos to consistent aspect ratios for catalog listings",
      "Create circular profile pictures from rectangular source images",
      "Trim whitespace and margins from scanned documents",
      "Cut precise regions from screenshots for documentation",
    ],
    features: [
      "Freeform, fixed aspect ratio, and pixel-precise crop modes",
      "Shape crops: circle, rounded rectangle, custom masks",
      "Preset ratios for common platforms (16:9, 4:3, 1:1, 3:2)",
      "Interactive drag-to-select crop region",
      "Batch crop with consistent dimensions",
    ],
    faqs: [
      {
        q: "Can I crop an image into a circle?",
        a: "Yes. Select the circle shape crop mode, position your selection, and export as PNG to preserve transparency. The circular crop creates a transparent background around the subject.",
      },
      {
        q: "How do I crop to an exact pixel size?",
        a: "Enter your target width and height in pixels, then drag the crop region to select which part of the image to keep. The selection will maintain your exact dimensions.",
      },
      {
        q: "Does cropping reduce image quality?",
        a: "Cropping does not recompress or degrade the image. The cropped area is extracted at the original quality. Only the portion outside the crop is removed.",
      },
    ],
  },
  rotate: {
    searchTitle: "Rotate and Flip Image Online",
    longDescription:
      "Rotate images by any angle, flip horizontally or vertically, and straighten crooked photos. Auto-detects EXIF orientation data so images display correctly regardless of how they were captured.",
    useCases: [
      "Fix photos taken in the wrong orientation on mobile devices",
      "Straighten scanned documents and architectural photos",
      "Create mirror-image versions of design assets",
      "Batch rotate images from a camera that records incorrect EXIF data",
    ],
    features: [
      "Rotate by 90, 180, 270 degrees or any custom angle",
      "Horizontal and vertical flip",
      "Auto-straighten using EXIF orientation data",
      "Batch rotate entire directories",
      "Lossless JPEG rotation when possible",
    ],
    faqs: [
      {
        q: "How do I rotate an image 90 degrees?",
        a: "Select 90 degrees from the rotation presets and click process. The image is rotated clockwise. For counter-clockwise, use 270 degrees.",
      },
      {
        q: "Can I straighten a crooked photo?",
        a: "Yes. Use the custom angle rotation to enter the exact degree of correction needed. For scanned documents, even 1-2 degrees of correction makes a visible difference.",
      },
      {
        q: "What is the difference between rotate and flip?",
        a: "Rotating turns the image around its center by a given angle. Flipping mirrors it along an axis, creating a mirror image horizontally (left-right swap) or vertically (top-bottom swap).",
      },
    ],
  },
  convert: {
    searchTitle: "Image Format Converter - HEIC, WebP, PNG, JPEG",
    longDescription:
      "Convert images between all major formats including JPEG, PNG, WebP, AVIF, TIFF, GIF, and HEIF. Handles RAW camera files, PSD layers, and HEIC from iPhones. Batch convert entire directories with a single action.",
    useCases: [
      "Convert HEIC photos from iPhones to JPEG for universal compatibility",
      "Batch convert PNG assets to WebP for smaller file sizes on the web",
      "Transform RAW camera files into standard formats for editing",
      "Convert legacy TIFF archives into modern formats for web delivery",
    ],
    features: [
      "Input: JPEG, PNG, WebP, AVIF, TIFF, GIF, HEIC, PSD, RAW (CR2, NEF, ARW, DNG)",
      "Output: JPEG, PNG, WebP, AVIF, TIFF, GIF, HEIF",
      "Quality control slider for lossy formats",
      "Batch convert hundreds of files in one operation",
      "Automatic HEIC/RAW detection and decoding",
    ],
    faqs: [
      {
        q: "How do I convert HEIC to JPG?",
        a: "Upload your HEIC file, select JPEG as the output format, adjust quality if needed, and click process. SnapOtter decodes HEIC natively without sending your file to any cloud service.",
      },
      {
        q: "What is the best image format for the web?",
        a: "WebP offers the best balance of quality and file size for modern browsers. AVIF is even smaller but has less browser support. Use JPEG as a fallback for maximum compatibility.",
      },
      {
        q: "Can I convert RAW camera files?",
        a: "Yes. SnapOtter supports CR2 (Canon), NEF (Nikon), ARW (Sony), DNG, and other common RAW formats. They are decoded and converted to your chosen output format.",
      },
    ],
  },
  compress: {
    searchTitle: "Compress Images Online - Reduce File Size",
    longDescription:
      "Reduce image file size by adjusting quality levels or targeting a specific file size. Smart compression preserves visual quality while dramatically cutting bytes. Supports all major formats with real-time preview of compression results.",
    useCases: [
      "Compress product images to meet marketplace upload limits",
      "Reduce photo sizes for email attachments without visible quality loss",
      "Optimize image libraries to save storage costs",
      "Hit specific file size targets for web performance budgets",
    ],
    features: [
      "Quality-based compression (1-100 scale) with live preview",
      "Target file size mode (e.g., compress to under 200KB)",
      "Supports JPEG, PNG, WebP, and AVIF compression",
      "Real-time before/after size comparison",
      "Batch compress entire folders",
    ],
    faqs: [
      {
        q: "How much can I compress an image without losing quality?",
        a: "Most JPEG images can be compressed to 70-80% quality with no visible difference. PNG files can often be reduced 30-50% with lossless optimization. The live preview lets you judge quality before saving.",
      },
      {
        q: "How do I compress an image to a specific file size?",
        a: "Use target size mode and enter your limit (e.g., 200KB). SnapOtter automatically finds the right quality level to hit your target while maximizing visual quality.",
      },
      {
        q: "Does compression change the image dimensions?",
        a: "No. Compression reduces file size by optimizing encoding, not by changing pixel dimensions. Your image keeps the same width and height.",
      },
    ],
  },
  "optimize-for-web": {
    searchTitle: "Optimize Images for Web - Speed Up Your Website",
    longDescription:
      "Optimize images specifically for web delivery with smart format selection, quality tuning, and live preview. Automatically picks the best format and compression level for each image to maximize quality while minimizing file size.",
    useCases: [
      "Prepare images for a website redesign with optimal file sizes",
      "Batch optimize an entire media library for faster page loads",
      "Convert and compress images to WebP or AVIF for modern browsers",
      "Preview optimization results before committing to quality settings",
    ],
    features: [
      "Smart format selection (WebP, AVIF, JPEG) based on image content",
      "Target quality or target file size mode",
      "Live preview with before/after comparison",
      "Batch processing for entire media libraries",
      "Output includes web-ready file names (lowercase, hyphens)",
    ],
    faqs: [
      {
        q: "What is the best image format for website speed?",
        a: "WebP typically offers 30% smaller files than JPEG at equivalent quality and is supported by all modern browsers. AVIF is even smaller but has less browser support. SnapOtter can auto-select the best format.",
      },
      {
        q: "How do images affect page load speed?",
        a: "Images are usually the largest assets on a web page. Unoptimized images can add seconds to load time, hurting both user experience and search engine rankings. Compression and format conversion are the most impactful optimizations.",
      },
      {
        q: "Should I use WebP or AVIF for my website?",
        a: "WebP has universal browser support and great compression. AVIF offers better compression but limited support in older browsers. For maximum compatibility, serve WebP with a JPEG fallback.",
      },
    ],
  },
  "strip-metadata": {
    searchTitle: "Remove EXIF Data and GPS from Photos",
    longDescription:
      "Remove EXIF data, GPS coordinates, camera information, and other metadata from images. Protect privacy by stripping location data before sharing photos online. Process in bulk to clean entire directories at once.",
    useCases: [
      "Remove GPS coordinates from photos before posting to social media",
      "Strip camera serial numbers and lens data for anonymous submissions",
      "Clean metadata from user-uploaded images to protect privacy",
      "Reduce file size by removing embedded thumbnails and ICC profiles",
    ],
    features: [
      "Removes EXIF, IPTC, XMP, and GPS metadata",
      "Option to keep color profile (ICC) while stripping everything else",
      "Batch strip metadata from entire directories",
      "Shows before/after metadata comparison",
      "Reduces file size by removing embedded thumbnails",
    ],
    faqs: [
      {
        q: "Do photos contain GPS location data?",
        a: "Yes, most smartphones embed GPS coordinates in photo metadata by default. This means anyone who downloads your photo can see exactly where it was taken. Stripping metadata removes this location data.",
      },
      {
        q: "Does removing metadata change the image quality?",
        a: "No. Metadata is stored separately from the pixel data. Removing it does not alter the visible image in any way. It can actually reduce file size slightly.",
      },
      {
        q: "What metadata do social media platforms strip?",
        a: "Most platforms strip EXIF data on upload, but not all do it completely. To be safe, strip metadata yourself before sharing. This also protects you when sharing via email, messaging apps, or direct downloads.",
      },
    ],
  },
  "edit-metadata": {
    searchTitle: "EXIF Metadata Editor - Edit Photo Data Online",
    longDescription:
      "View and edit EXIF, IPTC, and XMP metadata in images. Modify GPS coordinates, copyright fields, camera info, dates, and custom tags. Useful for photographers and archivists who need precise control over image metadata.",
    useCases: [
      "Add copyright and attribution data to photo collections",
      "Correct GPS coordinates on geotagged images",
      "Update date stamps on scanned analog photographs",
      "Add IPTC keywords and captions for digital asset management",
    ],
    features: [
      "Edit EXIF, IPTC, and XMP fields",
      "Modify GPS coordinates with map preview",
      "Set copyright, author, and description fields",
      "Correct date/time stamps",
      "Batch apply metadata to multiple files",
    ],
    faqs: [
      {
        q: "What is EXIF data in a photo?",
        a: "EXIF (Exchangeable Image File Format) is metadata embedded in image files by cameras and phones. It includes camera model, shutter speed, aperture, ISO, date taken, GPS location, and more.",
      },
      {
        q: "Can I add copyright information to my photos?",
        a: "Yes. Use the metadata editor to set the Copyright, Artist, and Rights fields. This embeds your ownership information directly in the image file so it travels with the image.",
      },
      {
        q: "How do I change the date on a photo?",
        a: "Open the image in the metadata editor and modify the DateTimeOriginal field. This is useful for scanned photos where you want to record the original date of the physical print.",
      },
    ],
  },
  "bulk-rename": {
    searchTitle: "Batch Rename Images - Bulk File Renaming Tool",
    longDescription:
      "Rename multiple image files using customizable patterns with variables like sequential numbers, dates, dimensions, and original names. Preview all renames before applying. Supports regex patterns for advanced renaming workflows.",
    useCases: [
      "Rename a photo shoot with consistent naming like 'wedding-001.jpg'",
      "Add date prefixes to organize photo archives chronologically",
      "Standardize file names from multiple cameras into a single naming scheme",
      "Replace spaces and special characters for web-safe file names",
    ],
    features: [
      "Pattern-based renaming with variables ({n}, {date}, {width}, {name})",
      "Sequential numbering with configurable start and padding",
      "Find-and-replace with regex support",
      "Live preview of all renames before applying",
      "Undo support to revert batch renames",
    ],
    faqs: [
      {
        q: "How do I batch rename photos with a sequence number?",
        a: "Set the pattern to something like 'vacation-{n}' where {n} is the auto-incrementing number. Configure the start number and zero-padding (e.g., 001, 002, 003).",
      },
      {
        q: "Can I rename files using their EXIF date?",
        a: "Yes. Use the {date} variable in your naming pattern to insert the date the photo was taken. Format it as needed (YYYY-MM-DD or similar).",
      },
      {
        q: "Will renaming change the file content?",
        a: "No. Renaming only changes the file name on disk. The image data, metadata, and quality remain completely unchanged.",
      },
    ],
  },
  "image-to-pdf": {
    searchTitle: "Image to PDF Converter - Combine Photos into PDF",
    longDescription:
      "Combine multiple images into a single PDF document with control over page size, margins, orientation, and image positioning. Drag to reorder pages before generating. Great for creating portfolios, reports, and multi-page documents from image files.",
    useCases: [
      "Combine scanned pages into a single PDF document",
      "Create photo portfolios and lookbooks in PDF format",
      "Bundle receipt images into a single file for expense reports",
      "Generate multi-page product catalogs from individual images",
    ],
    features: [
      "Combine unlimited images into one PDF",
      "Page size presets: A4, Letter, Legal, and custom dimensions",
      "Landscape or portrait orientation per page",
      "Drag-and-drop page reordering",
      "Adjustable margins and image fit modes",
    ],
    faqs: [
      {
        q: "How do I convert multiple JPGs to a single PDF?",
        a: "Upload all your JPG files, arrange them in your preferred order by dragging, select your page size, and click process. SnapOtter generates a single PDF with each image on its own page.",
      },
      {
        q: "Can I control the page size of the PDF?",
        a: "Yes. Choose from standard sizes (A4, Letter, Legal) or enter custom dimensions in millimeters. You can also choose portrait or landscape orientation.",
      },
      {
        q: "What image formats can I convert to PDF?",
        a: "Any format SnapOtter supports: JPEG, PNG, WebP, TIFF, HEIC, and more. They are all rendered into the PDF at full quality.",
      },
    ],
  },
  favicon: {
    searchTitle: "Favicon Generator - Create All Sizes from One Image",
    longDescription:
      "Generate a complete favicon package from a single source image. Creates all standard sizes including ICO, Apple Touch icons, Android Chrome icons, and web manifest files. One upload produces everything you need for modern browsers.",
    useCases: [
      "Generate all favicon sizes for a new website launch",
      "Create Apple Touch and Android manifest icons from a logo",
      "Update favicons across all platforms from a single source",
      "Generate PWA icon sets with correct sizes and formats",
    ],
    features: [
      "Generates ICO (16x16, 32x32, 48x48), Apple Touch (180x180), Android Chrome (192x192, 512x512)",
      "Outputs web manifest JSON snippet",
      "Supports transparent PNG and solid background inputs",
      "ZIP download with all sizes and manifest",
      "SVG favicon support for modern browsers",
    ],
    faqs: [
      {
        q: "What sizes do I need for a favicon?",
        a: "At minimum: favicon.ico (32x32), apple-touch-icon.png (180x180), and android-chrome (192x192, 512x512). SnapOtter generates all of these plus intermediate sizes in a single ZIP.",
      },
      {
        q: "What image format works best as a favicon source?",
        a: "Use a square PNG with transparency (at least 512x512 pixels). SVG sources also work well since they scale cleanly. Avoid photos or complex images that lose detail at small sizes.",
      },
      {
        q: "Do I need a web manifest for favicons?",
        a: "For PWAs and Android home screen icons, yes. SnapOtter includes a manifest.json snippet with your generated icons already referenced.",
      },
    ],
  },
  "adjust-colors": {
    searchTitle: "Adjust Image Colors - Brightness, Contrast, Saturation",
    longDescription:
      "Fine-tune image appearance with controls for brightness, contrast, exposure, saturation, temperature, tint, sharpness, and artistic effects. Apply adjustments to single images or batch process entire folders. Live preview shows changes in real time.",
    useCases: [
      "Correct white balance on product photography shot under mixed lighting",
      "Batch apply consistent color grading across a set of images",
      "Boost contrast and saturation on flat-looking phone photos",
      "Create stylized looks with temperature and tint adjustments",
    ],
    features: [
      "Brightness, contrast, exposure, and gamma controls",
      "Saturation, vibrance, hue, and temperature adjustments",
      "Built-in effects: grayscale, sepia, vintage, and more",
      "Live before/after preview",
      "Batch process with saved presets",
    ],
    faqs: [
      {
        q: "How do I fix a photo that is too dark?",
        a: "Increase the brightness and exposure sliders. If the highlights blow out, bring down the contrast slightly. The live preview shows your changes in real time so you can fine-tune.",
      },
      {
        q: "What is the difference between saturation and vibrance?",
        a: "Saturation increases the intensity of all colors equally. Vibrance boosts muted colors more than already-saturated ones, making it better for photos with skin tones (it avoids making faces look orange).",
      },
      {
        q: "Can I apply the same color adjustments to multiple images?",
        a: "Yes. Set your adjustments on one image, then batch process the rest of your files. All images will receive the same corrections, ensuring visual consistency across a set.",
      },
    ],
  },
  sharpening: {
    searchTitle: "Sharpen Image Online - Unsharp Mask and Adaptive",
    longDescription:
      "Sharpen images using three professional methods: adaptive sharpening, unsharp mask, and high-pass filtering. Includes presets for common use cases like web display, print preparation, and portrait enhancement. Fine-tune radius, amount, and threshold for precise control.",
    useCases: [
      "Sharpen product photos for crisp display on e-commerce sites",
      "Prepare images for print with appropriate sharpening levels",
      "Rescue slightly soft images from smartphone cameras",
      "Apply targeted sharpening to landscape and architecture photography",
    ],
    features: [
      "Three methods: adaptive, unsharp mask, and high-pass",
      "Radius, amount, and threshold controls",
      "Presets for web, print, portrait, and landscape",
      "Live preview with before/after comparison",
      "Batch sharpening with consistent settings",
    ],
    faqs: [
      {
        q: "What is the best way to sharpen an image for the web?",
        a: "Use unsharp mask with a radius of 0.5-1.0, amount of 80-120%, and threshold of 2-4. This adds crispness without introducing visible halos around edges.",
      },
      {
        q: "What is the difference between unsharp mask and adaptive sharpening?",
        a: "Unsharp mask applies uniform sharpening across the entire image. Adaptive sharpening analyzes each region and applies more sharpening to edges while leaving smooth areas untouched, producing more natural results.",
      },
      {
        q: "Can over-sharpening damage an image?",
        a: "Sharpening is non-destructive in SnapOtter (the original is preserved). However, excessive sharpening creates visible halos around edges and amplifies noise. Use the preview to find the right balance.",
      },
    ],
  },
  "replace-color": {
    searchTitle: "Replace Color in Image Online",
    longDescription:
      "Replace specific colors in images with tolerance control, or fully invert all colors. Pick source and target colors with a color picker or enter exact hex values. Useful for brand color adjustments and creative effects.",
    useCases: [
      "Change product colors for variant images without re-shooting",
      "Replace background colors in logos and icons",
      "Invert colors for dark mode versions of diagrams",
      "Adjust brand colors across a batch of marketing assets",
    ],
    features: [
      "Color picker and hex code input for source and target",
      "Adjustable tolerance for matching similar shades",
      "Full color inversion mode",
      "Batch replace across multiple images",
      "Preserves transparency and alpha channels",
    ],
    faqs: [
      {
        q: "How do I change a specific color in an image?",
        a: "Select the source color using the eyedropper or enter a hex code, set your replacement color, and adjust tolerance to control how many similar shades are affected. Preview shows the result before saving.",
      },
      {
        q: "What does the tolerance setting do?",
        a: "Tolerance controls how closely a pixel must match the source color to be replaced. Low tolerance replaces only exact matches. Higher tolerance replaces a wider range of similar shades.",
      },
      {
        q: "Can I invert the colors of an image?",
        a: "Yes. Use the invert mode to swap every color with its opposite (white becomes black, red becomes cyan, etc.). This is useful for creating dark mode versions of diagrams and line art.",
      },
    ],
  },
  "color-blindness": {
    searchTitle: "Color Blindness Simulator - Accessibility Testing",
    longDescription:
      "Simulate how images appear to people with different types of color vision deficiency, including protanopia, deuteranopia, tritanopia, and achromatopsia. Essential for accessibility testing of UI designs, infographics, and data visualizations.",
    useCases: [
      "Test UI designs for accessibility before shipping to production",
      "Verify data visualizations are readable for color-blind users",
      "Check that color-coded maps and charts remain distinguishable",
      "Audit marketing materials for inclusive color usage",
    ],
    features: [
      "Simulates 8 types of color vision deficiency",
      "Protanopia, deuteranopia, tritanopia, and achromatopsia",
      "Side-by-side comparison with original",
      "Batch test across multiple screenshots",
      "WCAG accessibility context for each deficiency type",
    ],
    faqs: [
      {
        q: "What percentage of people are color blind?",
        a: "About 8% of men and 0.5% of women have some form of color vision deficiency. The most common types are red-green (protanopia and deuteranopia), affecting roughly 1 in 12 men.",
      },
      {
        q: "How do I make my designs accessible for color blind users?",
        a: "Never rely on color alone to convey information. Use shapes, patterns, labels, or icons alongside color. Test with a simulator like this to verify your designs remain clear under all deficiency types.",
      },
      {
        q: "What is the difference between protanopia and deuteranopia?",
        a: "Both are red-green color blindness. Protanopia reduces sensitivity to red light, making reds appear darker. Deuteranopia reduces sensitivity to green light. Both make red and green hard to distinguish, but in slightly different ways.",
      },
    ],
  },
  "remove-background": {
    searchTitle: "Remove Background from Image - AI Powered, Private",
    longDescription:
      "Remove image backgrounds automatically using AI-powered segmentation that runs entirely on your hardware. Handles complex edges like hair, fur, and transparent objects. No data is sent to external APIs. Supports batch processing for product catalogs.",
    useCases: [
      "Create transparent product images for e-commerce listings",
      "Remove backgrounds from headshots for company directories",
      "Isolate subjects for compositing and graphic design work",
      "Batch process product catalogs with consistent white backgrounds",
    ],
    features: [
      "AI segmentation (rembg) running 100% locally",
      "Handles hair, fur, glass, and semi-transparent edges",
      "Output as transparent PNG or custom background color",
      "Batch processing for product catalogs",
      "No data sent to external APIs or cloud services",
    ],
    faqs: [
      {
        q: "Is my image uploaded to a server when removing the background?",
        a: "No. SnapOtter runs the AI model entirely on your own hardware. Your images never leave your network. This is the key difference from cloud services like remove.bg.",
      },
      {
        q: "How well does AI background removal handle hair and fur?",
        a: "The rembg model handles fine details like hair, fur, and semi-transparent objects well. It produces clean edges even on complex subjects. For best results, use images with clear contrast between subject and background.",
      },
      {
        q: "Can I remove backgrounds from hundreds of product images at once?",
        a: "Yes. Upload your entire product catalog and batch process them all. Each image gets the same AI treatment. Processing time depends on your hardware, but GPU acceleration is supported.",
      },
    ],
  },
  upscale: {
    searchTitle: "Upscale Image with AI - Enhance Resolution",
    longDescription:
      "Upscale images using AI super-resolution models that add genuine detail, not just interpolated blur. Supports 2x and 4x scaling with models trained on real-world photography. Runs locally with GPU acceleration when available.",
    useCases: [
      "Upscale low-resolution product images for high-DPI displays",
      "Enlarge social media photos for print without losing quality",
      "Rescue detail from small thumbnails and cropped images",
      "Scale up vintage or historic photographs for modern displays",
    ],
    features: [
      "2x and 4x AI upscaling with RealESRGAN",
      "Adds genuine detail, not interpolation blur",
      "GPU acceleration (CUDA) when available",
      "Optimized models for photos, anime, and general content",
      "Runs 100% locally with no cloud dependency",
    ],
    faqs: [
      {
        q: "How is AI upscaling different from regular upscaling?",
        a: "Regular upscaling (bicubic, lanczos) interpolates between existing pixels, producing blur. AI upscaling uses a neural network trained on millions of images to predict and generate realistic detail that was not in the original.",
      },
      {
        q: "How large can I upscale an image?",
        a: "SnapOtter supports 2x and 4x scaling. A 500x500 image becomes 1000x1000 at 2x or 2000x2000 at 4x. Processing time increases with the output size and depends on whether you have GPU acceleration.",
      },
      {
        q: "Do I need a GPU for AI upscaling?",
        a: "A GPU (NVIDIA CUDA) significantly speeds up processing, but it is not required. CPU-only mode works on any hardware, just slower. A typical photo takes seconds on GPU, minutes on CPU.",
      },
    ],
  },
  "erase-object": {
    searchTitle: "Remove Objects from Photos with AI",
    longDescription:
      "Remove unwanted objects from images using AI inpainting that fills in the background naturally. Paint over people, signs, wires, or any distraction and the AI reconstructs what was behind them. Runs entirely on your own infrastructure.",
    useCases: [
      "Remove photobombers and distractions from travel photos",
      "Clean up product shots by erasing background clutter",
      "Remove watermarks from your own images after purchasing licenses",
      "Erase power lines and signs from real estate photography",
    ],
    features: [
      "AI inpainting with LaMa model (locally hosted)",
      "Brush tool to paint over objects to remove",
      "Natural background reconstruction",
      "Works on complex textures like grass, sky, walls, and patterns",
      "No cloud processing, all on your hardware",
    ],
    faqs: [
      {
        q: "How does AI object removal work?",
        a: "You paint a mask over the object you want to remove. The LaMa inpainting model then analyzes the surrounding area and generates realistic fill content that matches the texture, color, and pattern of the background.",
      },
      {
        q: "Can I remove text or watermarks from images?",
        a: "You can remove text overlays and watermarks from your own images. The AI fills in the area behind the text. Results depend on the complexity of the background underneath.",
      },
      {
        q: "What size objects can be removed?",
        a: "Small to medium objects work best (people, signs, wires, trash). Very large objects (covering more than 30-40% of the image) leave less context for the AI to work with, and results may be less convincing.",
      },
    ],
  },
  ocr: {
    searchTitle: "OCR - Extract Text from Image Online",
    longDescription:
      "Extract text from images using PaddleOCR, supporting 80+ languages including CJK characters, Arabic, and Hindi. Handles printed text, handwriting, and scene text in photographs. Outputs plain text with bounding box coordinates for each detected region.",
    useCases: [
      "Digitize text from scanned documents and receipts",
      "Extract data from screenshots and whiteboard photos",
      "Convert signage and labels in photographs to searchable text",
      "Automate data entry from printed forms and invoices",
    ],
    features: [
      "PaddleOCR engine with 80+ language support",
      "Handles printed text, handwriting, and scene text",
      "Returns text with bounding box coordinates",
      "CJK, Arabic, Hindi, Cyrillic, and Latin script support",
      "Batch OCR across multiple images",
    ],
    faqs: [
      {
        q: "What languages does the OCR support?",
        a: "Over 80 languages including English, Chinese, Japanese, Korean, Arabic, Hindi, Russian, and all major European languages. The PaddleOCR engine handles multiple scripts in a single image.",
      },
      {
        q: "Can OCR read handwritten text?",
        a: "PaddleOCR handles clearly written handwriting reasonably well, though accuracy is lower than with printed text. Best results come from high-contrast handwriting on clean backgrounds.",
      },
      {
        q: "Does the OCR work on photos of signs and documents?",
        a: "Yes. The scene text detection handles text in photographs (signs, menus, labels) as well as clean document scans. For best results, ensure the text is in focus and well-lit.",
      },
    ],
  },
  "blur-faces": {
    searchTitle: "Blur Faces in Photos - GDPR Compliant Anonymization",
    longDescription:
      "Automatically detect and blur faces and personally identifiable information in images using AI face detection. Supports adjustable blur intensity and region expansion. Process entire batches to anonymize photo collections while keeping non-face content sharp.",
    useCases: [
      "Anonymize faces in street photography for legal compliance",
      "Blur identities in surveillance footage before sharing",
      "Redact PII from document scans and form images",
      "Comply with GDPR and privacy regulations for published imagery",
    ],
    features: [
      "AI face detection with MediaPipe",
      "Adjustable blur intensity and region expansion",
      "Pixelation and Gaussian blur options",
      "Batch anonymize entire photo collections",
      "GDPR and privacy compliance for published imagery",
    ],
    faqs: [
      {
        q: "Is automatic face blurring GDPR compliant?",
        a: "Blurring faces helps meet GDPR requirements for publishing imagery of identifiable individuals without consent. SnapOtter detects and blurs all faces automatically, and since it runs on your infrastructure, the images never leave your control.",
      },
      {
        q: "Can I control how strong the blur is?",
        a: "Yes. Adjust the blur intensity from subtle softening to heavy pixelation. You can also expand the detected region to ensure ears, hair, and neck are covered if needed.",
      },
      {
        q: "Does it detect all faces in a group photo?",
        a: "The MediaPipe face detection model handles multiple faces per image, including small faces in the background. Very small, heavily occluded, or profile faces may be missed in some cases.",
      },
    ],
  },
  "smart-crop": {
    searchTitle: "Smart Crop - AI Subject-Aware Image Cropping",
    longDescription:
      "Crop images intelligently using subject detection, face detection, or trim-based cropping that removes uniform borders. The AI identifies the most important region and crops around it, keeping key content centered and properly composed.",
    useCases: [
      "Auto-crop product images to center on the product subject",
      "Generate focused headshots from full-body photos",
      "Trim whitespace and uniform borders from scanned images",
      "Batch crop a photo set with consistent subject-centered framing",
    ],
    features: [
      "Subject-aware cropping using AI detection",
      "Face-centered crop with head room control",
      "Trim mode to remove uniform borders and whitespace",
      "Custom aspect ratio with subject-aware positioning",
      "Batch smart crop with consistent framing",
    ],
    faqs: [
      {
        q: "How does smart crop differ from regular cropping?",
        a: "Regular cropping requires you to manually select the region. Smart crop uses AI to detect the main subject (person, product, or object) and automatically centers the crop around it, maintaining proper composition.",
      },
      {
        q: "Can I use smart crop to create headshots from full-body photos?",
        a: "Yes. The face detection mode finds faces and crops to a configurable framing (close-up, head and shoulders, upper body, or half body). This is great for batch-generating profile pictures from group or full-body shots.",
      },
      {
        q: "What does trim mode do?",
        a: "Trim mode detects and removes uniform borders or whitespace around the edges of an image. It is useful for cleaning up scanned documents, screenshots, and images with padding.",
      },
    ],
  },
  "image-enhancement": {
    searchTitle: "Enhance Image Quality Online - One-Click Auto Fix",
    longDescription:
      "Enhance images automatically with a single click. Smart analysis evaluates exposure, contrast, color balance, and sharpness, then applies targeted corrections. Handles under-exposed, washed-out, and flat-looking images without manual tweaking.",
    useCases: [
      "Quick-fix phone photos before sharing or printing",
      "Batch enhance product images for a consistent, polished look",
      "Improve visibility of under-exposed or hazy outdoor photos",
      "Auto-correct scanned photos with color casts from aging",
    ],
    features: [
      "One-click auto-enhancement with smart analysis",
      "Corrects exposure, contrast, color balance, and sharpness",
      "Handles under-exposed, over-exposed, and flat images",
      "Before/after comparison view",
      "Batch enhance for consistent results across a set",
    ],
    faqs: [
      {
        q: "What does auto-enhance actually change in my image?",
        a: "The algorithm analyzes your image and applies targeted corrections to exposure (if too dark or bright), contrast (if flat), color balance (if tinted), and sharpness (if soft). Only the areas that need correction are adjusted.",
      },
      {
        q: "Is one-click enhancement as good as manual editing?",
        a: "For typical phone photos and quick corrections, auto-enhance produces results comparable to basic manual editing. For creative or precise work, you may want to use the manual color adjustment tool for full control.",
      },
      {
        q: "Can I enhance a batch of images with the same settings?",
        a: "Yes. Upload multiple images and they will each be analyzed and corrected individually. Each image gets its own tailored correction, so the results are consistent in quality even if the originals vary.",
      },
    ],
  },
  "enhance-faces": {
    searchTitle: "AI Face Enhancement - Restore Blurry Faces in Photos",
    longDescription:
      "Restore and enhance faces in photos using AI that sharpens facial features, smooths skin, and recovers detail lost to compression, low resolution, or motion blur. Works well on group photos where faces are small.",
    useCases: [
      "Sharpen faces in group photos where subjects are far from the camera",
      "Restore detail in low-resolution portraits from older cameras",
      "Improve facial clarity in ID and badge photos",
      "Enhance faces in video frame captures for identification",
    ],
    features: [
      "AI face restoration and detail recovery",
      "Works on small faces in group photos",
      "Handles compression artifacts, blur, and low resolution",
      "Skin smoothing without losing texture",
      "Runs locally with no cloud dependency",
    ],
    faqs: [
      {
        q: "Can AI really add detail to a blurry face?",
        a: "The model was trained on millions of face images and predicts what the missing detail likely looks like. It is not recovering the original data, but generating plausible detail that looks natural. Results are impressive on moderately blurry faces.",
      },
      {
        q: "Does it work on group photos with small faces?",
        a: "Yes. The model detects each face in the image and enhances them individually. Small faces that are only 50-100 pixels wide can be significantly improved.",
      },
      {
        q: "Will face enhancement change how someone looks?",
        a: "The model preserves the person's identity and features. It sharpens and restores detail rather than altering appearance. However, heavily degraded inputs may produce faces that differ slightly from the original.",
      },
    ],
  },
  colorize: {
    searchTitle: "Colorize Black and White Photos with AI",
    longDescription:
      "Convert black-and-white photographs to full color using AI colorization. The model understands natural colors for skin tones, vegetation, sky, fabrics, and common objects. Process historic family photos, archival images, and grayscale scans.",
    useCases: [
      "Bring old family photos to life with realistic colorization",
      "Colorize archival and historic photographs for presentations",
      "Add color to grayscale scans for visual impact",
      "Preview what a space or object might look like in color from B&W reference images",
    ],
    features: [
      "Deep learning colorization trained on millions of images",
      "Natural skin tones, vegetation, sky, and fabric colors",
      "Works on photos, scans, and grayscale images",
      "Batch colorize entire photo collections",
      "100% local processing, no cloud required",
    ],
    faqs: [
      {
        q: "How accurate is AI colorization?",
        a: "The AI produces plausible, natural-looking colors based on context (sky is blue, grass is green, skin has warm tones). It cannot know the exact original colors of specific objects like clothing, so some details may differ from reality.",
      },
      {
        q: "Does it work on any black and white photo?",
        a: "It works best on clearly exposed photos with recognizable objects. Very dark, very faded, or heavily damaged photos may produce less convincing results. Consider using the photo restoration tool first for damaged images.",
      },
      {
        q: "Can I colorize multiple photos at once?",
        a: "Yes. Upload a batch of B&W images and they will all be processed. Each image is colorized independently based on its own content.",
      },
    ],
  },
  "noise-removal": {
    searchTitle: "Remove Noise from Image - AI Photo Denoiser",
    longDescription:
      "Remove noise and grain from images using AI denoising models. Handles high-ISO noise from low-light photography, compression artifacts from JPEG files, and grain from scanned film. Preserves detail and edges while smoothing noise.",
    useCases: [
      "Clean up noisy photos taken in low-light conditions",
      "Remove JPEG compression artifacts from web-sourced images",
      "Reduce film grain from scanned analog photographs",
      "Improve image quality from security cameras and low-end sensors",
    ],
    features: [
      "AI denoising that preserves edges and detail",
      "Handles ISO noise, JPEG artifacts, and film grain",
      "Adjustable denoising strength",
      "Before/after preview",
      "Batch denoise across multiple images",
    ],
    faqs: [
      {
        q: "What causes noise in photos?",
        a: "Noise comes from high ISO settings in low-light conditions, small camera sensors (phone cameras), JPEG compression artifacts, or grain in scanned film. The AI denoiser handles all of these sources.",
      },
      {
        q: "Does denoising reduce image sharpness?",
        a: "Traditional denoising (blur-based) can soften details. AI denoising is trained to distinguish noise from detail, so it smooths noise while preserving edges, textures, and fine detail in the image.",
      },
      {
        q: "Can I remove JPEG compression artifacts?",
        a: "Yes. JPEG artifacts (blocky patterns, color banding) are a form of noise. The AI model was trained to recognize and remove these artifacts while restoring smoother gradients.",
      },
    ],
  },
  "red-eye-removal": {
    searchTitle: "Red Eye Removal - Fix Flash Photos Online",
    longDescription:
      "Detect and fix red-eye caused by flash photography using AI eye detection. Automatically locates red-eye instances and corrects them with natural-looking results. Works on individual portraits and group photos alike.",
    useCases: [
      "Fix red-eye in family and event photos taken with flash",
      "Batch correct red-eye across an entire photo album",
      "Improve portrait quality for prints and photo books",
      "Clean up flash photography before uploading to galleries",
    ],
    features: [
      "AI-powered automatic red-eye detection",
      "Natural color correction that preserves eye detail",
      "Works on multiple faces in a single image",
      "Handles different eye colors and lighting conditions",
      "Batch processing for entire photo albums",
    ],
    faqs: [
      {
        q: "What causes red-eye in photos?",
        a: "Red-eye occurs when flash light reflects off the blood vessels at the back of the eye (retina). It is most common in low-light conditions when pupils are dilated, and when the flash is close to the lens (like on phone cameras).",
      },
      {
        q: "Does it work on pet photos with glowing eyes?",
        a: "The tool is optimized for human red-eye. Pet eye glow (which is often green or yellow due to the tapetum lucidum) requires different correction and may not be fully addressed.",
      },
      {
        q: "Can I fix red-eye in a group photo with many people?",
        a: "Yes. The AI detects all faces and eyes in the image and corrects each red-eye instance individually.",
      },
    ],
  },
  "restore-photo": {
    searchTitle: "Restore Old Photos with AI - Fix Scratches and Damage",
    longDescription:
      "Repair damaged photographs using AI that fixes scratches, tears, creases, stains, and color fading. Works on scanned prints and digitized film. The model reconstructs missing or damaged areas while preserving the original character of the image.",
    useCases: [
      "Restore damaged family heirlooms and vintage photographs",
      "Repair scanned photos with scratches and fold marks",
      "Fix water damage and staining on old prints",
      "Clean up archival photographs for preservation and display",
    ],
    features: [
      "Fixes scratches, tears, creases, stains, and fading",
      "AI reconstruction of damaged and missing areas",
      "Color correction for yellowed and faded prints",
      "Works on scanned prints and digitized film",
      "Preserves the original character and grain of vintage photos",
    ],
    faqs: [
      {
        q: "What types of damage can be repaired?",
        a: "Scratches, tears, fold creases, water stains, mold spots, and color fading. The AI reconstructs the damaged area based on the surrounding content. Severe damage (large missing sections) may produce less accurate results.",
      },
      {
        q: "Should I scan the photo before or after cleaning the physical print?",
        a: "Scan it as-is at the highest resolution your scanner supports (300+ DPI). The AI handles digital restoration better than physical cleaning, which can cause further damage to fragile prints.",
      },
      {
        q: "Can I combine photo restoration with colorization?",
        a: "Yes. Use the restore tool first to fix damage, then run the colorized version through the AI colorization tool. SnapOtter's pipeline feature can chain these steps automatically.",
      },
    ],
  },
  "passport-photo": {
    searchTitle: "Passport Photo Maker - Compliant for 30+ Countries",
    longDescription:
      "Generate compliant passport and ID photos for 30+ countries using AI face detection and automatic cropping. Handles background replacement, head size validation, and print layout generation. Meets ICAO standards for official document photos.",
    useCases: [
      "Create passport photos at home without a photo studio",
      "Generate compliant ID photos for visa applications",
      "Batch produce employee badge photos with consistent formatting",
      "Print passport photo sheets on standard paper sizes",
    ],
    features: [
      "Specs for 30+ countries (US, UK, EU, India, China, Japan, and more)",
      "AI face detection with automatic cropping to spec",
      "Background replacement to white or required color",
      "Head size and eye line validation per country standard",
      "Print layout generation (4x6, A4) with multiple copies",
    ],
    faqs: [
      {
        q: "Which countries are supported?",
        a: "Over 30 countries including US, Canada, UK, EU (Germany, France, Italy, Spain, Netherlands), India, China, Japan, South Korea, Australia, and more. Each uses the official photo spec for that country's passport.",
      },
      {
        q: "Are the photos accepted for official passports?",
        a: "The tool generates photos that meet ICAO and country-specific dimensional standards (head size, eye line position, background color). Final acceptance depends on photo quality, lighting, and expression, which are your responsibility.",
      },
      {
        q: "Can I print the passport photos at home?",
        a: "Yes. The tool generates a print-ready layout with multiple copies arranged on standard paper sizes (4x6 inch or A4). Print on glossy photo paper with a color printer for best results.",
      },
    ],
  },
  "content-aware-resize": {
    searchTitle: "Content-Aware Resize - Seam Carving Tool",
    longDescription:
      "Resize images using seam carving, an algorithm that intelligently removes or adds pixels along the least important paths in an image. Preserves faces, text, and high-detail regions while adjusting dimensions. Far better than simple scaling for changing aspect ratios.",
    useCases: [
      "Change image aspect ratios without cropping or distorting subjects",
      "Fit images into banner formats while keeping key content intact",
      "Remove empty space from images without affecting important details",
      "Resize product images for different display contexts without re-shooting",
    ],
    features: [
      "Seam carving algorithm that preserves important content",
      "Face protection to avoid distorting faces",
      "Works for both width and height reduction",
      "Better than cropping for aspect ratio changes",
      "Energy map visualization showing preservation priority",
    ],
    faqs: [
      {
        q: "What is seam carving?",
        a: "Seam carving removes or adds vertical or horizontal pixel paths (seams) that pass through the least important areas of an image. This allows resizing without uniformly scaling or cropping, preserving the most visually significant content.",
      },
      {
        q: "When should I use content-aware resize instead of regular resize?",
        a: "Use it when you need to change the aspect ratio (e.g., make a landscape image narrower) without losing important content. Regular resize distorts proportions; content-aware resize removes unimportant areas instead.",
      },
      {
        q: "Does it work well on all images?",
        a: "Best on images with clear subjects and some empty or low-detail space (sky, walls, water). Images that are uniformly detailed with no obvious 'less important' areas may produce visible artifacts.",
      },
    ],
  },
  "ai-canvas-expand": {
    searchTitle: "AI Outpainting - Expand Image Canvas with AI Fill",
    longDescription:
      "Expand the canvas of an image and fill the new area with AI-generated content that matches the existing image seamlessly. Extend backgrounds, widen compositions, or add headroom above subjects. Powered by local inpainting models.",
    useCases: [
      "Extend landscape photos to wider aspect ratios for banners",
      "Add headroom above subjects for text overlay in designs",
      "Widen product photos to fit different layout requirements",
      "Expand backgrounds for presentation slides and marketing materials",
    ],
    features: [
      "AI-powered outpainting using local LaMa model",
      "Expand in any direction (top, bottom, left, right)",
      "Seamless blending with existing image content",
      "Custom canvas size or aspect ratio target",
      "No cloud processing, runs on your hardware",
    ],
    faqs: [
      {
        q: "What is outpainting?",
        a: "Outpainting is the AI technique of generating new image content beyond the original borders. The model analyzes the existing image and creates a natural continuation of the scene in the expanded area.",
      },
      {
        q: "How large can I expand the canvas?",
        a: "You can expand in any direction by any amount. Smaller expansions (10-30% per side) produce the most natural results. Very large expansions may look less convincing as the model has less context to work with.",
      },
      {
        q: "Does the expanded area look realistic?",
        a: "For scenes with consistent textures (sky, grass, walls, patterns), the results are very convincing. Complex scenes with many distinct objects may produce less accurate expansions.",
      },
    ],
  },
  "transparency-fixer": {
    searchTitle: "Fix PNG Transparency - Remove Fake Transparent Backgrounds",
    longDescription:
      "Detect and fix PNG images that appear transparent but actually contain a solid background baked into the image data. Uses AI matting to extract the true foreground and produce a genuine transparent PNG. Fixes a common issue with images from web scraping and design exports.",
    useCases: [
      "Fix logos and icons with fake transparency from web downloads",
      "Clean up PNGs from design tools that flatten transparency on export",
      "Prepare transparent assets for compositing and layered designs",
      "Batch fix a library of PNGs with embedded white backgrounds",
    ],
    features: [
      "Detects PNGs with fake transparency (white/solid bg baked in)",
      "AI matting extracts the true foreground",
      "Produces genuine transparent PNG output",
      "Batch fix entire icon/logo libraries",
      "One-click operation with no manual masking",
    ],
    faqs: [
      {
        q: "What is a fake transparent PNG?",
        a: "A fake transparent PNG appears to have a transparent background in some viewers, but actually has a white (or solid color) background baked into the pixel data. When placed on a colored background, the white rectangle is visible.",
      },
      {
        q: "How does this differ from background removal?",
        a: "Background removal handles complex photos with subjects. This tool is specifically designed for logos, icons, and graphics where the background should be transparent but was accidentally flattened during export or download.",
      },
      {
        q: "Does it work on logos with white in the design?",
        a: "The AI matting model distinguishes between white that is part of the design and white background. It preserves intentional white areas in the logo while removing the background.",
      },
    ],
  },
  "watermark-text": {
    searchTitle: "Add Text Watermark to Images Online",
    longDescription:
      "Add text watermarks to images with full control over font, size, color, opacity, rotation, and position. Apply tiled watermark patterns that cover the entire image or place a single watermark in a specific location. Batch process for bulk protection.",
    useCases: [
      "Protect portfolio images with a copyright watermark",
      "Add proof watermarks to client review galleries",
      "Brand images with company name before sharing externally",
      "Apply date or version stamps to documentation screenshots",
    ],
    features: [
      "Custom font, size, color, and opacity",
      "Tiled pattern or single-position placement",
      "Rotation angle control",
      "Text stroke and shadow effects",
      "Batch apply to entire image collections",
    ],
    faqs: [
      {
        q: "How do I add a watermark that covers the entire image?",
        a: "Use the tiled pattern mode. It repeats your watermark text across the entire image in a diagonal pattern. Adjust the spacing and opacity to balance protection with visibility of the underlying image.",
      },
      {
        q: "What opacity should I use for a watermark?",
        a: "15-30% opacity is typical for proof watermarks that should be visible but not distracting. For stronger copyright protection, use 40-60%. Too high and the image becomes unusable for review; too low and the watermark is easily removed.",
      },
      {
        q: "Can I batch watermark an entire folder of images?",
        a: "Yes. Set your watermark text and style once, then upload all images. They will all receive the same watermark treatment in a single batch operation.",
      },
    ],
  },
  "watermark-image": {
    searchTitle: "Add Logo Watermark to Photos - Batch Image Branding",
    longDescription:
      "Overlay a logo or image as a watermark on your photos. Control size, position, opacity, and tiling. Upload any PNG, SVG, or JPEG as the watermark source. Process entire folders to brand all images in a single operation.",
    useCases: [
      "Brand product images with a company logo watermark",
      "Add a studio logo to client preview galleries",
      "Overlay sponsor logos on event photography",
      "Batch apply a semi-transparent logo across marketing materials",
    ],
    features: [
      "Supports PNG, SVG, and JPEG logo uploads",
      "Adjustable size, position, opacity, and tiling",
      "9-point position grid (corners, edges, center)",
      "Tiled pattern for full-image coverage",
      "Batch apply to hundreds of images at once",
    ],
    faqs: [
      {
        q: "What format should my logo be in?",
        a: "PNG with a transparent background works best. The transparent areas of your logo will remain transparent in the watermark, allowing the underlying image to show through. SVG also works well.",
      },
      {
        q: "Can I control where the logo is placed?",
        a: "Yes. Choose from a 9-point grid (corners, edges, center) or use the tiled mode for full-image coverage. You can also control the size relative to the image and the margin from edges.",
      },
      {
        q: "How do I watermark 500 product images at once?",
        a: "Upload your logo, set the position, size, and opacity, then drop all 500 images into the upload area. They will all be processed with the same watermark placement.",
      },
    ],
  },
  "text-overlay": {
    searchTitle: "Add Text to Image Online - Caption and Title Maker",
    longDescription:
      "Add styled text to images with control over font, size, color, shadows, outlines, backgrounds, and positioning. Create social media graphics, annotated screenshots, and labeled images directly from your self-hosted instance.",
    useCases: [
      "Add captions and titles to social media images",
      "Annotate screenshots with labels and callouts",
      "Create promotional banners with text overlays",
      "Label diagrams and architectural photos with descriptive text",
    ],
    features: [
      "Custom font, size, color, and alignment",
      "Text shadow, outline, and background box",
      "Multiple text blocks per image",
      "Positioning by coordinates or drag-and-drop",
      "Supports Unicode and multi-language text",
    ],
    faqs: [
      {
        q: "Can I add multiple text blocks to one image?",
        a: "Yes. Add as many text blocks as needed, each with its own font, size, color, and position. This is useful for creating social media graphics with titles and subtitles.",
      },
      {
        q: "What fonts are available?",
        a: "SnapOtter includes a set of common web fonts. The available fonts depend on what is installed in your Docker container. You can extend this by mounting additional font files.",
      },
      {
        q: "Can I add text with a background box behind it?",
        a: "Yes. Enable the background option to add a colored rectangle behind your text. You can control the background color, opacity, and padding. This improves readability when placing text over busy images.",
      },
    ],
  },
  compose: {
    searchTitle: "Layer and Composite Images Online",
    longDescription:
      "Layer multiple images together with precise control over position, size, opacity, and blending. Place logos on backgrounds, combine overlapping elements, and create composite images. Supports drag-and-drop ordering for intuitive layer management.",
    useCases: [
      "Composite product images onto lifestyle backgrounds",
      "Place logos and badges onto certificate templates",
      "Layer multiple screenshots into a comparison view",
      "Create image mockups by placing designs onto device frames",
    ],
    features: [
      "Layer images with precise position and size control",
      "Opacity and blending mode settings per layer",
      "Drag-and-drop layer reordering",
      "Supports transparent PNG overlays",
      "Batch compose with the same overlay across multiple base images",
    ],
    faqs: [
      {
        q: "How do I place a logo on a background image?",
        a: "Upload the background as the base image and the logo as the overlay. Use a PNG logo with a transparent background. Position it by coordinates or drag it into place, and adjust the size and opacity.",
      },
      {
        q: "Can I layer more than two images?",
        a: "Yes. Add multiple overlay layers on top of the base image. Each layer has its own position, size, and opacity settings. Drag to reorder layers.",
      },
      {
        q: "What blending modes are supported?",
        a: "Standard blending modes including normal (opacity-based), multiply, screen, overlay, and more. These control how the overlay pixels interact with the base image pixels.",
      },
    ],
  },
  "meme-generator": {
    searchTitle: "Meme Generator - Create Custom Memes Online",
    longDescription:
      "Create memes from templates or your own images with customizable top and bottom text. Supports popular meme formats with drag-and-drop text positioning, font selection, and stroke effects for maximum readability.",
    useCases: [
      "Create team and workplace memes for internal Slack channels",
      "Generate reaction images and memes from custom photos",
      "Build memes for social media engagement campaigns",
      "Create branded memes for community and marketing content",
    ],
    features: [
      "Classic top/bottom text layout",
      "Impact font with black stroke (classic meme style)",
      "Custom font, size, and color options",
      "Upload your own template or start from any image",
      "Download in high resolution",
    ],
    faqs: [
      {
        q: "Can I use my own image as a meme template?",
        a: "Yes. Upload any image and add text over it. You are not limited to predefined templates. Any photo, screenshot, or graphic can be turned into a meme.",
      },
      {
        q: "What is the classic meme font?",
        a: "Impact Bold with a white fill and thick black stroke outline. This is the standard meme font because it is readable on any background. SnapOtter uses this as the default.",
      },
      {
        q: "Why self-host a meme generator?",
        a: "Cloud meme generators may compress your images, add watermarks, or track your usage. A self-hosted instance gives you full resolution output, no watermarks, and complete privacy. Useful for internal team memes with sensitive context.",
      },
    ],
  },
  info: {
    searchTitle: "Image Info Viewer - Check EXIF Data and Dimensions",
    longDescription:
      "View comprehensive metadata and properties for any image including dimensions, file size, format, color space, bit depth, DPI, EXIF data, GPS coordinates, camera settings, and embedded ICC profiles. A complete image inspector.",
    useCases: [
      "Check image dimensions and DPI before sending to print",
      "Inspect EXIF data to verify camera settings and GPS coordinates",
      "Audit file formats and color spaces in an image library",
      "Verify that metadata stripping was applied correctly",
    ],
    features: [
      "Shows dimensions, file size, format, color space, and bit depth",
      "Full EXIF data: camera, lens, settings, GPS, dates",
      "ICC color profile information",
      "DPI/PPI for print readiness checks",
      "Hash values (MD5, SHA-256) for file integrity",
    ],
    faqs: [
      {
        q: "How do I check the DPI of an image?",
        a: "Upload the image and look for the DPI/PPI field in the metadata panel. For print, 300 DPI is standard. Web images are typically 72 DPI. Note that DPI is a metadata flag, the actual print quality depends on pixel dimensions and print size.",
      },
      {
        q: "What is the difference between EXIF and IPTC metadata?",
        a: "EXIF contains technical data from the camera (settings, GPS, date). IPTC contains editorial data (caption, keywords, copyright, credit). Both are embedded in the image file but serve different purposes.",
      },
      {
        q: "Can I see where a photo was taken?",
        a: "If the image has GPS coordinates in its EXIF data, SnapOtter displays the latitude and longitude. Most smartphone photos include this data unless the user has disabled location services for the camera app.",
      },
    ],
  },
  compare: {
    searchTitle: "Compare Two Images Side by Side Online",
    longDescription:
      "Compare two images side by side with synchronized zoom and pan. Includes a slider overlay mode for pixel-perfect before-and-after comparisons. Useful for QA testing, verifying processing results, and comparing design iterations.",
    useCases: [
      "Compare before and after image processing results",
      "QA check compression quality against the original",
      "Review design iterations with pixel-level precision",
      "Verify color accuracy between source and output files",
    ],
    features: [
      "Side-by-side and slider overlay comparison modes",
      "Synchronized zoom and pan across both images",
      "Pixel-level difference highlighting",
      "File size and metadata comparison",
      "Works with any image format SnapOtter supports",
    ],
    faqs: [
      {
        q: "How does the slider comparison work?",
        a: "Both images are overlaid and a draggable slider reveals one image on the left and the other on the right. Drag the slider to compare any region of the two images at full resolution.",
      },
      {
        q: "Can I compare images of different sizes?",
        a: "Yes, though the comparison is most useful when both images have the same dimensions. Different-sized images will be displayed at the same visual scale for relative comparison.",
      },
      {
        q: "What is pixel-level difference highlighting?",
        a: "This mode shows only the pixels that differ between the two images, highlighting changes in color, brightness, or content. Identical pixels appear black. It is useful for QA and verifying edits.",
      },
    ],
  },
  "find-duplicates": {
    searchTitle: "Find Duplicate Images - Photo Deduplication Tool",
    longDescription:
      "Scan a set of images to find exact duplicates and near-duplicates using perceptual hashing. Detects similar images even after resizing, recompression, or minor edits. Helps clean up photo libraries and identify redundant assets.",
    useCases: [
      "Clean up photo libraries by finding and removing duplicate files",
      "Detect near-duplicates in large image datasets",
      "Identify redundant product images in an asset library",
      "Find similar images across different folders and sources",
    ],
    features: [
      "Perceptual hashing for near-duplicate detection",
      "Detects duplicates even after resize, crop, or recompression",
      "Adjustable similarity threshold",
      "Groups duplicates for easy review",
      "Shows file size, dimensions, and format for each match",
    ],
    faqs: [
      {
        q: "How does duplicate detection work if the files are different sizes?",
        a: "Perceptual hashing compares the visual content of images, not the file bytes. Two images that look the same but differ in resolution, compression, or format will still be detected as duplicates.",
      },
      {
        q: "Can it find near-duplicates, not just exact copies?",
        a: "Yes. The similarity threshold controls how closely images must match. Lower thresholds catch more variations (different crops, slight edits). Higher thresholds are stricter and match only very similar images.",
      },
      {
        q: "How many images can I scan at once?",
        a: "There is no hard limit. The tool compares all uploaded images against each other. Performance depends on the number of images and your hardware. Hundreds of images are handled quickly; thousands may take longer.",
      },
    ],
  },
  "color-palette": {
    searchTitle: "Extract Color Palette from Image Online",
    longDescription:
      "Extract the dominant colors from any image as a curated color palette. Returns hex values, RGB components, and the percentage weight of each color. Export palettes for use in design tools, CSS, or brand guidelines.",
    useCases: [
      "Extract brand colors from a logo or product image",
      "Generate color palettes from photography for design inspiration",
      "Identify the dominant colors in UI screenshots for consistency audits",
      "Create complementary color schemes based on product imagery",
    ],
    features: [
      "Extracts 3-10 dominant colors from any image",
      "Returns hex, RGB, and HSL values",
      "Shows percentage weight of each color",
      "Copy-to-clipboard for hex codes",
      "Works on photos, logos, UI screenshots, and illustrations",
    ],
    faqs: [
      {
        q: "How many colors are extracted?",
        a: "By default, the tool extracts 5 dominant colors. You can configure this from 3 to 10. Fewer colors give you the most prominent palette; more colors capture subtler variations.",
      },
      {
        q: "Can I use the extracted colors in CSS?",
        a: "Yes. Each color includes its hex code, which you can copy directly. The tool also shows RGB and HSL values for use in CSS custom properties or design tool inputs.",
      },
      {
        q: "Does it work on logos with few colors?",
        a: "Yes. For logos and flat designs, the extracted colors will closely match the actual colors used. For photographs, the palette represents the most visually dominant color regions.",
      },
    ],
  },
  "qr-generate": {
    searchTitle: "QR Code Generator - Custom Colors, Logos, and Patterns",
    longDescription:
      "Generate QR codes with custom colors, patterns, corner styles, and embedded logos. Control error correction levels for reliability. Output as PNG or SVG at any resolution. Style QR codes to match your brand while keeping them scannable.",
    useCases: [
      "Create branded QR codes for marketing materials and packaging",
      "Generate QR codes for URLs, WiFi credentials, and contact cards",
      "Produce high-resolution QR codes for print on posters and banners",
      "Embed company logos inside scannable QR codes",
    ],
    features: [
      "Custom foreground and background colors",
      "Logo embedding in the center of the QR code",
      "Multiple dot and corner styles",
      "Error correction levels (L, M, Q, H)",
      "PNG and SVG output at any resolution",
    ],
    faqs: [
      {
        q: "Can I put a logo in the center of a QR code?",
        a: "Yes. Upload your logo and it will be placed in the center. Use High (H) error correction to ensure the QR code remains scannable even with the logo covering part of the data pattern.",
      },
      {
        q: "What data can I encode in a QR code?",
        a: "URLs, plain text, WiFi credentials, vCard contact info, email addresses, phone numbers, and more. The QR code stores any text data up to about 4,000 characters.",
      },
      {
        q: "Will a colored QR code still scan?",
        a: "Yes, as long as there is sufficient contrast between the foreground and background. Dark foreground on light background works best. Avoid light-on-dark unless you are sure your scanner app supports it.",
      },
    ],
  },
  "barcode-read": {
    searchTitle: "Barcode and QR Code Scanner - Read from Image",
    longDescription:
      "Scan images for QR codes, barcodes, and 2D codes. Supports all major formats including QR, Code 128, EAN-13, UPC-A, Data Matrix, and PDF417. Upload a photo or screenshot and extract the encoded data instantly.",
    useCases: [
      "Decode QR codes from screenshots without a phone camera",
      "Read barcodes from product images for inventory systems",
      "Extract encoded data from scanned documents and labels",
      "Verify QR codes render correctly by scanning your own generated codes",
    ],
    features: [
      "Reads QR, Code 128, EAN-13, UPC-A, Data Matrix, PDF417, and more",
      "Works on photos, screenshots, and scanned images",
      "Detects multiple codes in a single image",
      "Returns decoded text data with code type",
      "Upload any image format",
    ],
    faqs: [
      {
        q: "What barcode formats are supported?",
        a: "QR Code, Code 128, Code 39, EAN-13, EAN-8, UPC-A, UPC-E, Data Matrix, PDF417, Aztec, and more. The scanner auto-detects the format.",
      },
      {
        q: "Can I scan a QR code from a screenshot?",
        a: "Yes. Upload the screenshot and the tool will detect and decode any QR codes or barcodes in the image. This is useful when you cannot point a phone camera at a screen.",
      },
      {
        q: "Can it read multiple barcodes in one image?",
        a: "Yes. The scanner detects all codes in the image and returns each one separately with its type and decoded content.",
      },
    ],
  },
  "image-to-base64": {
    searchTitle: "Image to Base64 Converter - Generate Data URIs",
    longDescription:
      "Convert images to base64-encoded strings for embedding directly in HTML, CSS, emails, and JSON payloads. Generates ready-to-use data URIs with the correct MIME type. Useful for eliminating external image requests in web pages and emails.",
    useCases: [
      "Embed small icons as data URIs in CSS to reduce HTTP requests",
      "Inline images in HTML email templates for guaranteed display",
      "Convert images to base64 for inclusion in JSON API responses",
      "Generate data URIs for use in SVG documents and inline styles",
    ],
    features: [
      "Generates complete data URI with MIME type",
      "Supports JPEG, PNG, WebP, GIF, and SVG encoding",
      "Copy-to-clipboard for the encoded string",
      "Shows encoded size vs original size",
      "Batch convert multiple images",
    ],
    faqs: [
      {
        q: "When should I use base64 instead of a regular image file?",
        a: "Base64 is best for very small images (icons, UI elements under 2-3KB) where eliminating an HTTP request saves more time than the 33% size increase from encoding. For larger images, use regular files.",
      },
      {
        q: "Does base64 increase file size?",
        a: "Yes. Base64 encoding increases the data size by approximately 33% because it converts binary data to text (3 bytes become 4 characters). This is why it is only recommended for small images.",
      },
      {
        q: "Can I use a base64 image in CSS?",
        a: "Yes. Use the generated data URI as a background-image value: background-image: url('data:image/png;base64,...'). This embeds the image directly in your stylesheet.",
      },
    ],
  },
  collage: {
    searchTitle: "Photo Collage Maker - Grid Layouts and Templates",
    longDescription:
      "Create photo collages and grid layouts from multiple images with 25+ built-in templates. Control spacing, background colors, and image arrangement. Drag to reorder and resize individual cells. Export at custom resolutions for print or web.",
    useCases: [
      "Create photo collages for social media posts and stories",
      "Build product grid layouts for catalogs and lookbooks",
      "Combine event photos into a single shareable collage",
      "Generate comparison grids showing before-and-after results",
    ],
    features: [
      "25+ grid templates (2x2, 3x3, masonry, horizontal strip, and more)",
      "Custom spacing and background color",
      "Drag-and-drop cell reordering",
      "Custom output resolution for print or web",
      "Individual cell resize and crop",
    ],
    faqs: [
      {
        q: "How many photos can I include in a collage?",
        a: "The built-in templates support 2 to 12+ images depending on the layout. For larger grids, use the stitch tool which supports unlimited images in a simple grid arrangement.",
      },
      {
        q: "Can I control the spacing between images?",
        a: "Yes. Adjust the gap size and background color between cells. Set spacing to 0 for a seamless grid or increase it for a framed look with a colored border between images.",
      },
      {
        q: "What resolution is the output?",
        a: "You can set the output resolution to any size. For social media, 1080x1080 or 1080x1350 pixels are common. For print, set a higher resolution (3000+ pixels on the longest side at 300 DPI).",
      },
    ],
  },
  stitch: {
    searchTitle: "Stitch Images Together - Combine Side by Side or Stacked",
    longDescription:
      "Join multiple images side by side, stacked vertically, or in a custom grid arrangement. Match widths or heights automatically for seamless alignment. Add spacing and borders between images. Process any number of input files in a single operation.",
    useCases: [
      "Stitch screenshots together for long-scrolling documentation",
      "Combine multiple product angles into a single horizontal strip",
      "Create panoramic-style compositions from sequential photos",
      "Join before-and-after pairs side by side for comparison",
    ],
    features: [
      "Horizontal, vertical, and grid stitching modes",
      "Auto-match width or height for seamless alignment",
      "Custom spacing and background color between images",
      "Unlimited number of input images",
      "Drag-and-drop ordering",
    ],
    faqs: [
      {
        q: "How do I combine images side by side?",
        a: "Upload your images, select horizontal mode, and they will be placed left to right. SnapOtter auto-matches heights so images of different sizes align cleanly. Drag to reorder.",
      },
      {
        q: "Can I stitch images with different dimensions?",
        a: "Yes. In horizontal mode, images are scaled to match the tallest image's height. In vertical mode, they are scaled to match the widest image's width. This ensures a seamless result without gaps.",
      },
      {
        q: "Is there a limit on how many images I can stitch?",
        a: "No hard limit. You can stitch dozens of images in a single operation. The output size is constrained by available memory, but typical use cases (10-50 images) are handled without issues.",
      },
    ],
  },
  split: {
    searchTitle: "Split Image into Tiles - Grid Cutter for Instagram",
    longDescription:
      "Split images into uniform grid tiles or by specific pixel dimensions with live preview. Choose rows and columns or set exact tile sizes. Exports individual tiles as separate files. Perfect for creating image puzzles, sprite sheets, and tiled content.",
    useCases: [
      "Split panoramic images into tiles for Instagram carousel posts",
      "Break sprite sheets into individual frame images",
      "Create image puzzle pieces from a single photograph",
      "Divide large maps and diagrams into printable tile sections",
    ],
    features: [
      "Split by row/column count or exact pixel dimensions",
      "Live preview of tile boundaries",
      "Individual tile numbering (row-col or sequential)",
      "ZIP download of all tiles",
      "Supports large images for print and map tiling",
    ],
    faqs: [
      {
        q: "How do I split an image into 9 tiles for Instagram?",
        a: "Set the grid to 3 rows and 3 columns. The tool splits your image into 9 equal tiles. Upload them to Instagram in reverse order (bottom-right first) so the grid assembles correctly on your profile.",
      },
      {
        q: "Can I split by exact pixel size instead of grid count?",
        a: "Yes. Switch to pixel dimension mode and enter the width and height for each tile. The tool calculates how many tiles fit and shows a preview of the grid before splitting.",
      },
      {
        q: "What happens to the tiles that don't fit evenly?",
        a: "Edge tiles that are smaller than the target size are included as-is. You can choose to discard them or keep them. The live preview shows exactly where each tile falls.",
      },
    ],
  },
  border: {
    searchTitle: "Add Border to Image Online - Frames, Corners, Shadows",
    longDescription:
      "Add borders, rounded corners, and drop shadows to images. Choose solid colors, gradients, or transparent borders. Control corner radius individually for each corner. Combine with shadows for polished, presentation-ready results.",
    useCases: [
      "Add consistent borders to product images for a catalog",
      "Round corners on screenshots for blog posts and presentations",
      "Apply drop shadows to make images pop on white backgrounds",
      "Frame photos with decorative borders for print and display",
    ],
    features: [
      "Solid color, gradient, and transparent border options",
      "Independent corner radius control",
      "Drop shadow with color, blur, and offset settings",
      "Border width in pixels or percentage",
      "Batch apply consistent borders across image sets",
    ],
    faqs: [
      {
        q: "How do I round the corners of a screenshot?",
        a: "Set the corner radius to your desired value (e.g., 12px for subtle rounding, 24px for more pronounced). You can set each corner independently if you want rounded corners only on specific sides.",
      },
      {
        q: "Can I add a drop shadow to an image?",
        a: "Yes. Enable the shadow option and configure the blur radius, offset (X/Y), and shadow color. This creates a soft shadow behind the image, making it appear elevated above the page.",
      },
      {
        q: "Does adding a border change the image dimensions?",
        a: "Yes. The border is added around the outside of the image, increasing the total dimensions. A 1000x800 image with a 20px border becomes 1040x840.",
      },
    ],
  },
  beautify: {
    searchTitle: "Screenshot Mockup Generator - Device Frames and Backgrounds",
    longDescription:
      "Transform plain screenshots into polished visuals with gradient backgrounds, device frames (phone, laptop, browser), shadows, and social media sizing. Turn a raw screen capture into a presentation-ready graphic in seconds.",
    useCases: [
      "Create polished app screenshots for the App Store and Play Store",
      "Generate device mockups from screenshots for marketing pages",
      "Style screenshots with gradient backgrounds for social media",
      "Prepare visuals for product launches and press kits",
    ],
    features: [
      "Device frames: iPhone, Android phone, MacBook, browser window",
      "Gradient, solid, and custom background options",
      "Drop shadow and reflection effects",
      "Social media sizing presets (Instagram, Twitter, etc.)",
      "Batch beautify for multiple screenshots",
    ],
    faqs: [
      {
        q: "What device frames are available?",
        a: "iPhone, Android phone, MacBook laptop, and browser window frames. Each frame is designed to look realistic and fits standard screenshot dimensions from those devices.",
      },
      {
        q: "Can I create App Store screenshots with this?",
        a: "Yes. Take a screenshot from your app, select the iPhone frame, choose a gradient background, and set the output to App Store dimensions. Add text overlay if needed using the text overlay tool.",
      },
      {
        q: "How is this different from adding a border?",
        a: "The border tool adds simple frames. Beautify creates complete mockup compositions with device frames, gradient backgrounds, shadows, and professional styling specifically designed for marketing and product visuals.",
      },
    ],
  },
  "svg-to-raster": {
    searchTitle: "SVG to PNG Converter - Convert Vector to Raster",
    longDescription:
      "Convert SVG vector graphics to raster formats including PNG, JPEG, WebP, AVIF, TIFF, GIF, and HEIF. Control output scale and DPI for crisp results at any size. Handles complex SVGs with gradients, filters, and embedded fonts.",
    useCases: [
      "Render SVG logos as PNG at multiple sizes for different platforms",
      "Convert vector icons to raster for use in systems that require bitmap images",
      "Generate high-DPI raster exports from SVG design files",
      "Batch convert SVG assets to WebP for web delivery",
    ],
    features: [
      "Output: PNG, JPEG, WebP, AVIF, TIFF, GIF, HEIF",
      "Custom scale factor (1x, 2x, 3x, 4x, etc.)",
      "Custom DPI for print output",
      "Handles gradients, filters, masks, and embedded fonts",
      "Batch convert SVG directories",
    ],
    faqs: [
      {
        q: "What scale should I use for Retina/HiDPI displays?",
        a: "Use 2x for standard Retina (Apple) displays and 3x for higher-density screens. A 100x100 SVG at 2x produces a 200x200 PNG that appears crisp on Retina screens.",
      },
      {
        q: "Can I convert an SVG to PNG with a transparent background?",
        a: "Yes. PNG supports transparency natively. If your SVG has no background (or a transparent background), the resulting PNG will preserve that transparency.",
      },
      {
        q: "Does it handle SVGs with embedded fonts?",
        a: "Yes, if the fonts are embedded in the SVG (as base64 or paths). System-dependent font references may render differently. For best results, convert text to paths in your SVG editor before uploading.",
      },
    ],
  },
  vectorize: {
    searchTitle: "Convert Image to SVG - Vectorize Raster Images",
    longDescription:
      "Convert raster images to SVG vector graphics using image tracing. Supports both color and monochrome tracing with adjustable detail levels. Produces clean, scalable vector paths from logos, icons, line art, and simple illustrations.",
    useCases: [
      "Convert a raster logo to SVG for infinite scalability",
      "Vectorize hand-drawn illustrations for digital use",
      "Trace line art and sketches into editable vector paths",
      "Create SVG versions of icons from bitmap sources",
    ],
    features: [
      "Color and monochrome tracing modes",
      "Adjustable detail level and path simplification",
      "Produces clean SVG with editable paths",
      "Best for logos, icons, line art, and flat illustrations",
      "Preview output before saving",
    ],
    faqs: [
      {
        q: "What type of images vectorize well?",
        a: "Logos, icons, line art, cartoons, and flat illustrations with clear edges and limited colors. Photographs do not vectorize well because they contain continuous tones and gradients that require millions of paths to represent.",
      },
      {
        q: "Can I edit the SVG output in Illustrator or Figma?",
        a: "Yes. The output is standard SVG with editable paths and shapes. Open it in any vector editor (Illustrator, Figma, Inkscape) to modify colors, scale, or individual paths.",
      },
      {
        q: "What is the difference between color and monochrome tracing?",
        a: "Monochrome tracing produces black-and-white paths (silhouettes). Color tracing preserves the colors by creating separate colored shapes. Monochrome is simpler and produces cleaner paths; color is more faithful but more complex.",
      },
    ],
  },
  "gif-tools": {
    searchTitle: "GIF Editor - Resize, Optimize, and Edit Animated GIFs",
    longDescription:
      "A complete toolkit for animated GIFs: resize, optimize file size, change playback speed, reverse animation, extract individual frames, and rotate. Handles all operations while preserving animation timing and transparency.",
    useCases: [
      "Resize animated GIFs to fit platform upload limits",
      "Optimize GIF file size for faster loading on web pages",
      "Extract individual frames from animated GIFs for editing",
      "Adjust playback speed or reverse GIF animations for creative effects",
    ],
    features: [
      "Resize while preserving animation and timing",
      "Optimize file size with quality controls",
      "Change playback speed (slow down or speed up)",
      "Reverse animation direction",
      "Extract individual frames as PNG images",
    ],
    faqs: [
      {
        q: "How do I reduce the file size of a GIF?",
        a: "Use the optimize function to reduce the color palette and apply lossy compression. You can also resize the GIF to smaller dimensions. A 500px wide GIF is often half the file size of a 1000px one.",
      },
      {
        q: "Can I extract frames from an animated GIF?",
        a: "Yes. The frame extraction mode exports each frame as an individual PNG image. This is useful for editing specific frames or using GIF frames as static images.",
      },
      {
        q: "Does resizing a GIF preserve the animation?",
        a: "Yes. All frames are resized together while preserving frame timing, delays, and transparency. The animation plays identically at the new size.",
      },
    ],
  },
  "pdf-to-image": {
    searchTitle: "PDF to Image Converter - Convert PDF Pages to PNG or JPEG",
    longDescription:
      "Convert PDF pages to images in any major format with control over resolution and quality. Extract individual pages or convert entire documents. Renders text, vectors, and embedded images faithfully at the DPI you specify.",
    useCases: [
      "Convert PDF slides to images for social media sharing",
      "Extract pages from documents as images for archival",
      "Generate image previews of PDF files for web display",
      "Convert multi-page PDFs to individual images for processing pipelines",
    ],
    features: [
      "Output: PNG, JPEG, WebP, TIFF, and more",
      "Custom DPI (72 for web, 300 for print, custom values)",
      "Extract specific pages or convert the entire document",
      "Faithful rendering of text, vectors, and embedded images",
      "Batch convert multiple PDF files",
    ],
    faqs: [
      {
        q: "What DPI should I use for PDF to image conversion?",
        a: "72 DPI for web display (smallest files), 150 DPI for general use, 300 DPI for print quality. Higher DPI means larger files but sharper text and graphics.",
      },
      {
        q: "Can I convert just one page from a PDF?",
        a: "Yes. Specify the page number or range (e.g., pages 1-3) to convert only the pages you need. You do not have to convert the entire document.",
      },
      {
        q: "Does the conversion preserve text quality?",
        a: "Yes. Text in the PDF is rendered at the DPI you specify, so at 300 DPI the text is sharp and crisp. It is rendered as pixels though, not selectable text, since the output is an image.",
      },
    ],
  },
};
