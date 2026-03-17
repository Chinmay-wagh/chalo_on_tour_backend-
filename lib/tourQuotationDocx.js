const { 
    Document, 
    Packer, 
    Paragraph, 
    TextRun, 
    Table, 
    TableRow, 
    TableCell, 
    AlignmentType, 
    ImageRun, 
    WidthType, 
    BorderStyle, 
    VerticalAlign,
    PageBreak,
    HeadingLevel
} = require('docx');
const fs = require('fs');
const path = require('path');

const PRIMARY_COLOR = '1e3a8a'; // Deep Navy
const ACCENT_COLOR = 'ef4444';  // Red
const GRAY_COLOR = '475569';
const BORDER_COLOR = 'cbd5e1';

// Scale: 100% = 5000
const FULL_WIDTH = 5000;

function getLogoBuffer() {
    const candidates = [
        path.join(__dirname, '..', 'public', 'Chalo-on-tour.jpg.jpeg'),
        path.join(process.cwd(), 'public', 'Chalo-on-tour.jpg.jpeg'),
        path.join(__dirname, '..', '..', 'frontend', 'public', 'Chalo-on-tour.jpg.jpeg'),
    ];
    for (const p of candidates) {
        if (fs.existsSync(p)) {
            try {
                return fs.readFileSync(p);
            } catch (_) {}
        }
    }
    return null;
}

function parseLines(value) {
    if (!value || !String(value).trim()) return [];
    return String(value)
        .split(/\r?\n/)
        .map((item) => item.replace(/^[\s\u2022\-\u27A2]+/, '').trim())
        .filter(Boolean);
}

/**
 * Professional DOCX Generation System (Stable Version)
 */
