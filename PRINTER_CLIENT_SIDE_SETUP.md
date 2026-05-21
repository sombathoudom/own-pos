# 🖨️ Client-Side Printing Setup (Production + Local Printer)

## The Problem

Your Laravel app is in **production** (cloud/VPS), but your printer is **local** (192.168.x.x).

```
❌ DOESN'T WORK:
Production Server → ws://192.168.110.176:1945 → Printer
(Can't reach local network from internet)

✅ WORKS:
Browser (Phone/iPad/Computer) → ws://192.168.110.176:1945 → Printer
(Same local network)
```

## Architecture

```
┌──────────────────────────────────────────┐
│  Production Server (yoursite.com)        │
│  - Returns receipt data as JSON          │
│  - NO direct printer connection          │
└──────────────────────────────────────────┘
                 ↓ HTTPS
┌──────────────────────────────────────────┐
│  Client Device (Phone/iPad/Computer)     │
│  - React Frontend                        │
│  - Connects to LOCAL printer server      │
│  - Must be on SAME NETWORK as printer    │
└──────────────────────────────────────────┘
                 ↓ WebSocket (Local)
┌──────────────────────────────────────────┐
│  Computer with Printer (192.168.x.x)     │
│  - ESC/POS Printer Server running        │
│  - USB Printer connected                 │
└──────────────────────────────────────────┘
```

## Requirements

### ✅ What You Need:

1. **Computer with printer** (Windows/Mac/Linux)
   - Connected to your local network
   - USB thermal printer attached
   - ESC/POS Printer Server installed and running

2. **Devices using POS** (Phone/iPad/Computer)
   - Connected to **SAME WiFi network** as printer computer
   - Can access your production website

3. **Network Setup**
   - All devices on same WiFi/LAN
   - Printer computer has static IP (recommended)

### ❌ Won't Work If:

- POS device is on different network (e.g., mobile data)
- Printer computer is turned off
- ESC/POS server not running
- Firewall blocking port 1945

## Setup Steps

### Step 1: Setup Printer Computer

1. **Install ESC/POS Printer Server**
   ```bash
   # Follow: https://github.com/darkterminal/escpos-printer-server
   ```

2. **Get Computer's Local IP**
   - Windows: `ipconfig` → Look for "IPv4 Address"
   - Mac: System Preferences → Network
   - Linux: `ip addr show`
   
   Example: `192.168.1.100`

3. **Set Static IP (Recommended)**
   - Prevents IP from changing
   - Router settings → DHCP Reservation
   - Or set static IP in computer network settings

4. **Start Printer Server**
   ```bash
   # Make sure it's running on port 1945
   # Should see: "WebSocket server started on ws://0.0.0.0:1945"
   ```

5. **Test from Browser**
   - Open `test-print-custom.html`
   - Update IP to your computer's IP
   - Click "Test Print"
   - Should print successfully

### Step 2: Configure POS Devices

Each device (phone/iPad/computer) needs to configure printer settings:

