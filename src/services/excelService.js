import ExcelJS from 'exceljs';
import path from 'path';
import fs from 'fs';
import Questionnaire from '../models/Questionnaire.js';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class ExcelService {
  constructor() {
    this.workbook = new ExcelJS.Workbook();
    this.worksheet = null;
  }

  async initializeWorksheet() {
    if (!this.worksheet) {
      this.worksheet = this.workbook.addWorksheet('Questionnaires');
      
      // Define columns
      this.worksheet.columns = [
        { header: 'Submitted At', key: 'submittedAt', width: 20 },
        { header: 'Organization Name', key: 'organizationName', width: 30 },
        { header: 'Organization Type', key: 'organizationType', width: 20 },
        { header: 'Position', key: 'position', width: 20 },
        { header: 'Email', key: 'email', width: 30 },
        { header: 'Contact Number', key: 'contactNumber', width: 15 },
        { header: 'WhatsApp Number', key: 'whatsappNumber', width: 15 },
        { header: 'LinkedIn Profile', key: 'linkedInProfile', width: 40 },
        { header: 'Website URL', key: 'websiteUrl', width: 40 },
        { header: 'Purpose', key: 'purpose', width: 50 },
        { header: 'Expected Usage', key: 'expectedUsage', width: 50 },
        { header: 'Additional Info', key: 'additionalInfo', width: 50 }
      ];

      // Style the header row
      this.worksheet.getRow(1).font = { bold: true };
      this.worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' }
      };
    }
  }

  async addQuestionnaire(data) {
    await this.initializeWorksheet();
    this.worksheet.addRow({
      ...data,
      submittedAt: new Date().toISOString()
    });
  }

  async exportToExcel() {
    await this.initializeWorksheet();
    
    // Get all questionnaires
    const questionnaires = await Questionnaire.find().sort({ submittedAt: -1 });
    
    // Clear existing rows except header
    this.worksheet.spliceRows(2, this.worksheet.rowCount - 1);
    
    // Add all questionnaires
    questionnaires.forEach(questionnaire => {
      this.worksheet.addRow({
        ...questionnaire.toObject(),
        submittedAt: questionnaire.submittedAt.toISOString()
      });
    });

    // Create data directory if it doesn't exist
    const dataDir = path.join(__dirname, '../data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir);
    }

    // Save the file
    const filePath = path.join(dataDir, 'questionnaires.xlsx');
    await this.workbook.xlsx.writeFile(filePath);
    
    return filePath;
  }
}

export default new ExcelService(); 