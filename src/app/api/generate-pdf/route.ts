
import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import type { ClientPlan } from '@/types';
import puppeteer from 'puppeteer-core';
import chrome from 'chrome-aws-lambda';

// Helper function to generate the HTML for the PDF
function generatePlanHtml(plan: ClientPlan): string {
    const { planData, clientName, professionalRegistration, goalPhase, trainingFrequency } = plan;

    const formatDate = (timestamp: any) => {
        if (!timestamp || !timestamp.toDate) return 'Data indisponível';
        return new Date(timestamp.toDate()).toLocaleDateString('pt-BR', {
            year: 'numeric', month: 'long', day: 'numeric'
        });
    };
    
    const trainingPlanHtml = planData.trainingPlan ? `
        <div class="plan-section">
            <h2>Plano de Treino</h2>
            <p class="section-meta">${planData.trainingPlan.weeklySplitDescription}</p>
            <p class="section-meta">${planData.trainingPlan.weeklyVolumeSummary}</p>
            ${planData.trainingPlan.workouts.map(workout => `
                <div class="workout-day">
                    <h3>${workout.day} ${workout.focus ? `<span>(${workout.focus})</span>` : ''}</h3>
                    <table class="exercises-table">
                        <thead>
                            <tr>
                                <th>Exercício</th>
                                <th>Séries</th>
                                <th>Reps</th>
                                <th>Descanso</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${workout.exercises.map(ex => `
                                <tr>
                                    <td>
                                        <strong>${ex.name}</strong>
                                        ${ex.notes ? `<small>${ex.notes}</small>` : ''}
                                    </td>
                                    <td>${ex.sets}</td>
                                    <td>${ex.reps}</td>
                                    <td>${ex.restSeconds ? `${ex.restSeconds / 60} min` : '-'}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            `).join('')}
            ${planData.trainingPlan.notes ? `<div class="notes"><strong>Notas Gerais do Treino:</strong> ${planData.trainingPlan.notes}</div>` : ''}
        </div>
    ` : '';

    const dietGuidanceHtml = planData.dietGuidance ? `
         <div class="plan-section">
            <h2>Diretrizes de Dieta (Fase: ${goalPhase})</h2>
            <p class="section-meta">
                <strong>Metas Diárias Estimadas:</strong> 
                ~${planData.dietGuidance.estimatedDailyCalories} kcal | 
                P: ${planData.dietGuidance.proteinGrams}g | 
                C: ${planData.dietGuidance.carbGrams}g | 
                G: ${planData.dietGuidance.fatGrams}g
            </p>
            ${planData.dietGuidance.dailyMealPlans.map(meal => `
                <div class="meal-plan">
                    <h4>${meal.mealName}</h4>
                    ${meal.mealOptions.map((option, index) => `
                        <div class="meal-option">
                            <p><strong>Opção ${index + 1}</strong>${option.optionDescription ? `: ${option.optionDescription}` : ''}</p>
                            <ul>
                                ${option.items.map(item => `
                                    <li>${item.foodName}: <span>${item.quantity}</span></li>
                                `).join('')}
                            </ul>
                        </div>
                    `).join('')}
                </div>
            `).join('')}
            ${planData.dietGuidance.notes ? `<div class="notes"><strong>Notas Gerais da Dieta:</strong> ${planData.dietGuidance.notes}</div>` : ''}
        </div>
    ` : '';

    return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <style>
                body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; font-size: 10pt; color: #333; }
                .page { width: 100%; page-break-after: always; }
                .page:last-child { page-break-after: avoid; }
                .main-header { text-align: center; border-bottom: 2px solid #3F51B5; padding-bottom: 10px; margin-bottom: 20px; }
                h1 { font-size: 20pt; margin: 0; color: #3F51B5; }
                .sub-header { font-size: 11pt; color: #555; }
                .plan-section { margin-bottom: 20px; }
                h2 { font-size: 16pt; color: #3F51B5; border-bottom: 1px solid #ccc; padding-bottom: 5px; margin-top: 0; }
                h3 { font-size: 13pt; margin-top: 15px; margin-bottom: 10px; }
                h3 span { font-weight: normal; color: #666; font-size: 11pt; }
                h4 { font-size: 12pt; margin-bottom: 8px; }
                p { margin: 0 0 5px; }
                .section-meta { font-size: 9pt; color: #666; margin-bottom: 15px; }
                .workout-day { page-break-before: always; margin-top: 20px; }
                .workout-day:first-child { page-break-before: avoid; margin-top: 0; }
                .exercises-table { width: 100%; border-collapse: collapse; margin-top: 10px; }
                .exercises-table th, .exercises-table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                .exercises-table th { background-color: #f2f2f2; font-size: 10pt; }
                .exercises-table td { font-size: 9pt; vertical-align: top; }
                .exercises-table td small { display: block; font-size: 8pt; color: #777; margin-top: 4px; }
                .meal-plan { margin-bottom: 15px; }
                .meal-option { border-left: 3px solid #6c7ae0; padding-left: 10px; margin-bottom: 10px; }
                ul { padding-left: 20px; margin: 5px 0; }
                li { margin-bottom: 4px; font-size: 9.5pt; }
                li span { font-weight: 500; }
                .notes { margin-top: 15px; font-style: italic; color: #555; font-size: 9pt; border-top: 1px solid #eee; padding-top: 10px; }
            </style>
        </head>
        <body>
            <div class="page">
                 <div class="main-header">
                    <h1>Plano para ${clientName}</h1>
                    <p class="sub-header">
                        ${professionalRegistration ? `Profissional Responsável: ${professionalRegistration} | ` : ''}
                        Gerado em: ${formatDate(plan.createdAt)}
                    </p>
                </div>
                ${planData.overallSummary ? `
                    <div class="plan-section">
                        <h2>Resumo Geral</h2>
                        <p>${planData.overallSummary}</p>
                    </div>
                ` : ''}
                ${dietGuidanceHtml}
            </div>
            ${trainingPlanHtml}
        </body>
        </html>
    `;
}

