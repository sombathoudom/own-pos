/**
 * Client-Side Printer Service
 * 
 * Connects to local ESC/POS Printer Server via WebSocket
 * Works from any device on the same network as the printer
 */

export type ReceiptData = {
    invoice_no: string;
    date: string;
    customer_name: string;
    phone: string;
    location: string;
    delivery: string;
    items: Array<{
        product: string;
        qty: number;
        total: number;
    }>;
    discount: number;
    delivery_fee: number;
    total: number;
    paid: number;
    remaining: number;
    status: string;
    footer?: string;
};

export type PrinterConfig = {
    serverUrl: string;
    printerName: string;
    printerNameShort: string;
    pullCashDrawer: boolean;
    enabled: boolean;
};

class PrinterService {
    private config: PrinterConfig;

    constructor() {
        // Load config from localStorage or use defaults
        this.config = this.loadConfig();
    }

    /**
     * Load printer configuration from localStorage
     */
    private loadConfig(): PrinterConfig {
        const saved = localStorage.getItem('printer_config');
        
        if (saved) {
            return JSON.parse(saved);
        }

        // Default configuration
        return {
            serverUrl: 'ws://192.168.110.176:1945',
            printerName: 'smb://localhost/XP-80C',
            printerNameShort: 'XP-80C',
            pullCashDrawer: false,
            enabled: false, // Disabled by default
        };
    }

    /**
     * Save printer configuration to localStorage
     */
    saveConfig(config: Partial<PrinterConfig>): void {
        this.config = { ...this.config, ...config };
        localStorage.setItem('printer_config', JSON.stringify(this.config));
    }

    /**
     * Get current configuration
     */
    getConfig(): PrinterConfig {
        return { ...this.config };
    }

    /**
     * Test printer connection
     */
    async testConnection(): Promise<boolean> {
        return new Promise((resolve) => {
            try {
                const ws = new WebSocket(this.config.serverUrl);

                ws.onopen = () => {
                    console.log('✅ Printer connection successful');
                    ws.close();
                    resolve(true);
                };

                ws.onerror = () => {
                    console.error('❌ Printer connection failed');
                    resolve(false);
                };

                ws.onclose = () => {
                    // Connection closed
                };

                // Timeout after 5 seconds
                setTimeout(() => {
                    if (ws.readyState !== WebSocket.CLOSED) {
                        ws.close();
                        resolve(false);
                    }
                }, 5000);
            } catch (error) {
                console.error('Printer test error:', error);
                resolve(false);
            }
        });
    }

    /**
     * Print receipt
     */
    async printReceipt(receiptData: ReceiptData): Promise<{
        success: boolean;
        message: string;
    }> {
        if (!this.config.enabled) {
            return {
                success: false,
                message: 'Printer is disabled. Enable it in settings.',
            };
        }

        return new Promise((resolve) => {
            try {
                const ws = new WebSocket(this.config.serverUrl);

                ws.onopen = () => {
                    console.log('📡 Connected to printer server');

                    const payload = {
                        from: 'posclient',
                        printer_name: this.config.printerName,
                        printer_settings: {
                            interface: 'windows-usb',
                            printer_name: this.config.printerNameShort,
                            template: 'custom_invoice_image',
                            pull_cash_drawer: this.config.pullCashDrawer,
                            more_new_line: 3,
                        },
                        receipt_data: receiptData,
                    };

                    ws.send(JSON.stringify(payload));
                    console.log('📄 Receipt data sent');
                };

                ws.onmessage = (event) => {
                    console.log('📨 Server response:', event.data);
                    ws.close();
                    resolve({
                        success: true,
                        message: 'Receipt printed successfully',
                    });
                };

                ws.onerror = (error) => {
                    console.error('❌ WebSocket error:', error);
                    resolve({
                        success: false,
                        message: 'Failed to connect to printer server',
                    });
                };

                ws.onclose = (event) => {
                    if (event.code !== 1000) {
                        // Abnormal closure
                        resolve({
                            success: false,
                            message: `Connection closed unexpectedly (code: ${event.code})`,
                        });
                    }
                };

                // Timeout after 10 seconds
                setTimeout(() => {
                    if (ws.readyState !== WebSocket.CLOSED) {
                        ws.close();
                        resolve({
                            success: false,
                            message: 'Print request timed out',
                        });
                    }
                }, 10000);
            } catch (error) {
                console.error('Print error:', error);
                resolve({
                    success: false,
                    message: error instanceof Error ? error.message : 'Unknown error',
                });
            }
        });
    }

    /**
     * Check if printer is enabled
     */
    isEnabled(): boolean {
        return this.config.enabled;
    }

    /**
     * Enable/disable printer
     */
    setEnabled(enabled: boolean): void {
        this.saveConfig({ enabled });
    }
}

// Export singleton instance
export const printerService = new PrinterService();
