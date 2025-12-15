import React from 'react';
import { Drawer } from '@/components/molecules/Drawer/Drawer';
import { PharmacyFilterPanel } from '../../FilterPanel/PharmacyFilterPanel';
import { DateFilterPanel } from '../../FilterPanel/DateFilterPanel';
import { LaboratoriesFilterPanel } from '../../FilterPanel/LaboratoriesFilterPanel';
import { CategoriesFilterPanel } from '../../FilterPanel/CategoriesFilterPanel';
import { ProductsFilterPanel } from '../../FilterPanel/ProductsFilterPanel';
import { LogicalOperatorFilterPanel } from '../../FilterPanel/LogicalOperatorFilterPanel';
import { ExclusionsFilterPanel } from '../../FilterPanel/ExclusionsFilterPanel';
import { DrawerType } from '../hooks/useFilterBarLogic';

interface FilterDrawerListProps {
    activeDrawer: DrawerType;
    onClose: () => void;
}

export const FilterDrawerList: React.FC<FilterDrawerListProps> = ({ activeDrawer, onClose }) => {
    React.useEffect(() => {
        if (activeDrawer) {
            document.body.style.overflow = 'hidden';
            document.documentElement.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
            document.documentElement.style.overflow = '';
        }

        return () => {
            document.body.style.overflow = '';
            document.documentElement.style.overflow = '';
        };
    }, [activeDrawer]);

    return (
        <>
            <Drawer isOpen={activeDrawer === 'pharmacy'} onClose={onClose} title="Sélection Pharmacies" accentColor="orange">
                <PharmacyFilterPanel onClose={onClose} />
            </Drawer>

            <Drawer isOpen={activeDrawer === 'date'} onClose={onClose} title="Période" accentColor="blue">
                <DateFilterPanel onClose={onClose} />
            </Drawer>

            <Drawer isOpen={activeDrawer === 'laboratories'} onClose={onClose} title="Laboratoires & Marques" accentColor="purple">
                <LaboratoriesFilterPanel onClose={onClose} />
            </Drawer>

            <Drawer isOpen={activeDrawer === 'categories'} onClose={onClose} title="Catégories" accentColor="red">
                <CategoriesFilterPanel onClose={onClose} />
            </Drawer>

            <Drawer isOpen={activeDrawer === 'products'} onClose={onClose} title="Produits" accentColor="green">
                <ProductsFilterPanel onClose={onClose} />
            </Drawer>

            <Drawer isOpen={activeDrawer === 'operators'} onClose={onClose} title="Opérateur Logique" accentColor="yellow">
                <LogicalOperatorFilterPanel onClose={onClose} />
            </Drawer>

            <Drawer isOpen={activeDrawer === 'exclusions'} onClose={onClose} title="Exclusions" accentColor="black">
                <ExclusionsFilterPanel onClose={onClose} />
            </Drawer>
        </>
    );
};
