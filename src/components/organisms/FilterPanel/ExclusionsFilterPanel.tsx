import React, { useState } from 'react';
import { Package, TestTube, Tag } from 'lucide-react';
import { FilterTabs } from './components/shared/FilterTabs';
import { ExcludedProductsTab } from './components/exclusions/ExcludedProductsTab';
import { ExcludedLaboratoriesTab } from './components/exclusions/ExcludedLaboratoriesTab';
import { ExcludedCategoriesTab } from './components/exclusions/ExcludedCategoriesTab';

interface ExclusionsFilterPanelProps {
    onClose?: () => void;
}

export const ExclusionsFilterPanel: React.FC<ExclusionsFilterPanelProps> = ({ onClose }) => {
    const [activeTab, setActiveTab] = useState<'products' | 'laboratories' | 'categories'>('products');

    return (
        <div className="flex flex-col h-full bg-gray-50/50">
            <div className="bg-white px-6 pt-6 pb-2 z-30 border-b border-gray-50 shadow-sm shrink-0">
                <FilterTabs
                    activeTab={activeTab}
                    onTabChange={setActiveTab}
                    tabs={[
                        { id: 'products', label: 'Produits', icon: Package },
                        { id: 'laboratories', label: 'Laboratoires', icon: TestTube },
                        { id: 'categories', label: 'Catégories', icon: Tag }
                    ]}
                />
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar relative">
                {activeTab === 'products' && <ExcludedProductsTab onClose={onClose ?? undefined} />}
                {activeTab === 'laboratories' && <ExcludedLaboratoriesTab onClose={onClose ?? undefined} />}
                {activeTab === 'categories' && <ExcludedCategoriesTab onClose={onClose ?? undefined} />}
            </div>
        </div>
    );
};
