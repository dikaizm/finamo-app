#!/bin/bash
# Migrate Ionicons to Lucide React Native across all source files

cd /Users/dikaizm/Documents/PROGRAMMING/mobile-dev/finamo/finamo-app/src

echo "🔄 Migrating Ionicons to Lucide React Native..."
echo ""

# Find all TSX/TS files with Ionicons
files=$(grep -rl "Ionicons" . --include="*.tsx" --include="*.ts" | grep -v "expo-vector-icons.d.ts")

for file in $files; do
  echo "Processing: $file"
  
  # Extract all icon names used in this file
  icons=$(grep -oP 'Ionicons\s+name="\K[^"]+' "$file" | sort -u)
  
  if [ -z "$icons" ]; then
    continue
  fi
  
  # Build the import line
  lucide_imports=""
  
  for icon in $icons; do
    case "$icon" in
      home|home-outline) lucide_imports="$lucide_imports Home" ;;
      pie-chart|pie-chart-outline) lucide_imports="$lucide_imports PieChart" ;;
      wallet|wallet-outline) lucide_imports="$lucide_imports Wallet" ;;
      calculator|calculator-outline) lucide_imports="$lucide_imports Calculator" ;;
      person|person-outline) lucide_imports="$lucide_imports User" ;;
      add|add-circle) lucide_imports="$lucide_imports Plus" ;;
      close|close-circle) lucide_imports="$lucide_imports X" ;;
      search|search-outline) lucide_imports="$lucide_imports Search" ;;
      notifications|notifications-outline) lucide_imports="$lucide_imports Bell" ;;
      settings|settings-outline) lucide_imports="$lucide_imports Settings" ;;
      ellipsis-horizontal) lucide_imports="$lucide_imports MoreHorizontal" ;;
      ellipsis-vertical) lucide_imports="$lucide_imports MoreVertical" ;;
      chevron-forward) lucide_imports="$lucide_imports ChevronRight" ;;
      chevron-back) lucide_imports="$lucide_imports ChevronLeft" ;;
      chevron-up) lucide_imports="$lucide_imports ChevronUp" ;;
      chevron-down) lucide_imports="$lucide_imports ChevronDown" ;;
      arrow-up|arrow-up-outline) lucide_imports="$lucide_imports ArrowUp" ;;
      arrow-down|arrow-down-outline) lucide_imports="$lucide_imports ArrowDown" ;;
      arrow-forward|arrow-forward-outline) lucide_imports="$lucide_imports ArrowRight" ;;
      arrow-back|arrow-back-outline) lucide_imports="$lucide_imports ArrowLeft" ;;
      cash) lucide_imports="$lucide_imports DollarSign" ;;
      card|card-outline) lucide_imports="$lucide_imports CreditCard" ;;
      pricetag|pricetag-outline) lucide_imports="$lucide_imports Tag" ;;
      document-text|document-text-outline) lucide_imports="$lucide_imports FileText" ;;
      grid|grid-outline) lucide_imports="$lucide_imports Grid3X3" ;;
      layers|layers-outline) lucide_imports="$lucide_imports Layers" ;;
      stats-chart) lucide_imports="$lucide_imports BarChart3" ;;
      trash|trash-outline) lucide_imports="$lucide_imports Trash2" ;;
      create|create-outline) lucide_imports="$lucide_imports Edit2" ;;
      save|save-outline) lucide_imports="$lucide_imports Save" ;;
      checkmark) lucide_imports="$lucide_imports Check" ;;
      checkmark-circle) lucide_imports="$lucide_imports CheckCircle" ;;
      warning) lucide_imports="$lucide_imports AlertTriangle" ;;
      information-circle) lucide_imports="$lucide_imports Info" ;;
      help|help-outline) lucide_imports="$lucide_imports HelpCircle" ;;
      heart|heart-outline) lucide_imports="$lucide_imports Heart" ;;
      star|star-outline) lucide_imports="$lucide_imports Star" ;;
      calendar|calendar-outline) lucide_imports="$lucide_imports Calendar" ;;
      time|time-outline) lucide_imports="$lucide_imports Clock" ;;
      image|image-outline) lucide_imports="$lucide_imports Image" ;;
      camera|camera-outline) lucide_imports="$lucide_imports Camera" ;;
      send|send-outline) lucide_imports="$lucide_imports Send" ;;
      download|download-outline) lucide_imports="$lucide_imports Download" ;;
      upload|upload-outline) lucide_imports="$lucide_imports Upload" ;;
      share|share-outline) lucide_imports="$lucide_imports Share2" ;;
      filter|filter-outline) lucide_imports="$lucide_imports Filter" ;;
      refresh|refresh-outline) lucide_imports="$lucide_imports RefreshCw" ;;
      receipt|receipt-outline) lucide_imports="$lucide_imports Receipt" ;;
      scan|scan-outline) lucide_imports="$lucide_imports Scan" ;;
      eye|eye-outline) lucide_imports="$lucide_imports Eye" ;;
      eye-off|eye-off-outline) lucide_imports="$lucide_imports EyeOff" ;;
      lock-closed|lock-closed-outline) lucide_imports="$lucide_imports Lock" ;;
      lock-open|lock-open-outline) lucide_imports="$lucide_imports Unlock" ;;
      key|key-outline) lucide_imports="$lucide_imports Key" ;;
      mail|mail-outline) lucide_imports="$lucide_imports Mail" ;;
      call|call-outline) lucide_imports="$lucide_imports Phone" ;;
      location|location-outline) lucide_imports="$lucide_imports MapPin" ;;
      navigate|navigate-outline) lucide_imports="$lucide_imports Navigation" ;;
      globe|globe-outline) lucide_imports="$lucide_imports Globe" ;;
      link|link-outline) lucide_imports="$lucide_imports Link" ;;
      chatbubble|chatbubble-outline) lucide_imports="$lucide_imports MessageCircle" ;;
      restaurant|restaurant-outline) lucide_imports="$lucide_imports Utensils" ;;
      car|car-outline) lucide_imports="$lucide_imports Car" ;;
      cart|cart-outline) lucide_imports="$lucide_imports ShoppingCart" ;;
      basket|basket-outline) lucide_imports="$lucide_imports ShoppingBasket" ;;
      bag|bag-outline) lucide_imports="$lucide_imports Bag" ;;
      gift|gift-outline) lucide_imports="$lucide_imports Gift" ;;
      sunny|sunny-outline) lucide_imports="$lucide_imports Sun" ;;
      moon|moon-outline) lucide_imports="$lucide_imports Moon" ;;
      cloud|cloud-outline) lucide_imports="$lucide_imports Cloud" ;;
      sparkles) lucide_imports="$lucide_imports Sparkles" ;;
      scale|scale-outline) lucide_imports="$lucide_imports Scale" ;;
      barcode) lucide_imports="$lucide_imports Barcode" ;;
      *) 
        echo "  ⚠️  Unknown icon: $icon (keeping as placeholder)"
        lucide_imports="$lucide_imports Circle"
        ;;
    esac
  done
  
  # Remove duplicates and format
  lucide_imports=$(echo $lucide_imports | tr ' ' '\n' | sort -u | tr '\n' ' ' | xargs)
  
  # Create import statement
  import_stmt="import { $lucide_imports } from 'lucide-react-native';"
  
  # Add import after React import if not already present
  if ! grep -q "lucide-react-native" "$file"; then
    # Insert after the react-native or react import
    sed -i.bak "/from ['\"]react['\"]/a\\
