const path = require('path');
const fs = require('fs');

function getImageDataUri(filePath) {
  if (!fs.existsSync(filePath)) return null;
  const ext = path.extname(filePath).toLowerCase();
  const mime = ext === '.png' ? 'image/png' : 'image/jpeg';
  return `data:${mime};base64,${fs.readFileSync(filePath).toString('base64')}`;
}

function getLogoBase64() {
  const candidates = [
    path.join(__dirname, '..', 'public', 'Chalo-on-tour.jpg.jpeg'),
    path.join(process.cwd(), 'public', 'Chalo-on-tour.jpg.jpeg'),
    path.join(__dirname, '..', '..', 'frontend', 'public', 'Chalo-on-tour.jpg.jpeg'),
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) {
      try {
        return getImageDataUri(p);
      } catch (_) {}
    }
  }
  return null;
}

function getStampSignBase64(filename) {
  const candidates = [
    path.join(__dirname, '..', 'public', filename),
    path.join(process.cwd(), 'public', filename),
    path.join(__dirname, '..', '..', 'frontend', 'public', filename),
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) {
      try {
        return getImageDataUri(p);
      } catch (_) {}
    }
  }
  return null;
}

function esc(value) {
  if (value == null) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function lines(value) {
  if (!value || !String(value).trim()) return [];
  return String(value)
    .split(/\r?\n/)
    .map((item) => item.replace(/^[\s\u2022\-\u27A2]+/, '').trim())
    .filter(Boolean);
}

function absImageSrc(src, frontendUrl) {
  const raw = String(src || '').trim();
  if (!raw) return '';
  if (/^data:/i.test(raw)) return raw;
  if (/^https?:\/\//i.test(raw)) return raw;
  if (!frontendUrl) return raw;
  if (raw.startsWith('/')) return `${frontendUrl}${raw}`;
  return `${frontendUrl}/${raw}`;
}

/**
 * Build DOCX-friendly HTML (simple tables + inline styles).
 */
function buildTourQuotationDocxHtml(data = {}, { frontendUrl } = {}) {
  const titleDestinations = (data.destinations || '').trim();
  const tripTitle = titleDestinations ? `Let's Explore ${titleDestinations}` : "Let's Explore Your Trip";

  const logoData = getLogoBase64();
  const logoImg = logoData ? `<img src="${logoData}" width="180" style="margin-bottom:10px;" />` : '';

  const stampData = getStampSignBase64('stamp.png') || getStampSignBase64('stamp-sign.png');
  const signatureData = getStampSignBase64('signature.png');

  const heroImages = [data.heroMain, data.heroSub1, data.heroSub2]
    .map((src) => absImageSrc(src, frontendUrl))
    .filter(Boolean)
    .slice(0, 3);

  const hotels = Array.isArray(data.hotels) ? data.hotels : [];
  const flights = Array.isArray(data.flights) ? data.flights : [];
  const itinerary = Array.isArray(data.itinerary) ? data.itinerary : [];

  const inclusionItems = lines(data.inclusions);
  const exclusionItems = lines(data.exclusions);
  const paymentPolicyItems = lines(data.paymentPolicy);
  const cancellationPolicyItems = lines(data.cancellationPolicy);
  const termsItems = lines(data.termsAndConditions);

  const bulletChar = '<span style="color:#c62828; font-size:12pt;">\u27A2</span>';

  const summaryRows = [
    ['01.', 'Per Person Cost', data.perPersonCost ? `Rs. ${esc(data.perPersonCost)} /- Per Person` : '—'],
    ['02.', 'Total No. of Pax', data.totalPax ? `Approx. ${esc(data.totalPax)}` : '—'],
    ['03.', 'Vehicle Type', esc(data.vehicleType || '—')],
    ['04.', 'Hotel Category', esc(data.hotelCategory || '—')],
    ['05.', 'Meal Plan', esc(data.mealPlan || '—')],
    ['06.', 'Tour Duration', esc(data.tourDuration || '—')],
    ['07.', 'Tour Date', `${esc(data.tourDateFrom || '—')} to ${esc(data.tourDateTo || '—')}`],
    ['08.', 'Pick up', esc(data.pickupPoint || '—')],
    ['09.', 'Drop', esc(data.dropPoint || '—')],
    ['10.', 'Destinations', esc(data.destinations || '—')],
  ];

  const footerHtml = `
    <div style="margin-top:25px; page-break-inside:avoid; text-align:left;">
      <div style="font-weight:bold; color:#1565c0; font-size:14pt; margin-bottom:5px;">Thank You</div>
      <p style="font-size:9pt; font-style:italic; margin-bottom:15px; line-height:1.4;">
        Let's stay connected via email, phone, WhatsApp, Facebook, Instagram, and more. We look forward to seeing you again on another memorable Chalo On Tour Trip.
      </p>
      
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-top:1px solid #eee; padding-top:15px;">
        <tr>
          <td valign="top" width="60%">
            <div style="font-weight:bold; font-size:10pt;">Thanks & Regards</div>
            <div style="color:#0d47a1; font-weight:bold; text-decoration:underline; font-size:16pt; margin:4px 0;">CHALO ON TOUR</div>
            <div style="font-weight:bold; color:#000; margin-bottom:2px;">${esc(data.ceoName || 'Mr. Utkarsh Kale (C.E.O.)')}</div>
            <div style="color:#c62828; font-weight:bold; font-size:10.5pt;">Cell: - ${esc(data.cell1 || '')} / ${esc(data.cell2 || '')}</div>
            <div style="color:#c62828; font-weight:bold; font-size:10.5pt; margin-top:2px;">Mail ID: - <span style="color:#0d47a1; text-decoration:underline;">${esc(data.companyEmail || 'bookings@chaloontour.com')}</span></div>
            <div style="color:#c62828; font-weight:bold; font-size:10.5pt; margin-top:2px;">Website: - <span style="color:#0d47a1; text-decoration:underline;">${esc(data.companyWebsite || 'www.chaloontour.com')}</span></div>
          </td>
          <td valign="bottom" align="center" width="40%">
            <div style="font-size:9pt; font-weight:bold; color:#666; margin-bottom:5px; text-transform:uppercase;">Authorised Signatory</div>
            <div style="position:relative; width:150px; height:120px;">
              ${stampData ? `<img src="${stampData}" width="120" style="position:absolute; top:0; left:15px; opacity:0.8;" />` : ''}
              ${signatureData ? `<img src="${signatureData}" width="130" style="position:relative; top:20px; z-index:2;" />` : ''}
            </div>
            <div style="margin-top:5px; font-weight:bold; color:#0d47a1;">CHALO ON TOUR</div>
          </td>
        </tr>
      </table>
    </div>
  `;

  const sectionHeader = (text, color) => `
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 20px 0 10px; border-collapse: collapse; width: 100%;" align="center">
      <tr>
        <td bgcolor="${color}" align="center" valign="middle" height="40" style="background-color: ${color}; color: #ffffff; font-family: Arial, sans-serif; font-size: 14pt; font-weight: bold; text-transform: uppercase; text-align: center;">
          ${esc(text)}: -
        </td>
      </tr>
    </table>
  `;

  const listTable = (items) => `
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse; margin-top: 5px;">
      ${items.map((item) => `<tr><td width="20" valign="top" style="padding-top:2px;">${bulletChar}</td><td style="font-size:10.5pt; color:#333; padding-bottom:6px;">${esc(item)}</td></tr>`).join('')}
    </table>
  `;

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Tour Quotation</title>
  <style>
    @page { size: A4; margin: 0; }
    body { font-family: "Times New Roman", Times, serif; margin: 0; padding: 0; font-size: 11pt; color: #000; background: #fff; line-height: 1.4; }
    .page { width: 794px; margin: 0 auto; padding: 40px 50px; page-break-after: always; background: #fff; }
    .page:last-child { page-break-after: auto; }
    table { width: 100%; border-collapse: collapse; table-layout: fixed; }
    .data-table { border: 1px solid #000; }
    .data-table th { background: #f2f2f2; font-weight: bold; text-align: center; border: 1px solid #000; padding: 8px; font-size: 10pt; }
    .data-table td { border: 1px solid #000; padding: 7px 10px; text-align: left; vertical-align: middle; font-size: 10pt; word-wrap: break-word; }
    .itinerary-desc { padding: 8px 0; text-align: left; font-size: 10.5pt; line-height: 1.5; color: #000; }
    .note-box { font-size: 9.5pt; font-style: italic; margin: 10px 0; color: #444; }
    .places-to-visit { color: #c62828; font-weight: bold; text-decoration: underline; font-size: 11pt; margin: 12px 0 6px 0; display: block; }
  </style>
</head>
<body>
  <div class="page">
    <table width="100%" border="0" cellpadding="0" cellspacing="0" style="margin-bottom:15px; width: 100%;">
      <tr>
        <td align="center" style="text-align: center;">
          ${logoImg}
          <h1 style="color:#c62828; font-size:26pt; font-weight:bold; font-style:italic; margin:5px 0 0 0; line-height:1.2; text-align: center;">${esc(tripTitle)}</h1>
          ${data.quoteNumber || data.quoteDate ? `
            <div style="margin-top:8px; font-size:10.5pt; color:#333; text-align: center;">
              ${data.quoteNumber ? `<span><b>Quote:</b> ${esc(data.quoteNumber)}</span>` : ''}
              ${(data.quoteNumber && data.quoteDate) ? `<span> &nbsp; | &nbsp; </span>` : ''}
              ${data.quoteDate ? `<span><b>Date:</b> ${esc(data.quoteDate)}</span>` : ''}
            </div>` : ''}
        </td>
      </tr>
    </table>

    ${heroImages.length ? `
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:20px; border-collapse: collapse;">
        <tr>
          ${heroImages.length === 1 ? `
            <td width="100%" align="center">
              <img src="${esc(heroImages[0])}" width="650" height="350" style="border-radius:12px; border:1px solid #ddd; display:block;" />
            </td>
          ` : `
            <td width="65%" valign="top" style="padding-right: 12px;">
              <img src="${esc(heroImages[0])}" width="430" height="350" style="border-radius:12px; border:1px solid #ddd; display:block;" />
            </td>
            <td width="35%" valign="top">
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse;">
                <tr>
                  <td style="padding-bottom:12px;">
                    <img src="${esc(heroImages[1])}" width="210" height="169" style="border-radius:10px; border:1px solid #ddd; display:block;" />
                  </td>
                </tr>
                <tr>
                  <td>
                    ${heroImages[2] ? `<img src="${esc(heroImages[2])}" width="210" height="169" style="border-radius:10px; border:1px solid #ddd; display:block;" />` : ''}
                  </td>
                </tr>
              </table>
            </td>
          `}
        </tr>
      </table>
    ` : ''}

    ${sectionHeader('Tour Summary', '#1565c0')}
    <table width="100%" class="data-table" border="1" style="border-collapse: collapse;">
      <tbody>
        ${summaryRows.map((r) => `<tr>
          <td width="10%" align="center" bgcolor="#f9f9f9" style="background:#f9f9f9; font-weight:bold;">${esc(r[0])}</td>
          <td width="35%" style="font-weight:bold;">${esc(r[1])}</td>
          <td>${r[2]}</td>
        </tr>`).join('')}
      </tbody>
    </table>
  </div>

  <div class="page">
    ${sectionHeader('Accommodation', '#1565c0')}
    <table class="data-table" border="1" style="border-collapse: collapse;">
      <thead>
        <tr>
          <th width="10%">Sr.No</th>
          <th width="25%">Hotel Name</th>
          <th width="15%">No. of Nights</th>
          <th width="20%">Room Category</th>
          <th width="15%">Room Sharing</th>
          <th width="15%">Destination</th>
        </tr>
      </thead>
      <tbody>
        ${hotels.length ? hotels.map((h, i) => `
          <tr>
            <td align="center">0${i + 1}.</td>
            <td style="font-weight:bold;">${esc(h?.name || '')}</td>
            <td align="center">${esc(h?.nights || '')}</td>
            <td>${esc(h?.roomCategory || '')}</td>
            <td>${esc(h?.roomSharing || '')}</td>
            <td>${esc(h?.destination || '')}</td>
          </tr>
        `).join('') : '<tr><td colspan="6" align="center" style="color:#666; padding: 20px;">No accommodation details provided.</td></tr>'}
      </tbody>
    </table>
    ${data.accommodationNote ? `<div class="note-box">(Note- ${esc(data.accommodationNote)})</div>` : ''}

    ${sectionHeader('Flight Details', '#1565c0')}
    <table class="data-table" border="1" style="border-collapse: collapse;">
      <thead>
        <tr>
          <th width="10%">Sr.No</th>
          <th width="25%">From</th>
          <th width="25%">To</th>
          <th width="25%">Airline</th>
          <th width="15%">PNR Details</th>
        </tr>
      </thead>
      <tbody>
        ${flights.length ? flights.map((f, i) => `
          <tr>
            <td align="center">0${i + 1}.</td>
            <td>${esc([f?.from, f?.depDate, f?.depTime].filter(Boolean).join(' '))}</td>
            <td>${esc([f?.to, f?.arrDate, f?.arrTime].filter(Boolean).join(' '))}</td>
            <td>${esc([f?.airline, f?.flightNo].filter(Boolean).join(' '))}</td>
            <td style="font-weight:bold;">${esc(f?.pnr || '')}</td>
          </tr>
        `).join('') : '<tr><td colspan="5" align="center" style="color:#666; padding: 20px;">No flight details provided.</td></tr>'}
      </tbody>
    </table>
    ${data.flightNote ? `<div class="note-box">(Note- ${esc(data.flightNote)})</div>` : ''}

    ${sectionHeader('Tour Itinerary', '#c62828')}
    ${itinerary.map((day, i) => `
      <div style="page-break-inside: avoid; margin-top: 15px;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border: 1px solid #d4d400; border-collapse: collapse;">
          <tr>
            <td bgcolor="#ffeb3b" align="center" valign="middle" height="36" style="background-color: #ffeb3b; color: #000000; font-family: Arial, sans-serif; font-size: 13pt; font-weight: bold;">
              ${esc(day?.dayLabel || `Day ${i + 1}`)} :– ${esc(day?.title || '')} ${day?.date ? `(${esc(day.date)})` : ''}
            </td>
          </tr>
        </table>
        <div class="itinerary-desc">${esc(day?.description || '')}</div>
        ${Array.isArray(day?.places) && day.places.filter(Boolean).length ? `
          <div class="places-to-visit" style="color: #c62828; font-weight: bold; text-decoration: underline; font-size: 11pt; margin-top: 10px;">Places to Visit: -</div>
          ${listTable(day.places.filter(Boolean))}
        ` : ''}
      </div>
    `).join('')}

    ${(inclusionItems.length || exclusionItems.length || paymentPolicyItems.length || cancellationPolicyItems.length || termsItems.length || data.memorableTrip) ? `
      <div style="margin-top:20px; page-break-before: auto;">
        ${inclusionItems.length ? `
          <div style="margin-top:20px;">
            <div style="color:#1565c0; font-weight:bold; text-decoration:underline; font-size:12pt; margin-bottom:8px;">Package Inclusions</div>
            ${listTable(inclusionItems)}
          </div>
        ` : ''}
        ${exclusionItems.length ? `
          <div style="margin-top:20px;">
            <div style="color:#c62828; font-weight:bold; text-decoration:underline; font-size:12pt; margin-bottom:8px;">Package Exclusions</div>
            ${listTable(exclusionItems)}
          </div>
        ` : ''}
        ${(paymentPolicyItems.length || cancellationPolicyItems.length) ? `
          <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:20px; border-collapse: collapse;">
            <tr>
              <td width="50%" valign="top" style="padding-right: 15px;">
                <div style="color:#1565c0; font-weight:bold; text-decoration:underline; font-size:11pt; margin-bottom:8px;">Payment Policy</div>
                ${paymentPolicyItems.length ? listTable(paymentPolicyItems) : '<div style="color:#666; font-size:10pt;">—</div>'}
              </td>
              <td width="50%" valign="top" style="padding-left: 15px;">
                <div style="color:#c62828; font-weight:bold; text-decoration:underline; font-size:11pt; margin-bottom:8px;">Cancellation Policy</div>
                ${cancellationPolicyItems.length ? listTable(cancellationPolicyItems) : '<div style="color:#666; font-size:10pt;">—</div>'}
              </td>
            </tr>
          </table>
        ` : ''}
        
        <div style="margin-top:20px; border: 1px solid #eee; padding: 15px; background: #fafafa; page-break-inside:avoid;">
          <div style="font-weight:bold; margin-bottom:8px; font-size:11pt;">Terms & Conditions</div>
          <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse; margin-top: 5px;">
            <tr><td width="20" valign="top" style="padding-top:2px;">${bulletChar}</td><td style="font-size:10.5pt; color:#c62828; font-weight:bold; padding-bottom:6px;">Computer generated receipt. No physical signature required for validity.</td></tr>
            ${termsItems.map((item) => `<tr><td width="20" valign="top" style="padding-top:2px;">${bulletChar}</td><td style="font-size:10.5pt; color:#333; padding-bottom:6px;">${esc(item)}</td></tr>`).join('')}
          </table>
        </div>

        ${data.memorableTrip ? `
          <div style="margin-top:20px; border: 1px solid #e3f2fd; padding:15px; background:#f4f8ff; border-left: 5px solid #1565c0; page-break-inside:avoid;">
            <div style="font-weight:bold; color:#0d47a1; margin-bottom:8px; font-size:11pt;">Tip For Memorable Trip</div>
            <div style="color:#333; line-height: 1.5;">${esc(data.memorableTrip)}</div>
          </div>
        ` : ''}
      </div>
    ` : ''}

    ${footerHtml}
  </div>
</body>
</html>`;
}

module.exports = { buildTourQuotationDocxHtml };
