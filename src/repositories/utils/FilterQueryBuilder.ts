
// Define default column mapping matching Achats structure
const DEFAULT_MAPPING = {
    pharmacyId: 'ip.pharmacy_id',
    laboratory: 'gp.bcb_lab',
    productCode: 'ip.code_13_ref_id',
    tva: 'gp.tva_percentage',
    reimbursable: 'gp.is_reimbursable',
    genericStatus: 'gp.bcb_generic_status',

    // Categories
    cat_l0: 'gp.bcb_segment_l0',
    cat_l1: 'gp.bcb_segment_l1',
    cat_l2: 'gp.bcb_segment_l2',
    cat_l3: 'gp.bcb_segment_l3',
    cat_l4: 'gp.bcb_segment_l4',
    cat_l5: 'gp.bcb_segment_l5',
    cat_family: 'gp.bcb_family',
};

export class FilterQueryBuilder {
    private paramIndex: number = 3;
    private params: any[] = [];
    private conditions: string[] = [];
    private cumulativeItemCount: number = 0;
    private filterOperators: ('AND' | 'OR')[] = [];
    private mapping: typeof DEFAULT_MAPPING;

    constructor(
        initialParams: any[] = [],
        initialParamIndex: number = 3,
        filterOperators: ('AND' | 'OR')[] = [],
        customMapping: Partial<typeof DEFAULT_MAPPING> = {}
    ) {
        this.params = [...initialParams];
        this.paramIndex = initialParamIndex;
        this.filterOperators = filterOperators;
        this.mapping = { ...DEFAULT_MAPPING, ...customMapping };
    }

    public getParams(): any[] {
        return this.params;
    }

    public getConditions(): string {
        return this.conditions.length > 0 ? `AND (${this.conditions.join(' ')})` : '';
    }

    public addFilterGroup(
        items: any[],
        sqlGenerator: (paramIdx: number) => string,
        usesParams: boolean = true
    ): void {
        if (!items || items.length === 0) return;

        // Logic to determine operator
        if (this.conditions.length > 0) {
            const operatorIndex = Math.max(0, this.cumulativeItemCount - 1);
            const op = this.filterOperators[operatorIndex] || 'AND';
            this.conditions.push(op);
        }

        // Generate SQL
        const sql = sqlGenerator(this.paramIndex);
        this.conditions.push(`(${sql})`);

        // Register params
        if (usesParams) {
            if (Array.isArray(items) && items.length > 0 && (typeof items[0] !== 'object' || items[0] === null)) {
                this.params.push(items);
                this.paramIndex++;
            }
        }

        this.cumulativeItemCount += 1;
    }

    // --- Specific Filter Implementations ---

    public addPharmacies(pharmacyIds: string[]) {
        this.addFilterGroup(pharmacyIds, (idx) => `${this.mapping.pharmacyId} = ANY($${idx}::uuid[])`);
    }

    public addLaboratories(labs: string[]) {
        this.addFilterGroup(labs, (idx) => `${this.mapping.laboratory} = ANY($${idx}::text[])`);
    }

    public addProducts(productCodes: string[]) {
        this.addFilterGroup(productCodes, (idx) => `${this.mapping.productCode} = ANY($${idx}::text[])`);
    }

    public addTvaRates(rates: number[]) {
        this.addFilterGroup(rates, (idx) => `${this.mapping.tva} = ANY($${idx}::numeric[])`);
    }

    public addReimbursementStatus(status?: 'ALL' | 'REIMBURSED' | 'NOT_REIMBURSED') {
        if (!status || status === 'ALL') return;

        const items = [status];
        this.addFilterGroup(items, (_idx) => {
            if (status === 'REIMBURSED') return `${this.mapping.reimbursable} = true`;
            if (status === 'NOT_REIMBURSED') return `${this.mapping.reimbursable} = false`;
            return '1=1';
        }, false);
    }

    public addGenericStatus(isGeneric?: 'ALL' | 'PRINCEPS_GENERIC' | 'GENERIC' | 'PRINCEPS') {
        if (!isGeneric || isGeneric === 'ALL') return;

        let values: string[] = [];
        if (isGeneric === 'GENERIC') values = ['GÉNÉRIQUE'];
        if (isGeneric === 'PRINCEPS') values = ['RÉFÉRENT'];
        if (isGeneric === 'PRINCEPS_GENERIC') values = ['GÉNÉRIQUE', 'RÉFÉRENT'];

        this.addFilterGroup([isGeneric], (_idx) => {
            if (values.length === 0) return '1=1';
            const valuesList = values.map(v => `'${v}'`).join(',');
            return `${this.mapping.genericStatus} IN (${valuesList})`;
        }, false);
    }

