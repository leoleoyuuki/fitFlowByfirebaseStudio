
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { ClientPlan } from '@/types';

// Estende a interface jsPDF para incluir o método autoTable para o TypeScript
interface jsPDFWithAutoTable extends jsPDF {
  autoTable: (options: any) => jsPDF;
}

export async function generatePlanPdf(plan: ClientPlan, exportType: 'training' | 'diet' | 'both'): Promise<void> {
    const doc = new jsPDF() as jsPDFWithAutoTable;
    const { planData, clientName, professionalRegistration, createdAt } = plan;

    const formatDate = (timestamp: any) => {
        if (!timestamp || !timestamp.toDate) return 'Data indisponível';
        return new Date(timestamp.toDate()).toLocaleDateString('pt-BR', {
            year: 'numeric', month: 'long', day: 'numeric'
        });
    };

    const generateHeader = (pageTitle: string) => {
        doc.setFontSize(22);
        doc.setTextColor('#3F51B5'); // Primary color
        doc.text(pageTitle, 14, 22);

        doc.setFontSize(10);
        doc.setTextColor(100);
        const professionalInfo = professionalRegistration ? `Profissional Responsável: ${professionalRegistration}` : '';
        const generatedDate = `Gerado em: ${formatDate(createdAt)}`;
        doc.text(`${professionalInfo}${professionalInfo ? ' | ' : ''}${generatedDate}`, 14, 29);
    };
    
    let currentY = 40;

    const generateDietPdf = (isFirstPage: boolean) => {
        if (!planData.dietGuidance) return;
        
        if (!isFirstPage) {
            doc.addPage();
        }

        generateHeader(`Dieta: ${clientName}`);
        currentY = 40;

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

                autoTable(doc, {
                    startY: currentY,
                    head: [[{ content: mealTitle, colSpan: 2, styles: { fillColor: '#F0F2F5', textColor: '#3F51B5' } }]],
                    body: body,
                    theme: 'grid',
                    headStyles: { fontStyle: 'bold' },
                    didDrawPage: (data) => {
                        currentY = data.cursor?.y || currentY;
                    }
                });
                currentY = (doc as any).lastAutoTable.finalY + 6;
            });
        });

        if (planData.dietGuidance.notes) {
            currentY += 4;
            if (currentY > 260) { doc.addPage(); generateHeader(`Dieta: ${clientName}`); currentY=40; }
            doc.setFontSize(10);
            doc.setTextColor('#3F51B5');
            doc.text('Notas da Dieta:', 14, currentY);
            currentY += 5;
            doc.setFontSize(9);
            doc.setTextColor(80);
            const dietNotesLines = doc.splitTextToSize(planData.dietGuidance.notes, 180);
            doc.text(dietNotesLines, 14, currentY);
        }
    };

    const generateTrainingPdf = (isFirstPage: boolean) => {
        if (!planData.trainingPlan || !planData.trainingPlan.workouts) return;

        const workoutsWithExercises = planData.trainingPlan.workouts.filter(
            (workout) => workout.exercises && workout.exercises.length > 0
        );
        
        workoutsWithExercises.forEach((workoutDay, index) => {
            if (!isFirstPage || index > 0) {
                doc.addPage();
            }
            
            generateHeader(`Treino: ${clientName}`);
            currentY = 40;

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

            autoTable(doc, {
                startY: currentY,
                head: head,
                body: body,
                theme: 'striped',
                headStyles: { fillColor: '#3F51B5', textColor: '#FFFFFF' },
                columnStyles: {
                    0: { cellWidth: 50 },
                    1: { cellWidth: 20 },
                    2: { cellWidth: 20 },
                    3: { cellWidth: 25 },
                    4: { cellWidth: 'auto' },
                }
            });
             currentY = (doc as any).lastAutoTable.finalY;
        });

        if (planData.trainingPlan.notes) {
            let finalY = currentY + 10;
            if (finalY > 260) { doc.addPage(); generateHeader(`Treino: ${clientName}`); finalY=40; }
            doc.setFontSize(10);
            doc.setTextColor('#3F51B5');
            doc.text('Notas Gerais do Treino:', 14, finalY);
            finalY += 5;
            doc.setFontSize(9);
            doc.setTextColor(80);
            const trainingNotesLines = doc.splitTextToSize(planData.trainingPlan.notes, 180);
            doc.text(trainingNotesLines, 14, finalY);
        }
    };
    
    if (exportType === 'diet') {
        generateDietPdf(true);
    } else if (exportType === 'training') {
        generateTrainingPdf(true);
    } else { // 'both'
        generateTrainingPdf(true);
        generateDietPdf(false);
    }

    const safeFilename = `Plano - ${clientName.replace(/[^a-z0-9]/gi, '_')} - ${exportType}.pdf`;
    doc.save(safeFilename);
}


