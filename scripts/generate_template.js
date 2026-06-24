const ExcelJS = require('exceljs');
const fs = require('fs');

async function createTemplate() {
  const workbook = new ExcelJS.Workbook();
  
  // === SHEET 1: TRANSACTIONS ===
  const sheet = workbook.addWorksheet('Transactions (Upload This)', {
    views: [{ state: 'frozen', xSplit: 0, ySplit: 1 }] // Freeze top row
  });

  sheet.columns = [
    { header: 'Date', key: 'date', width: 20 },
    { header: 'Description', key: 'desc', width: 45 },
    { header: 'Amount', key: 'amount', width: 25 },
  ];

  // Style Header Row
  const headerRow = sheet.getRow(1);
  headerRow.font = { name: 'Arial', size: 12, bold: true, color: { argb: 'FFFFFFFF' } };
  headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
  headerRow.height = 30;
  
  ['A1', 'B1', 'C1'].forEach((cell) => {
    sheet.getCell(cell).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF0070F3' } // Vercel/NextJS Blue
    };
    sheet.getCell(cell).border = {
      bottom: { style: 'medium', color: { argb: 'FF000000' } }
    };
  });

  // Example Data
  sheet.addRow({ date: '2026-05-15', desc: 'Acme Corp - Consulting Project', amount: 45000 });
  sheet.addRow({ date: '2026-05-18', desc: 'Office Supplies (Naivas)', amount: -3500 });
  sheet.addRow({ date: '2026-05-20', desc: 'Uber Ride - Client Meeting', amount: -850 });

  // Format data rows
  sheet.getColumn('A').numFmt = 'yyyy-mm-dd';
  sheet.getColumn('C').numFmt = '#,##0.00;[Red]-#,##0.00'; // Standard accounting format (negative is red)
  sheet.getColumn('C').alignment = { horizontal: 'right' };

  for (let i = 2; i <= 20; i++) {
    sheet.getRow(i).font = { name: 'Arial', size: 11 };
    sheet.getRow(i).height = 20;
    // Add subtle borders
    ['A', 'B', 'C'].forEach(col => {
      sheet.getCell(`${col}${i}`).border = {
        bottom: { style: 'thin', color: { argb: 'FFEEEEEE' } }
      };
    });
  }

  // === SHEET 2: INSTRUCTIONS ===
  const instr = workbook.addWorksheet('Instructions');
  instr.getColumn('A').width = 80;
  
  instr.addRow(['How to use this template']).font = { bold: true, size: 16 };
  instr.addRow(['']);
  instr.addRow(['1. Do not rename the columns. Leave "Date", "Description", and "Amount" in the first row.']);
  instr.addRow(['2. In the "Transactions" tab, erase the example rows and paste your own data.']);
  instr.addRow(['3. Amount should be POSITIVE for Income and NEGATIVE for Expenses.']);
  instr.addRow(['4. Date format should be YYYY-MM-DD or DD/MM/YYYY.']);
  instr.addRow(['5. Once you paste your data, save this file and drop it into the Smart Upload area.']);
  instr.addRow(['']);
  instr.addRow(['In the Smart Upload screen, you can manually type custom project names in the Category column!']).font = { bold: true, color: { argb: 'FF0070F3' } };

  // Make sure public directory exists
  if (!fs.existsSync('./public')) fs.mkdirSync('./public');

  await workbook.xlsx.writeFile('./public/Ledger360_Template.xlsx');
  console.log('Template created successfully!');
}

createTemplate().catch(console.error);
