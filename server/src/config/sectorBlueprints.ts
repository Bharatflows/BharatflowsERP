
export interface LedgerGroupTemplate {
    name: string;
    code: string;
    parentCode?: string;
    type: 'ASSET' | 'LIABILITY' | 'EQUITY' | 'INCOME' | 'EXPENSE';
    isSystem: boolean;
}

export interface LedgerTemplate {
    name: string;
    code: string;
    groupCode: string; // References LedgerGroupTemplate.code
    openingBalanceType: 'DEBIT' | 'CREDIT';
    description?: string;
}

export interface SectorBlueprint {
    sector: string;
    businessType: 'MANUFACTURING' | 'TRADING' | 'SERVICE' | 'HYBRID';
    modules: Record<string, boolean>;
    features: Record<string, boolean>;
    ledgerGroups: LedgerGroupTemplate[];
    ledgers: LedgerTemplate[];
    inventoryTypes: string[]; // e.g., 'RAW_MATERIAL', 'WIP', 'FINISHED_GOODS'
    productionFlow?: string[]; // Ordered list of stages
    validationRules?: string[]; // Custom validation rules
}

export const SECTOR_BLUEPRINTS: Record<string, SectorBlueprint> = {
    GARMENT: {
        sector: "GARMENT",
        businessType: "MANUFACTURING",
        modules: {
            inventory: true,
            production: true,
            accounting: true,
            gst: true,
            hr: true,
            pos: false // Usually B2B
        },
        features: {
            bom: true,
            batchTracking: true, // For fabric rolls
            serialTracking: false,
            wastage: true,
            multiWarehouse: true // Cutting floor vs Store vs Showroom
        },
        inventoryTypes: [
            "FABRIC", "ACCESSORIES", "SEMI_FINISHED", "FINISHED_GARMENT", "SCRAP"
        ],
        productionFlow: [
            "CUTTING", "STITCHING", "WASHING", "IRONING", "PACKING"
        ],
        ledgerGroups: [
            { name: "Direct Manufacturing Expenses", code: "MFG_EXP", type: "EXPENSE", isSystem: true },
            { name: "Finished Goods Inventory", code: "FG_STOCK", type: "ASSET", isSystem: true, parentCode: "STOCK_IN_HAND" },
            { name: "WIP Inventory", code: "WIP_STOCK", type: "ASSET", isSystem: true, parentCode: "STOCK_IN_HAND" },
            { name: "Raw Material Inventory", code: "RM_STOCK", type: "ASSET", isSystem: true, parentCode: "STOCK_IN_HAND" }
        ],
        ledgers: [
            { name: "Fabric Purchase", code: "PUR_FABRIC", groupCode: "PURCHASE_ACCOUNTS", openingBalanceType: "DEBIT" },
            { name: "Accessories Purchase", code: "PUR_ACCESSORIES", groupCode: "PURCHASE_ACCOUNTS", openingBalanceType: "DEBIT" },
            { name: "Stitching Charges (Job Work)", code: "JOB_STITCHING", groupCode: "MFG_EXP", openingBalanceType: "DEBIT" },
            { name: "Washing Charges", code: "WASHING_EXP", groupCode: "MFG_EXP", openingBalanceType: "DEBIT" },
            { name: "Production Wastage / Loss", code: "PROD_LOSS", groupCode: "DIRECT_EXPENSES", openingBalanceType: "DEBIT" }
        ]
    },

    POLYBAG: {
        sector: "POLYBAG",
        businessType: "MANUFACTURING",
        modules: {
            inventory: true,
            production: true,
            accounting: true,
            gst: true,
            hr: true,
            pos: false
        },
        features: {
            bom: true,
            batchTracking: true,
            wastage: true, // Critical for extrusion
            multiWarehouse: true
        },
        inventoryTypes: [
            "GRANULES", "MASTERBATCH", "FILM_ROLLS", "PRINTED_ROLLS", "FINISHED_BAGS", "SCRAP"
        ],
        productionFlow: [
            "EXTRUSION", "PRINTING", "CUTTING", "PACKING"
        ],
        ledgerGroups: [
            { name: "Manufacturing Power & Fuel", code: "MFG_POWER", type: "EXPENSE", isSystem: false },
            { name: "Scrap Recovery", code: "SCRAP_INC", type: "INCOME", isSystem: false }
        ],
        ledgers: [
            { name: "Granules Purchase", code: "PUR_granules", groupCode: "PURCHASE_ACCOUNTS", openingBalanceType: "DEBIT" },
            { name: "Masterbatch Purchase", code: "PUR_masterbatch", groupCode: "PURCHASE_ACCOUNTS", openingBalanceType: "DEBIT" },
            { name: "Extrusion Power Cost", code: "EXT_POWER", groupCode: "MFG_POWER", openingBalanceType: "DEBIT" },
            { name: "Cylinder Making Charges", code: "CYLINDER_EXP", groupCode: "DIRECT_EXPENSES", openingBalanceType: "DEBIT" },
            { name: "Scrap Sales", code: "SALE_SCRAP", groupCode: "SALES_ACCOUNTS", openingBalanceType: "CREDIT" }
        ]
    },

    GENERIC_TRADING: {
        sector: "TRADING_GENERAL",
        businessType: "TRADING",
        modules: {
            inventory: true,
            pos: true,
            production: false,
            accounting: true,
            gst: true,
            crm: true
        },
        features: {
            barcode: true,
            multiWarehouse: true,
            ecommerce: true
        },
        inventoryTypes: ["TRADED_GOODS"],
        ledgerGroups: [],
        ledgers: [
            { name: "Purchase Account", code: "PUR_GEN", groupCode: "PURCHASE_ACCOUNTS", openingBalanceType: "DEBIT" },
            { name: "Sales Account", code: "SALE_GEN", groupCode: "SALES_ACCOUNTS", openingBalanceType: "CREDIT" }
        ]
    }
};