async function buildTourQuotationDocx(data) {
    const docChildren = [];
    const logoBuffer = getLogoBuffer();

    // ─── 1. HEADER (2-Column Table) ───
    docChildren.push(
        new Table({
            width: { size: FULL_WIDTH, type: WidthType.PERCENTAGE },
            columnWidths: [2500, 2500],
            rows: [
                new TableRow({
                    children: [
                        new TableCell({
                            children: logoBuffer ? [
                                new Paragraph({
                                    children: [
                                        new ImageRun({
                                            data: logoBuffer,
                                            transformation: { width: 140, height: 50 },
                                        }),
                                    ],
                                }),
                                new Paragraph({
                                    children: [new TextRun({ text: "THE FUTURE OF TRAVEL", size: 12, color: GRAY_COLOR, bold: true, characterSpacing: 2 })]
                                })
                            ] : [],
                            border: { top: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE } },
                        }),
                        new TableCell({
                            children: [
                                new Paragraph({
                                    children: [new TextRun({ text: "CHALO ON TOUR", bold: true, size: 24, color: PRIMARY_COLOR })],
                                    alignment: AlignmentType.RIGHT,
                                }),
                                new Paragraph({
                                    children: [new TextRun({ text: `Ph: ${data.cell1 || ''} / ${data.cell2 || ''}`, size: 16 })],
                                    alignment: AlignmentType.RIGHT,
                                }),
                                new Paragraph({
                                    children: [new TextRun({ text: `Email: ${data.companyEmail || ''}`, size: 16 })],
                                    alignment: AlignmentType.RIGHT,
                                }),
                                new Paragraph({
                                    children: [new TextRun({ text: `Web: ${data.companyWebsite || ''}`, size: 16 })],
                                    alignment: AlignmentType.RIGHT,
                                }),
                            ],
                            border: { top: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE } },
                        }),
                    ],
                }),
            ],
        }),
        new Paragraph({ spacing: { after: 400 } })
    );

    // ─── 2. TITLE ───
    docChildren.push(
        new Paragraph({
            children: [
                new TextRun({ text: "TOUR DETAILS", bold: true, size: 40, color: PRIMARY_COLOR }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 },
        }),
        new Paragraph({
            children: [
                new TextRun({ text: `Quote: ${data.quoteNumber || '—'}  |  Date: ${data.quoteDate || '—'}`, size: 18, color: GRAY_COLOR }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 600 },
        })
    );

    // ─── 3. CUSTOMER / TRIP SUMMARY ───
    const tripTitle = (data.destinations || '').trim() ? `Exploration: ${data.destinations}` : "Your Unique Trip Details";
    docChildren.push(
        new Paragraph({
            children: [new TextRun({ text: tripTitle, bold: true, size: 32 })],
            spacing: { after: 300 },
            border: { bottom: { color: ACCENT_COLOR, size: 20, style: BorderStyle.SINGLE, space: 5 } }
        })
    );

    docChildren.push(
        new Table({
            width: { size: FULL_WIDTH, type: WidthType.PERCENTAGE },
            columnWidths: [1500, 3500],
            rows: [
                ["TOUR DURATION", data.tourDuration],
                ["TOTAL PAX", data.totalPax],
                ["MEAL PLAN", data.mealPlan],
                ["HOTEL CATEGORY", data.hotelCategory],
                ["VEHICLE TYPE", data.vehicleType],
                ["COST PER PERSON", data.perPersonCost ? `₹ ${Number(data.perPersonCost).toLocaleString('en-IN')}` : '—']
            ].map(([label, value]) => new TableRow({
                children: [
                    new TableCell({
                        children: [new Paragraph({ children: [new TextRun({ text: label, bold: true, size: 18, color: PRIMARY_COLOR })] })],
                        shading: { fill: 'f1f5f9' },
                        verticalAlign: VerticalAlign.CENTER,
                        margins: { left: 150 },
                        border: { top: { style: BorderStyle.SINGLE, color: BORDER_COLOR }, bottom: { style: BorderStyle.SINGLE, color: BORDER_COLOR }, left: { style: BorderStyle.SINGLE, color: BORDER_COLOR }, right: { style: BorderStyle.SINGLE, color: BORDER_COLOR } }
                    }),
                    new TableCell({
                        children: [new Paragraph({ children: [new TextRun({ text: String(value || '—'), size: 18 })] })],
                        verticalAlign: VerticalAlign.CENTER,
                        margins: { left: 150 },
                        border: { top: { style: BorderStyle.SINGLE, color: BORDER_COLOR }, bottom: { style: BorderStyle.SINGLE, color: BORDER_COLOR }, left: { style: BorderStyle.SINGLE, color: BORDER_COLOR }, right: { style: BorderStyle.SINGLE, color: BORDER_COLOR } }
                    }),
                ],
            })),
        }),
        new Paragraph({ spacing: { after: 600 } })
    );

    // ─── 4. ACCOMMODATION TABLE ───
    docChildren.push(createSubHeading("Accommodation Plan"));
    const hotels = Array.isArray(data.hotels) ? data.hotels : [];
    const hotelRows = [
        new TableRow({
            tableHeader: true,
            children: [
                createHeaderCell("City", 1200),
                createHeaderCell("Hotel Name", 1800),
                createHeaderCell("Nights", 600),
                createHeaderCell("Room Category", 1400),
            ],
        }),
    ];
    hotels.forEach(h => {
        hotelRows.push(new TableRow({
            children: [
                createDataCell(h?.destination, false, 1200),
                createDataCell(h?.name, true, 1800),
                createDataCell(h?.nights, false, 600, AlignmentType.CENTER),
                createDataCell(h?.roomCategory, false, 1400),
            ],
        }));
    });
    docChildren.push(
        new Table({
            width: { size: FULL_WIDTH, type: WidthType.PERCENTAGE },
            columnWidths: [1200, 1800, 600, 1400],
            rows: hotelRows,
        }),
        new Paragraph({ spacing: { after: 600 } })
    );

    // ─── 5. ITINERARY (Paragraphs & Bullets - NO TABLES) ───
    docChildren.push(createSubHeading("Detailed Day-wise Itinerary"));
    const itinerary = Array.isArray(data.itinerary) ? data.itinerary : [];
    itinerary.forEach((day, i) => {
        docChildren.push(
            new Paragraph({
                children: [
                    new TextRun({ text: `DAY ${i + 1}: ${day?.title || 'Tours'}`, bold: true, size: 24, color: PRIMARY_COLOR }),
                ],
                spacing: { before: 200, after: 100 },
            }),
            new Paragraph({
                children: [new TextRun({ text: day?.description || '', size: 20 })],
                spacing: { after: 150 },
            })
        );

        if (Array.isArray(day?.places) && day.places.filter(Boolean).length) {
            docChildren.push(
                new Paragraph({ children: [new TextRun({ text: "Sightseeing Highlights:", bold: true, size: 18, color: ACCENT_COLOR })], spacing: { after: 100 } })
            );
            day.places.filter(Boolean).forEach(place => {
                docChildren.push(
                    new Paragraph({
                        text: place,
                        bullet: { level: 0 },
                        spacing: { after: 50 },
                    })
                );
            });
        }
    });

    // ─── 6. INCLUSIONS & EXCLUSIONS ───
    docChildren.push(new Paragraph({ children: [new PageBreak()] }));
    
    docChildren.push(createSubHeading("Package Inclusions (What's included)"));
    parseLines(data.inclusions).forEach(item => {
        docChildren.push(new Paragraph({ text: item, bullet: { level: 0 }, spacing: { after: 50 } }));
    });

    docChildren.push(new Paragraph({ spacing: { after: 400 } }));

    docChildren.push(createSubHeading("Package Exclusions (What's NOT included)"));
    parseLines(data.exclusions).forEach(item => {
        docChildren.push(new Paragraph({ text: item, bullet: { level: 0 }, spacing: { after: 50 } }));
    });

    // ─── 7. TERMS & POLICIES ───
    docChildren.push(new Paragraph({ spacing: { after: 600 } }));
    docChildren.push(createSubHeading("Payment & Cancellation Policies"));
    
    docChildren.push(new Paragraph({ children: [new TextRun({ text: "Payment Schedule:", bold: true, size: 20, color: PRIMARY_COLOR })], spacing: { before: 200, after: 100 } }));
    parseLines(data.paymentPolicy).forEach(item => {
        docChildren.push(new Paragraph({ text: item, bullet: { level: 0 }, spacing: { after: 50 } }));
    });

    docChildren.push(new Paragraph({ children: [new TextRun({ text: "Cancellation Terms:", bold: true, size: 20, color: PRIMARY_COLOR })], spacing: { before: 200, after: 100 } }));
    parseLines(data.cancellationPolicy).forEach(item => {
        docChildren.push(new Paragraph({ text: item, bullet: { level: 0 }, spacing: { after: 50 } }));
    });

    // ─── 8. FOOTER ───
    docChildren.push(
        new Paragraph({ spacing: { before: 1000 } }),
        new Paragraph({
            children: [new TextRun({ text: "Thank you for choosing CHALO ON TOUR!", bold: true, color: PRIMARY_COLOR, size: 22 })],
            alignment: AlignmentType.CENTER,
            spacing: { after: 100 }
        }),
        new Paragraph({
            children: [new TextRun({ text: "Registered Office: Near Police Station, Ghodegaon, Tal- Ambegaon, Dist Pune | www.chaloontour.com", size: 14, color: GRAY_COLOR })],
            alignment: AlignmentType.CENTER,
        }),
        new Paragraph({
            children: [new TextRun({ text: "Digital Verification Active. This is a system-generated document.", size: 12, italic: true, color: GRAY_COLOR })],
            alignment: AlignmentType.CENTER,
            spacing: { before: 50 }
        })
    );

    const doc = new Document({
        sections: [{
            properties: {},
            children: docChildren,
        }],
    });

    return await Packer.toBuffer(doc);
}

// ─── HELPERS ───

function createSubHeading(text) {
    return new Paragraph({
        children: [new TextRun({ text: text.toUpperCase(), bold: true, size: 24, color: PRIMARY_COLOR })],
        spacing: { before: 400, after: 200 },
        border: { bottom: { color: BORDER_COLOR, size: 10, style: BorderStyle.SINGLE, space: 5 } }
    });
}

function createHeaderCell(text, width) {
    return new TableCell({
        children: [new Paragraph({ children: [new TextRun({ text, bold: true, color: 'ffffff', size: 18 })], alignment: AlignmentType.CENTER })],
        shading: { fill: PRIMARY_COLOR },
        verticalAlign: VerticalAlign.CENTER,
        width: { size: width, type: WidthType.DXA }
    });
}

function createDataCell(text, bold = false, width, align = AlignmentType.LEFT) {
    return new TableCell({
        children: [new Paragraph({ children: [new TextRun({ text: String(text || '—'), bold, size: 18 })], alignment: align })],
        verticalAlign: VerticalAlign.CENTER,
        margins: { top: 100, bottom: 100, left: 100, right: 100 },
        width: { size: width, type: WidthType.DXA }
    });
}

module.exports = { buildTourQuotationDocx };
