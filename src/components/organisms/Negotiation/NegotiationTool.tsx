'use client';

import React from 'react';
import { useNegotiation } from '@/hooks/useNegotiation';
import { NegotiationScenario } from '@/types/negotiation';
import { Input } from '@/components/atoms/Input/Input';
import { Calculator } from 'lucide-react';

const CURRENCY_FORMAT = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' });

const NUMBER_FORMAT = new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const NegotiationTool = () => {
    const { 
        scenarios, 
        updateField, 

        calculateTargetPP_forMarginPercent 
    } = useNegotiation();



    return (
        <div className="space-y-6">
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/60 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-gray-50/50">
                                <th className="p-4 text-left font-semibold text-gray-600 w-1/4">Indicateur</th>
                                {scenarios.map(s => (
                                    <th key={s.id} className="p-4 text-center font-bold text-gray-800 w-1/4 bg-opacity-50">
                                        <div className={`
                                            inline-flex items-center px-3 py-1 rounded-full text-sm
                                            ${s.id === '1' ? 'bg-blue-100 text-blue-800' : 
                                              s.id === '2' ? 'bg-purple-100 text-purple-800' : 
                                              'bg-yellow-100 text-yellow-800'}
                                        `}>
                                            {s.name}
                                        </div>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {/* ACHAT SECTION */}
                            <SectionHeader title="Paramètres Achat" />
                            <InputRow label="Prix Tarif (€)" field="prixTarif" scenarios={scenarios} onChange={updateField} />
                            <InputRow label="RSF (%)" field="rsfPercent" scenarios={scenarios} onChange={updateField} />
                            <InputRow label="RFA 1 (%)" field="rfa1Percent" scenarios={scenarios} onChange={updateField} />
                            <InputRow label="RFA 2 (%)" field="rfa2Percent" scenarios={scenarios} onChange={updateField} />
                            <InputRow label="TVA (%)" field="tvaPercent" scenarios={scenarios} onChange={updateField} />
                            <InputRow label="Quantité Commandée" field="qteCommandee" scenarios={scenarios} onChange={updateField} />
                            <InputRow label="Unités Gratuites (UG)" field="ug" scenarios={scenarios} onChange={updateField} />
                             
                            {/* RESULTS ACHAT SECTION */}
                            <SectionHeader title="Résultats Achat (Calculés)" className="bg-gray-50/80 mt-4" />
                            <DisplayRow scenarios={scenarios} label="Prix Net Remise" getValue={(s: NegotiationScenario) => s.prixNetRemise} format={(v: number) => CURRENCY_FORMAT.format(v)} />
                            <DisplayRow scenarios={scenarios} label="Prix Net avec UG" getValue={(s: NegotiationScenario) => s.prixNetAvecUG} format={(v: number) => CURRENCY_FORMAT.format(v)} highlight />
                            <DisplayRow scenarios={scenarios} label="Prix Net avec RFA 1" getValue={(s: NegotiationScenario) => s.prixNetAvecRFA1} format={(v: number) => CURRENCY_FORMAT.format(v)} />
                            <DisplayRow scenarios={scenarios} label="Prix Net Final (RFA 2)" getValue={(s: NegotiationScenario) => s.prixNetAvecRFA2} format={(v: number) => CURRENCY_FORMAT.format(v)} bold />

                            {/* VENTE SECTION */}
                            <SectionHeader title="Paramètres Vente" className="bg-blue-50/30" />
                            
                            {/* Custom Row for Public Price with Simulator for Scenario 3 */}
                            <tr className="hover:bg-gray-50/50 transition-colors">
                                <td className="p-4 text-sm text-gray-700 font-medium">Prix Public TTC Cible (€)</td>
                                {scenarios.map((s: NegotiationScenario) => (
                                    <td key={s.id} className="p-2 text-center align-top">
                                        <div className="flex flex-col items-center gap-2">
                                            <Input
                                                type="text"
                                                value={(s.prixPublicTTC?.toString()) || ''}
                                                onChange={(e) => updateField(s.id, 'prixPublicTTC', e.target.value)}
                                                className={`text-center max-w-[120px] ${s.id === '3' ? 'font-bold bg-blue-50/50 border-blue-200' : ''}`}
                                                size="sm"
                                                placeholder="0"
                                            />
                                            
                                            {/* Simulator Button for Scenario 3 */}
                                            {s.id === '3' && (
                                                <button
                                                    onClick={() => {
                                                        const targetPrice = calculateTargetPP_forMarginPercent('3', '1');
                                                        updateField('3', 'prixPublicTTC', targetPrice.toFixed(2));
                                                    }}
                                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md shadow-sm transition-all text-xs font-semibold whitespace-nowrap"
                                                    title="Calculer le prix public pour obtenir le même % de marge que la Proposition Actuelle"
                                                >
                                                    <Calculator size={12} />
                                                    Aligner Marge Propal 1
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                ))}
                            </tr>

                            {/* TRADE SELL-OUT INPUTS */}
                            <SectionHeader title="Trade Sell-Out (Simulation)" className="bg-yellow-50/30 mt-4" />
                            <InputRow label="Trade Sell-Out (€)" field="tradeSellOutAmount" scenarios={scenarios} onChange={updateField} />
                            <InputRow label="Trade Sell-Out (%)" field="tradeSellOutPercent" scenarios={scenarios} onChange={updateField} />
            
            {/* PRIX PUBLIC EFFECTIF AVEC TRADE (Calculated) */}
            <DisplayRow scenarios={scenarios} label="Prix Public TTC Effectif avec Trade (€)" getValue={(s: NegotiationScenario) => s.prixPublicTTCEffectif} format={(v: number) => CURRENCY_FORMAT.format(v)} highlight bold />
                            
                            {/* RENTABILITÉ SECTION */}
                            <SectionHeader title="Rentabilité & Marge" className="bg-green-50/30" />
                            <DisplayRow scenarios={scenarios} label="Marge Unitaire (€)" getValue={(s: NegotiationScenario) => s.margeVal} format={(v: number) => CURRENCY_FORMAT.format(v)} colorize />
                            <DisplayRow scenarios={scenarios} label="Coefficient" getValue={(s: NegotiationScenario) => s.coefficient} format={(v: number) => NUMBER_FORMAT.format(v)} />
                            <DisplayRow scenarios={scenarios} label="Marge (%)" getValue={(s: NegotiationScenario) => s.margePercent} format={(v: number) => NUMBER_FORMAT.format(v) + ' %'} colorize />
                            
                            {/* RENTABILITÉ AVEC TRADE SECTION */}
                            <SectionHeader title="Rentabilité avec Trade" className="bg-purple-50/30" />
                            <DisplayRow scenarios={scenarios} label="Marge Trade (€)" getValue={(s: NegotiationScenario) => s.margeTradeVal} format={(v: number) => CURRENCY_FORMAT.format(v)} colorize />
                            <DisplayRow scenarios={scenarios} label="Marge Trade (%)" getValue={(s: NegotiationScenario) => s.margeTradePercent} format={(v: number) => NUMBER_FORMAT.format(v) + ' %'} colorize />
                        </tbody>
                    </table>
                </div>
            </div>

        </div>
    );
};

// --- Helper Components ---

const SectionHeader = ({ title, className = '' }: { title: string, className?: string }) => (
    <tr className={`border-b border-gray-100 ${className}`}>
        <td colSpan={4} className="p-3 text-xs font-bold text-gray-500 uppercase tracking-wider bg-gray-50/50">
            {title}
        </td>
    </tr>
);

const InputRow = ({ label, field, scenarios, onChange, highlight }: any) => (
    <tr className="hover:bg-gray-50/50 transition-colors">
        <td className="p-4 text-sm text-gray-700 font-medium">{label}</td>
        {scenarios.map((s: NegotiationScenario) => (
            <td key={s.id} className="p-2 text-center">
                <Input
                    type="text"
                    value={(s[field as keyof NegotiationScenario]?.toString()) || ''}
                    onChange={(e) => onChange(s.id, field, e.target.value)}
                    className={`text-center max-w-[120px] mx-auto ${highlight ? 'font-bold bg-blue-50/50 border-blue-200' : ''}`}
                    size="sm"
                    placeholder="0"
                />
            </td>
        ))}
    </tr>
);

const DisplayRow = ({ scenarios, label, getValue, format, bold, colorize, highlight }: any) => {
    // Find max value for colorization (optional logic)
    const values = scenarios.map(getValue);
    const maxVal = Math.max(...(values as number[]));


    return (
        <tr className={`transition-colors ${highlight ? 'bg-yellow-50/30' : 'hover:bg-gray-50/30'}`}>
            <td className="p-4 text-sm text-gray-700 font-medium">{label}</td>
            {scenarios.map((s: NegotiationScenario) => {
                const val = getValue(s);
                const isMax = colorize && val === maxVal && val > 0;
                
                return (
                    <td key={s.id} className="p-4 text-center">
                        <span className={`
                            ${bold ? 'font-bold' : 'font-medium'}
                            ${isMax ? 'text-green-600' : 'text-gray-900'}
                        `}>
                            {format(val)}
                        </span>
                    </td>
                );
            })}
        </tr>
    );
};