export async function generateThermalPlanPdf(plan: ClientPlan): Promise<void> {
    const { planData, clientName, professionalRegistration, createdAt } = plan;
    // 48mm de largura (aprox 136pt) e 200mm de altura (aprox 567pt)
    const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: [136, 567] }) as jsPDFWithAutoTable;
    
    const formatDate = (timestamp: any) => {
        if (!timestamp || !timestamp.toDate) return 'Data indisponível';
        return new Date(timestamp.toDate()).toLocaleDateString('pt-BR');
    };

    if (!planData.trainingPlan) {
        throw new Error("Plano de treino não encontrado para impressão térmica.");
    }
        
    const workoutsWithExercises = planData.trainingPlan.workouts.filter(w => w.exercises && w.exercises.length > 0);
    
    if (workoutsWithExercises.length === 0) {
        throw new Error("Nenhum exercício encontrado no plano de treino para impressão.");
    }
    
    workoutsWithExercises.forEach((workoutDay, index) => {
        if (index > 0) {
            doc.addPage();
        }
        let y = 15;

        // Header por página de treino
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text('Plano de Treino', doc.internal.pageSize.getWidth() / 2, y, { align: 'center' });
        y += 12;
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.text(`Cliente: ${clientName}`, doc.internal.pageSize.getWidth() / 2, y, { align: 'center' });
        y += 10;
        doc.text(`Data: ${formatDate(createdAt)}`, doc.internal.pageSize.getWidth() / 2, y, { align: 'center' });
        y += 10;
        if (professionalRegistration) {
            doc.text(`Prof: ${professionalRegistration}`, doc.internal.pageSize.getWidth() / 2, y, { align: 'center' });
            y += 10;
        }
        y += 3;
        doc.setLineWidth(0.5);
        doc.line(10, y, 126, y);
        y += 12;

        // Conteúdo do treino
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text(workoutDay.day.toUpperCase(), 10, y);
        y += 5;
        doc.setLineWidth(0.2);
        doc.line(10, y, 126, y);
        y += 10;

        workoutDay.exercises.forEach(ex => {
            const pageHeight = doc.internal.pageSize.getHeight();
            const marginBottom = 20;

            doc.setFontSize(8);
            doc.setFont('helvetica', 'bold');
            const exNameLines = doc.splitTextToSize(ex.name, 116);
            
            if (y + (exNameLines.length * 10) > pageHeight - marginBottom) {
                doc.addPage();
                y = 15;
            }
            doc.text(exNameLines, 10, y);
            y += exNameLines.length * 8;

            doc.setFont('helvetica', 'normal');
            
            let details = `- ${ex.sets} séries de ${ex.reps} reps`;
            if (ex.restSeconds) {
                details += ` c/ ${ex.restSeconds}s desc.`;
            }
            const detailLines = doc.splitTextToSize(details, 116);
             if (y + (detailLines.length * 10) > pageHeight - marginBottom) {
                doc.addPage();
                y = 15;
            }
            doc.text(detailLines, 12, y);
            y += detailLines.length * 8;


            if (ex.notes) {
                const notesLines = doc.splitTextToSize(`Nota: ${ex.notes}`, 116);
                if (y + (notesLines.length * 8) > pageHeight - marginBottom) {
                    doc.addPage();
                    y = 15;
                }
                doc.text(notesLines, 12, y);
                y += notesLines.length * 8;
            }
            y += 8; // Espaço extra entre exercícios
        });
    });

    const safeFilename = `Plano_Termico - ${clientName.replace(/[^a-z0-9]/gi, '_')}.pdf`;
    doc.save(safeFilename);
}
