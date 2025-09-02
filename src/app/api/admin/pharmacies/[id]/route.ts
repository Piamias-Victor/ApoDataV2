// src/app/api/admin/pharmacies/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import type { PharmacyUpdateData } from '@/types/pharmacy';

/**
 * API Route - Mise à jour d'une pharmacie
 * 
 * PATCH /api/admin/pharmacies/[id]
 * Body: PharmacyUpdateData
 * 
 * Sécurité: Admin uniquement
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 1. Vérification sécurité admin
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'admin') {
      console.log('❌ [API] Unauthorized update attempt');
      return NextResponse.json(
        { error: 'Unauthorized - Admin only' },
        { status: 403 }
      );
    }
    
    const pharmacyId = params.id;
    const updateData: PharmacyUpdateData = await request.json();
    
    console.log('📝 [API] Updating pharmacy:', { pharmacyId, updateData });
    
    // 2. Vérification que la pharmacie existe
    const checkQuery = `SELECT id FROM data_pharmacy WHERE id = $1`;
    const checkResult = await db.query(checkQuery, [pharmacyId]);
    
    if (checkResult.length === 0) {
      return NextResponse.json(
        { error: 'Pharmacy not found' },
        { status: 404 }
      );
    }
    
    // 3. Construction de la requête UPDATE dynamique
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;
    
    if (updateData.name !== undefined) {
      updates.push(`name = $${paramIndex++}`);
      values.push(updateData.name);
    }
    
    if (updateData.id_nat !== undefined) {
      updates.push(`id_nat = $${paramIndex++}`);
      values.push(updateData.id_nat);
    }
    
    if (updateData.address !== undefined) {
      updates.push(`address = $${paramIndex++}`);
      values.push(updateData.address);
    }
    
    if (updateData.area !== undefined) {
      updates.push(`area = $${paramIndex++}`);
      values.push(updateData.area);
    }
    
    if (updateData.ca !== undefined) {
      updates.push(`ca = $${paramIndex++}`);
      values.push(updateData.ca);
    }
    
    if (updateData.employees_count !== undefined) {
      updates.push(`employees_count = $${paramIndex++}`);
      values.push(updateData.employees_count);
    }
    
    // Surface n'existe peut-être pas dans la DB, on peut l'ignorer ou l'ajouter si le champ existe
    // Pour l'instant on l'ignore car il n'est pas dans le schéma original
    
    if (updates.length === 0) {
      return NextResponse.json(
        { error: 'No fields to update' },
        { status: 400 }
      );
    }
    
    // Ajout de updated_at et pharmacy_id
    updates.push(`updated_at = NOW()`);
    values.push(pharmacyId);
    
    const updateQuery = `
      UPDATE data_pharmacy 
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;
    
    // 4. Exécution de la mise à jour
    const result = await db.query(updateQuery, values);
    
    if (result.length === 0) {
      throw new Error('Update failed');
    }
    
    const updatedPharmacy = result[0];
    
    // 5. Log d'audit
    console.log('✅ [API] Pharmacy updated successfully:', {
      pharmacyId,
      updatedBy: session.user.id,
      timestamp: new Date().toISOString()
    });
    
    // 6. Formatage de la réponse
    return NextResponse.json({
      success: true,
      pharmacy: {
        id: updatedPharmacy.id,
        id_nat: updatedPharmacy.id_nat,
        name: updatedPharmacy.name,
        address: updatedPharmacy.address,
        area: updatedPharmacy.area,
        ca: updatedPharmacy.ca ? parseFloat(updatedPharmacy.ca.toString()) : null,
        employees_count: updatedPharmacy.employees_count ? 
          parseInt(updatedPharmacy.employees_count.toString()) : null,
        created_at: updatedPharmacy.created_at,
        updated_at: updatedPharmacy.updated_at
      }
    });
    
  } catch (error) {
    console.error('❌ [API] Error updating pharmacy:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}