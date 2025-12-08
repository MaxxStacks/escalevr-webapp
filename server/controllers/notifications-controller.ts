import { Request, Response } from 'express';
import { smsService, SMSNotification } from '../services/sms-service';
import { storage } from '../storage';
import { z } from 'zod';

// Schéma de validation pour l'envoi de SMS
const sendSMSSchema = z.object({
  phoneNumber: z.string().min(10, "Numéro de téléphone invalide"),
  message: z.string().min(1, "Le message ne peut pas être vide"),
  jobId: z.number().optional(),
  unitId: z.number().optional(),
});

// Schéma pour les notifications de status
const jobStatusNotificationSchema = z.object({
  clientId: z.number(),
  jobId: z.number(),
  status: z.string(),
  details: z.string().optional(),
});

// Schéma pour les rappels de rendez-vous
const appointmentReminderSchema = z.object({
  clientId: z.number(),
  jobId: z.number(),
  appointmentDate: z.string(),
  message: z.string().optional(),
});

/**
 * Contrôleur pour gérer les notifications
 */
export class NotificationsController {
  /**
   * Envoyer un SMS à un client
   */
  async sendSMS(req: Request, res: Response) {
    try {
      // Valider les données de la requête
      const validationResult = sendSMSSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ 
          success: false, 
          error: validationResult.error.errors.map(e => e.message).join(', ') 
        });
      }

      // Vérifier si le service SMS est configuré
      if (!smsService.isServiceConfigured()) {
        return res.status(503).json({ 
          success: false, 
          error: "Le service SMS n'est pas configuré. Veuillez configurer les variables d'environnement TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN et TWILIO_PHONE_NUMBER."
        });
      }

      // Envoyer le SMS
      const result = await smsService.sendSMS(validationResult.data as SMSNotification);
      
      if (result.success) {
        // Stocker la notification dans la base de données si nécessaire
        // ...

        return res.status(200).json(result);
      } else {
        return res.status(500).json(result);
      }
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * Envoyer une notification de mise à jour de statut
   */
  async sendJobStatusNotification(req: Request, res: Response) {
    try {
      // Valider les données de la requête
      const validationResult = jobStatusNotificationSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ 
          success: false, 
          error: validationResult.error.errors.map(e => e.message).join(', ') 
        });
      }

      const { clientId, jobId, status, details } = validationResult.data;

      // Récupérer les informations du client
      const client = await storage.getUser(clientId);
      if (!client) {
        return res.status(404).json({ success: false, error: "Client non trouvé" });
      }

      // Récupérer les informations du service
      const job = await storage.getJob(jobId);
      if (!job) {
        return res.status(404).json({ success: false, error: "Service non trouvé" });
      }

      // Récupérer le numéro de téléphone du client
      const phoneNumber = client.phone;
      if (!phoneNumber) {
        return res.status(400).json({ 
          success: false, 
          error: "Le client n'a pas de numéro de téléphone enregistré" 
        });
      }

      // Créer le message de notification
      const message = smsService.createJobStatusUpdateMessage(jobId, status, details);

      // Envoyer le SMS
      const result = await smsService.sendSMS({
        phoneNumber,
        message,
        jobId,
        status
      });

      return res.status(result.success ? 200 : 500).json(result);
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * Envoyer un rappel de rendez-vous
   */
  async sendAppointmentReminder(req: Request, res: Response) {
    try {
      // Valider les données de la requête
      const validationResult = appointmentReminderSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ 
          success: false, 
          error: validationResult.error.errors.map(e => e.message).join(', ') 
        });
      }

      const { clientId, jobId, appointmentDate, message } = validationResult.data;

      // Récupérer les informations du client
      const client = await storage.getUser(clientId);
      if (!client) {
        return res.status(404).json({ success: false, error: "Client non trouvé" });
      }

      // Récupérer les informations du service
      const job = await storage.getJob(jobId);
      if (!job) {
        return res.status(404).json({ success: false, error: "Service non trouvé" });
      }

      // Récupérer le numéro de téléphone du client
      const phoneNumber = client.phone;
      if (!phoneNumber) {
        return res.status(400).json({ 
          success: false, 
          error: "Le client n'a pas de numéro de téléphone enregistré" 
        });
      }

      // Créer le message de rappel ou utiliser celui fourni
      const smsMessage = message || smsService.createAppointmentReminderMessage(
        jobId, 
        new Date(appointmentDate)
      );

      // Envoyer le SMS
      const result = await smsService.sendSMS({
        phoneNumber,
        message: smsMessage,
        jobId
      });

      return res.status(result.success ? 200 : 500).json(result);
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * Vérifier le statut du service SMS
   */
  async checkSMSServiceStatus(req: Request, res: Response) {
    const isConfigured = smsService.isServiceConfigured();
    
    return res.status(200).json({
      configured: isConfigured,
      requiredEnvVars: {
        TWILIO_ACCOUNT_SID: !!process.env.TWILIO_ACCOUNT_SID,
        TWILIO_AUTH_TOKEN: !!process.env.TWILIO_AUTH_TOKEN,
        TWILIO_PHONE_NUMBER: !!process.env.TWILIO_PHONE_NUMBER
      }
    });
  }
}

// Exporter une instance du contrôleur
export const notificationsController = new NotificationsController();