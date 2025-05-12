## Overview

This script automates the creation of proof documents for labels in Adobe Illustrator. The script assists pre-press operators by generating technical elements needed to visualize and streamline label production.

## Key Terminology

### Label Components
- **Dieline**: The cutting path that defines the final shape of the label (standard: 1pt magenta stroke). Also referred to as the "cut line"
- **Bleed**: Extra area beyond the dieline that ensures no white edges if cutting is slightly misaligned
- **Safe Zone**: A defined area within the dieline where important design elements must stay to avoid being too close to the label edge
- **Backer**: For die-cut labels, represents the backing material that remains after the label is cut
- **White Ink**: Opaque white layer printed beneath colored inks to provide opacity on clear materials

### Label Types
- **Sheets**: Labels printed on sheets, requiring larger bleed (offset +0.125" from dieline) and safe zone (offset -0.125" from dieline), no backer
- **Rolls**: Labels produced on continuous rolls, with minimal bleed (offset +0.0625" from dieline) and safe zone (offset -0.0625" from dieline), no backer
- **Die Cut**: Custom-shaped labels with safe zone (offset -0.0625" from dieline), larger bleed (offset +0.1875" from dieline), and backer representation (offset +0.125" from dieline)
- **Custom**: User-defined specifications for safe zone, bleed, and backer measurements

### Label Shape Options
- **Squared**: Rectangle with sharp corners
- **Rounded**: Rectangle with rounded corners (using industry-standard 9pt/0.125" radius)
- **Round**: Perfect circle

### Technical Elements
- **Legend**: Reference graphic that defines the different graphic elements used in the proof
- **Dimension Guidelines**: Annotations showing the width and height measurements
- **Spot Colors**: Non-process colors used for production elements

### Strategic Choices
- Fixed 9pt radius for rounded corners reflects industry standards
- Layer organization separates design elements from technical guides
- White ink placement options (horizontal/vertical) accommodate different design requirements

## Implementation Notes
The script operates through Illustrator's ExtendScript environment and relies on:
- Adobe Illustrator Actions for creating offsets
- Legend graphics in the legends/ directory
- Specific naming conventions for spot colors and layers