export async function POST(req: NextRequest) {
    let browser = null;
    try {
        const body = await req.json();
        const { planId, userId } = body;

        if (!planId || !userId) {
            return NextResponse.json({ error: 'ID do plano e do usuário são obrigatórios.' }, { status: 400 });
        }

        const planRef = adminDb.collection('userGeneratedPlans').doc(userId).collection('plans').doc(planId);
        const planSnap = await planRef.get();

        if (!planSnap.exists) {
            return NextResponse.json({ error: 'Plano não encontrado.' }, { status: 404 });
        }

        const planData = { id: planSnap.id, ...planSnap.data() } as ClientPlan;
        
        const htmlContent = generatePlanHtml(planData);

        const executablePath = await chrome.executablePath;

        browser = await puppeteer.launch({
            args: chrome.args,
            executablePath,
            headless: true,
        });
        const page = await browser.newPage();

        await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

        const pdfBuffer = await page.pdf({
            format: 'A4',
            printBackground: true,
            displayHeaderFooter: true,
            headerTemplate: `<div style="font-size: 9px; color: #555; text-align: left; width: 100%; padding: 0 40px;">Plano de: ${planData.clientName}</div>`,
            footerTemplate: `<div style="font-size: 9px; color: #555; text-align: right; width: 100%; padding: 0 40px;">Página <span class="pageNumber"></span> de <span class="totalPages"></span></div>`,
            margin: {
                top: '50px',
                right: '40px',
                bottom: '50px',
                left: '40px'
            }
        });
        
        const safeFilename = `Plano - ${planData.clientName.replace(/[^a-z0-9]/gi, '_')}.pdf`;

        return new NextResponse(pdfBuffer, {
            status: 200,
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="${safeFilename}"`,
            },
        });

    } catch (error: any) {
        console.error('Erro ao gerar PDF com Puppeteer:', error);
        return NextResponse.json({ error: `Falha ao gerar o PDF: ${error.message}` }, { status: 500 });
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}
