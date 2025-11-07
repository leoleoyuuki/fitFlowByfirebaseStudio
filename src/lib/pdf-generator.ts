
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { ClientPlan } from '@/types';

// O autoTable não se anexa automaticamente em todos os ambientes de módulo,
// então aplicamos manualmente se necessário.
if (typeof (jsPDF.prototype as any).autoTable !== 'function') {
    // Isso estende o protótipo do jsPDF para incluir a função autoTable
    // e garante que 'doc.autoTable' funcionará.
    autoTable(jsPDF.prototype);
}

// Estende a interface jsPDF para incluir o método autoTable para o TypeScript
interface jsPDFWithAutoTable extends jsPDF {
  autoTable: (options: any) => jsPDF;
}

export async function generatePlanPdf(plan: ClientPlan): Promise<void> {
    const doc = new jsPDF() as jsPDFWithAutoTable;
    const { planData, clientName, professionalRegistration, createdAt } = plan;

    const formatDate = (timestamp: any) => {
        if (!timestamp || !timestamp.toDate) return 'Data indisponível';
        return new Date(timestamp.toDate()).toLocaleDateString('pt-BR', {
            year: 'numeric', month: 'long', day: 'numeric'
        });
    };
    
    // --- Page 1: Header, Summary, and Diet ---

    // Main Header
    doc.setFontSize(22);
    doc.setTextColor('#3F51B5'); // Primary color
    doc.text(`Plano para: ${clientName}`, 14, 22);

    doc.setFontSize(10);
    doc.setTextColor(100);
    const professionalInfo = professionalRegistration ? `Profissional Responsável: ${professionalRegistration}` : '';
    const generatedDate = `Gerado em: ${formatDate(createdAt)}`;
    doc.text(`${professionalInfo}${professionalInfo ? ' | ' : ''}${generatedDate}`, 14, 29);
    
    let currentY = 40;

    // Overall Summary
    if (planData.overallSummary) {
        doc.setFontSize(14);
        doc.setTextColor('#3F51B5');
        doc.text("Resumo Geral", 14, currentY);
        currentY += 7;

        doc.setFontSize(10);
        doc.setTextColor(50);
        const summaryLines = doc.splitTextToSize(planData.overallSummary, 180);
        doc.text(summaryLines, 14, currentY);
        currentY += (summaryLines.length * 5) + 10;
    }
    
    // Diet Guidance
    if (planData.dietGuidance) {
        doc.setFontSize(14);
        doc.setTextColor('#3F51B5');
        doc.text("Diretrizes de Dieta", 14, currentY);
        currentY += 7;
        
        const { estimatedDailyCalories, proteinGrams, carbGrams, fatGrams } = planData.dietGuidance;
        const macroInfo = `Metas Diárias Estimadas: ~${estimatedDailyCalories} kcal | P: ${proteinGrams}g, C: ${carbGrams}g, G: ${fatGrams}g`;
        doc.setFontSize(9);
        doc.setTextColor(100);
        doc.text(macroInfo, 14, currentY);
        currentY += 8;

        planData.dietGuidance.dailyMealPlans.forEach(meal => {
            meal.mealOptions.forEach((option, index) => {
                const mealTitle = `${meal.mealName} - Opção ${index + 1}${option.optionDescription ? ` (${option.optionDescription})` : ''}`;
                
                const body = option.items.map(item => [item.foodName, item.quantity]);

                doc.autoTable({
                    startY: currentY,
                    head: [[{ content: mealTitle, colSpan: 2, styles: { fillColor: '#F0F2F5', textColor: '#3F51B5' } }]],
                    body: body,
                    theme: 'grid',
                    headStyles: { fontStyle: 'bold' },
                    didDrawPage: (data) => {
                        // Reseta a posição Y após o autoTable desenhar (se houver quebra de página)
                        currentY = data.cursor?.y || currentY;
                    }
                });
                currentY = (doc as any).autoTable.previous.finalY + 6;
            });
        });

        if (planData.dietGuidance.notes) {
            currentY += 4;
            doc.setFontSize(10);
            doc.setTextColor('#3F51B5');
            doc.text('Notas da Dieta:', 14, currentY);
            currentY += 5;
            doc.setFontSize(9);
            doc.setTextColor(80);
            const dietNotesLines = doc.splitTextToSize(planData.dietGuidance.notes, 180);
            doc.text(dietNotesLines, 14, currentY);
        }
    }


    // --- Subsequent Pages: Training Plan (one day per page) ---

    if (planData.trainingPlan && planData.trainingPlan.workouts) {
        planData.trainingPlan.workouts.forEach((workoutDay, index) => {
            doc.addPage();
            currentY = 22;

            // Page Header
            doc.setFontSize(18);
            doc.setTextColor('#3F51B5');
            doc.text(workoutDay.day, 14, currentY);
            if(workoutDay.focus) {
                 doc.setFontSize(12);
                 doc.setTextColor(100);
                 doc.text(`Foco: ${workoutDay.focus}`, 14, currentY + 7);
                 currentY += 7;
            }
            currentY += 10;
            
            const head = [['Exercício', 'Séries', 'Reps', 'Descanso', 'Notas']];
            const body = workoutDay.exercises.map(ex => [
                ex.name,
                ex.sets,
                ex.reps,
                ex.restSeconds ? `${ex.restSeconds / 60} min` : '-',
                ex.notes || '-'
            ]);

            doc.autoTable({
                startY: currentY,
                head: head,
                body: body,
                theme: 'striped',
                headStyles: { fillColor: '#3F51B5', textColor: '#FFFFFF' },
                columnStyles: {
                    0: { cellWidth: 50 }, // Exercise
                    1: { cellWidth: 20 }, // Sets
                    2: { cellWidth: 20 }, // Reps
                    3: { cellWidth: 25 }, // Rest
                    4: { cellWidth: 'auto' }, // Notes
                }
            });
        });
    }

    const safeFilename = `Plano - ${clientName.replace(/[^a-z0-9]/gi, '_')}.pdf`;
    doc.save(safeFilename);
}
