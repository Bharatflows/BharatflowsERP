// Common HSN codes for Indian businesses
// Can be imported using POST /api/v1/hsn/import

export const commonHSNCodes = [
    // Electronics
    { code: '8471', description: 'Computers and data processing units', gstRate: 18, category: 'Electronics' },
    { code: '8517', description: 'Telephones, mobile phones, smartphones', gstRate: 18, category: 'Electronics' },
    { code: '8523', description: 'Discs, tapes, storage devices', gstRate: 18, category: 'Electronics' },
    { code: '8528', description: 'Monitors, projectors, televisions', gstRate: 28, category: 'Electronics' },
    { code: '8504', description: 'Electrical transformers, power supplies, UPS', gstRate: 18, category: 'Electronics' },

    // Textiles & Garments
    { code: '6109', description: 'T-shirts, singlets and vests, knitted', gstRate: 5, category: 'Garments' },
    { code: '6104', description: 'Women\'s suits, dresses, skirts, trousers', gstRate: 5, category: 'Garments' },
    { code: '6103', description: 'Men\'s suits, jackets, trousers', gstRate: 5, category: 'Garments' },
    { code: '6205', description: 'Men\'s shirts', gstRate: 5, category: 'Garments' },
    { code: '6204', description: 'Women\'s suits, ensembles, not knitted', gstRate: 5, category: 'Garments' },

    // Food & Beverages
    { code: '0901', description: 'Coffee, roasted or unroasted', gstRate: 5, category: 'Food' },
    { code: '0902', description: 'Tea, green tea, black tea', gstRate: 5, category: 'Food' },
    { code: '1905', description: 'Bread, pastries, biscuits, cakes', gstRate: 18, category: 'Food' },
    { code: '1704', description: 'Sugar confectionery, chocolates', gstRate: 18, category: 'Food' },
    { code: '2201', description: 'Mineral waters, drinking water', gstRate: 18, category: 'Beverages' },
    { code: '2202', description: 'Soft drinks, aerated beverages', gstRate: 28, category: 'Beverages' },

    // Packaging & Paper
    { code: '4819', description: 'Cartons, boxes, bags made of paper', gstRate: 18, category: 'Packaging' },
    { code: '4823', description: 'Other paper and paperboard articles', gstRate: 18, category: 'Paper' },
    { code: '3923', description: 'Plastic containers, bottles, boxes', gstRate: 18, category: 'Packaging' },

    // Machinery & Equipment
    { code: '8414', description: 'Air pumps, vacuum pumps, compressors', gstRate: 18, category: 'Machinery' },
    { code: '8418', description: 'Refrigerators, freezers, cooling equipment', gstRate: 18, category: 'Appliances' },
    { code: '8422', description: 'Dishwashing machines, packaging machinery', gstRate: 18, category: 'Machinery' },
    { code: '8443', description: 'Printing machinery, printers', gstRate: 18, category: 'Machinery' },
    { code: '8467', description: 'Hand-held power tools', gstRate: 18, category: 'Tools' },

    // Furniture
    { code: '9401', description: 'Seats, chairs (excluding 9402)', gstRate: 18, category: 'Furniture' },
    { code: '9403', description: 'Other furniture and parts', gstRate: 18, category: 'Furniture' },
    { code: '9404', description: 'Mattresses, sleeping bags, bedding', gstRate: 18, category: 'Furniture' },

    // Stationery
    { code: '4820', description: 'Registers, notebooks, diaries', gstRate: 18, category: 'Stationery' },
    { code: '9608', description: 'Ball point pens, felt tip pens', gstRate: 18, category: 'Stationery' },

    // Cosmetics
    { code: '3304', description: 'Beauty products, makeup, skin care', gstRate: 28, category: 'Cosmetics' },
    { code: '3305', description: 'Hair preparations, shampoos', gstRate: 18, category: 'Cosmetics' },
    { code: '3306', description: 'Oral hygiene, toothpaste, mouthwash', gstRate: 18, category: 'Personal Care' },
    { code: '3307', description: 'Shaving preparations, deodorants', gstRate: 28, category: 'Personal Care' },

    // Pharmaceuticals
    { code: '3004', description: 'Medicaments, pharmaceutical preparations', gstRate: 12, category: 'Pharmaceuticals' },
    { code: '3005', description: 'Bandages, medical dressings', gstRate: 12, category: 'Medical' },

    // Automotive
    { code: '8703', description: 'Motor cars, vehicles for persons', gstRate: 28, category: 'Automotive' },
    { code: '8711', description: 'Motorcycles, scooters, cycles', gstRate: 28, category: 'Automotive' },
    { code: '4011', description: 'New rubber tyres', gstRate: 28, category: 'Automotive' },
    { code: '8708', description: 'Motor vehicle parts and accessories', gstRate: 28, category: 'Automotive' },

    // Services (SAC Codes)
    { code: '9954', description: 'Construction services', gstRate: 18, category: 'Services', isService: true },
    { code: '9971', description: 'Financial and related services', gstRate: 18, category: 'Services', isService: true },
    { code: '9972', description: 'Real estate services', gstRate: 18, category: 'Services', isService: true },
    { code: '9973', description: 'Leasing or rental services', gstRate: 18, category: 'Services', isService: true },
    { code: '9983', description: 'Other professional, technical services', gstRate: 18, category: 'Services', isService: true },
    { code: '9984', description: 'Telecommunications, broadcasting', gstRate: 18, category: 'Services', isService: true },
    { code: '9985', description: 'Support services, business admin', gstRate: 18, category: 'Services', isService: true },
    { code: '9986', description: 'Educational services', gstRate: 18, category: 'Services', isService: true },
    { code: '9987', description: 'Maintenance and repair services', gstRate: 18, category: 'Services', isService: true },
    { code: '9988', description: 'Manufacturing services on physical inputs', gstRate: 18, category: 'Services', isService: true },
    { code: '9991', description: 'Public administration, government', gstRate: 0, category: 'Services', isService: true },
    { code: '9992', description: 'Education services', gstRate: 0, category: 'Services', isService: true },
    { code: '9993', description: 'Human health and social care', gstRate: 0, category: 'Services', isService: true },
    { code: '9995', description: 'Recreational, cultural and sporting services', gstRate: 18, category: 'Services', isService: true },
    { code: '9996', description: 'Personal services (salon, spa)', gstRate: 18, category: 'Services', isService: true },
    { code: '9997', description: 'Other services', gstRate: 18, category: 'Services', isService: true },
];

export default commonHSNCodes;