1. **Go to POS Settings** (we'll create this page)
2. **Enter Printer Configuration:**
   - Server URL: `ws://192.168.1.100:1945` (your printer computer IP)
   - Printer Name: `smb://localhost/XP-80C`
   - Enable Auto-Print: ✅

3. **Test Connection**
   - Click "Test Printer"
   - Should show "✅ Connected"

4. **Save Settings**
   - Stored in browser localStorage
   - Each device remembers its settings

### Step 3: Use POS

1. **Complete a sale**
2. **Receipt prints automatically** (if enabled)
3. **Or click "Print Receipt" button**

## Implementation

### Option A: Quick Implementation (Recommended)

Add printer settings to POS page:

```typescript
// In POS page, add printer configuration
import { printerService } from '@/services/PrinterService';

// After sale success
const submitForm = () => {
    post(salesStore.url(), {
        onSuccess: (response) => {
            // Get sale data from response
            const sale = response.props.sale;
            
            // Print receipt if enabled
            if (printerService.isEnabled()) {
                const receiptData = {
                    invoice_no: sale.invoice_no,
                    date: sale.sale_date,
                    customer_name: sale.customer?.name || 'Walk-in',
                    phone: sale.customer?.phone || '',
                    location: sale.customer?.address || '',
                    delivery: sale.delivery_company?.name || '',
                    items: sale.items.map(item => ({
                        product: `${item.product_name} / ${item.size}`,
                        qty: item.qty,
                        total: parseFloat(item.total_usd),
                    })),
                    discount: parseFloat(sale.discount_usd),
                    delivery_fee: parseFloat(sale.customer_delivery_fee_usd),
                    total: parseFloat(sale.total_usd),
                    paid: parseFloat(sale.paid_usd),
                    remaining: parseFloat(sale.total_usd) - parseFloat(sale.paid_usd),
                    status: sale.payment_status.toUpperCase(),
                    footer: 'Thank you for supporting us <3',
                };
                
                printerService.printReceipt(receiptData);
            }
            
            setShowCartMobile(false);
            setShowPreviewModal(false);
        },
    });
};
```

### Option B: Printer Settings Page

Create a dedicated settings page:

```typescript
// resources/js/pages/settings/printer.tsx
import { printerService } from '@/services/PrinterService';

export default function PrinterSettings() {
    const [config, setConfig] = useState(printerService.getConfig());
    const [testing, setTesting] = useState(false);
    const [testResult, setTestResult] = useState<string | null>(null);

    const handleTest = async () => {
        setTesting(true);
        const success = await printerService.testConnection();
        setTestResult(success ? '✅ Connected' : '❌ Failed');
        setTesting(false);
    };

    const handleSave = () => {
        printerService.saveConfig(config);
        alert('Settings saved!');
    };

    return (
        <div>
            <h2>Printer Settings</h2>
            
            <Form.Group>
                <Form.Label>Server URL</Form.Label>
                <Form.Control
                    value={config.serverUrl}
                    onChange={(e) => setConfig({...config, serverUrl: e.target.value})}
                    placeholder="ws://192.168.1.100:1945"
                />
            </Form.Group>

            <Form.Check
                label="Enable Auto-Print"
                checked={config.enabled}
                onChange={(e) => setConfig({...config, enabled: e.target.checked})}
            />

            <Button onClick={handleTest} disabled={testing}>
                {testing ? 'Testing...' : 'Test Connection'}
            </Button>

            {testResult && <Alert>{testResult}</Alert>}

            <Button onClick={handleSave}>Save Settings</Button>
        </div>
    );
}
```

## Network Configuration

### For Home/Small Office:

1. **Connect all devices to same WiFi**
2. **Set printer computer to static IP**
3. **Done!**

### For Multiple Locations:

Each location needs:
- Own printer computer with ESC/POS server
- Own local IP (e.g., Location A: 192.168.1.100, Location B: 192.168.2.100)
- Devices configure their local printer IP

### For Remote Printing (Advanced):

If you need to print from anywhere (not same network):

**Option 1: VPN**
- Setup VPN server at location with printer
- Devices connect via VPN
- Can access local printer IP

**Option 2: Reverse Proxy (ngrok/cloudflare tunnel)**
```bash
# On printer computer
ngrok tcp 1945
# Get public URL: tcp://0.tcp.ngrok.io:12345
# Use in POS: ws://0.tcp.ngrok.io:12345
```

**Option 3: Cloud Print Service**
- Build a cloud queue system
- Printer computer polls for print jobs
- More complex but works from anywhere

## Troubleshooting

### "Connection Failed"

1. **Check same network**
   ```bash
   # On POS device, ping printer computer
   ping 192.168.1.100
   ```

2. **Check server running**
   - On printer computer, verify ESC/POS server is running
   - Check port 1945 is listening

3. **Check firewall**
   - Windows: Allow port 1945 in Windows Firewall
   - Mac: System Preferences → Security → Firewall
   - Linux: `sudo ufw allow 1945`

4. **Check IP address**
   - Verify printer computer IP hasn't changed
   - Use static IP to prevent this

### "Prints from computer but not phone"

- Phone might be on guest WiFi (isolated network)
- Check phone is on same WiFi as printer computer
- Some routers isolate WiFi devices - check router settings

### "Works at location but not from home"

- This is expected! Client-side printing requires same network
- Use VPN or cloud print service for remote printing

## Production Checklist

- [ ] Printer computer has static IP
- [ ] ESC/POS server starts on boot
- [ ] Firewall allows port 1945
- [ ] All POS devices on same network
- [ ] Each device configured with correct printer IP
- [ ] Test print works from all devices
- [ ] Backup manual print option available

## Advantages of Client-Side Printing

✅ **Works with production server** - No need for server to reach local printer  
✅ **Multiple locations** - Each location has own printer  
✅ **No server changes** - Just frontend configuration  
✅ **Fast** - Direct connection, no server relay  
✅ **Flexible** - Each device can use different printer  

## Disadvantages

❌ **Same network required** - Devices must be on local network  
❌ **Per-device config** - Each device needs configuration  
❌ **No remote printing** - Can't print from outside network (without VPN)  

## Alternative: Server-Side with VPN

If you want server-side printing:

1. **Setup VPN** at location with printer
2. **Connect production server** to VPN
3. **Server can reach** local printer IP
4. **Use original server-side approach**

This is more complex but allows:
- Print from anywhere
- Centralized configuration
- No per-device setup

## Summary

**For most POS systems, client-side printing is the best solution:**

- Simple setup
- Works with production server
- No VPN needed
- Each location independent

**Just remember: POS device and printer must be on same network!**
