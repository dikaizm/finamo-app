#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

// Icon mapping: Ionicons → Lucide
const ICON_MAP = {
  'home': 'Home',
  'home-outline': 'Home',
  'pie-chart': 'PieChart',
  'pie-chart-outline': 'PieChart',
  'wallet': 'Wallet',
  'wallet-outline': 'Wallet',
  'calculator': 'Calculator',
  'calculator-outline': 'Calculator',
  'person': 'User',
  'person-outline': 'User',
  'add': 'Plus',
  'add-circle': 'PlusCircle',
  'close': 'X',
  'close-circle': 'XCircle',
  'search': 'Search',
  'search-outline': 'Search',
  'notifications': 'Bell',
  'notifications-outline': 'Bell',
  'settings': 'Settings',
  'settings-outline': 'Settings',
  'ellipsis-horizontal': 'MoreHorizontal',
  'ellipsis-vertical': 'MoreVertical',
  'chevron-forward': 'ChevronRight',
  'chevron-back': 'ChevronLeft',
  'chevron-up': 'ChevronUp',
  'chevron-down': 'ChevronDown',
  'arrow-up': 'ArrowUp',
  'arrow-up-outline': 'ArrowUp',
  'arrow-down': 'ArrowDown',
  'arrow-down-outline': 'ArrowDown',
  'arrow-forward': 'ArrowRight',
  'arrow-forward-outline': 'ArrowRight',
  'arrow-back': 'ArrowLeft',
  'arrow-back-outline': 'ArrowLeft',
  'cash': 'DollarSign',
  'card': 'CreditCard',
  'card-outline': 'CreditCard',
  'pricetag': 'Tag',
  'pricetag-outline': 'Tag',
  'document-text': 'FileText',
  'document-text-outline': 'FileText',
  'grid': 'Grid3X3',
  'grid-outline': 'Grid3X3',
  'layers': 'Layers',
  'layers-outline': 'Layers',
  'stats-chart': 'BarChart3',
  'trash': 'Trash2',
  'trash-outline': 'Trash2',
  'create': 'Edit2',
  'create-outline': 'Edit2',
  'save': 'Save',
  'save-outline': 'Save',
  'checkmark': 'Check',
  'checkmark-circle': 'CheckCircle',
  'warning': 'AlertTriangle',
  'information-circle': 'Info',
  'help': 'HelpCircle',
  'help-outline': 'HelpCircle',
  'heart': 'Heart',
  'heart-outline': 'Heart',
  'star': 'Star',
  'star-outline': 'Star',
  'calendar': 'Calendar',
  'calendar-outline': 'Calendar',
  'time': 'Clock',
  'time-outline': 'Clock',
  'image': 'Image',
  'image-outline': 'Image',
  'camera': 'Camera',
  'camera-outline': 'Camera',
  'send': 'Send',
  'send-outline': 'Send',
  'download': 'Download',
  'download-outline': 'Download',
  'upload': 'Upload',
  'upload-outline': 'Upload',
  'share': 'Share2',
  'share-outline': 'Share2',
  'filter': 'Filter',
  'filter-outline': 'Filter',
  'refresh': 'RefreshCw',
  'refresh-outline': 'RefreshCw',
  'receipt': 'Receipt',
  'receipt-outline': 'Receipt',
  'scan': 'Scan',
  'scan-outline': 'Scan',
  'eye': 'Eye',
  'eye-outline': 'Eye',
  'eye-off': 'EyeOff',
  'eye-off-outline': 'EyeOff',
  'lock-closed': 'Lock',
  'lock-closed-outline': 'Lock',
  'lock-open': 'Unlock',
  'lock-open-outline': 'Unlock',
  'key': 'Key',
  'key-outline': 'Key',
  'mail': 'Mail',
  'mail-outline': 'Mail',
  'call': 'Phone',
  'call-outline': 'Phone',
  'location': 'MapPin',
  'location-outline': 'MapPin',
  'navigate': 'Navigation',
  'navigate-outline': 'Navigation',
  'globe': 'Globe',
  'globe-outline': 'Globe',
  'link': 'Link',
  'link-outline': 'Link',
  'chatbubble': 'MessageCircle',
  'chatbubble-outline': 'MessageCircle',
  'restaurant': 'Utensils',
  'restaurant-outline': 'Utensils',
  'car': 'Car',
  'car-outline': 'Car',
  'cart': 'ShoppingCart',
  'cart-outline': 'ShoppingCart',
  'basket': 'ShoppingBasket',
  'basket-outline': 'ShoppingBasket',
  'bag': 'Bag',
  'bag-outline': 'Bag',
  'gift': 'Gift',
  'gift-outline': 'Gift',
  'sunny': 'Sun',
  'sunny-outline': 'Sun',
  'moon': 'Moon',
  'moon-outline': 'Moon',
  'cloud': 'Cloud',
  'cloud-outline': 'Cloud',
  'sparkles': 'Sparkles',
  'sparkles-outline': 'Sparkles',
  'scale': 'Scale',
  'scale-outline': 'Scale',
  'barcode': 'Barcode',
  'alert-circle': 'AlertCircle',
  'alert-circle-outline': 'AlertCircle',
  'log-out': 'LogOut',
  'log-out-outline': 'LogOut',
  'trending-up': 'TrendingUp',
  'trending-up-outline': 'TrendingUp',
  'trending-down': 'TrendingDown',
  'trending-down-outline': 'TrendingDown',
  'today': 'CalendarDays',
  'today-outline': 'CalendarDays',
  'pencil': 'Pencil',
  'pencil-outline': 'Pencil',
  'document': 'File',
  'document-outline': 'File',
  'apps': 'Apps',
  'add-circle': 'PlusCircle',
  'add-circle-outline': 'PlusCircle',
  'checkmark-circle': 'CheckCircle',
  'checkmark-circle-outline': 'CheckCircle',
  'shield-checkmark': 'ShieldCheck',
  'chatbox-ellipses': 'MessageCircleMore',
  'bulb': 'Lightbulb',
  'swap-horizontal': 'ArrowLeftRight',
  'swap-horizontal-outline': 'ArrowLeftRight',
};

function migrateFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  const original = content;
  
  // Skip if already migrated
  if (content.includes('lucide-react-native') && !content.includes('@expo/vector-icons')) {
    return false;
  }
  
  // Find all icon names used
  const iconRegex = /Ionicons\s+name=["']([^"']+)["']/g;
  const foundIcons = new Set();
  let match;
  
  while ((match = iconRegex.exec(content)) !== null) {
    foundIcons.add(match[1]);
  }
  
  if (foundIcons.size === 0) {
    // No Ionicons found, just remove the import if present
    if (content.includes('@expo/vector-icons')) {
      content = content.replace(/import\s*{\s*Ionicons\s*}\s*from\s*['"]@expo\/vector-icons['"];?\n?/g, '');
      if (content !== original) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`✓ Cleaned (no icons): ${path.relative(process.cwd(), filePath)}`);
        return true;
      }
    }
    return false;
  }
  
  // Build Lucide imports
  const lucideIcons = [...foundIcons]
    .map(icon => ICON_MAP[icon])
    .filter(Boolean);
  
  const uniqueImports = [...new Set(lucideIcons)];
  const importStmt = `import { ${uniqueImports.join(', ')} } from 'lucide-react-native';\n`;
  
  // Add import after React/react-native imports
  const reactImportIdx = content.search(/from ['"]react['"]/);
  const rnImportIdx = content.search(/from ['"]react-native['"]/);
  
  let insertIdx = -1;
  if (reactImportIdx > -1) {
    insertIdx = content.indexOf('\n', reactImportIdx) + 1;
  } else if (rnImportIdx > -1) {
    insertIdx = content.indexOf('\n', rnImportIdx) + 1;
  }
  
  if (insertIdx > -1) {
    content = content.slice(0, insertIdx) + importStmt + content.slice(insertIdx);
  }
  
  // Replace each Ionicons usage with Lucide component
  for (const ionicon of foundIcons) {
    const lucideName = ICON_MAP[ionicon];
    if (!lucideName) {
      console.log(`⚠️  Unknown icon "${ionicon}" in ${filePath}`);
      continue;
    }
    
    // Replace <Ionicons name="icon" size={X} color={Y} /> or variations
    // Pattern 1: <Ionicons name="icon" size={size} color={color} />
    content = content.replace(
      new RegExp(`<Ionicons\\s+name=["']${ionicon}["']\\s+size=\\{([^}]+)\\}\\s+color=\\{([^}]+)\\}([^>]*)>`, 'g'),
      `<${lucideName} size={$1} color={$2} strokeWidth={2}$3>`
    );
    
    // Pattern 2: <Ionicons name="icon" color={color} size={size} />
    content = content.replace(
      new RegExp(`<Ionicons\\s+name=["']${ionicon}["']\\s+color=\\{([^}]+)\\}\\s+size=\\{([^}]+)\\}([^>]*)>`, 'g'),
      `<${lucideName} color={$1} size={$2} strokeWidth={2}$3>`
    );
  }
  
  // Remove Ionicons import
  content = content.replace(/import\s*{\s*Ionicons\s*}\s*from\s*['"]@expo\/vector-icons['"];?\n?/g, '');
  
  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✓ Migrated: ${path.relative(process.cwd(), filePath)}`);
    return true;
  }
  
  return false;
}

function walkDir(dir) {
  let results = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    
    if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
      results = results.concat(walkDir(fullPath));
    } else if (entry.isFile() && /\.(tsx|ts)$/.test(entry.name)) {
      results.push(fullPath);
    }
  }
  
  return results;
}

console.log('🔄 Migrating Ionicons to Lucide React Native...\n');

const srcDir = path.join(__dirname, '..', 'src');
const files = walkDir(srcDir);

let count = 0;
for (const file of files) {
  if (migrateFile(file)) {
    count++;
  }
}

console.log(`\n✅ Migration complete! ${count} files updated.`);
console.log('\n⚠️  Manual review needed for:');
console.log('   - Complex icon styling or props');
console.log('   - Icons without direct Lucide equivalents');
console.log('   - Type definitions (expo-vector-icons.d.ts)');
