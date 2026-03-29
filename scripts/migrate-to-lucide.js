#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

// Mapping of common Ionicons names to Lucide equivalents
const iconMap = {
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
  'arrow-down': 'ArrowDown',
  'arrow-forward': 'ArrowRight',
  'arrow-back': 'ArrowLeft',
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
  'qr-code': 'Scan',
  'barcode': 'Scan',
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
  'unlink': 'Unlink',
  'paper-plane': 'Send',
  'chatbubble': 'MessageCircle',
  'chatbubble-outline': 'MessageCircle',
  'chatbubbles': 'MessagesSquare',
  'chatbubbles-outline': 'MessagesSquare',
  'phone-portrait': 'Smartphone',
  'phone-landscape': 'MonitorSmartphone',
  'construct': 'Settings',
  'construct-outline': 'Settings',
  'paw': 'PawPrint',
  'paw-outline': 'PawPrint',
  'medical': 'HeartPulse',
  'medical-outline': 'HeartPulse',
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
  'flower': 'Flower',
  'flower-outline': 'Flower',
  'leaf': 'Leaf',
  'leaf-outline': 'Leaf',
  'sunny': 'Sun',
  'sunny-outline': 'Sun',
  'moon': 'Moon',
  'moon-outline': 'Moon',
  'cloud': 'Cloud',
  'cloud-outline': 'Cloud',
  'umbrella': 'Umbrella',
  'umbrella-outline': 'Umbrella',
  'thermometer': 'Thermometer',
  'thermometer-outline': 'Thermometer',
  'speedometer': 'Gauge',
  'speedometer-outline': 'Gauge',
};

function migrateFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  const originalContent = content;
  
  // Skip if already has lucide import
  if (content.includes('lucide-react-native')) {
    return false;
  }
  
  let changed = false;
  
  // Find all Ionicons usage patterns
  const ioniconMatches = content.matchAll(/name=["'](.*?)["']/gi);
  const iconNamesUsed = new Set();
  
  for (const match of ioniconMatches) {
    const iconSrc = match[1];
    if (iconMap[iconSrc]) {
      iconNamesUsed.add(iconSrc);
    }
  }
  
  if (iconNamesUsed.size === 0) {
    return false;
  }
  
  // Build import statement
  const lucideIcons = [...iconNamesUsed].map(name => iconMap[name]);
  const uniqueImports = [...new Set(lucideIcons)];
  const importStatement = `import { ${uniqueImports.join(', ')} } from 'lucide-react-native';\n`;
  
  // Add import after React imports
  const reactImportMatch = content.match(/from ['"]react['"];?\n/i);
  if (reactImportMatch) {
    const insertPos = reactImportMatch.index + reactImportMatch[0].length;
    content = content.slice(0, insertPos) + importStatement + content.slice(insertPos);
    changed = true;
  }
  
  // Replace Ionicons component usage with Lucide components
  // This is a simplified replacement - complex cases may need manual fixes
  Object.entries(iconMap).forEach(([ionicon, lucide]) => {
    const pattern = new RegExp(`<Ionicons\\s+name=["']${ionicon}["']`, 'g');
    if (content.match(pattern)) {
      const sizeMatch = content.match(`name=["']${ionicon}["']\\\\s[^>]*size={([^}]+)}`);
      const colorMatch = content.match(`name=["']${ionicon}["']\\\\s[^>]*color={([^}]+)}`);
      
      content = content.replace(pattern, `<${lucide}`);
      changed = true;
    }
  });
  
  // Replace size and color props
  content = content.replace(/\n?\s*size={(\d+|size|ICON_SIZE)}/g, (match, size) => {
    return `\n  size={${size}}`;
  });
  
  if (changed && content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✓ Migrated: ${path.relative(process.cwd(), filePath)}`);
    return true;
  }
  
  return false;
}

function walkDir(dir, callback) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      if (!file.startsWith('.') && file !== 'node_modules') {
        walkDir(filePath, callback);
      }
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      callback(filePath);
    }
  });
}

console.log('Migrating Ionicons to Lucide React Native...\n');

const srcDir = path.join(__dirname, '..', 'src');
let migratedCount = 0;

walkDir(srcDir, (filePath) => {
  if (migrateFile(filePath)) {
    migratedCount++;
  }
});

console.log(`\n✓ Migration complete! ${migratedCount} files updated.`);
console.log('\n⚠️  Note: Some manual adjustments may be needed for:');
console.log('   - Complex icon prop combinations');
console.log('   - Custom styled icons');
console.log('   - Icons without direct Lucide equivalents');