    public addCategories(categories: { code: string; type: string }[]) {
        if (categories.length === 0) return;

        const codesByType: Record<string, string[]> = {};
        categories.forEach(cat => {
            if (!codesByType[cat.type]) codesByType[cat.type] = [];
            codesByType[cat.type]!.push(cat.code);
        });

        const categorySqlParts: string[] = [];
        const mappingKeys: Record<string, string> = {
            'bcb_segment_l0': this.mapping.cat_l0,
            'bcb_segment_l1': this.mapping.cat_l1,
            'bcb_segment_l2': this.mapping.cat_l2,
            'bcb_segment_l3': this.mapping.cat_l3,
            'bcb_segment_l4': this.mapping.cat_l4,
            'bcb_segment_l5': this.mapping.cat_l5,
            'bcb_family': this.mapping.cat_family,
        };

        Object.entries(codesByType).forEach(([type, codes]) => {
            const column = mappingKeys[type];
            if (!column) return;

            categorySqlParts.push(`${column} = ANY($${this.paramIndex}::text[])`);
            this.params.push(codes);
            this.paramIndex++;
        });

        if (categorySqlParts.length > 0) {
            const categorySql = categorySqlParts.join(' OR ');

            if (this.conditions.length > 0) {
                const operatorIndex = Math.max(0, this.cumulativeItemCount - 1);
                const op = this.filterOperators[operatorIndex] || 'AND';
                this.conditions.push(op);
            }
            this.conditions.push(`(${categorySql})`);
            this.cumulativeItemCount += categories.length;
        }
    }

    // --- Exclusion Methods ---

    public addExcludedPharmacies(pharmacyIds: string[]) {
        this.addFilterGroup(pharmacyIds, (idx) => `${this.mapping.pharmacyId} <> ALL($${idx}::uuid[])`);
    }

    public addExcludedLaboratories(labs: string[]) {
        this.addFilterGroup(labs, (idx) => `${this.mapping.laboratory} <> ALL($${idx}::text[])`);
    }

    public addExcludedProducts(productCodes: string[]) {
        this.addFilterGroup(productCodes, (idx) => `${this.mapping.productCode} <> ALL($${idx}::text[])`);
    }

    public addExcludedCategories(categories: { code: string; type: string }[]) {
        if (categories.length === 0) return;

        const codesByType: Record<string, string[]> = {};
        categories.forEach(cat => {
            if (!codesByType[cat.type]) codesByType[cat.type] = [];
            codesByType[cat.type]!.push(cat.code);
        });

        const categorySqlParts: string[] = [];
        const mappingKeys: Record<string, string> = {
            'bcb_segment_l0': this.mapping.cat_l0,
            'bcb_segment_l1': this.mapping.cat_l1,
            'bcb_segment_l2': this.mapping.cat_l2,
            'bcb_segment_l3': this.mapping.cat_l3,
            'bcb_segment_l4': this.mapping.cat_l4,
            'bcb_segment_l5': this.mapping.cat_l5,
            'bcb_family': this.mapping.cat_family,
        };

        Object.entries(codesByType).forEach(([type, codes]) => {
            const column = mappingKeys[type];
            if (!column) return;

            // Exclusion: col <> ALL(...)
            categorySqlParts.push(`${column} <> ALL($${this.paramIndex}::text[])`);
            this.params.push(codes);
            this.paramIndex++;
        });

        if (categorySqlParts.length > 0) {
            // Join with AND because we want to exclude if ANY matches.
            // i.e., Row must NOT be in Group A AND NOT be in Group B.
            const categorySql = categorySqlParts.join(' AND ');

            if (this.conditions.length > 0) {
                // Exclusions are always added with AND to the main query logic
                this.conditions.push('AND');
            }
            this.conditions.push(`(${categorySql})`);
            this.cumulativeItemCount += categories.length; // Count items but operator is fixed AND
        }
    }

    public addRangeFilter(
        range: { min: number; max: number } | undefined,
        column: string
    ) {
        if (!range) return;

        // Range filters count as 1 item for operator logic
        const { min, max } = range;
        this.addFilterGroup([range], (_idx) => {
            this.params.push(min);
            const minParamIdx = this.paramIndex++;
            this.params.push(max);
            const maxParamIdx = this.paramIndex++;

            return `${column} >= $${minParamIdx} AND ${column} <= $${maxParamIdx}`;
        }, false);
    }
}
