import Questionnaire from '../models/Questionnaire.js';
import excelService from '../services/excelService.js';
import { sendEmail } from '../utils/emailService.js';
import fs from 'fs';

const submitQuestionnaire = async (req, res) => {
  try {
    console.log('Received questionnaire submission:', req.body);
    const questionnaireData = req.body;

    // Create new questionnaire
    console.log('Creating questionnaire in database...');
    const questionnaire = await Questionnaire.create(questionnaireData);
    console.log('Questionnaire created successfully:', questionnaire);

    // Add to Excel file
    console.log('Adding questionnaire to Excel file...');
    await excelService.addQuestionnaire(questionnaireData);
    console.log('Questionnaire added to Excel successfully');

    // Send email notification
    console.log('Preparing to send email notification...');
    console.log('Admin email:', process.env.ADMIN_EMAIL);
    try {
      await sendEmail({
        to: process.env.ADMIN_EMAIL,
        subject: 'New Questionnaire Submission',
        html: `
          <h2>New Questionnaire Submission</h2>
          <p><strong>Organization:</strong> ${questionnaireData.organizationName}</p>
          <p><strong>Position:</strong> ${questionnaireData.position}</p>
          <p><strong>Email:</strong> ${questionnaireData.email}</p>
          <p><strong>Contact:</strong> ${questionnaireData.contactNumber}</p>
          <p><strong>WhatsApp:</strong> ${questionnaireData.whatsappNumber}</p>
          <p><strong>LinkedIn:</strong> ${questionnaireData.linkedInProfile}</p>
          <p><strong>Purpose:</strong> ${questionnaireData.purpose}</p>
        `
      });
      console.log('Email notification sent successfully');
    } catch (emailError) {
      console.error('Email service error:', emailError);
      // Continue with the response even if email fails
    }

    res.status(201).json({
      success: true,
      data: questionnaire
    });
  } catch (error) {
    console.error('Error submitting questionnaire:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

const getQuestionnaires = async (req, res) => {
  try {
    console.log('Fetching all questionnaires...');
    const questionnaires = await Questionnaire.find().sort({ submittedAt: -1 });
    console.log(`Found ${questionnaires.length} questionnaires`);
    res.status(200).json({
      success: true,
      count: questionnaires.length,
      data: questionnaires
    });
  } catch (error) {
    console.error('Error fetching questionnaires:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

const exportToExcel = async (req, res) => {
  try {
    console.log('Starting Excel export process...');
    const filePath = await excelService.exportToExcel();
    console.log('Excel file created at:', filePath);
    
    res.download(filePath, 'questionnaires.xlsx', (err) => {
      if (err) {
        console.error('Error downloading file:', err);
      }
      // Clean up the file after download
      fs.unlink(filePath, (err) => {
        if (err) {
          console.error('Error deleting file:', err);
        } else {
          console.log('Temporary Excel file deleted successfully');
        }
      });
    });
  } catch (error) {
    console.error('Error exporting to Excel:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}; 

export default {
  submitQuestionnaire,
  getQuestionnaires,
  exportToExcel
}; 