$import_stmt
" "$file"
    
    # If that didn't work, try after react-native import
    if ! grep -q "lucide-react-native" "$file"; then
      sed -i.bak "/from ['\"]react-native['\"]/a\\
$import_stmt
" "$file"
    fi
    
    # Remove backup
    rm -f "${file}.bak"
  fi
  
  # Replace Ionicons component usage with Lucide components
  for icon in $icons; do
    lucide_name=""
    case "$icon" in
      home|home-outline) lucide_name="Home" ;;
      pie-chart|pie-chart-outline) lucide_name="PieChart" ;;
      wallet|wallet-outline) lucide_name="Wallet" ;;
      calculator|calculator-outline) lucide_name="Calculator" ;;
      person|person-outline) lucide_name="User" ;;
      add|add-circle) lucide_name="Plus" ;;
      close|close-circle) lucide_name="X" ;;
      search|search-outline) lucide_name="Search" ;;
      notifications|notifications-outline) lucide_name="Bell" ;;
      settings|settings-outline) lucide_name="Settings" ;;
      ellipsis-horizontal) lucide_name="MoreHorizontal" ;;
      ellipsis-vertical) lucide_name="MoreVertical" ;;
      chevron-forward) lucide_name="ChevronRight" ;;
      chevron-back) lucide_name="ChevronLeft" ;;
      chevron-up) lucide_name="ChevronUp" ;;
      chevron-down) lucide_name="ChevronDown" ;;
      arrow-up|arrow-up-outline) lucide_name="ArrowUp" ;;
      arrow-down|arrow-down-outline) lucide_name="ArrowDown" ;;
      arrow-forward|arrow-forward-outline) lucide_name="ArrowRight" ;;
      arrow-back|arrow-back-outline) lucide_name="ArrowLeft" ;;
      cash) lucide_name="DollarSign" ;;
      card|card-outline) lucide_name="CreditCard" ;;
      pricetag|pricetag-outline) lucide_name="Tag" ;;
      document-text|document-text-outline) lucide_name="FileText" ;;
      grid|grid-outline) lucide_name="Grid3X3" ;;
      layers|layers-outline) lucide_name="Layers" ;;
      stats-chart) lucide_name="BarChart3" ;;
      trash|trash-outline) lucide_name="Trash2" ;;
      create|create-outline) lucide_name="Edit2" ;;
      save|save-outline) lucide_name="Save" ;;
      checkmark) lucide_name="Check" ;;
      checkmark-circle) lucide_name="CheckCircle" ;;
      warning) lucide_name="AlertTriangle" ;;
      information-circle) lucide_name="Info" ;;
      help|help-outline) lucide_name="HelpCircle" ;;
      heart|heart-outline) lucide_name="Heart" ;;
      star|star-outline) lucide_name="Star" ;;
      calendar|calendar-outline) lucide_name="Calendar" ;;
      time|time-outline) lucide_name="Clock" ;;
      image|image-outline) lucide_name="Image" ;;
      camera|camera-outline) lucide_name="Camera" ;;
      send|send-outline) lucide_name="Send" ;;
      download|download-outline) lucide_name="Download" ;;
      upload|upload-outline) lucide_name="Upload" ;;
      share|share-outline) lucide_name="Share2" ;;
      filter|filter-outline) lucide_name="Filter" ;;
      refresh|refresh-outline) lucide_name="RefreshCw" ;;
      receipt|receipt-outline) lucide_name="Receipt" ;;
      scan|scan-outline) lucide_name="Scan" ;;
      eye|eye-outline) lucide_name="Eye" ;;
      eye-off|eye-off-outline) lucide_name="EyeOff" ;;
      lock-closed|lock-closed-outline) luname_name="Lock" ;;
      lock-open|lock-open-outline) lucide_name="Unlock" ;;
      key|key-outline) lucide_name="Key" ;;
      mail|mail-outline) lucide_name="Mail" ;;
      call|call-outline) lucide_name="Phone" ;;
      location|location-outline) lucide_name="MapPin" ;;
      navigate|navigate-outline) lucide_name="Navigation" ;;
      globe|globe-outline) lucide_name="Globe" ;;
      link|link-outline) lucide_name="Link" ;;
      chatbubble|chatbubble-outline) lucide_name="MessageCircle" ;;
      restaurant|restaurant-outline) lucide_name="Utensils" ;;
      car|car-outline) lucide_name="Car" ;;
      cart|cart-outline) lucide_name="ShoppingCart" ;;
      basket|basket-outline) lucide_name="ShoppingBasket" ;;
      bag|bag-outline) lucide_name="Bag" ;;
      gift|gift-outline) lucide_name="Gift" ;;
      sunny|sunny-outline) lucide_name="Sun" ;;
      moon|moon-outline) lucide_name="Moon" ;;
      cloud|cloud-outline) lucide_name="Cloud" ;;
      sparkles) lucide_name="Sparkles" ;;
      scale|scale-outline) lucide_name="Scale" ;;
      barcode) lucide_name="Barcode" ;;
      *) lucide_name="Circle" ;;
    esac
    
    # Replace <Ionicons name="icon" ... /> with <LucideName ... />
    # Using perl for more reliable regex
    perl -i -pe "s/<Ionicons\s+name=[\"']$icon[\"']\s+size=\{([^}]+)\}\s+color=\{([^}]+)\}/<$lucide_name size={\$1} color={\$2} strokeWidth={2}/g" "$file"
    perl -i -pe "s/<Ionicons\s+name=[\"']$icon[\"']\s+color=\{([^}]+)\}\s+size=\{([^}]+)\}/<$lucide_name color={\$1} size={\$2} strokeWidth={2}/g" "$file"
  done
  
  # Remove Ionicons import if no longer used
  if ! grep -q '<Ionicons' "$file"; then
    sed -i.bak "/Ionicons.*@expo\/vector-icons/d" "$file"
    rm -f "${file}.bak"
  fi
  
done

echo ""
echo "✅ Migration complete!"
echo ""
echo "⚠️  Next steps:"
echo "  1. Check for any compilation errors"
echo "  2. Manually fix any complex icon usage patterns"
echo "  3. Test the app thoroughly"
